import "server-only";
import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { effectivePlan, type PlanId } from "./radar/plans";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const COOKIE = "apex_session";
const SESSION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: PlanId;
  planUntil: string | null;
  discordWebhook: string | null;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  plan: string;
  plan_until: string | null;
  discord_webhook: string | null;
  created_at: string;
}

const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  plan: effectivePlan(r.plan, r.plan_until),
  planUntil: r.plan_until,
  discordWebhook: r.discord_webhook,
  createdAt: r.created_at,
});

/** Hasło: scrypt z losową solą, zapis "sól:skrót" w hex. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  getDb()
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, expires.toISOString());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function registerUser(email: string, password: string, name: string): Promise<{ error?: string }> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalized)) {
    return { error: "Konto z tym adresem już istnieje. Zaloguj się." };
  }
  const id = randomUUID();
  db.prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(
    id,
    normalized,
    name.trim() || null,
    await hashPassword(password),
    new Date().toISOString(),
  );
  await startSession(id);
  return {};
}

export async function loginUser(email: string, password: string): Promise<{ error?: string }> {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return { error: "Nieprawidłowy e-mail lub hasło." };
  }
  await startSession(row.id);
  return {};
}

export async function logoutUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
  store.delete(COOKIE);
}

/** Zalogowany użytkownik albo null. Wymaga granicy <Suspense> (czyta ciasteczka). */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?",
    )
    .get(hashToken(token), new Date().toISOString()) as UserRow | undefined;
  return row ? toUser(row) : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/radar/logowanie");
  return user;
}

"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginUser, logoutUser, registerUser, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isDiscordWebhook, sendDiscord } from "@/lib/radar/discord";
import type { Listing } from "@/lib/radar/match";
import { keywordPhrases } from "@/lib/radar/match";
import { PLANS } from "@/lib/radar/plans";
import { runScan, sendDigests } from "@/lib/radar/scan";
import {
  CATEGORY_IDS,
  CONDITION_IDS,
  GENDER_IDS,
  SOURCE_IDS,
  type Category,
  type Condition,
  type Gender,
  type SourceId,
} from "@/lib/radar/sources";

export interface FormState {
  error?: string;
  ok?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "");
  if (!EMAIL_RE.test(email)) return { error: "Podaj poprawny adres e-mail." };
  if (password.length < 8) return { error: "Hasło musi mieć co najmniej 8 znaków." };
  const res = await registerUser(email, password, name);
  if (res.error) return res;
  redirect("/panel/wyszukiwania/nowe?pierwsze=1");
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const res = await loginUser(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (res.error) return res;
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/panel") ? next : "/panel");
}

export async function logoutAction() {
  await logoutUser();
  redirect("/radar");
}

const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/\s/g, ""));
  return String(v ?? "").trim() === "" || !Number.isFinite(n) ? null : Math.round(n);
};
/** Liczba z połówkami (rozmiar butów: 42,5). */
const dec = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(",", ".").replace(/\s/g, ""));
  return String(v ?? "").trim() === "" || !Number.isFinite(n) ? null : Math.round(n * 2) / 2;
};

export async function saveWatchAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const db = getDb();
  const id = String(form.get("id") ?? "");
  const plan = PLANS[user.plan];

  const name = String(form.get("name") ?? "").trim();
  const category: Category = CATEGORY_IDS.includes(form.get("category") as Category) ? (form.get("category") as Category) : "skis";
  const gender: Gender = category === "boots" && GENDER_IDS.includes(form.get("gender") as Gender) ? (form.get("gender") as Gender) : "all";
  // katalog modeli obejmuje tylko narty; buty wyszukujemy po słowach kluczowych
  const families = category === "skis" ? form.getAll("families").map(String).filter(Boolean) : [];
  // porządkujemy frazy: „tecnica,scarpa ,” → „tecnica, scarpa”
  const keywords = keywordPhrases(String(form.get("keywords") ?? "")).join(", ");
  const sources = form.getAll("sources").map(String).filter((s): s is SourceId => SOURCE_IDS.includes(s as SourceId));
  const conditions = form
    .getAll("conditions")
    .map(String)
    .filter((c): c is Condition => CONDITION_IDS.includes(c as Condition));
  let notify = String(form.get("notify") ?? "daily");
  const minPrice = num(form.get("min_price"));
  const maxPrice = num(form.get("max_price"));
  const lenMin = category === "skis" ? num(form.get("len_min")) : null;
  const lenMax = category === "skis" ? num(form.get("len_max")) : null;
  const sizeMin = category === "boots" ? dec(form.get("size_min")) : null;
  const sizeMax = category === "boots" ? dec(form.get("size_max")) : null;

  if (category === "boots" && !keywords) return { error: "Wpisz markę lub model butów, np. tecnica, scarpa." };
  if (!families.length && !keywords) return { error: "Wybierz co najmniej jeden model albo wpisz słowa kluczowe." };
  if (sizeMin != null && sizeMax != null && sizeMin > sizeMax) return { error: "Rozmiar minimalny jest większy niż maksymalny." };
  if (!sources.length) return { error: "Zaznacz co najmniej jeden serwis z ogłoszeniami." };
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) return { error: "Cena minimalna jest wyższa niż maksymalna." };
  if (lenMin != null && lenMax != null && lenMin > lenMax) return { error: "Długość minimalna jest większa niż maksymalna." };
  if (!["instant", "daily", "off"].includes(notify)) notify = "daily";
  if (notify === "instant" && !plan.instant) notify = "daily";

  const values = [
    name || families[0] || keywords,
    category,
    gender,
    JSON.stringify(families),
    keywords,
    minPrice,
    maxPrice,
    lenMin,
    lenMax,
    sizeMin,
    sizeMax,
    JSON.stringify(conditions),
    JSON.stringify(sources),
    notify,
  ];

  let watchId = id;
  if (id) {
    const r = db
      .prepare(
        `UPDATE watches SET name=?, category=?, gender=?, families=?, keywords=?, min_price=?, max_price=?, len_min=?, len_max=?, size_min=?, size_max=?, conditions=?, sources=?, notify=?, last_run_at=NULL
         WHERE id = ? AND user_id = ?`,
      )
      .run(...values, id, user.id);
    if (!r.changes) return { error: "Nie znaleziono wyszukiwania." };
  } else {
    const count = (db.prepare("SELECT COUNT(*) AS n FROM watches WHERE user_id = ?").get(user.id) as { n: number }).n;
    if (count >= plan.maxWatches) {
      return { error: `Plan ${plan.name} pozwala na ${plan.maxWatches} wyszukiwania. Przejdź na Pro, żeby dodać więcej.` };
    }
    watchId = randomUUID();
    db.prepare(
      `INSERT INTO watches (id, user_id, name, category, gender, families, keywords, min_price, max_price, len_min, len_max, size_min, size_max, conditions, sources, notify, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(watchId, user.id, ...values, new Date().toISOString());
  }
  // od razu przeszukujemy ostatnie 7 dni, żeby użytkownik zobaczył wyniki
  await runScan({ userId: user.id, demoCount: 10 });
  revalidatePath("/panel", "layout");
  redirect(`/panel/wyszukiwania/${watchId}`);
}

export async function deleteWatchAction(id: string) {
  const user = await requireUser();
  getDb().prepare("DELETE FROM watches WHERE id = ? AND user_id = ?").run(id, user.id);
  revalidatePath("/panel", "layout");
  redirect("/panel/wyszukiwania");
}

export async function toggleWatchAction(id: string, active: boolean) {
  const user = await requireUser();
  getDb().prepare("UPDATE watches SET active = ? WHERE id = ? AND user_id = ?").run(active ? 1 : 0, id, user.id);
  revalidatePath("/panel", "layout");
}

export async function setMatchStatusAction(matchId: number, status: "new" | "saved" | "dismissed") {
  const user = await requireUser();
  getDb()
    .prepare(
      "UPDATE watch_matches SET status = ? WHERE id = ? AND watch_id IN (SELECT id FROM watches WHERE user_id = ?)",
    )
    .run(status, matchId, user.id);
  revalidatePath("/panel", "layout");
}

export async function scanNowAction(): Promise<FormState> {
  const user = await requireUser();
  const r = await runScan({ userId: user.id, demoCount: 14 });
  revalidatePath("/panel", "layout");
  return {
    ok:
      (r.newMatches === 0
        ? `Sprawdzone ogłoszenia: ${r.fetched}. Nic nowego nie spełnia Twoich kryteriów.`
        : `Sprawdzone ogłoszenia: ${r.fetched}. Nowe pasujące: ${r.newMatches}.${r.notified ? " Wysłaliśmy powiadomienie." : ""}`) +
      (r.removed ? ` Nieaktualne (sprzedane lub usunięte): ${r.removed}.` : ""),
  };
}

export async function sendDigestNowAction(): Promise<FormState> {
  const user = await requireUser();
  const n = await sendDigests({ userId: user.id });
  revalidatePath("/panel", "layout");
  return { ok: n ? `Wysłano podsumowanie (${n}).` : "Brak nowych ogłoszeń do podsumowania." };
}

/** DEMO: aktywacja planu bez płatności. W produkcji: Stripe Checkout / Przelewy24 i webhook. */
export async function upgradePlanAction(period: "month" | "year") {
  const user = await requireUser();
  const days = period === "year" ? 365 : 30;
  const until = new Date(Date.now() + days * 86_400_000).toISOString();
  getDb().prepare("UPDATE users SET plan = 'pro', plan_until = ? WHERE id = ?").run(until, user.id);
  revalidatePath("/panel", "layout");
  redirect("/panel/plan?aktywowano=1");
}

export async function cancelPlanAction() {
  const user = await requireUser();
  const db = getDb();
  db.prepare("UPDATE users SET plan = 'free', plan_until = NULL WHERE id = ?").run(user.id);
  // plan Free nie ma powiadomień natychmiastowych
  db.prepare("UPDATE watches SET notify = 'daily' WHERE user_id = ? AND notify = 'instant'").run(user.id);
  revalidatePath("/panel", "layout");
}

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  getDb().prepare("UPDATE users SET name = ? WHERE id = ?").run(String(form.get("name") ?? "").trim() || null, user.id);
  revalidatePath("/panel", "layout");
  return { ok: "Zapisano." };
}

export async function saveDiscordAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const url = String(form.get("webhook") ?? "").trim();
  if (!isDiscordWebhook(url))
    return { error: "To nie jest adres webhooka Discorda. Powinien zaczynać się od https://discord.com/api/webhooks/." };
  const ok = await sendDiscord(url, "Apex Radar połączony z tym kanałem. Tutaj będą trafiać nowe ogłoszenia.", []);
  if (!ok) return { error: "Discord odrzucił wiadomość. Sprawdź, czy webhook nie został usunięty." };
  getDb().prepare("UPDATE users SET discord_webhook = ? WHERE id = ?").run(url, user.id);
  revalidatePath("/panel", "layout");
  return { ok: "Połączono. Na kanale powinna być wiadomość od Apex Radar." };
}

/** Wysyła na Discorda najtańsze z ostatnio znalezionych ogłoszeń, żeby zobaczyć, jak wygląda powiadomienie. */
export async function testDiscordAction(): Promise<FormState> {
  const user = await requireUser();
  if (!user.discordWebhook) return { error: "Najpierw połącz kanał Discorda." };
  const items = getDb()
    .prepare(
      `SELECT l.* FROM watch_matches m JOIN watches w ON w.id = m.watch_id JOIN listings l ON l.id = m.listing_id
       WHERE w.user_id = ? AND m.status != 'dismissed' ORDER BY m.created_at DESC, l.price LIMIT 3`,
    )
    .all(user.id) as unknown as Listing[];
  const heading = items.length
    ? `**Test powiadomienia:** ${items.length} ostatnio znalezione ogłoszenia`
    : "**Test powiadomienia.** Nie masz jeszcze znalezionych ogłoszeń, więc wysyłamy samą wiadomość.";
  const ok = await sendDiscord(user.discordWebhook, heading, items);
  return ok ? { ok: "Wysłano na Discorda." } : { error: "Discord odrzucił wiadomość." };
}

export async function removeDiscordAction(): Promise<FormState> {
  const user = await requireUser();
  getDb().prepare("UPDATE users SET discord_webhook = NULL WHERE id = ?").run(user.id);
  revalidatePath("/panel", "layout");
  return { ok: "Odłączono Discorda." };
}

export async function deleteAccountAction() {
  const user = await requireUser();
  await logoutUser();
  getDb().prepare("DELETE FROM users WHERE id = ?").run(user.id);
  redirect("/radar");
}

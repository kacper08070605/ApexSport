import { randomUUID } from "node:crypto";
import { getDb, type AlertRow } from "@/lib/db";
import { liveBestPrice } from "@/lib/live-prices";
import { getSki, skiName } from "@/lib/skis";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Załóż alert: { email, slug, targetPrice }. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const slug = String(body?.slug ?? "");
  const target = Math.round(Number(body?.targetPrice));

  if (!EMAIL_RE.test(email)) return Response.json({ error: "Podaj poprawny adres e-mail" }, { status: 400 });
  const ski = getSki(slug);
  const current = liveBestPrice(slug);
  if (!ski || current === undefined) return Response.json({ error: "Nie ma takiego produktu" }, { status: 404 });
  if (!Number.isFinite(target) || target <= 0 || target >= current) {
    return Response.json({ error: "Cena docelowa musi być niższa od obecnej najniższej ceny" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM alerts WHERE email = ? AND product_slug = ? AND status = 'active'")
    .get(email, slug) as { id: string } | undefined;

  const id = existing?.id ?? randomUUID();
  if (existing) {
    db.prepare("UPDATE alerts SET target_price = ? WHERE id = ?").run(target, id);
  } else {
    db.prepare(
      "INSERT INTO alerts (id, email, product_slug, target_price, price_at_signup, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id, email, slug, target, current, new Date().toISOString());
  }
  return Response.json({ id, product: skiName(ski), target });
}

/** Alerty z tej przeglądarki: ?ids=a,b,c (identyfikatory są losowymi UUID). */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 50);
  if (ids.length === 0) return Response.json({ alerts: [] });

  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM alerts WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY created_at DESC`)
    .all(...ids) as unknown as AlertRow[];

  const alerts = rows.map((a) => {
    const ski = getSki(a.product_slug);
    const notification = db
      .prepare("SELECT subject, body, created_at FROM notifications WHERE alert_id = ? ORDER BY id DESC LIMIT 1")
      .get(a.id);
    return {
      id: a.id,
      email: a.email,
      slug: a.product_slug,
      name: ski ? skiName(ski) : a.product_slug,
      season: ski?.season,
      image: ski?.image,
      target: a.target_price,
      priceAtSignup: a.price_at_signup,
      current: liveBestPrice(a.product_slug),
      status: a.status,
      createdAt: a.created_at,
      triggeredAt: a.triggered_at,
      triggeredPrice: a.triggered_price,
      notification: notification ?? null,
    };
  });
  return Response.json({ alerts });
}

/** Anuluj alert: ?id=... */
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Brak id" }, { status: 400 });
  getDb().prepare("UPDATE alerts SET status = 'cancelled' WHERE id = ?").run(id);
  return Response.json({ ok: true });
}

// Aktualizacja cen ze stron produktów w sklepach + sprawdzenie alertów cenowych.
//
// Każda oferta w data/offers.json ma adres karty produktu. Skrypt otwiera ją (zwykłe żądanie,
// uczciwy User-Agent, przerwa między sklepami), czyta cenę i dostępność z danych strukturalnych
// schema.org (JSON-LD albo microdata) i zapisuje zmiany. Strona, z której nie da się odczytać ceny,
// zostaje z poprzednią ceną i datą sprawdzenia. Uruchamiany ręcznie, nie ma harmonogramu.
//
// Użycie:
//   node scripts/update-prices.mjs                  # wszystkie oferty
//   node scripts/update-prices.mjs <slug>           # tylko jeden model
//
// Wysyłka e-maili: jeśli ustawiono RESEND_API_KEY, przez Resend; inaczej powiadomienie
// trafia tylko do tabeli notifications (widać je na stronie /alerty).

import postgres from "postgres";
import { isoDay, minPrice, OFFERS_PATH, readJson, writeJson } from "./lib/prices.mjs";

const UA = "ApexSport/0.1 (porownywarka cen nart, projekt studencki)";
const PAUSE_MS = 1500;

const data = await readJson("data/offers.json");
const skis = await readJson("data/skis.json");
const shops = Object.fromEntries((await readJson("data/shops.json")).map((s) => [s.id, s]));
const skiBySlug = Object.fromEntries(skis.map((s) => [s.slug, s]));

const only = process.argv[2];
if (only && !data.products[only]) throw new Error(`Nie ma produktu ${only}`);

/** Cena i dostępność z danych strukturalnych strony produktu. */
function readOffer(html) {
  const found = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const type = [node["@type"]].flat().join(" ");
    if (/Offer/.test(type)) {
      const price = Number(String(node.price ?? node.lowPrice ?? "").replace(",", "."));
      if (price > 0) found.push({ price, availability: String(node.availability ?? "") });
    }
    Object.values(node).forEach(walk);
  };
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1].trim()));
    } catch {
      // uszkodzony JSON-LD zdarza się w sklepach, pomijamy blok
    }
  }
  if (!found.length) {
    const meta = html.match(/(?:itemprop="price"|property="product:price:amount")[^>]*content="([\d.,]+)"/i);
    if (meta) found.push({ price: Number(meta[1].replace(",", ".")), availability: "" });
  }
  if (!found.length) return null;
  // sklepy często podają osobną ofertę dla każdej długości: liczy się najtańsza dostępna
  const known = found.filter((o) => o.availability);
  const live = known.filter((o) => !/OutOfStock|SoldOut|Discontinued/i.test(o.availability));
  const pool = live.length ? live : found;
  const price = Math.round(Math.min(...pool.map((o) => o.price)));
  const availability = !known.length
    ? null // strona nie podaje stanu, zostaje poprzedni
    : !live.length
      ? "out_of_stock"
      : live.every((o) => /LimitedAvailability/i.test(o.availability))
        ? "low_stock"
        : "in_stock";
  return { price, availability };
}

const day = isoDay(new Date());
const now = new Date().toISOString();
let checked = 0;
let changed = 0;
const failed = [];

for (const [slug, p] of Object.entries(data.products)) {
  if (only && slug !== only) continue;
  for (const o of p.offers) {
    if (checked) await new Promise((r) => setTimeout(r, PAUSE_MS));
    checked++;
    const res = await fetch(o.url, { headers: { "User-Agent": UA }, redirect: "follow" }).catch(() => null);
    if (res && (res.status === 404 || res.status === 410)) {
      o.availability = "out_of_stock";
      o.checked_at = now;
      changed++;
      continue;
    }
    const read = res?.ok ? readOffer(await res.text()) : null;
    if (!read) {
      failed.push(`${shops[o.shop]?.name ?? o.shop}: ${res ? res.status : "brak połączenia"}`);
      continue;
    }
    // schema.org nie ma stanu „ostatnie sztuki”, więc InStock go nie nadpisuje
    const availability =
      read.availability === null || (read.availability === "in_stock" && o.availability === "low_stock")
        ? o.availability
        : read.availability;
    if (read.price !== o.price || availability !== o.availability) changed++;
    o.price = read.price;
    o.list_price = Math.max(o.list_price, read.price);
    o.availability = availability;
    o.checked_at = now;
  }
  p.min = minPrice(p.offers);
  if (!Number.isFinite(p.min)) continue;
  if (p.history.at(-1)?.d === day) p.history.at(-1).min = p.min;
  else p.history.push({ d: day, min: p.min });
  p.history = p.history.slice(-365);
}
data.updated_at = now;
await writeJson(OFFERS_PATH, data);
console.log(`Ceny na ${day}: sprawdzono ${checked} ofert, zmienionych ${changed}.`);
if (failed.length) console.log(`Nie udało się odczytać (${failed.length}):\n  ${failed.join("\n  ")}`);

// --- alerty ---
if (!process.env.DATABASE_URL) {
  console.log("Alerty pominięte: brak DATABASE_URL.");
  process.exit(0);
}
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
const active = await sql`SELECT * FROM alerts WHERE status = 'active'`;
let sent = 0;

for (const alert of active) {
  const p = data.products[alert.product_slug];
  const ski = skiBySlug[alert.product_slug];
  if (!p || !ski || !Number.isFinite(p.min) || p.min > alert.target_price) continue;

  const best = p.offers.filter((o) => o.price === p.min && o.availability !== "out_of_stock")[0];
  const name = `${ski.brand} ${ski.model} (${ski.season})`;
  const subject = `Cena spadła: ${name} za ${p.min} zł`;
  const body = [
    `${name} kosztuje teraz ${p.min} zł w sklepie ${shops[best.shop]?.name ?? best.shop}.`,
    `Twój próg: ${alert.target_price} zł. Cena w dniu zapisu: ${alert.price_at_signup} zł.`,
    `Oferta: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/go/${best.id}`,
  ].join("\n");

  await sendEmail(alert.email, subject, body);
  await sql`INSERT INTO notifications (alert_id, email, subject, body, created_at) VALUES (${alert.id}, ${alert.email}, ${subject}, ${body}, ${now})`;
  await sql`UPDATE alerts SET status = 'triggered', triggered_at = ${now}, triggered_price = ${p.min} WHERE id = ${alert.id}`;
  sent++;
}
console.log(`Alerty: ${active.length} aktywnych, wysłano ${sent} powiadomień.`);
await sql.end();

async function sendEmail(to, subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`  [bez RESEND_API_KEY] e-mail do ${to}: ${subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.ALERT_FROM ?? "Apex Sport <alerty@apexsport.pl>", to, subject, text }),
  });
  if (!res.ok) console.warn(`  Resend: ${res.status} ${await res.text()}`);
}

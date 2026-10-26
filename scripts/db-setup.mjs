// Zakłada tabele w Postgresie (Supabase) z data/schema.sql.
// Z --from-sqlite przenosi też dane z dawnej lokalnej bazy data/apex.db (konta, wyszukiwania, ogłoszenia, alerty).
//
// Użycie: npm run db:setup              # tylko schemat
//         npm run db:setup -- --from-sqlite

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const root = path.resolve(import.meta.dirname, "..");
if (!process.env.DATABASE_URL) throw new Error("Brak DATABASE_URL w .env.local");
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

await sql.unsafe(readFileSync(path.join(root, "data/schema.sql"), "utf-8"));
console.log("Schemat gotowy.");

const sqlitePath = path.join(root, "data/apex.db");
if (process.argv.includes("--from-sqlite") && existsSync(sqlitePath)) {
  const { DatabaseSync } = await import("node:sqlite");
  const lite = new DatabaseSync(sqlitePath, { readOnly: true });
  // kolejność ze względu na klucze obce; tabele z BIGSERIAL kopiujemy bez id
  const tables = ["users", "sessions", "watches", "listings", "watch_matches", "radar_notifications", "alerts", "clicks", "notifications"];
  const serial = new Set(["watch_matches", "radar_notifications", "clicks", "notifications"]);
  for (const t of tables) {
    const rows = lite.prepare(`SELECT * FROM ${t}`).all().map((r) => {
      const o = { ...r };
      if (serial.has(t)) delete o.id;
      return o;
    });
    if (!rows.length) continue;
    for (let i = 0; i < rows.length; i += 500) {
      await sql`INSERT INTO ${sql(t)} ${sql(rows.slice(i, i + 500))} ON CONFLICT DO NOTHING`;
    }
    console.log(`${t}: ${rows.length}`);
  }
}
await sql.end();

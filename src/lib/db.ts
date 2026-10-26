import "server-only";
import postgres from "postgres";

/**
 * Baza Postgres (Supabase). Adres w DATABASE_URL: pooler w trybie transakcji (port 6543),
 * dlatego bez prepared statements. Schemat: data/schema.sql, zakładany przez scripts/db-setup.mjs.
 */
const g = globalThis as unknown as { __apexSql?: postgres.Sql };

function client() {
  if (!process.env.DATABASE_URL) throw new Error("Brak DATABASE_URL (ustaw w .env.local albo w zmiennych środowiska hostingu).");
  return postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    onnotice: () => {},
    // COUNT/SUM/AVG zwracają w Postgresie bigint/numeric; w aplikacji chcemy zwykłe liczby
    types: { bigint: { to: 20, from: [20, 1700], serialize: (x: number) => String(x), parse: (x: string) => Number(x) } },
  });
}

const sql = () => (g.__apexSql ??= client());

/** Zapytania pisane z „?” jak w SQLite; zamieniamy na $1, $2… */
const pg = (q: string) => {
  let i = 0;
  return q.replace(/\?/g, () => `$${++i}`);
};

type Param = string | number | boolean | null | undefined;
const params = (p: Param[]) => p.map((x) => (x === undefined ? null : x)) as (string | number | boolean | null)[];

export const db = {
  async get<T>(q: string, ...p: Param[]): Promise<T | undefined> {
    return (await sql().unsafe(pg(q), params(p)))[0] as T | undefined;
  },
  async all<T>(q: string, ...p: Param[]): Promise<T[]> {
    return (await sql().unsafe(pg(q), params(p))) as unknown as T[];
  },
  /** INSERT/UPDATE/DELETE; zwraca liczbę zmienionych wierszy. */
  async run(q: string, ...p: Param[]): Promise<{ changes: number }> {
    const r = await sql().unsafe(pg(q), params(p));
    return { changes: r.count };
  },
};

export interface AlertRow {
  id: string;
  email: string;
  product_slug: string;
  target_price: number;
  price_at_signup: number;
  status: "active" | "triggered" | "cancelled";
  created_at: string;
  triggered_at: string | null;
  triggered_price: number | null;
}

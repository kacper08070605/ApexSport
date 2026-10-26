import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// APEX_DB pozwala uruchomić drugą instancję na kopii bazy (np. do nagrań i testów)
const DB_PATH = process.env.APEX_DB ?? path.join(process.cwd(), "data/apex.db");

let db: DatabaseSync | undefined;

/** Połączenie z bazą SQLite; schemat tworzy się przy pierwszym użyciu. */
export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    db.exec(readFileSync(path.join(process.cwd(), "data/schema.sql"), "utf-8"));
    // migracja istniejących baz: kolumny dodane po utworzeniu tabel
    const addColumn = (table: string, column: string, def: string) => {
      const cols = (db!.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
      if (!cols.includes(column)) db!.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    };
    addColumn("users", "discord_webhook", "TEXT");
    addColumn("watches", "category", "TEXT NOT NULL DEFAULT 'skis'");
    addColumn("watches", "gender", "TEXT NOT NULL DEFAULT 'all'");
    addColumn("watches", "size_min", "REAL");
    addColumn("watches", "size_max", "REAL");
    addColumn("listings", "category", "TEXT NOT NULL DEFAULT 'skis'");
    addColumn("listings", "size", "REAL");
    addColumn("listings", "checked_at", "TEXT");
    addColumn("listings", "removed_at", "TEXT");
  }
  return db;
}

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

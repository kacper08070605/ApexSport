-- Baza serwisu (SQLite, plik data/apex.db). Wspólna dla aplikacji i skryptów.

CREATE TABLE IF NOT EXISTS alerts (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  product_slug    TEXT NOT NULL,
  target_price    INTEGER NOT NULL,
  price_at_signup INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active', -- active | triggered | cancelled
  created_at      TEXT NOT NULL,
  triggered_at    TEXT,
  triggered_price INTEGER
);

-- Kliknięcia w oferty sklepów: podstawa rozliczeń z sieciami afiliacyjnymi.
CREATE TABLE IF NOT EXISTS clicks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id     TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  shop         TEXT NOT NULL,
  price        INTEGER NOT NULL,
  created_at   TEXT NOT NULL
);

-- Wysłane (lub w trybie demo: zapisane) powiadomienia e-mail.
CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id   TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ===== Apex Radar: monitoring ogłoszeń z rynku wtórnego =====

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  password_hash TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free',   -- free | pro
  plan_until    TEXT,
  discord_webhook TEXT,                         -- adres webhooka kanału Discord (opcjonalnie)
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,                  -- skrót SHA-256 tokenu z ciasteczka
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

-- Wyszukiwania (filtry) użytkownika.
CREATE TABLE IF NOT EXISTS watches (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'skis',    -- skis | boots
  gender      TEXT NOT NULL DEFAULT 'all',     -- buty: all | men | women | kids
  families    TEXT NOT NULL DEFAULT '[]',      -- JSON: linie modeli z katalogu
  keywords    TEXT NOT NULL DEFAULT '',
  min_price   INTEGER,
  max_price   INTEGER,
  len_min     INTEGER,
  len_max     INTEGER,
  size_min    REAL,                            -- rozmiar EU (buty)
  size_max    REAL,
  conditions  TEXT NOT NULL DEFAULT '[]',      -- JSON: new | like_new | used | worn
  sources     TEXT NOT NULL DEFAULT '[]',      -- JSON: olx | allegro | vinted
  notify      TEXT NOT NULL DEFAULT 'instant', -- instant | daily | off
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  last_run_at TEXT
);

-- Ogłoszenia zebrane przez bota (ze wszystkich źródeł).
CREATE TABLE IF NOT EXISTS listings (
  id          TEXT PRIMARY KEY,
  source      TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title       TEXT NOT NULL,
  price       INTEGER NOT NULL,
  url         TEXT NOT NULL,
  image       TEXT,
  location    TEXT,
  condition   TEXT,
  category    TEXT NOT NULL DEFAULT 'skis',    -- skis | boots
  length_cm   INTEGER,
  size        REAL,                            -- rozmiar EU (buty)
  family      TEXT,                            -- dopasowana linia modelu z katalogu
  ski_slug    TEXT,                            -- dopasowany rocznik (jeśli rozpoznany)
  posted_at   TEXT NOT NULL,
  seen_at     TEXT NOT NULL,
  checked_at  TEXT,                            -- ostatnie sprawdzenie, czy ogłoszenie istnieje
  removed_at  TEXT,                            -- sprzedane lub usunięte w serwisie
  UNIQUE (source, external_id)
);

CREATE TABLE IF NOT EXISTS watch_matches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  watch_id    TEXT NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
  listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  notified_at TEXT,
  status      TEXT NOT NULL DEFAULT 'new',     -- new | saved | dismissed
  UNIQUE (watch_id, listing_id)
);

CREATE TABLE IF NOT EXISTS radar_notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watch_id   TEXT,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  matches    INTEGER NOT NULL DEFAULT 0,
  channel    TEXT NOT NULL DEFAULT 'email',
  created_at TEXT NOT NULL
);

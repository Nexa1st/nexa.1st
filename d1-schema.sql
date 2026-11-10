-- IRFAN-GD owner dashboard — D1 schema (Phase 3, staging)
-- Apply ONCE by the owner (Cloudflare dashboard → D1 → Console) or via
-- wrangler after the database exists. Stores AGGREGATES ONLY, plus the
-- owner's own imported report rows and the admin activity log.
-- No visitor-level data, no customer data, no payment data — ever.

-- Daily affiliate-click aggregates synced from the GA4 Data API.
CREATE TABLE IF NOT EXISTS daily_clicks (
  date    TEXT NOT NULL,             -- YYYY-MM-DD (GA4 date)
  product TEXT NOT NULL,             -- GA4 event parameter: product name
  clicks  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, product)
);

-- Sync bookkeeping (single row, id = 1).
CREATE TABLE IF NOT EXISTS sync_state (
  id        INTEGER PRIMARY KEY CHECK (id = 1),
  last_sync TEXT                      -- ISO timestamp of last successful GA4 sync
);
INSERT OR IGNORE INTO sync_state (id, last_sync) VALUES (1, NULL);

-- Earnings rows imported by the owner from official AliExpress Portals CSV
-- reports. The unique (row_date, item, amount) key is the row-level
-- duplicate guard; the file-level guard is import_files.file_hash.
CREATE TABLE IF NOT EXISTS earnings (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  row_date TEXT NOT NULL,             -- date from the report row
  item     TEXT NOT NULL,             -- product / order label from the report
  amount   REAL NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  file_id  INTEGER,
  UNIQUE (row_date, item, amount)
);

-- One row per imported file; file_hash = SHA-256 of the file bytes.
-- Re-uploading the identical file is rejected on this unique hash alone.
CREATE TABLE IF NOT EXISTS import_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  file_hash   TEXT NOT NULL UNIQUE,
  file_name   TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  rows_ok     INTEGER NOT NULL DEFAULT 0,
  rows_skip   INTEGER NOT NULL DEFAULT 0
);

-- Durable admin audit trail: session_start rows (logins) + every dashboard
-- action (csv_import, manual_sync, ...) with success AND failure results.
CREATE TABLE IF NOT EXISTS admin_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     TEXT NOT NULL,               -- ISO timestamp (UTC)
  actor  TEXT NOT NULL,               -- verified owner email from Access JWT
  action TEXT NOT NULL,
  detail TEXT,
  result TEXT NOT NULL DEFAULT 'ok'
);
CREATE INDEX IF NOT EXISTS idx_admin_log_ts ON admin_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON daily_clicks (date DESC);

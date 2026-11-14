CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  secret_hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  org_id TEXT NOT NULL DEFAULT 'org_default',
  scopes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org_default',
  label TEXT NOT NULL,
  public_key_pem TEXT,
  fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  audio_content_hash TEXT NOT NULL,
  manifest JSONB NOT NULL,
  signature_b64u TEXT NOT NULL,
  public_key_pem TEXT NOT NULL,
  key_fingerprint TEXT NOT NULL,
  time_attestation JSONB,
  disclaimer TEXT,
  audio_stored BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS log_entries (
  idx INTEGER PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  package_id TEXT NOT NULL REFERENCES packages(id),
  content_hash TEXT NOT NULL,
  key_fingerprint TEXT NOT NULL,
  leaf_hash_hex TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS log_roots (
  day DATE PRIMARY KEY,
  tree_size INTEGER NOT NULL,
  root_hex TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_packages_org ON packages(org_id);
CREATE INDEX IF NOT EXISTS idx_log_package ON log_entries(package_id);

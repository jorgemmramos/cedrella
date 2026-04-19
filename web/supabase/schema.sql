-- Cedrella v1.5 — Supabase schema
-- Run in: https://app.supabase.com → SQL Editor → New query
-- All tables use Row Level Security: each user sees only their own data.

-- ── Extensions ────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── Readings ──────────────────────────────────────────────────────────────────

create table if not exists readings (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null    default auth.uid()
                           references auth.users(id) on delete cascade,
  sensor_id    uuid        not null,
  timestamp    timestamptz not null    default now(),
  temp         numeric(5,1),
  lux          integer,
  moisture     integer,
  conductivity integer,
  battery      integer
);

alter table readings enable row level security;

create policy "readings_owner" on readings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists idx_readings_sensor_ts
  on readings (sensor_id, timestamp desc);

-- ── Plants ────────────────────────────────────────────────────────────────────

create table if not exists plants (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null    default auth.uid()
                         references auth.users(id) on delete cascade,
  sensor_id  uuid,
  name       text        not null,
  location   text,
  limits     jsonb,
  created_at timestamptz not null    default now()
);

alter table plants enable row level security;

create policy "plants_owner" on plants
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Sensors ───────────────────────────────────────────────────────────────────

create table if not exists sensors (
  id        uuid        primary key default uuid_generate_v4(),
  user_id   uuid        not null    default auth.uid()
                        references auth.users(id) on delete cascade,
  ble_id    text        not null,
  name      text,
  firmware  text,
  battery   integer,
  last_seen timestamptz
);

alter table sensors enable row level security;

create policy "sensors_owner" on sensors
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Prevent duplicate BLE devices per user
create unique index if not exists idx_sensors_user_ble
  on sensors (user_id, ble_id);

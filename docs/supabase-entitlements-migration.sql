-- Supabase migration: user_entitlements table
-- Run this in the Supabase SQL editor (or via supabase db push) before deploying
-- the lobby server in production.

create table if not exists user_entitlements (
  user_id                 text        primary key,
  tier_id                 text        not null default 'fibber',
  addon_twist_truth       boolean     not null default false,
  unlocked_theme_pack_ids jsonb       not null default '[]',
  updated_at              timestamptz not null default now(),
  source                  text        not null default 'default'
);

-- Optional: enable Row Level Security so only the service role can write.
alter table user_entitlements enable row level security;

-- Allow the service role (used by the lobby server) full access.
create policy "service_role_full_access" on user_entitlements
  for all
  using (true)
  with check (true);

-- Allow authenticated users to read their own entitlements (optional, for client-side reads).
create policy "users_read_own" on user_entitlements
  for select
  using (auth.uid()::text = user_id);

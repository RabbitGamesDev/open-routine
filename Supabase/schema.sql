-- OpenRutine — esquema + RLS. Ejecutar en Supabase SQL Editor.
create table if not exists public.or_entries (
  id bigint generated always as identity primary key,
  owner uuid references auth.users not null default auth.uid(),
  store text not null check (store in ('tasks','routines','occurrences','results','academic','kv')),
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (owner, store, key)
);
alter table public.or_entries enable row level security;
create policy "own read"   on public.or_entries for select using (owner = auth.uid());
create policy "own write"  on public.or_entries for insert with check (owner = auth.uid());
create policy "own update" on public.or_entries for update using (owner = auth.uid());
create policy "own delete" on public.or_entries for delete using (owner = auth.uid());
-- Conflictos: gana updated_at mas reciente (aplicado en cliente en fase 2; ver docs/DESPLIEGUE.md)

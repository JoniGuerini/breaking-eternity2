-- Execute este SQL no Supabase (SQL Editor) para criar a tabela de saves na nuvem.
-- Um save por usuário (user_id); atualizado a cada persistência quando logado.

create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

-- Usuário só acessa a própria linha
create policy "Users can read own save"
  on public.saves for select
  using (auth.uid() = user_id);

create policy "Users can insert own save"
  on public.saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update own save"
  on public.saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own save"
  on public.saves for delete
  using (auth.uid() = user_id);

-- Índice opcional (já temos PK em user_id)
-- create index if not exists saves_updated_at on public.saves(updated_at);

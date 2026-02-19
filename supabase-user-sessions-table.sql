-- Execute no Supabase (SQL Editor) para suportar "um dispositivo por conta".
-- Usado para avisar ao logar que a conta já está em outro dispositivo e para
-- deslogar o outro dispositivo ao escolher "Forçar login".

create table if not exists public.user_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_device_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_sessions enable row level security;

create policy "Users can read own session"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own session"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own session"
  on public.user_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Para o outro dispositivo ser deslogado em tempo real, inclua a tabela na publication do Realtime.
-- No SQL Editor, execute também:
--   alter publication supabase_realtime add table public.user_sessions;
-- (Ou em Database → Publications → supabase_realtime, adicione a tabela user_sessions.)

alter table public.boards enable row level security;
alter table public.board_items enable row level security;
alter table public.chat_threads enable row level security;

revoke all on table public.boards from anon;
revoke all on table public.board_items from anon;
revoke all on table public.chat_threads from anon;
grant select, insert, update, delete on table public.boards to authenticated;
grant select, insert, update, delete on table public.board_items to authenticated;
grant select, insert, update, delete on table public.chat_threads to authenticated;
grant all on table public.boards to service_role;
grant all on table public.board_items to service_role;
grant all on table public.chat_threads to service_role;

revoke all on table public.generation_logs from anon, authenticated;
grant all on table public.generation_logs to service_role;
drop policy if exists "anon_select_generation_logs" on public.generation_logs;
drop policy if exists "anon_insert_generation_logs" on public.generation_logs;
drop policy if exists "anon_update_generation_logs" on public.generation_logs;
drop policy if exists "anon_delete_generation_logs" on public.generation_logs;

revoke all on table public.generations from anon;
grant select, insert, update, delete on table public.generations to authenticated;
grant all on table public.generations to service_role;
drop policy if exists "anon_select_generations" on public.generations;
drop policy if exists "anon_insert_generations" on public.generations;
drop policy if exists "anon_update_generations" on public.generations;
drop policy if exists "anon_delete_generations" on public.generations;

drop policy if exists "own generations update" on public.generations;
create policy "own generations update" on public.generations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on table public.workflows from anon;
grant select, insert, update, delete on table public.workflows to authenticated;
grant all on table public.workflows to service_role;
drop policy if exists "anon_select_workflows" on public.workflows;
drop policy if exists "anon_insert_workflows" on public.workflows;
drop policy if exists "anon_update_workflows" on public.workflows;
drop policy if exists "anon_delete_workflows" on public.workflows;

revoke all on table public.scheduler_heartbeats from anon, authenticated;
grant all on table public.scheduler_heartbeats to service_role;
drop policy if exists "heartbeats read" on public.scheduler_heartbeats;
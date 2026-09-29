create policy "service role manages generation logs"
on public.generation_logs
for all
to service_role
using (true)
with check (true);

create policy "service role manages scheduler heartbeats"
on public.scheduler_heartbeats
for all
to service_role
using (true)
with check (true);
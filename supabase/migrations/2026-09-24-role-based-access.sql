-- Role-based access (2026-09-24)
-- Before: every org member could write everything. After: super_admin and
-- client_admin ("editors") can write; client_user (and the retired
-- practice_staff) is view-only, except changing task status via
-- set_task_status(). Audit-log reads are admin-only. Also closes a hole
-- where any user could update their own public.users row — including their
-- role — directly through the Supabase API.
-- Keep the editor list in sync with EDITOR_ROLES in lib/users/permissions.ts.
-- Idempotent: safe to re-run. Rollback: 2026-09-24-role-based-access.rollback.sql

create or replace function public.current_user_can_edit()
returns boolean as $$
  select coalesce(
    (select role in ('super_admin', 'client_admin') from public.users where id = auth.uid()),
    false
  )
$$ language sql stable security definer set search_path = public;

drop policy if exists "Org members can write companies" on public.companies;
drop policy if exists "Org editors can write companies" on public.companies;
create policy "Org editors can write companies" on public.companies
  for all using (organization_id = public.current_org_id() and public.current_user_can_edit())
  with check (organization_id = public.current_org_id() and public.current_user_can_edit());

drop policy if exists "Org members can write people" on public.people;
drop policy if exists "Org editors can write people" on public.people;
create policy "Org editors can write people" on public.people
  for all using (organization_id = public.current_org_id() and public.current_user_can_edit())
  with check (organization_id = public.current_org_id() and public.current_user_can_edit());

drop policy if exists "Org members can write legal_entities" on public.legal_entities;
drop policy if exists "Org editors can write legal_entities" on public.legal_entities;
create policy "Org editors can write legal_entities" on public.legal_entities
  for all using (organization_id = public.current_org_id() and public.current_user_can_edit())
  with check (organization_id = public.current_org_id() and public.current_user_can_edit());

drop policy if exists "Org members can write role_assignments" on public.role_assignments;
drop policy if exists "Org editors can write role_assignments" on public.role_assignments;
create policy "Org editors can write role_assignments" on public.role_assignments
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit())
  with check (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit());

drop policy if exists "Org members can write documents" on public.documents;
drop policy if exists "Org editors can write documents" on public.documents;
create policy "Org editors can write documents" on public.documents
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit())
  with check (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit());

drop policy if exists "Org members can write compliance_events" on public.compliance_events;
drop policy if exists "Org editors can write compliance_events" on public.compliance_events;
create policy "Org editors can write compliance_events" on public.compliance_events
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit())
  with check (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit());

drop policy if exists "Org members can write tasks" on public.tasks;
drop policy if exists "Org editors can write tasks" on public.tasks;
create policy "Org editors can write tasks" on public.tasks
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit())
  with check (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit());

drop policy if exists "Org members can write funding_rounds" on public.funding_rounds;
drop policy if exists "Org editors can write funding_rounds" on public.funding_rounds;
create policy "Org editors can write funding_rounds" on public.funding_rounds
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit())
  with check (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit());

drop policy if exists "Org members can write milestones" on public.milestones;
drop policy if exists "Org editors can write milestones" on public.milestones;
create policy "Org editors can write milestones" on public.milestones
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit())
  with check (company_id in (select id from public.companies where organization_id = public.current_org_id()) and public.current_user_can_edit());

drop policy if exists "Org members can upload documents to storage" on storage.objects;
drop policy if exists "Org editors can upload documents to storage" on storage.objects;
create policy "Org editors can upload documents to storage"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_user_can_edit()
  );

drop policy if exists "Org members can read their org's audit logs" on public.audit_logs;
drop policy if exists "Org admins can read their org's audit logs" on public.audit_logs;
create policy "Org admins can read their org's audit logs" on public.audit_logs
  for select using (organization_id = public.current_org_id() and public.current_user_can_edit());

-- All user-row changes go through the service-role /api/users routes.
drop policy if exists "Users can update their own row" on public.users;

-- Task status is the one write every role may make. Runs as definer so it
-- can also sync the linked compliance event (which view-only roles can't
-- write directly), but still scopes to the caller's own organization.
create or replace function public.set_task_status(p_task_id uuid, p_status text)
returns setof public.tasks as $$
declare
  t public.tasks;
begin
  if p_status not in ('todo', 'in_progress', 'done') then
    raise exception 'status must be one of todo, in_progress, done';
  end if;

  update public.tasks set status = p_status
  where id = p_task_id
    and company_id in (select id from public.companies where organization_id = public.current_org_id())
  returning * into t;
  if not found then return; end if;

  if t.source_compliance_event_id is not null then
    update public.compliance_events
    set status = case when p_status = 'done' then 'completed' else 'upcoming' end
    where id = t.source_compliance_event_id;
  end if;

  return next t;
end
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.set_task_status(uuid, text) from public, anon;
grant execute on function public.set_task_status(uuid, text) to authenticated;

-- Make PostgREST pick up the new function immediately.
notify pgrst, 'reload schema';

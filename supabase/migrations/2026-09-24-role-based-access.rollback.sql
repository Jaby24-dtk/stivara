-- Rollback for 2026-09-24-role-based-access.sql — restores the previous
-- "every org member can write everything" policies exactly.

drop policy if exists "Org editors can write companies" on public.companies;
drop policy if exists "Org members can write companies" on public.companies;
create policy "Org members can write companies" on public.companies
  for all using (organization_id = public.current_org_id());

drop policy if exists "Org editors can write people" on public.people;
drop policy if exists "Org members can write people" on public.people;
create policy "Org members can write people" on public.people
  for all using (organization_id = public.current_org_id());

drop policy if exists "Org editors can write legal_entities" on public.legal_entities;
drop policy if exists "Org members can write legal_entities" on public.legal_entities;
create policy "Org members can write legal_entities" on public.legal_entities
  for all using (organization_id = public.current_org_id());

drop policy if exists "Org editors can write role_assignments" on public.role_assignments;
drop policy if exists "Org members can write role_assignments" on public.role_assignments;
create policy "Org members can write role_assignments" on public.role_assignments
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()));

drop policy if exists "Org editors can write documents" on public.documents;
drop policy if exists "Org members can write documents" on public.documents;
create policy "Org members can write documents" on public.documents
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()));

drop policy if exists "Org editors can write compliance_events" on public.compliance_events;
drop policy if exists "Org members can write compliance_events" on public.compliance_events;
create policy "Org members can write compliance_events" on public.compliance_events
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()));

drop policy if exists "Org editors can write tasks" on public.tasks;
drop policy if exists "Org members can write tasks" on public.tasks;
create policy "Org members can write tasks" on public.tasks
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()));

drop policy if exists "Org editors can write funding_rounds" on public.funding_rounds;
drop policy if exists "Org members can write funding_rounds" on public.funding_rounds;
create policy "Org members can write funding_rounds" on public.funding_rounds
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()));

drop policy if exists "Org editors can write milestones" on public.milestones;
drop policy if exists "Org members can write milestones" on public.milestones;
create policy "Org members can write milestones" on public.milestones
  for all using (company_id in (select id from public.companies where organization_id = public.current_org_id()));

drop policy if exists "Org editors can upload documents to storage" on storage.objects;
drop policy if exists "Org members can upload documents to storage" on storage.objects;
create policy "Org members can upload documents to storage"
  on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_org_id()::text);

drop policy if exists "Org admins can read their org's audit logs" on public.audit_logs;
drop policy if exists "Org members can read their org's audit logs" on public.audit_logs;
create policy "Org members can read their org's audit logs" on public.audit_logs
  for select using (organization_id = public.current_org_id());

drop policy if exists "Users can update their own row" on public.users;
create policy "Users can update their own row" on public.users
  for update using (id = auth.uid());

-- set_task_status() and current_user_can_edit() are left in place on
-- purpose: the deployed app calls set_task_status(), which only ever
-- touches the caller's own org, and nothing references the other once
-- these policies are restored.

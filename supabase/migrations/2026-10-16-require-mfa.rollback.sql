-- Rollback for 2026-10-16-require-mfa.sql: password-only sessions work again.
create or replace function public.current_org_id()
returns uuid as $$
  select organization_id from public.users where id = auth.uid()
$$ language sql stable security definer;

create or replace function public.current_user_can_edit()
returns boolean as $$
  select coalesce(
    (select role in ('super_admin', 'client_admin') from public.users where id = auth.uid()),
    false
  )
$$ language sql stable security definer set search_path = public;

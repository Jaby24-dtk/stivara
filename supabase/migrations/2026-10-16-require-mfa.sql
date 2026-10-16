-- Two-step sign-in is required for everyone. Every org-scoped policy (tables
-- and the documents bucket) goes through current_org_id(), and every write
-- policy through current_user_can_edit(), so both now also require a
-- code-verified session: JWT claim aal = 'aal2'. A password-only (aal1)
-- session sees and changes nothing, even when calling the Supabase API
-- directly. The service-role key (signup, /api/users admin routes) bypasses
-- RLS as before. Idempotent. Rollback: 2026-10-16-require-mfa.rollback.sql

create or replace function public.mfa_verified()
returns boolean as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$ language sql stable;

create or replace function public.current_org_id()
returns uuid as $$
  select organization_id from public.users
  where id = auth.uid() and public.mfa_verified()
$$ language sql stable security definer set search_path = public;

create or replace function public.current_user_can_edit()
returns boolean as $$
  select public.mfa_verified() and coalesce(
    (select role in ('super_admin', 'client_admin') from public.users where id = auth.uid()),
    false
  )
$$ language sql stable security definer set search_path = public;

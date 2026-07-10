-- Stivara — Phase 0 Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables, indexes, and RLS policies.

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Organizations (the firm or self-serve tenant)
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('firm', 'self_serve')),
  created_at timestamptz default now()
);

-- Users (extends Supabase auth.users, one row per platform login)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('super_admin', 'practice_staff', 'client_admin', 'client_user')),
  created_at timestamptz default now()
);

-- Companies (client entities being administered)
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  jurisdiction text not null check (jurisdiction in (
    'SG', 'HK', 'MY', 'PH', 'ID', 'VN', 'TH', 'KH', 'AE', 'SA', 'IN', 'CN', 'JP', 'KR',
    'AU', 'NZ', 'GB', 'IE', 'US', 'CA', 'VG', 'KY', 'SC', 'MU', 'BZ', 'PA', 'OTHER'
  )),
  jurisdiction_other text,
  entity_type text,
  incorporation_date date,
  fye date not null,
  status text not null check (status in ('green', 'amber', 'red')) default 'green',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- People (directors, shareholders, officers — can hold roles across companies)
create table if not exists public.people (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz default now()
);

-- Role assignments (Person <-> Company <-> Role, time-bound)
create table if not exists public.role_assignments (
  id uuid primary key default uuid_generate_v4(),
  person_id uuid not null references public.people(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null check (role in ('director', 'shareholder', 'officer', 'beneficial_owner')),
  start_date date not null default current_date,
  end_date date
);

-- Documents (central repository per company)
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  storage_path text not null,
  content_type text,
  uploaded_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Document chunks (for RAG — chat with your documents)
create table if not exists public.doc_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz default now()
);

create index if not exists doc_chunks_embedding_idx on public.doc_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Cosine-similarity search scoped to a company, used by lib/ai/documentSearch.ts
-- (called via the service-role client, so it intentionally bypasses RLS —
-- the caller is trusted to have already checked the requester's org access).
create or replace function public.match_doc_chunks(
  query_embedding vector(768),
  match_company_id uuid,
  match_count int default 6
)
returns table (
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
language sql stable
as $$
  select document_id, chunk_index, content, 1 - (embedding <=> query_embedding) as similarity
  from public.doc_chunks
  where company_id = match_company_id
  order by embedding <=> query_embedding
  limit match_count
$$;

-- Compliance events (auto-generated from jurisdiction rules)
create table if not exists public.compliance_events (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null,
  due_date date not null,
  status text not null check (status in ('upcoming', 'due_soon', 'overdue', 'completed')) default 'upcoming',
  created_at timestamptz default now()
);

-- Tasks (manual + auto-created from compliance events)
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  status text not null check (status in ('todo', 'in_progress', 'done')) default 'todo',
  due_date date,
  source_compliance_event_id uuid references public.compliance_events(id) on delete set null,
  created_at timestamptz default now()
);

-- Ownership: extends existing tables rather than a new join table, since a
-- shareholder role_assignment already ties a person to a company — a share
-- count/class is just more detail on that same row.
alter table public.role_assignments add column if not exists share_count integer;
alter table public.role_assignments add column if not exists share_class text;
alter table public.companies add column if not exists issued_share_capital numeric;
alter table public.companies add column if not exists paid_up_share_capital numeric;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'companies_issued_capital_non_negative') then
    alter table public.companies add constraint companies_issued_capital_non_negative
      check (issued_share_capital is null or issued_share_capital >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'companies_paid_up_capital_non_negative') then
    alter table public.companies add constraint companies_paid_up_capital_non_negative
      check (paid_up_share_capital is null or paid_up_share_capital >= 0);
  end if;
end $$;

-- Funding rounds (Corporate DNA — funding history)
create table if not exists public.funding_rounds (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  round_type text not null,
  amount numeric not null check (amount >= 0),
  currency text not null default 'SGD',
  investor text,
  closed_date date not null,
  created_at timestamptz default now()
);

-- Milestones (Corporate DNA — legal/growth history)
create table if not exists public.milestones (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category text not null check (category in ('legal', 'growth', 'other')),
  title text not null,
  description text,
  event_date date not null,
  created_at timestamptz default now()
);

-- Auto-update updated_at on companies
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger companies_updated_at before update on public.companies
  for each row execute procedure update_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — Phase 0 uses organization-level isolation only.
-- Any authenticated member of an organization can see all companies/data
-- within that organization. Fine-grained per-company staff ACLs are Phase 2.
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.people enable row level security;
alter table public.role_assignments enable row level security;
alter table public.documents enable row level security;
alter table public.doc_chunks enable row level security;
alter table public.compliance_events enable row level security;
alter table public.tasks enable row level security;
alter table public.funding_rounds enable row level security;
alter table public.milestones enable row level security;

create or replace function public.current_org_id()
returns uuid as $$
  select organization_id from public.users where id = auth.uid()
$$ language sql stable security definer;

create policy "Org members can read their org" on public.organizations
  for select using (id = public.current_org_id());

create policy "Org members can read org users" on public.users
  for select using (organization_id = public.current_org_id());
create policy "Users can update their own row" on public.users
  for update using (id = auth.uid());

create policy "Org members can read companies" on public.companies
  for select using (organization_id = public.current_org_id());
create policy "Org members can write companies" on public.companies
  for all using (organization_id = public.current_org_id());

create policy "Org members can read people" on public.people
  for select using (organization_id = public.current_org_id());
create policy "Org members can write people" on public.people
  for all using (organization_id = public.current_org_id());

create policy "Org members can read role_assignments" on public.role_assignments
  for select using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );
create policy "Org members can write role_assignments" on public.role_assignments
  for all using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );

create policy "Org members can read documents" on public.documents
  for select using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );
create policy "Org members can write documents" on public.documents
  for all using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );

create policy "Org members can read doc_chunks" on public.doc_chunks
  for select using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );

create policy "Org members can read compliance_events" on public.compliance_events
  for select using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );
create policy "Org members can write compliance_events" on public.compliance_events
  for all using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );

create policy "Org members can read tasks" on public.tasks
  for select using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );
create policy "Org members can write tasks" on public.tasks
  for all using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );

create policy "Org members can read funding_rounds" on public.funding_rounds
  for select using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );
create policy "Org members can write funding_rounds" on public.funding_rounds
  for all using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );

create policy "Org members can read milestones" on public.milestones
  for select using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );
create policy "Org members can write milestones" on public.milestones
  for all using (
    company_id in (select id from public.companies where organization_id = public.current_org_id())
  );

-- ---------------------------------------------------------------------------
-- Storage bucket for documents (create via dashboard if this fails on your plan)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Org members can read their documents in storage"
  on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_org_id()::text);

create policy "Org members can upload documents to storage"
  on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_org_id()::text);

-- ---------------------------------------------------------------------------
-- STIVARA_V2 Phase 1, Milestone 1 — Audit logs
-- Immutable (no update/delete RLS policy — default-denied), org-scoped.
-- ---------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('create', 'update', 'delete', 'view_sensitive')),
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Org members can read their org's audit logs" on public.audit_logs
  for select using (organization_id = public.current_org_id());
create policy "Org members can write audit logs for their org" on public.audit_logs
  for insert with check (organization_id = public.current_org_id());
-- No update/delete policy: RLS default-denies both, so audit rows are
-- immutable even to org members — satisfies "cannot delete or overwrite
-- audit logs" without needing a trigger.

-- ---------------------------------------------------------------------------
-- STIVARA_V2 Phase 1, Milestone 2 — Legal entities + role_assignments expansion
-- ---------------------------------------------------------------------------

-- Corporate parties (shareholders, holding companies, auditors, banks,
-- service providers) — distinct from public.organizations (the platform
-- tenant/firm) and from public.people (natural persons).
create table if not exists public.legal_entities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  entity_category text not null check (entity_category in
    ('company', 'bank', 'auditor', 'service_provider', 'government_body', 'other')),
  jurisdiction text,
  registration_number text,
  registered_address text,
  linked_company_id uuid references public.companies(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.legal_entities enable row level security;
create policy "Org members can read legal_entities" on public.legal_entities
  for select using (organization_id = public.current_org_id());
create policy "Org members can write legal_entities" on public.legal_entities
  for all using (organization_id = public.current_org_id());

-- Allow a role_assignment to be held by a legal entity instead of a person.
alter table public.role_assignments alter column person_id drop not null;
alter table public.role_assignments add column if not exists legal_entity_id uuid references public.legal_entities(id) on delete cascade;
alter table public.role_assignments add column if not exists is_nominee boolean not null default false;
alter table public.role_assignments add column if not exists nominator text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'role_assignments_holder_exclusive') then
    alter table public.role_assignments add constraint role_assignments_holder_exclusive
      check ((person_id is not null and legal_entity_id is null) or (person_id is null and legal_entity_id is not null));
  end if;
end $$;

-- Widen role_assignments.role to cover the V2 "key appointments" list.
-- Purely additive — existing values (director/shareholder/officer/
-- beneficial_owner) remain valid, so no existing row can violate this.
alter table public.role_assignments drop constraint if exists role_assignments_role_check;
alter table public.role_assignments add constraint role_assignments_role_check check (role in (
  'director', 'shareholder', 'officer', 'beneficial_owner',
  'nominee_director', 'nominee_shareholder', 'registrable_controller', 'company_secretary',
  'ceo', 'auditor', 'dpo', 'tax_agent', 'accountant', 'authorised_filing_agent', 'bank_signatory'
));

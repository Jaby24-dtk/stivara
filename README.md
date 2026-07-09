# Stivara

Corporate secretarial operating system — Phase 0 scaffold (see `AGENTS.md` for scope boundaries).

Implements: multi-tenant auth, Company/Person/Role data model, document management, a Singapore-only compliance calendar, AI document search (RAG), and basic task management.

## Setup

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the Supabase SQL editor, run `supabase/schema.sql` in full (creates tables, RLS policies, the `documents` storage bucket, and the `match_doc_chunks` vector search function). Requires the `vector` extension, which is enabled on all Supabase projects by default.
3. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Settings > API
   - `GEMINI_API_KEY` — from [aistudio.google.com](https://aistudio.google.com), free tier, used for both the AI Assistant chat and document embeddings
4. `npm install`
5. `npm run dev`, then open [localhost:3000](http://localhost:3000)

Without Supabase configured, the app still boots — auth pages show a "not configured" message instead of crashing. Without `GEMINI_API_KEY`, everything works except the AI Assistant, which returns a clear "not configured" error.

## Sign up

Go to `/signup` to create the first organization + super-admin user. Choose "Self-serve company" for a single-company workspace, or "Corporate secretarial firm" if you'll be managing multiple client companies (Phase 0 doesn't yet differentiate the UI between these — both see the same portfolio dashboard).

## What's not built yet

Deliberately out of scope for this pass — see `Stivara-Build-Brief.md` Section 12 for the full phasing:
- Registers, resolutions/minutes, meetings, filings, and their AI generators
- Malaysia/Philippines/Korea compliance rules (calendar is Singapore-only)
- Client portal, invoicing, e-signatures
- Per-company staff ACLs (RLS is organization-level only for now)
- OCR ingestion — document AI search only indexes plain text/markdown/JSON uploads; PDFs and scanned docs need a text-extraction step first

export type Organization = {
  id: string
  name: string
  type: 'firm' | 'self_serve'
  created_at: string
}

export type UserRow = {
  id: string
  organization_id: string
  name: string
  email: string
  role: 'super_admin' | 'practice_staff' | 'client_admin' | 'client_user'
  created_at: string
}

export type Company = {
  id: string
  organization_id: string
  name: string
  jurisdiction: string
  jurisdiction_other: string | null
  entity_type: string | null
  incorporation_date: string | null
  fye: string
  status: 'green' | 'amber' | 'red'
  issued_share_capital: number | null
  paid_up_share_capital: number | null
  created_at: string
  updated_at: string

  // Identity & registration (STIVARA_V2 Phase 1, Milestone 3)
  uen: string | null
  former_name: string | null
  registered_office_address: string | null
  principal_business_address: string | null
  primary_ssic_code: string | null
  primary_ssic_description: string | null
  secondary_ssic_code: string | null
  secondary_ssic_description: string | null
  business_description: string | null
  first_fye: string | null
  constitution_adopted: boolean | null
  company_seal_used: boolean | null
  registration_status: 'live' | 'struck_off' | 'dissolved' | 'converted' | 'amalgamated' | 'in_liquidation' | 'other' | null

  // Compliance classification & structure
  is_private: boolean | null
  is_exempt_private: boolean | null
  is_foreign_entity: boolean | null
  liability_type: 'limited_by_shares' | 'limited_by_guarantee' | 'unlimited' | 'other' | null
  is_dormant: boolean | null
  is_solvent: boolean | null
  audit_exemption_status: 'exempt' | 'review_required' | 'not_exempt' | null
  is_gst_registered: boolean | null
  is_employer_registered: boolean | null
  is_regulated_business: boolean | null
  licensed_activities: string | null
  is_csp_client: boolean | null
  is_listed: boolean | null
  is_charity_or_ipc: boolean | null
  is_group_company: boolean | null
  is_holding_company: boolean | null
  parent_company_id: string | null
}

export type ComplianceEvent = {
  id: string
  company_id: string
  type: string
  due_date: string
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed'
  created_at: string
}

export type Task = {
  id: string
  company_id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  source_compliance_event_id: string | null
  created_at: string
}

export type Document = {
  id: string
  company_id: string
  name: string
  storage_path: string
  content_type: string | null
  uploaded_by: string | null
  created_at: string
  person_id: string | null
  legal_entity_id: string | null
}

export type Person = {
  id: string
  organization_id: string
  name: string
  email: string | null
  created_at: string

  // KYC fields (STIVARA_V2 Phase 1, Milestone 4). The *_encrypted fields are
  // AES-256-GCM ciphertext (lib/security/pii.ts) — never decrypted
  // client-side by default; only via POST /api/people/[id]/reveal-sensitive.
  id_type: 'nric' | 'passport' | 'fin' | 'other' | null
  id_number_encrypted: string | null
  nationality: string | null
  residential_address_encrypted: string | null
  service_address: string | null
  phone: string | null
  date_of_birth: string | null
  kyc_status: 'not_started' | 'pending' | 'verified' | 'rejected' | null
  sanctions_screening_status: 'not_screened' | 'clear' | 'flagged' | 'under_review' | null
  pep_status: 'not_pep' | 'pep' | 'pep_associate' | 'unknown' | null
  verification_date: string | null
}

// Corporate shareholders, holding companies, auditors, banks, and service
// providers — distinct from Organization (the platform tenant/firm) and
// from Person (natural persons).
export type LegalEntity = {
  id: string
  organization_id: string
  name: string
  entity_category: 'company' | 'bank' | 'auditor' | 'service_provider' | 'government_body' | 'other'
  jurisdiction: string | null
  registration_number: string | null
  registered_address: string | null
  linked_company_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// A corporate appointment (this person/entity's role at a company) — not to
// be confused with UserRow.role, which is the platform login's own
// permission tier. Both can share literal strings (e.g. 'director') but
// mean unrelated things.
export type CorporateRole =
  | 'director' | 'shareholder' | 'officer' | 'beneficial_owner'
  | 'nominee_director' | 'nominee_shareholder' | 'registrable_controller' | 'company_secretary'
  | 'ceo' | 'auditor' | 'dpo' | 'tax_agent' | 'accountant' | 'authorised_filing_agent' | 'bank_signatory'

export type RoleAssignment = {
  id: string
  person_id: string | null
  legal_entity_id: string | null
  company_id: string
  role: CorporateRole
  start_date: string
  end_date: string | null
  share_count: number | null
  share_class: string | null
  is_nominee: boolean
  nominator: string | null
}

export type FundingRound = {
  id: string
  company_id: string
  round_type: string
  amount: number
  currency: string
  investor: string | null
  closed_date: string
  created_at: string
}

export type Milestone = {
  id: string
  company_id: string
  category: 'legal' | 'growth' | 'other'
  title: string
  description: string | null
  event_date: string
  created_at: string
}

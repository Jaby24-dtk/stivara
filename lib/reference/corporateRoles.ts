import type { CorporateRole } from '@/lib/types'

// Shared across the role-assignment display map, AI context labels, and the
// person-form dropdown so the three can't drift out of sync.
export const CORPORATE_ROLE_LABELS: Record<CorporateRole, string> = {
  director: 'Director',
  shareholder: 'Shareholder',
  officer: 'Officer',
  beneficial_owner: 'Beneficial owner',
  nominee_director: 'Nominee director',
  nominee_shareholder: 'Nominee shareholder',
  registrable_controller: 'Registrable controller',
  company_secretary: 'Company secretary',
  ceo: 'CEO',
  auditor: 'Auditor',
  dpo: 'Data Protection Officer',
  tax_agent: 'Tax agent',
  accountant: 'Accountant',
  authorised_filing_agent: 'Authorised filing agent',
  bank_signatory: 'Bank signatory',
}

export const CORPORATE_ROLE_GROUPS: { label: string; roles: CorporateRole[] }[] = [
  { label: 'Individual roles', roles: ['director', 'shareholder', 'officer', 'beneficial_owner'] },
  { label: 'Nominee / controller', roles: ['nominee_director', 'nominee_shareholder', 'registrable_controller'] },
  {
    label: 'Firm appointments',
    roles: ['company_secretary', 'ceo', 'auditor', 'dpo', 'tax_agent', 'accountant', 'authorised_filing_agent', 'bank_signatory'],
  },
]

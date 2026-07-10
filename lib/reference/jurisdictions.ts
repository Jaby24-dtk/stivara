// Jurisdictions Stivara supports for company incorporation. Only 'SG'
// generates an automated compliance calendar today (see
// lib/compliance/singapore.ts) — the rest are recorded but don't yet get
// auto-created deadlines. Matches the CHECK constraint on
// companies.jurisdiction in supabase/schema.sql; keep both in sync.

export type Jurisdiction = {
  code: string
  name: string
}

export const JURISDICTIONS: Jurisdiction[] = [
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong SAR' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'AE', name: 'United Arab Emirates (UAE)' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'VG', name: 'British Virgin Islands (BVI)' },
  { code: 'KY', name: 'Cayman Islands' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'BZ', name: 'Belize' },
  { code: 'PA', name: 'Panama' },
]

export const OTHER_JURISDICTION_CODE = 'OTHER'

export function getJurisdictionLabel(code: string, other?: string | null): string {
  if (code === OTHER_JURISDICTION_CODE) return other || 'Other'
  return JURISDICTIONS.find((j) => j.code === code)?.name ?? code
}

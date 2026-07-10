// ACRA (Singapore) entity types, sourced from ACRA_Entity_Types_List.xlsx.
// Stored as plain text on companies.entity_type (no DB constraint), so this
// list is the UI's suggested set, not an enforced enum — "Other" falls
// through to free text for entity types ACRA doesn't cover (or for
// non-Singapore jurisdictions).

export type EntityType = {
  name: string
  description: string
}

export const ENTITY_TYPES: EntityType[] = [
  { name: 'Sole Proprietorship', description: 'Business owned by one individual or one corporate owner.' },
  { name: 'Partnership', description: 'General partnership with two or more partners.' },
  { name: 'Limited Partnership (LP)', description: 'Partnership with at least one general partner and one limited partner.' },
  { name: 'Limited Liability Partnership (LLP)', description: 'Separate legal entity with limited liability for partners.' },
  { name: 'Exempt Private Company Limited by Shares', description: 'Private company with up to 20 individual shareholders and no corporate shareholder.' },
  { name: 'Private Company Limited by Shares', description: 'Standard private limited company (Pte. Ltd.).' },
  { name: 'Public Company Limited by Shares', description: 'Public company able to offer shares to the public.' },
  { name: 'Public Company Limited by Guarantee', description: 'Usually charities and non-profit organisations.' },
  { name: 'Unlimited Exempt Private Company', description: 'Unlimited liability company with exempt private status.' },
  { name: 'Unlimited Private Company', description: 'Unlimited liability private company.' },
  { name: 'Unlimited Public Company', description: 'Unlimited liability public company.' },
  { name: 'Foreign Company', description: 'Overseas company registered as a branch in Singapore.' },
  { name: 'Variable Capital Company (VCC)', description: 'Investment fund structure.' },
  { name: 'Registered Business Trust', description: 'Business trust.' },
  { name: 'Accounting Limited Liability Partnership', description: 'LLP providing public accountancy services.' },
  { name: 'Public Accounting Corporation', description: 'Licensed public accounting corporation.' },
  { name: 'Public Accounting Firm', description: 'Licensed public accounting firm.' },
  { name: 'Government Agency', description: 'Government entity.' },
  { name: 'Statutory Board', description: 'Statutory board.' },
  { name: 'Ministry', description: 'Singapore ministry.' },
  { name: 'Organ of State', description: 'Constitutional organ of state.' },
  { name: 'Foreign Government Agency', description: 'Foreign government office.' },
  { name: 'Embassy', description: 'Embassy.' },
  { name: 'Consulate', description: 'Consulate.' },
  { name: 'International Organisation', description: 'International organisation.' },
  { name: 'Society', description: 'Registered society.' },
  { name: 'Trade Union', description: 'Registered trade union.' },
  { name: 'Co-operative Society', description: 'Co-operative.' },
  { name: 'Mutual Benefit Organisation', description: 'Mutual benefit organisation.' },
  { name: 'Charity', description: 'Registered charity.' },
  { name: 'Institution of a Public Character (IPC)', description: 'IPC.' },
  { name: 'School', description: 'Educational institution.' },
  { name: 'Mosque', description: 'Religious institution.' },
  { name: 'Church', description: 'Religious institution.' },
  { name: 'Temple', description: 'Religious institution.' },
  { name: 'Clan Association', description: 'Clan association.' },
  { name: "Residents' Committee", description: "Residents' committee." },
  { name: 'Management Corporation Strata Title (MCST)', description: 'MCST.' },
  { name: 'Town Council', description: 'Town council.' },
  { name: 'Healthcare Institution', description: 'Healthcare institution.' },
  { name: 'Hospital', description: 'Hospital.' },
  { name: 'Clinic', description: 'Clinic.' },
  { name: 'Association', description: 'Association.' },
  { name: 'Representative Office', description: 'Representative office.' },
  { name: 'Other Unincorporated Association', description: 'Other unincorporated association.' },
  { name: 'Other Incorporated Entity', description: 'Other incorporated entity.' },
  { name: 'Trust', description: 'Trust.' },
  { name: 'Estate', description: 'Estate.' },
  { name: 'Trustee', description: 'Trustee.' },
  { name: 'Sub-Entity / Branch Registration', description: 'Branch/sub-entity registration.' },
  { name: 'Other UEN-Issuing Agency Entity Types', description: 'Other UEN categories.' },
]

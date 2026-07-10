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
}

export type Person = {
  id: string
  organization_id: string
  name: string
  email: string | null
  created_at: string
}

export type RoleAssignment = {
  id: string
  person_id: string
  company_id: string
  role: 'director' | 'shareholder' | 'officer' | 'beneficial_owner'
  start_date: string
  end_date: string | null
  share_count: number | null
  share_class: string | null
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

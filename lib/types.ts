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
  jurisdiction: 'SG' | 'MY' | 'PH' | 'KR'
  entity_type: string | null
  incorporation_date: string | null
  fye: string
  status: 'green' | 'amber' | 'red'
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

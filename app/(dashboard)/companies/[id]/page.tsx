import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Company, ComplianceEvent, Document, Person, RoleAssignment, Task } from '@/lib/types'
import { UploadDocumentButton } from '@/components/documents/UploadDocumentButton'
import { TaskStatusSelect } from '@/components/tasks/TaskStatusSelect'
import { AddPersonButton } from '@/components/people/AddPersonButton'
import { RemoveRoleButton } from '@/components/people/RemoveRoleButton'
import { ResolutionGenerator } from '@/components/resolutions/ResolutionGenerator'
import { computeCompanyHealth, type HealthStatus } from '@/lib/compliance/health'

const roleLabel: Record<RoleAssignment['role'], string> = {
  director: 'Director',
  shareholder: 'Shareholder',
  officer: 'Officer',
  beneficial_owner: 'Beneficial owner',
}

const healthBadge: Record<HealthStatus, string> = {
  green: 'badge-success',
  amber: 'badge-warning',
  red: 'badge-danger',
}

const healthLabel: Record<HealthStatus, string> = {
  green: 'Healthy',
  amber: 'Needs attention',
  red: 'At risk',
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company } = await supabase.from('companies').select('*').eq('id', id).single()
  if (!company) notFound()

  const [{ data: events }, { data: tasks }, { data: documents }, { data: roleAssignments }] = await Promise.all([
    supabase.from('compliance_events').select('*').eq('company_id', id).order('due_date'),
    supabase.from('tasks').select('*').eq('company_id', id).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('documents').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('role_assignments').select('*, people(name, email)').eq('company_id', id).is('end_date', null).order('start_date'),
  ])

  const companyRow = company as Company
  const eventList = (events ?? []) as ComplianceEvent[]
  const taskList = (tasks ?? []) as Task[]
  const documentList = (documents ?? []) as Document[]
  type RoleAssignmentRow = RoleAssignment & { people: Pick<Person, 'name' | 'email'> | null }
  const roleAssignmentList = (roleAssignments ?? []) as unknown as RoleAssignmentRow[]

  const health = computeCompanyHealth({
    events: eventList,
    tasks: taskList,
    directorCount: roleAssignmentList.filter((r) => r.role === 'director').length,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{companyRow.name}</h1>
          <p className="text-sm text-slate-500">
            {companyRow.jurisdiction} · {companyRow.entity_type ?? 'Entity type not set'} · FYE {companyRow.fye}
          </p>
        </div>
        <span className={`badge ${healthBadge[health.status]}`}>{healthLabel[health.status]}</span>
      </div>

      {health.reasons.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Compliance health</h2>
          <ul className="flex flex-col gap-2">
            {health.reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-3 text-sm py-1">
                <span className={`badge ${r.severity === 'red' ? 'badge-danger' : 'badge-warning'}`}>
                  {r.severity === 'red' ? 'overdue' : 'due soon'}
                </span>
                <span className="text-slate-700">{r.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">People</h2>
          <AddPersonButton companyId={id} />
        </div>
        {roleAssignmentList.length === 0 ? (
          <p className="text-sm text-slate-500">No directors, shareholders, or officers on record yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {roleAssignmentList.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-slate-900 font-medium">{r.people?.name ?? '—'}</span>
                  {r.people?.email && <span className="text-slate-400 ml-2">{r.people.email}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge badge-info">{roleLabel[r.role]}</span>
                  <RemoveRoleButton roleAssignmentId={r.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Compliance calendar</h2>
        {eventList.length === 0 ? (
          <p className="text-sm text-slate-500">No compliance events on record.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {eventList.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{e.type}</span>
                <span className="text-slate-500">{e.due_date}</span>
                <span className="badge badge-gray">{e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Tasks</h2>
        {taskList.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {taskList.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <Link href={`/tasks/${t.id}`} className="text-slate-700 hover:text-teal-700">{t.title}</Link>
                <div className="flex items-center gap-3">
                  {t.due_date && <span className="text-slate-500">{t.due_date}</span>}
                  <TaskStatusSelect taskId={t.id} status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Draft a resolution</h2>
        <p className="text-sm text-slate-500 mb-4">
          Describe what you need in plain English — the AI Company Secretary will draft it and flag the correct approval type.
        </p>
        <ResolutionGenerator companyId={id} companyName={companyRow.name} />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Documents</h2>
          <UploadDocumentButton companyId={id} />
        </div>
        {documentList.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documentList.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{d.name}</span>
                <span className="text-slate-500">{new Date(d.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

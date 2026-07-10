import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Company, ComplianceEvent, Document, FundingRound, LegalEntity, Milestone, Person, RoleAssignment, Task } from '@/lib/types'
import { UploadDocumentButton } from '@/components/documents/UploadDocumentButton'
import { TaskStatusSelect } from '@/components/tasks/TaskStatusSelect'
import { AddPersonButton } from '@/components/people/AddPersonButton'
import { AddLegalEntityButton } from '@/components/legalEntities/AddLegalEntityButton'
import { RemoveRoleButton } from '@/components/people/RemoveRoleButton'
import { DirectorAppointmentWizard } from '@/components/people/DirectorAppointmentWizard'
import { ResolutionGenerator } from '@/components/resolutions/ResolutionGenerator'
import { CorporateDoctorScan } from '@/components/companies/CorporateDoctorScan'
import { CompanyTimeline } from '@/components/companies/CompanyTimeline'
import { EditCapitalButton } from '@/components/companies/EditCapitalButton'
import { EditShareholdingButton } from '@/components/companies/EditShareholdingButton'
import { AddFundingRoundButton } from '@/components/companies/AddFundingRoundButton'
import { AddMilestoneButton } from '@/components/companies/AddMilestoneButton'
import { AiSuggestions } from '@/components/companies/AiSuggestions'
import { EditCompanyButton } from '@/components/companies/EditCompanyButton'
import { DeleteCompanyButton } from '@/components/companies/DeleteCompanyButton'
import { computeCompanyHealth, computeMissionControl, deriveEventStatus, type EventStatus, type HealthStatus } from '@/lib/compliance/health'
import { getJurisdictionLabel } from '@/lib/reference/jurisdictions'
import { buildRecommendations } from '@/lib/compliance/recommendations'
import { buildTimeline } from '@/lib/compliance/timeline'
import { CORPORATE_ROLE_LABELS } from '@/lib/reference/corporateRoles'

const roleLabel = CORPORATE_ROLE_LABELS

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

const eventStatusBadge: Record<EventStatus, string> = {
  upcoming: 'badge-info',
  due_soon: 'badge-warning',
  overdue: 'badge-danger',
  completed: 'badge-success',
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company } = await supabase.from('companies').select('*').eq('id', id).single()
  if (!company) notFound()

  const [{ data: events }, { data: tasks }, { data: documents }, { data: roleAssignments }, { data: fundingRounds }, { data: milestones }] = await Promise.all([
    supabase.from('compliance_events').select('*').eq('company_id', id).order('due_date'),
    supabase.from('tasks').select('*').eq('company_id', id).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('documents').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('role_assignments').select('*, people(name, email), legal_entities(name)').eq('company_id', id).order('start_date'),
    supabase.from('funding_rounds').select('*').eq('company_id', id).order('closed_date', { ascending: false }),
    supabase.from('milestones').select('*').eq('company_id', id).order('event_date', { ascending: false }),
  ])

  const companyRow = company as Company
  const eventList = (events ?? []) as ComplianceEvent[]
  const taskList = (tasks ?? []) as Task[]
  const documentList = (documents ?? []) as Document[]
  const fundingRoundList = (fundingRounds ?? []) as FundingRound[]
  const milestoneList = (milestones ?? []) as Milestone[]
  type RoleAssignmentRow = RoleAssignment & {
    people: Pick<Person, 'name' | 'email'> | null
    legal_entities: Pick<LegalEntity, 'name'> | null
  }
  // Includes past (resigned/removed) assignments too — needed for the
  // timeline's history. The People card below filters to active-only.
  const roleAssignmentList = (roleAssignments ?? []) as unknown as RoleAssignmentRow[]
  const activeRoleAssignmentList = roleAssignmentList.filter((r) => r.end_date === null)
  const activeShareholders = activeRoleAssignmentList.filter((r) => r.role === 'shareholder')

  const directorCount = activeRoleAssignmentList.filter((r) => r.role === 'director').length
  const health = computeCompanyHealth({ events: eventList, tasks: taskList, directorCount })
  const missionControl = computeMissionControl({ events: eventList, tasks: taskList, directorCount })
  const recommendations = buildRecommendations({ events: eventList, tasks: taskList, directorCount })
  const timeline = buildTimeline({
    companyName: companyRow.name,
    incorporationDate: companyRow.incorporation_date,
    roleAssignments: roleAssignmentList.map((r) => ({
      personName: r.people?.name ?? 'Unknown person',
      role: r.role,
      startDate: r.start_date,
      endDate: r.end_date,
    })),
    documents: documentList.map((d) => ({ name: d.name, createdAt: d.created_at })),
    fundingRounds: fundingRoundList.map((f) => ({
      roundType: f.round_type,
      amount: f.amount,
      currency: f.currency,
      investor: f.investor,
      closedDate: f.closed_date,
    })),
    milestones: milestoneList.map((m) => ({ category: m.category, title: m.title, eventDate: m.event_date })),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{companyRow.name}</h1>
          <p className="text-sm text-slate-500">
            {getJurisdictionLabel(companyRow.jurisdiction, companyRow.jurisdiction_other)} · {companyRow.entity_type ?? 'Entity type not set'} · FYE {companyRow.fye}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${healthBadge[health.status]}`}>{healthLabel[health.status]}</span>
          <Link href={`/companies/${id}/settings`} className="btn-secondary btn-sm">Full profile</Link>
          <EditCompanyButton company={companyRow} />
          <DeleteCompanyButton companyId={id} companyName={companyRow.name} />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Corporate Doctor</h2>
        <p className="text-sm text-slate-500 mb-4">
          Scans the director register, statutory filings, and tasks on record for {companyRow.name}.
        </p>
        <CorporateDoctorScan
          companyHealth={missionControl.trustScore}
          riskLevel={missionControl.riskLevel}
          recommendations={recommendations}
        />
      </div>

      <div className="card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Corporate DNA</h2>
            <p className="text-sm text-slate-500">Ownership, funding, and legal/growth history for {companyRow.name}.</p>
          </div>
          <EditCapitalButton
            companyId={id}
            issuedShareCapital={companyRow.issued_share_capital}
            paidUpShareCapital={companyRow.paid_up_share_capital}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Ownership</h3>
          <p className="text-xs text-slate-500 mb-3">
            Issued: {companyRow.issued_share_capital != null ? companyRow.issued_share_capital.toLocaleString() : 'not set'} ·
            {' '}Paid-up: {companyRow.paid_up_share_capital != null ? companyRow.paid_up_share_capital.toLocaleString() : 'not set'}
          </p>
          {activeShareholders.length === 0 ? (
            <p className="text-sm text-slate-500">No shareholders on record yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {activeShareholders.map((r) => (
                <li key={r.id} className="text-sm text-slate-700 flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span>{r.people?.name ?? '—'}</span>
                  <span className="text-slate-500">
                    {r.share_count != null ? `${r.share_count.toLocaleString()} ${r.share_class ?? 'shares'}` : 'No share count on record'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Funding history</h3>
            <AddFundingRoundButton companyId={id} />
          </div>
          {fundingRoundList.length === 0 ? (
            <p className="text-sm text-slate-500">No funding rounds on record yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {fundingRoundList.map((f) => (
                <li key={f.id} className="text-sm text-slate-700 flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span>{f.round_type}{f.investor ? ` — ${f.investor}` : ''}</span>
                  <span className="text-slate-500">{f.currency} {f.amount.toLocaleString()} · {f.closed_date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Legal &amp; growth milestones</h3>
            <AddMilestoneButton companyId={id} />
          </div>
          {milestoneList.length === 0 ? (
            <p className="text-sm text-slate-500">No milestones on record yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {milestoneList.map((m) => (
                <li key={m.id} className="text-sm text-slate-700 flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span>{m.title}</span>
                  <span className="text-slate-500">{m.category} · {m.event_date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AiSuggestions companyId={id} />

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
          <div className="flex items-center gap-2">
            <DirectorAppointmentWizard companyId={id} />
            <AddLegalEntityButton companyId={id} />
            <AddPersonButton companyId={id} />
          </div>
        </div>
        {activeRoleAssignmentList.length === 0 ? (
          <p className="text-sm text-slate-500">No directors, shareholders, or officers on record yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeRoleAssignmentList.map((r) => {
              const holderName = r.people?.name ?? r.legal_entities?.name ?? '—'
              return (
              <li key={r.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-slate-900 font-medium">{holderName}</span>
                  {r.people?.email && <span className="text-slate-400 ml-2">{r.people.email}</span>}
                  {r.legal_entity_id && <span className="text-slate-400 ml-2">(legal entity)</span>}
                  {r.is_nominee && <span className="badge badge-gray ml-2">nominee</span>}
                </div>
                <div className="flex items-center gap-3">
                  {r.role === 'shareholder' && (
                    <span className="text-xs text-slate-500">
                      {r.share_count != null ? `${r.share_count.toLocaleString()} ${r.share_class ?? 'shares'}` : 'No share count on record'}
                    </span>
                  )}
                  <span className="badge badge-info">{roleLabel[r.role]}</span>
                  {r.role === 'shareholder' && (
                    <EditShareholdingButton
                      roleAssignmentId={r.id}
                      personName={holderName}
                      shareCount={r.share_count}
                      shareClass={r.share_class}
                    />
                  )}
                  <RemoveRoleButton roleAssignmentId={r.id} />
                </div>
              </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Compliance calendar</h2>
        {eventList.length === 0 ? (
          <p className="text-sm text-slate-500">No compliance events on record.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {eventList.map((e) => {
              const status = deriveEventStatus(e)
              return (
                <li key={e.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-700">{e.type}</span>
                  <span className="text-slate-500">{e.due_date}</span>
                  <span className={`badge ${eventStatusBadge[status]}`}>{status.replace('_', ' ')}</span>
                </li>
              )
            })}
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

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Timeline</h2>
        <CompanyTimeline events={timeline} />
      </div>
    </div>
  )
}

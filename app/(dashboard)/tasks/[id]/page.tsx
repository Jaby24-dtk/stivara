import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Company, ComplianceEvent, Task } from '@/lib/types'
import { TaskStatusSelect } from '@/components/tasks/TaskStatusSelect'
import { DownloadTextButton } from '@/components/documents/DownloadTextButton'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { getChecklist } from '@/lib/compliance/checklists'
import { generateAgmNotice } from '@/lib/documents/agmNotice'
import { generateAnnualReturnSummary } from '@/lib/documents/annualReturnSummary'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: task } = await supabase
    .from('tasks')
    .select('*, companies(id, name, jurisdiction, fye)')
    .eq('id', id)
    .single()
  if (!task) notFound()

  type TaskRow = Task & { companies: Pick<Company, 'id' | 'name' | 'jurisdiction' | 'fye'> | null }
  const taskRow = task as unknown as TaskRow

  let event: ComplianceEvent | null = null
  if (taskRow.source_compliance_event_id) {
    const { data: eventRow } = await supabase
      .from('compliance_events')
      .select('*')
      .eq('id', taskRow.source_compliance_event_id)
      .single()
    event = eventRow as ComplianceEvent | null
  }

  const checklist = event ? getChecklist(event.type) : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        {taskRow.companies && (
          <Link href={`/companies/${taskRow.companies.id}`} className="text-sm text-teal-700 font-medium">
            ← {taskRow.companies.name}
          </Link>
        )}
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-semibold text-slate-900">{taskRow.title}</h1>
          <TaskStatusSelect taskId={taskRow.id} status={taskRow.status} />
        </div>
        {taskRow.due_date && <p className="text-sm text-slate-500 mt-1">Due {taskRow.due_date}</p>}
      </div>

      {checklist.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Checklist</h2>
          <ul className="flex flex-col gap-2">
            {checklist.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700 py-1">
                <span className="badge badge-gray shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {event?.type === 'AGM' && taskRow.companies && (
        <Suspense fallback={<DocumentLoadingSkeleton title="Draft AGM Notice" />}>
          <AgmNoticeCard
            companyId={taskRow.companies.id}
            companyName={taskRow.companies.name}
            jurisdiction={taskRow.companies.jurisdiction}
            agmDate={event.due_date}
          />
        </Suspense>
      )}

      {event?.type === 'Annual Return (BizFile+)' && taskRow.companies && (
        <Suspense fallback={<DocumentLoadingSkeleton title="Annual Return Filing Summary" />}>
          <AnnualReturnCard
            companyId={taskRow.companies.id}
            companyName={taskRow.companies.name}
            jurisdiction={taskRow.companies.jurisdiction}
            fye={taskRow.companies.fye}
            dueDate={event.due_date}
          />
        </Suspense>
      )}

      {checklist.length === 0 && (
        <div className="card p-6">
          <p className="text-sm text-slate-500">
            This is a manual task with no compliance checklist attached.
          </p>
        </div>
      )}
    </div>
  )
}

// Both cards below run a live AI call that can take several seconds — each
// is isolated in its own Suspense boundary so it doesn't block the rest of
// the page (checklist, status) from rendering immediately.

async function AgmNoticeCard({
  companyId,
  companyName,
  jurisdiction,
  agmDate,
}: {
  companyId: string
  companyName: string
  jurisdiction: string
  agmDate: string
}) {
  const supabase = await createClient()
  const { data: directorRows } = await supabase
    .from('role_assignments')
    .select('people(name)')
    .eq('company_id', companyId)
    .eq('role', 'director')
    .is('end_date', null)
  const directors = (directorRows ?? [])
    .map((r) => (r.people as unknown as { name: string } | null)?.name)
    .filter((name): name is string => !!name)

  const notice = await generateAgmNotice({ companyName, jurisdiction, agmDate, directors })

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Draft AGM Notice</h2>
        <DownloadTextButton filename={`${companyName}-notice.txt`} content={notice} />
      </div>
      <DocumentPreview content={notice} />
    </div>
  )
}

async function AnnualReturnCard({
  companyId,
  companyName,
  jurisdiction,
  fye,
  dueDate,
}: {
  companyId: string
  companyName: string
  jurisdiction: string
  fye: string
  dueDate: string
}) {
  const supabase = await createClient()
  const { data: roleRows } = await supabase
    .from('role_assignments')
    .select('role, people(name)')
    .eq('company_id', companyId)
    .is('end_date', null)
  const people = (roleRows ?? []).map((r) => ({
    name: (r.people as unknown as { name: string } | null)?.name ?? 'Unknown',
    role: r.role as string,
  }))

  const summary = await generateAnnualReturnSummary({ companyName, jurisdiction, dueDate, fye, people })

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Annual Return Filing Summary</h2>
        <DownloadTextButton filename={`${companyName}-annual-return-summary.txt`} content={summary} />
      </div>
      <DocumentPreview content={summary} />
    </div>
  )
}

function DocumentLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="card p-6">
      <h2 className="font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="max-w-2xl mx-auto flex flex-col gap-3 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
        <div className="h-4 bg-slate-100 rounded w-full mt-4" />
        <div className="h-4 bg-slate-100 rounded w-5/6" />
        <div className="h-4 bg-slate-100 rounded w-4/6" />
      </div>
      <p className="text-xs text-slate-400 text-center mt-4">Drafting with AI — this can take a few seconds…</p>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Company, ComplianceEvent, Task } from '@/lib/types'
import { TaskStatusSelect } from '@/components/tasks/TaskStatusSelect'
import { DownloadTextButton } from '@/components/documents/DownloadTextButton'
import { getChecklist } from '@/lib/compliance/checklists'
import { generateAgmNotice } from '@/lib/documents/agmNotice'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: task } = await supabase
    .from('tasks')
    .select('*, companies(id, name)')
    .eq('id', id)
    .single()
  if (!task) notFound()

  type TaskRow = Task & { companies: Pick<Company, 'id' | 'name'> | null }
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
  const notice = event?.type === 'AGM' && taskRow.companies
    ? generateAgmNotice({ companyName: taskRow.companies.name, agmDate: event.due_date })
    : null

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

      {notice && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Draft AGM Notice</h2>
            <DownloadTextButton filename={`${taskRow.companies?.name ?? 'agm'}-notice.txt`} content={notice} />
          </div>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-4 border border-slate-100">{notice}</pre>
        </div>
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

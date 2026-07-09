import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Company, Task } from '@/lib/types'
import { AddTaskButton } from '@/components/tasks/AddTaskButton'
import { TaskStatusSelect } from '@/components/tasks/TaskStatusSelect'

export default async function TasksPage() {
  const supabase = await createClient()
  const [{ data: tasks }, { data: companies }] = await Promise.all([
    supabase.from('tasks').select('*, companies(name)').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('companies').select('id, name').order('name'),
  ])

  type Row = Task & { companies: Pick<Company, 'name'> | null }
  const taskList = (tasks ?? []) as unknown as Row[]
  const companyList = (companies ?? []) as Pick<Company, 'id' | 'name'>[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
        <AddTaskButton companies={companyList} />
      </div>

      <div className="card p-6">
        {taskList.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {taskList.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <Link href={`/tasks/${t.id}`} className="group">
                  <p className="text-slate-900 font-medium group-hover:text-teal-700">{t.title}</p>
                  <p className="text-slate-500 text-xs">{t.companies?.name ?? '—'}</p>
                </Link>
                <div className="flex items-center gap-3">
                  {t.due_date && <span className="text-slate-500">{t.due_date}</span>}
                  <TaskStatusSelect taskId={t.id} status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

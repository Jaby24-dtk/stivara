import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Company, ComplianceEvent } from '@/lib/types'
import { deriveEventStatus, type EventStatus } from '@/lib/compliance/health'

const statusBadge: Record<EventStatus, string> = {
  upcoming: 'badge-info',
  due_soon: 'badge-warning',
  overdue: 'badge-danger',
  completed: 'badge-success',
}

export default async function CompliancePage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('compliance_events')
    .select('*, companies(name)')
    .order('due_date')

  type Row = ComplianceEvent & { companies: Pick<Company, 'name'> | null }
  const eventList = (events ?? []) as unknown as Row[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Compliance calendar</h1>
        <p className="text-sm text-slate-500">Singapore statutory deadlines, auto-generated from each company&apos;s FYE.</p>
      </div>

      <div className="card p-6">
        {eventList.length === 0 ? (
          <p className="text-sm text-slate-500">No compliance events yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 font-medium">Company</th>
                <th className="py-2 font-medium">Event</th>
                <th className="py-2 font-medium">Due date</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {eventList.map((e) => {
                const status = deriveEventStatus(e)
                return (
                  <tr key={e.id} className="table-row-hover border-b border-slate-100">
                    <td className="py-2">
                      <Link href={`/companies/${e.company_id}`} className="font-medium text-slate-900 hover:text-teal-700">
                        {e.companies?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-600">{e.type}</td>
                    <td className="py-2 text-slate-600">{e.due_date}</td>
                    <td className="py-2"><span className={`badge ${statusBadge[status]}`}>{status.replace('_', ' ')}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { Company, ComplianceEvent } from '@/lib/types'

const statusBadge: Record<Company['status'], string> = {
  green: 'badge-success',
  amber: 'badge-warning',
  red: 'badge-danger',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name')
  const { data: events } = await supabase
    .from('compliance_events')
    .select('*')
    .neq('status', 'completed')
    .order('due_date')
    .limit(8)

  const companyList = (companies ?? []) as Company[]
  const upcoming = (events ?? []) as ComplianceEvent[]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Portfolio</h1>
        <p className="text-sm text-slate-500">{companyList.length} companies under management</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Companies</h2>
          <Link href="/companies" className="btn-secondary btn-sm">View all</Link>
        </div>
        {companyList.length === 0 ? (
          <p className="text-sm text-slate-500">No companies yet. <Link href="/companies" className="text-teal-700 font-medium">Add your first company</Link>.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Jurisdiction</th>
                <th className="py-2 font-medium">FYE</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {companyList.map((c) => (
                <tr key={c.id} className="table-row-hover border-b border-slate-100">
                  <td className="py-2">
                    <Link href={`/companies/${c.id}`} className="font-medium text-slate-900 hover:text-teal-700">
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-600">{c.jurisdiction}</td>
                  <td className="py-2 text-slate-600">{c.fye}</td>
                  <td className="py-2"><span className={`badge ${statusBadge[c.status]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming compliance deadlines</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing due — add companies to generate a compliance calendar.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-700">{e.type}</span>
                <span className="text-slate-500">{e.due_date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

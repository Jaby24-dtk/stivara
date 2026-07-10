import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Company } from '@/lib/types'
import { AddCompanyButton } from '@/components/companies/AddCompanyButton'
import { HealthLegend } from '@/components/companies/HealthLegend'
import { computeCompanyHealth, type HealthStatus } from '@/lib/compliance/health'
import { getJurisdictionLabel } from '@/lib/reference/jurisdictions'

const statusBadge: Record<HealthStatus, string> = {
  green: 'badge-success',
  amber: 'badge-warning',
  red: 'badge-danger',
}

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('*').order('name')
  const companyList = (companies ?? []) as Company[]
  const companyIds = companyList.map((c) => c.id)

  // Batched (not per-company) so the page stays fast regardless of portfolio size.
  const [{ data: events }, { data: tasks }, { data: roles }] = companyIds.length > 0
    ? await Promise.all([
        supabase.from('compliance_events').select('company_id, type, due_date, status').in('company_id', companyIds),
        supabase.from('tasks').select('company_id, title, due_date, status').in('company_id', companyIds),
        supabase.from('role_assignments').select('company_id, role').in('company_id', companyIds).eq('role', 'director').is('end_date', null),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const healthByCompany = new Map(
    companyList.map((c) => [
      c.id,
      computeCompanyHealth({
        events: (events ?? []).filter((e) => e.company_id === c.id),
        tasks: (tasks ?? []).filter((t) => t.company_id === c.id),
        directorCount: (roles ?? []).filter((r) => r.company_id === c.id).length,
      }),
    ])
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Companies</h1>
        <AddCompanyButton />
      </div>

      <HealthLegend />

      <div className="card p-6">
        {companyList.length === 0 ? (
          <p className="text-sm text-slate-500">No companies yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Jurisdiction</th>
                <th className="py-2 font-medium">Entity type</th>
                <th className="py-2 font-medium">FYE</th>
                <th className="py-2 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {companyList.map((c) => {
                const health = healthByCompany.get(c.id)!
                return (
                  <tr key={c.id} className="table-row-hover border-b border-slate-100">
                    <td className="py-2">
                      <Link href={`/companies/${c.id}`} className="font-medium text-slate-900 hover:text-teal-700">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-600">{getJurisdictionLabel(c.jurisdiction, c.jurisdiction_other)}</td>
                    <td className="py-2 text-slate-600">{c.entity_type ?? '—'}</td>
                    <td className="py-2 text-slate-600">{c.fye}</td>
                    <td className="py-2">
                      <span className={`badge ${statusBadge[health.status]}`} title={health.reasons.map((r) => r.message).join('; ')}>
                        {health.status}
                      </span>
                    </td>
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

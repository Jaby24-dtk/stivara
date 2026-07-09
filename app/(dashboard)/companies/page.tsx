import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Company } from '@/lib/types'
import { AddCompanyButton } from '@/components/companies/AddCompanyButton'

const statusBadge: Record<Company['status'], string> = {
  green: 'badge-success',
  amber: 'badge-warning',
  red: 'badge-danger',
}

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('*').order('name')
  const companyList = (companies ?? []) as Company[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Companies</h1>
        <AddCompanyButton />
      </div>

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
                  <td className="py-2 text-slate-600">{c.entity_type ?? '—'}</td>
                  <td className="py-2 text-slate-600">{c.fye}</td>
                  <td className="py-2"><span className={`badge ${statusBadge[c.status]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

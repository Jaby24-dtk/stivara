import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Person, RoleAssignment, Company } from '@/lib/types'
import { PersonDetailsForm } from '@/components/people/PersonDetailsForm'
import { CORPORATE_ROLE_LABELS } from '@/lib/reference/corporateRoles'

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: person } = await supabase.from('people').select('*').eq('id', id).single()
  if (!person) notFound()

  const { data: roleAssignments } = await supabase
    .from('role_assignments')
    .select('*, companies(id, name)')
    .eq('person_id', id)
    .order('start_date', { ascending: false })

  type RoleAssignmentRow = RoleAssignment & { companies: Pick<Company, 'id' | 'name'> | null }
  const roleList = (roleAssignments ?? []) as unknown as RoleAssignmentRow[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft size={14} />
          Back to Companies
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{(person as Person).name}</h1>
        <p className="text-sm text-slate-500 mt-1">Person record and KYC details.</p>
      </div>

      {roleList.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Appointments</h2>
          <ul className="flex flex-col gap-2">
            {roleList.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <Link href={`/companies/${r.company_id}`} className="text-slate-900 font-medium hover:text-teal-700">
                  {r.companies?.name ?? 'Unknown company'}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="badge badge-info">{CORPORATE_ROLE_LABELS[r.role]}</span>
                  {r.end_date && <span className="text-xs text-slate-400">ended {r.end_date}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PersonDetailsForm person={person as Person} />
    </div>
  )
}

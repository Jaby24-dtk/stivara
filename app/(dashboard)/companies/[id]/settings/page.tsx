import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Company } from '@/lib/types'
import { CompanyProfileForm } from '@/components/companies/CompanyProfileForm'

export default async function CompanySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: otherCompanies }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).single(),
    supabase.from('companies').select('id, name').neq('id', id).order('name'),
  ])
  if (!company) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/companies/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft size={14} />
          Back to {(company as Company).name}
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Full profile</h1>
        <p className="text-sm text-slate-500 mt-1">Identity, registration, and compliance classification details.</p>
      </div>

      <CompanyProfileForm company={company as Company} otherCompanies={otherCompanies ?? []} />
    </div>
  )
}

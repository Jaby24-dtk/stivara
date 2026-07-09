import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Company, ComplianceEvent, Document } from '@/lib/types'
import { UploadDocumentButton } from '@/components/documents/UploadDocumentButton'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company } = await supabase.from('companies').select('*').eq('id', id).single()
  if (!company) notFound()

  const { data: events } = await supabase
    .from('compliance_events')
    .select('*')
    .eq('company_id', id)
    .order('due_date')
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('company_id', id)
    .order('created_at', { ascending: false })

  const companyRow = company as Company
  const eventList = (events ?? []) as ComplianceEvent[]
  const documentList = (documents ?? []) as Document[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{companyRow.name}</h1>
        <p className="text-sm text-slate-500">
          {companyRow.jurisdiction} · {companyRow.entity_type ?? 'Entity type not set'} · FYE {companyRow.fye}
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Compliance calendar</h2>
        {eventList.length === 0 ? (
          <p className="text-sm text-slate-500">No compliance events on record.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {eventList.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{e.type}</span>
                <span className="text-slate-500">{e.due_date}</span>
                <span className="badge badge-gray">{e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Documents</h2>
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
    </div>
  )
}

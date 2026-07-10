import { createClient } from '@/lib/supabase/server'
import type { Company } from '@/lib/types'
import { AiChat } from '@/components/ai/AiChat'

export default async function AiAssistantPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('*').order('name')
  const companyList = (companies ?? []) as Company[]

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Assistant</h1>
        <p className="text-sm text-slate-500">
          Ask about a company&apos;s directors, filings, or indexed documents. Answers draw on Stivara&apos;s own records and cite document sources where used.
        </p>
      </div>
      <AiChat companies={companyList} />
    </div>
  )
}

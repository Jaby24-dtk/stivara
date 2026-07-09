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
        <h1 className="text-2xl font-semibold text-slate-900">AI Assistant</h1>
        <p className="text-sm text-slate-500">Ask questions about a company&apos;s indexed documents. Answers cite their source excerpts.</p>
      </div>
      <AiChat companies={companyList} />
    </div>
  )
}

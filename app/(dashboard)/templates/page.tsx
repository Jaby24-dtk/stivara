import { DOCUMENT_TEMPLATES } from '@/lib/documents/templates'
import { TemplateCard } from '@/components/documents/TemplateCard'

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-slate-900 tracking-tight">Templates</h1>
        <p className="text-base text-slate-500 mt-1">
          Blank, standard-format documents you can download directly — no company selection needed.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {DOCUMENT_TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  )
}

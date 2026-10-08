'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DownloadTextButton } from '@/components/documents/DownloadTextButton'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import type { DocumentTemplate } from '@/lib/documents/templates'

export function TemplateCard({ template }: { template: DocumentTemplate }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card-gold p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-900">{template.name}</h3>
          <p className="text-sm text-slate-500 mt-1">{template.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-secondary btn-sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Preview
          </button>
          <DownloadTextButton filename={template.filename} content={template.content} />
        </div>
      </div>
      {expanded && (
        <div className="mt-5">
          <DocumentPreview content={template.content} />
        </div>
      )}
    </div>
  )
}

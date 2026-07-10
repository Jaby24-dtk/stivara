'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DownloadTextButton } from '@/components/documents/DownloadTextButton'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import type { DocumentTemplate } from '@/lib/documents/templates'

export function TemplateCard({ template }: { template: DocumentTemplate }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card-gold p-6">
      <div className="flex items-start justify-between gap-4">
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

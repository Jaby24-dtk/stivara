'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { NewLegalEntityForm } from './NewLegalEntityForm'

export function AddLegalEntityButton({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <Building2 size={14} />
        Add legal entity
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add legal entity</h2>
            <NewLegalEntityForm companyId={companyId} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

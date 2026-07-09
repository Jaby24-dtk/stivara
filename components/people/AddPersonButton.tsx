'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NewPersonForm } from './NewPersonForm'

export function AddPersonButton({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Add person
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add person</h2>
            <NewPersonForm companyId={companyId} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

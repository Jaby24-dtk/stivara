'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NewCompanyForm } from './NewCompanyForm'

export function AddCompanyButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Add company
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-slate-900 mb-4">Add company</h2>
            <NewCompanyForm onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

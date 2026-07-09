'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Company } from '@/lib/types'
import { NewTaskForm } from './NewTaskForm'

export function AddTaskButton({ companies }: { companies: Pick<Company, 'id' | 'name'>[] }) {
  const [open, setOpen] = useState(false)

  if (companies.length === 0) return null

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Add task
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add task</h2>
            <NewTaskForm companies={companies} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

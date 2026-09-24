'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import type { UserRow } from '@/lib/types'
import { NewUserForm } from './NewUserForm'

export function AddUserButton({ roles }: { roles: UserRow['role'][] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <UserPlus size={14} />
        Add user
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add user</h2>
            <NewUserForm roles={roles} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}

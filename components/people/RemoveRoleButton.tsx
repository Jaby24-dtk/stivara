'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RemoveRoleButton({ roleAssignmentId }: { roleAssignmentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch(`/api/role-assignments/${roleAssignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setLoading(false)
    if (res.ok) router.refresh()
  }

  return (
    <button className="text-xs text-slate-400 hover:text-red-600" onClick={handleClick} disabled={loading}>
      {loading ? 'Removing…' : 'Remove'}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task } from '@/lib/types'

const statusBadge: Record<Task['status'], string> = {
  todo: 'badge-gray',
  in_progress: 'badge-info',
  done: 'badge-success',
}

export function TaskStatusSelect({ taskId, status }: { taskId: string; status: Task['status'] }) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: Task['status']) {
    setCurrent(next)
    setSaving(true)
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setSaving(false)
    if (!res.ok) {
      setCurrent(status)
      return
    }
    router.refresh()
  }

  return (
    <select
      className={`badge ${statusBadge[current]} border-0 cursor-pointer`}
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as Task['status'])}
    >
      <option value="todo">todo</option>
      <option value="in_progress">in progress</option>
      <option value="done">done</option>
    </select>
  )
}

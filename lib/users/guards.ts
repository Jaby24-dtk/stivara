import { NextResponse } from 'next/server'
import type { UserRow } from '@/lib/types'
import { canEditData } from './permissions'

// For API write handlers: returns a 403 response for view-only roles, or
// null to continue. RLS enforces the same rule; this gives a clear message.
export function requireEditor(user: Pick<UserRow, 'role'>): NextResponse | null {
  if (canEditData(user.role)) return null
  return NextResponse.json({ error: 'You have view-only access. Ask an admin to make this change.' }, { status: 403 })
}

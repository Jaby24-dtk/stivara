import type { UserRow } from '@/lib/types'

type PlatformRole = UserRow['role']

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  super_admin: 'Super admin',
  practice_staff: 'Practice staff',
  client_admin: 'Client admin',
  client_user: 'Client user',
}

// Which roles each admin tier may hand out. A client admin manages their own
// client-side team only — they can't mint firm staff or another super admin.
const ASSIGNABLE_ROLES: Record<PlatformRole, PlatformRole[]> = {
  super_admin: ['super_admin', 'practice_staff', 'client_admin', 'client_user'],
  client_admin: ['client_admin', 'client_user'],
  practice_staff: [],
  client_user: [],
}

export function assignableRoles(role: PlatformRole): PlatformRole[] {
  return ASSIGNABLE_ROLES[role] ?? []
}

export function canManageUsers(role: PlatformRole): boolean {
  return assignableRoles(role).length > 0
}

export function canAssignRole(actorRole: PlatformRole, targetRole: string): targetRole is PlatformRole {
  return (assignableRoles(actorRole) as string[]).includes(targetRole)
}

// An admin may edit/remove a user only if that user's current role is one
// they could have assigned — so a client admin can't touch firm staff or a
// super admin. Nobody manages their own account here, to avoid self-lockout.
export function canManageUser(actor: Pick<UserRow, 'id' | 'role'>, target: Pick<UserRow, 'id' | 'role'>): boolean {
  return actor.id !== target.id && canAssignRole(actor.role, target.role)
}

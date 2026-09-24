import type { UserRow } from '@/lib/types'

type PlatformRole = UserRow['role']

// practice_staff is retired: it can no longer be assigned, but the DB check
// constraint still allows it, so existing rows keep a label and can be moved
// to another role (or removed) by a super admin.
export const RETIRED_ROLES: PlatformRole[] = ['practice_staff']

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  super_admin: 'Super admin',
  practice_staff: 'Practice staff (retired)',
  client_admin: 'Client admin',
  client_user: 'Client user',
}

// Which roles each admin tier may hand out. A client admin manages their own
// client-side team only — they can't mint another super admin.
const ASSIGNABLE_ROLES: Record<PlatformRole, PlatformRole[]> = {
  super_admin: ['super_admin', 'client_admin', 'client_user'],
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
// they could have assigned — so a client admin can't touch a super admin.
// Super admins can also clean up users still on a retired role. Nobody
// manages their own account here, to avoid self-lockout.
export function canManageUser(actor: Pick<UserRow, 'id' | 'role'>, target: Pick<UserRow, 'id' | 'role'>): boolean {
  if (actor.id === target.id) return false
  if (actor.role === 'super_admin' && RETIRED_ROLES.includes(target.role)) return true
  return canAssignRole(actor.role, target.role)
}

// Plain-language summary of what a role can do, shown on Settings.
export function rolePermissions(role: PlatformRole): string[] {
  const permissions = canEditData(role)
    ? ['View and edit all companies, people, documents and tasks', 'Reveal encrypted ID numbers and addresses']
    : ['View all companies, people, documents and tasks (view only)', 'Update task status']
  permissions.push('Use the AI assistant')
  const roles = assignableRoles(role)
  if (role === 'super_admin') permissions.push('Add, edit and remove all users')
  else if (roles.length > 0) {
    permissions.push(`Add, edit and remove ${roles.map((r) => PLATFORM_ROLE_LABELS[r].toLowerCase() + 's').join(' and ')}`)
  } else permissions.push('Cannot manage users')
  return permissions
}

// Roles that may create/edit/delete company data. Everyone else in the org
// is view-only (they can still change task status). Enforced in the DB by
// public.current_user_can_edit() — keep the two lists in sync.
const EDITOR_ROLES: PlatformRole[] = ['super_admin', 'client_admin']

export function canEditData(role: PlatformRole): boolean {
  return EDITOR_ROLES.includes(role)
}

// Decrypting ID numbers / residential addresses is admin-only.
export function canViewSensitive(role: PlatformRole): boolean {
  return canEditData(role)
}

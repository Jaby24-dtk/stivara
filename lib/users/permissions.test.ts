import { describe, expect, it } from 'vitest'
import { assignableRoles, canAssignRole, canManageUsers } from './permissions'

describe('user management permissions', () => {
  it('lets super admins assign every role', () => {
    expect(assignableRoles('super_admin')).toEqual(['super_admin', 'practice_staff', 'client_admin', 'client_user'])
  })

  it('limits client admins to client-side roles', () => {
    expect(canAssignRole('client_admin', 'client_user')).toBe(true)
    expect(canAssignRole('client_admin', 'client_admin')).toBe(true)
    expect(canAssignRole('client_admin', 'practice_staff')).toBe(false)
    expect(canAssignRole('client_admin', 'super_admin')).toBe(false)
  })

  it('blocks non-admin roles from managing users', () => {
    expect(canManageUsers('practice_staff')).toBe(false)
    expect(canManageUsers('client_user')).toBe(false)
    expect(canAssignRole('client_user', 'client_user')).toBe(false)
  })

  it('rejects unknown role strings', () => {
    expect(canAssignRole('super_admin', 'owner')).toBe(false)
  })
})

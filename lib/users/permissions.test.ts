import { describe, expect, it } from 'vitest'
import { assignableRoles, canAssignRole, canManageUser, canManageUsers, rolePermissions } from './permissions'

describe('user management permissions', () => {
  it('lets super admins assign every active role', () => {
    expect(assignableRoles('super_admin')).toEqual(['super_admin', 'client_admin', 'client_user'])
  })

  it('no longer lets anyone assign the retired practice staff role', () => {
    expect(canAssignRole('super_admin', 'practice_staff')).toBe(false)
    expect(canAssignRole('client_admin', 'practice_staff')).toBe(false)
  })

  it('limits client admins to client-side roles', () => {
    expect(canAssignRole('client_admin', 'client_user')).toBe(true)
    expect(canAssignRole('client_admin', 'client_admin')).toBe(true)
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

  it('only lets admins manage other users they could have created', () => {
    const superAdmin = { id: 'a', role: 'super_admin' as const }
    const clientAdmin = { id: 'b', role: 'client_admin' as const }
    expect(canManageUser(superAdmin, clientAdmin)).toBe(true)
    expect(canManageUser(clientAdmin, superAdmin)).toBe(false)
    expect(canManageUser(clientAdmin, { id: 'c', role: 'client_user' })).toBe(true)
  })

  it('lets only super admins clean up users on a retired role', () => {
    const legacy = { id: 'd', role: 'practice_staff' as const }
    expect(canManageUser({ id: 'a', role: 'super_admin' }, legacy)).toBe(true)
    expect(canManageUser({ id: 'b', role: 'client_admin' }, legacy)).toBe(false)
  })

  it('never lets an admin manage their own account', () => {
    expect(canManageUser({ id: 'a', role: 'super_admin' }, { id: 'a', role: 'super_admin' })).toBe(false)
  })

  it('describes each role in plain language', () => {
    expect(rolePermissions('super_admin')).toContain('Add, edit and remove all users')
    expect(rolePermissions('client_admin')).toContain('Add, edit and remove client admins and client users')
    expect(rolePermissions('client_user')).toContain('Cannot manage users')
  })
})

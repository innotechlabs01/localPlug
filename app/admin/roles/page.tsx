'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface Role {
  id: number; name: string; description: string
}

interface Module {
  id: number; name: string; slug: string
}

interface Perms {
  can_view: number; can_create: number; can_update: number; can_delete: number
}

type PermMap = Record<string, Record<string, Perms>>

const actions = [
  { key: 'can_view' as const, label: 'Menu/View', color: 'var(--ui-info)' },
  { key: 'can_create' as const, label: 'Create', color: 'var(--ui-accent)' },
  { key: 'can_update' as const, label: 'Update', color: 'var(--ui-warning)' },
  { key: 'can_delete' as const, label: 'Delete', color: 'var(--ui-danger)' },
]

const CORE_ROLES = ['super_admin', 'admin', 'viewer']

const theme = {
  bg: 'var(--bg)', surface: 'var(--surface)', surfaceHover: 'var(--surface-hover)',
  border: 'var(--border)', fg: 'var(--fg)', fgSecondary: 'var(--fg-muted)',
  accent: 'var(--accent)', accentSoft: 'rgba(16,185,129,0.12)',
  radiusSm: '6px', radiusMd: '10px',
}

function Checkbox({ checked, onChange, color }: { checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 22, height: 22, borderRadius: 5,
        border: checked ? 'none' : `1.5px solid var(--border)`,
        background: checked ? color : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {checked && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [perms, setPerms] = useState<PermMap>({})
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [newRoleOpen, setNewRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [newRoleModules, setNewRoleModules] = useState<string[]>(['dispatch'])
  const { showToast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/permissions')
      const data = await res.json()
      setRoles(data.roles || [])
      setModules(data.modules || [])
      setPerms(data.permissions || {})
      setIsSuperAdmin(Boolean(data.isSuperAdmin))
    } catch {
      showToast?.('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const togglePerm = async (roleId: number, moduleId: number, field: string, currentValue: number) => {
    const newValue = currentValue ? 0 : 1
    const rId = String(roleId)
    const mId = String(moduleId)
    const prevModulePerms = perms[rId]?.[mId] || { can_view: 0, can_create: 0, can_update: 0, can_delete: 0 }
    const nextModulePerms = { ...prevModulePerms, [field]: newValue }

    setPerms(prev => {
      const next = { ...prev }
      if (!next[rId]) next[rId] = {}
      next[rId] = { ...next[rId], [mId]: nextModulePerms }
      return next
    })

    setSaving(`${roleId}-${moduleId}`)
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: roleId,
          module_id: moduleId,
          can_view: !!nextModulePerms.can_view,
          can_create: !!nextModulePerms.can_create,
          can_update: !!nextModulePerms.can_update,
          can_delete: !!nextModulePerms.can_delete,
        }),
      })
      if (!res.ok) throw new Error()
      showToast?.('Permiso actualizado ✓')
    } catch {
      setPerms(prev => {
        const next = { ...prev }
        if (next[rId]?.[mId]) next[rId][mId] = prevModulePerms
        return next
      })
      showToast?.('Failed to update permission')
    } finally {
      setSaving(null)
    }
  }

  const handleCreateRole = async () => {
    if (!isSuperAdmin) {
      showToast?.('Only Super Admin can create roles')
      return
    }
    if (!newRoleName.trim()) {
      showToast?.('Role name is required')
      return
    }
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          allowedModules: newRoleModules,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast?.(err.error || 'Failed to create role')
        return
      }
      setNewRoleName('')
      setNewRoleDesc('')
      setNewRoleModules(['dispatch'])
      setNewRoleOpen(false)
      showToast?.('Role created')
      fetchData()
    } catch {
      showToast?.('Failed to create role')
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (!isSuperAdmin) return
    if (!confirm(`Delete role "${role.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/permissions?id=${role.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast?.(err.error || 'Failed to delete role')
        return
      }
      showToast?.(`Role "${role.name}" deleted`)
      fetchData()
    } catch {
      showToast?.('Failed to delete role')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, color: theme.fgSecondary }}>
        Loading permissions...
      </div>
    )
  }

  return (
    <div style={{ padding: 28, maxWidth: 1200 }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.fg, margin: 0 }}>Roles & Permissions</h1>
          <p style={{ fontSize: 14, color: theme.fgSecondary, marginTop: 6 }}>
            Configure module-level permissions for each role. Click a checkbox to toggle.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setNewRoleOpen(v => !v)}
            style={{
              padding: '9px 16px',
              borderRadius: theme.radiusSm,
              border: 'none',
              background: theme.accent,
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            + New Role
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: theme.radiusSm, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--ui-warning)', fontSize: 13 }}>
          Solo el Super Admin (anthonyrivera51@gmail.com) puede crear roles, asignar permisos y configurar la visibilidad del menú.
        </div>
      )}

      {newRoleOpen && isSuperAdmin && (
        <div style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: theme.radiusMd,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="Role slug (e.g. dispatch, accountant)"
              style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.fg, minWidth: 220 }}
            />
            <input
              value={newRoleDesc}
              onChange={e => setNewRoleDesc(e.target.value)}
              placeholder="Description"
              style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.fg, flex: 1, minWidth: 220 }}
            />
            <button
              onClick={handleCreateRole}
              style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: theme.accent, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              Save Role
            </button>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.fgSecondary, marginBottom: 8 }}>
              Menús activos para este rol (Menu/View):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {modules.map(m => {
                const checked = newRoleModules.includes(m.slug)
                return (
                  <label key={m.slug} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: `1px solid ${checked ? theme.accent : theme.border}`, background: checked ? theme.accentSoft : 'transparent', fontSize: 12, cursor: 'pointer', color: theme.fg }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setNewRoleModules(prev => checked ? prev.filter(s => s !== m.slug) : [...prev, m.slug])}
                    />
                    {m.name}
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{
        overflowX: 'auto',
        borderRadius: theme.radiusMd,
        border: `1px solid ${theme.border}`,
        background: theme.surface,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, color: theme.fgSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', position: 'sticky', left: 0, background: theme.surface, zIndex: 2 }}>
                Module
              </th>
              {roles.map(role => (
                <th key={role.id} style={{ textAlign: 'center', padding: '14px 8px', borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.fg }}>{role.name}</span>
                    {isSuperAdmin && !CORE_ROLES.includes(role.name) && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        title="Delete role"
                        style={{ background: 'none', border: 'none', color: 'var(--ui-danger)', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: theme.fgSecondary, marginTop: 2 }}>{role.description}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(mod => {
              const isAdminRow = mod.slug === 'roles'
              return (
                <tr key={mod.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{
                    padding: '12px 18px', position: 'sticky', left: 0,
                    background: theme.surface, zIndex: 1,
                    borderRight: `1px solid ${theme.border}`,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: theme.fg }}>{mod.name}</div>
                    <div style={{ fontSize: 11, color: theme.fgSecondary, marginTop: 2 }}>{mod.slug}</div>
                  </td>
                  {roles.map(role => {
                    const rId = String(role.id)
                    const mId = String(mod.id)
                    const p = perms[rId]?.[mId] || { can_view: 0, can_create: 0, can_update: 0, can_delete: 0 }
                    const isFullAccess = role.name === 'super_admin' || role.name === 'admin'

                    return (
                      <td key={`${role.id}-${mod.id}`} style={{
                        padding: '10px 8px', borderLeft: `1px solid ${theme.border}`,
                        verticalAlign: 'middle',
                      }}>
                        {isFullAccess ? (
                          <div style={{ textAlign: 'center', fontSize: 11, color: theme.accent, fontWeight: 500 }}>
                            Full Access
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', opacity: isSuperAdmin ? 1 : 0.6, pointerEvents: isSuperAdmin ? 'auto' : 'none' }}>
                            {actions.map(a => (
                              <div key={a.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <Checkbox
                                  checked={!!p[a.key]}
                                  color={a.color}
                                  onChange={() => togglePerm(role.id, mod.id, a.key, p[a.key])}
                                />
                                <span style={{ fontSize: 9, color: theme.fgSecondary }}>{a.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {saving && (
        <div style={{ marginTop: 12, fontSize: 12, color: theme.fgSecondary }}>
          Saving...
        </div>
      )}
    </div>
  )
}

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
  { key: 'can_view' as const, label: 'View', color: '#3b82f6' },
  { key: 'can_create' as const, label: 'Create', color: '#10b981' },
  { key: 'can_update' as const, label: 'Update', color: '#f59e0b' },
  { key: 'can_delete' as const, label: 'Delete', color: '#ef4444' },
]

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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const { showToast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/permissions')
      const data = await res.json()
      setRoles(data.roles || [])
      setModules(data.modules || [])
      setPerms(data.permissions || {})
    } catch {
      showToast?.('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  const togglePerm = async (roleId: number, moduleId: number, field: string, currentValue: number) => {
    const newValue = currentValue ? 0 : 1

    setPerms(prev => {
      const next = { ...prev }
      const rId = String(roleId)
      const mId = String(moduleId)
      if (!next[rId]) next[rId] = {}
      next[rId] = { ...next[rId], [mId]: { ...next[rId][mId], [field]: newValue } }
      return next
    })

    setSaving(`${roleId}-${moduleId}`)
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId, module_id: moduleId, [field]: !!newValue }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setPerms(prev => {
        const next = { ...prev }
        const rId = String(roleId)
        const mId = String(moduleId)
        if (next[rId]?.[mId]) next[rId][mId] = { ...next[rId][mId], [field]: currentValue }
        return next
      })
      showToast?.('Failed to update permission')
    } finally {
      setSaving(null)
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
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.fg, margin: 0 }}>Roles & Permissions</h1>
        <p style={{ fontSize: 14, color: theme.fgSecondary, marginTop: 6 }}>
          Configure module-level permissions for each role. Click a checkbox to toggle.
        </p>
      </div>

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
                <th key={role.id} style={{ textAlign: 'center', padding: '14px 8px', borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, minWidth: 140 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.fg }}>{role.name}</div>
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
                    const p = perms[rId]?.[mId]
                    const isAdmin = role.name === 'admin'

                    return (
                      <td key={`${role.id}-${mod.id}`} style={{
                        padding: '10px 8px', borderLeft: `1px solid ${theme.border}`,
                        verticalAlign: 'middle',
                      }}>
                        {isAdmin ? (
                          <div style={{ textAlign: 'center', fontSize: 11, color: theme.accent, fontWeight: 500 }}>
                            Full Access
                          </div>
                        ) : p ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
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
                        ) : (
                          <div style={{ textAlign: 'center', fontSize: 11, color: theme.fgSecondary }}>
                            No permissions
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

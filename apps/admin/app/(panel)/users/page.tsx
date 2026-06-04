'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Profile = {
  id: string
  fullName: string | null
  role: 'student' | 'teacher' | 'admin'
  targetLevel: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    const { data } = await api.admin.users.get()
    if (Array.isArray(data)) setUsers(data as Profile[])
  }

  useEffect(() => { load() }, [])

  async function setRole(id: string, role: 'student' | 'teacher' | 'admin') {
    setSaving(id)
    await api.admin.users({ id }).role.patch({ role })
    await load()
    setSaving(null)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Korisnici</h1>
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Ime</th>
              <th>ID</th>
              <th>Nivo</th>
              <th>Uloga</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName ?? <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                <td style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {u.id.slice(0, 8)}…
                </td>
                <td>{u.targetLevel ?? '—'}</td>
                <td>
                  <select
                    className="select"
                    value={u.role}
                    disabled={saving === u.id}
                    onChange={(e) => setRole(u.id, e.target.value as 'student' | 'teacher' | 'admin')}
                    style={{ width: 140 }}
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Nema korisnika</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

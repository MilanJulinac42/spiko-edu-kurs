'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Course = { id: string; title: string; status: string }
type UserRow = { id: string; role: string }

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [users, setUsers] = useState<UserRow[]>([])

  useEffect(() => {
    api.admin.courses.get().then(({ data }) => {
      if (Array.isArray(data)) setCourses(data as Course[])
    })
    api.admin.users.get().then(({ data }) => {
      if (Array.isArray(data)) setUsers(data as UserRow[])
    })
  }, [])

  const published = courses.filter((c) => c.status === 'published').length
  const drafts = courses.filter((c) => c.status === 'draft').length
  const admins = users.filter((u) => u.role === 'admin').length
  const students = users.filter((u) => u.role === 'student').length

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Pregled</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <Stat label="Ukupno kurseva" value={courses.length} hint={`${published} objavljeno, ${drafts} draft`} />
        <Stat label="Korisnici" value={users.length} hint={`${students} student, ${admins} admin`} />
        <Stat label="Vežbe" value="—" hint="uskoro" />
        <Stat label="Zakazivanja" value="—" hint="uskoro" />
      </div>

      <div className="panel">
        <div className="row between" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Skorašnji kursevi</h2>
          <Link href="/courses" className="btn secondary">
            Svi kursevi →
          </Link>
        </div>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Nema kurseva. <Link href="/courses">Napravi prvi →</Link></p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Naslov</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/courses/${c.id}`}>{c.title}</Link>
                  </td>
                  <td>
                    <span className={`status-badge ${c.status}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="panel">
      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.4rem' }}>{value}</div>
      {hint && <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>{hint}</div>}
    </div>
  )
}

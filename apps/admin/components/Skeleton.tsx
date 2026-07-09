import type { CSSProperties } from 'react'

/**
 * Skeleton placeholder — sivi pravougaonik sa shimmer animacijom.
 * Koristi se kao loading state pre nego što stignu pravi podaci.
 */
export function Skeleton({
  width,
  height = 16,
  radius = 6,
  style,
}: {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
}) {
  return (
    <span
      className="admin-skeleton"
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius: radius,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  )
}

/* ──────── Page-level skeletons ──────── */

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-card-label" style={{ gap: '0.5rem' }}>
        <Skeleton width={8} height={8} radius={999} />
        <Skeleton width={110} height={9} />
      </div>
      <Skeleton width={56} height={28} radius={6} style={{ marginTop: 4 }} />
      <Skeleton width={140} height={10} style={{ marginTop: 4 }} />
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ columns = 3, titleWidth = '60%' }: { columns?: number; titleWidth?: string }) {
  return (
    <tr>
      <td>
        <Skeleton width={titleWidth} height={14} />
        <br />
        <Skeleton width="35%" height={10} style={{ marginTop: 6 }} />
      </td>
      {Array.from({ length: columns - 1 }, (_, i) => (
        <td key={i}>
          <Skeleton width={i === columns - 2 ? 60 : 80} height={12} />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({
  headers,
  rows = 5,
}: {
  headers: string[]
  rows?: number
}) {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={i === 0 ? { width: '55%' } : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, i) => (
          <TableRowSkeleton key={i} columns={headers.length} />
        ))}
      </tbody>
    </table>
  )
}

export function PanelTableSkeleton({
  title,
  action,
  headers,
  rows = 5,
}: {
  title: string
  action?: string
  headers: string[]
  rows?: number
}) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        className="row between"
        style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border)' }}
      >
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{title}</h2>
        {action && (
          <Skeleton width={action.length * 8 + 24} height={32} radius={8} />
        )}
      </div>
      <TableSkeleton headers={headers} rows={rows} />
    </div>
  )
}

/* ──────── Card grid skeleton (za vežbe library) ──────── */

export function ExerciseCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '1.1rem 1.15rem 1rem',
        paddingLeft: 'calc(1.15rem + 4px)',
        minHeight: 180,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: 'var(--border-2)',
        }}
      />
      <Skeleton width={120} height={20} radius={999} />
      <div>
        <Skeleton width="80%" height={16} />
        <br />
        <Skeleton width="95%" height={11} style={{ marginTop: 8 }} />
        <br />
        <Skeleton width="65%" height={11} style={{ marginTop: 4 }} />
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.35rem' }}>
        <Skeleton width="60%" height={32} radius={8} />
        <Skeleton width={32} height={32} radius={8} />
        <Skeleton width={32} height={32} radius={8} />
      </div>
    </div>
  )
}

export function ExerciseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: '0.75rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <ExerciseCardSkeleton key={i} />
      ))}
    </div>
  )
}

/* ──────── Course detail hero skeleton ──────── */

export function CourseHeroSkeleton() {
  return (
    <div
      style={{
        position: 'relative',
        padding: '1.6rem 1.75rem',
        borderRadius: 'var(--r-lg)',
        background:
          'linear-gradient(135deg, var(--primary-soft) 0%, var(--accent-soft) 100%)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-soft)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
        <Skeleton width={66} height={20} radius={999} />
        <Skeleton width={36} height={20} radius={999} />
        <Skeleton width={42} height={20} radius={999} />
      </div>
      <Skeleton width="55%" height={28} />
      <br />
      <Skeleton width="80%" height={12} style={{ marginTop: 12 }} />
      <br />
      <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.9rem' }}>
        <Skeleton width={70} height={12} />
        <Skeleton width={70} height={12} />
        <Skeleton width={100} height={12} />
      </div>
    </div>
  )
}

/* ──────── Module/lesson list skeleton ──────── */

export function CourseBuilderSkeleton() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <Skeleton width={140} height={20} />
        <Skeleton width={90} height={36} radius={10} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {Array.from({ length: 2 }, (_, i) => (
          <ModuleSkeleton key={i} lessons={3} />
        ))}
      </div>
    </div>
  )
}

function ModuleSkeleton({ lessons = 3 }: { lessons?: number }) {
  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <header
        style={{
          padding: '0.9rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, var(--primary-soft) 0%, transparent 70%)',
        }}
      >
        <Skeleton width={14} height={14} radius={4} />
        <Skeleton width={34} height={34} radius={10} />
        <div style={{ flex: 1 }}>
          <Skeleton width="40%" height={14} />
          <br />
          <Skeleton width="25%" height={10} style={{ marginTop: 4 }} />
        </div>
      </header>
      <div style={{ padding: '0.6rem' }}>
        {Array.from({ length: lessons }, (_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.7rem 0.85rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              marginBottom: '0.35rem',
            }}
          >
            <Skeleton width={14} height={14} radius={4} />
            <Skeleton width={14} height={14} radius={4} />
            <Skeleton width="40%" height={12} />
            <div style={{ flex: 1 }} />
            <Skeleton width={60} height={20} radius={999} />
            <Skeleton width={70} height={20} radius={999} />
          </div>
        ))}
      </div>
      <div style={{ padding: '0.65rem 1rem 1rem' }}>
        <Skeleton width="100%" height={42} radius={12} />
      </div>
    </article>
  )
}

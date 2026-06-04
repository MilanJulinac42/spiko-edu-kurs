export default function ExercisesPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Vežbe</h1>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Faza 3 — uskoro</h2>
        <p style={{ color: 'var(--muted)' }}>
          Builderi za 4 tipa vežbi (multiple choice, fill blank, matching, ordering)
          sa specifičnim formama, validacijom tačnih odgovora i preview-om.
        </p>
        <p style={{ color: 'var(--muted)' }}>
          Backend rute (<code>POST /admin/exercises</code>) i JSON shape-ovi (
          <code>packages/shared/src/exercises.ts</code>) su već postavljeni.
        </p>
      </div>
    </div>
  )
}

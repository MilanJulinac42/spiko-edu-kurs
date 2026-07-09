import { cn } from '@/lib/utils'

/** Bazni skeleton block sa pulse animacijom. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-ink/5', className)}
      aria-hidden
    />
  )
}

/** Dashboard hero + kurs grid skeleton — mimicka pravi layout. */
export function DashboardSkeleton() {
  return (
    <div>
      {/* Hero */}
      <section className="overflow-hidden bg-ink pb-32 pt-12 sm:pt-16">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Skeleton className="h-7 w-48 bg-white/10" />
          <Skeleton className="mt-6 h-12 w-3/4 max-w-2xl bg-white/10" />
          <Skeleton className="mt-3 h-12 w-2/3 max-w-xl bg-white/10" />
          <Skeleton className="mt-6 h-5 w-full max-w-md bg-white/10" />
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-13 w-44 bg-white/10" />
            <Skeleton className="h-13 w-44 bg-white/10" />
          </div>
          <div className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-7 w-16 bg-white/10" />
                <Skeleton className="mt-2 h-3 w-20 bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cards grid */}
      <section className="bg-surface py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-9 w-72" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
      <Skeleton className="h-32 w-full" />
      <div className="mt-5 flex gap-1.5">
        <Skeleton className="h-5 w-10 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-3/4" />
      <Skeleton className="mt-5 h-2 w-full" />
      <Skeleton className="mt-5 h-10 w-full rounded-full" />
    </div>
  )
}

/** Lekcija skeleton — koristi se i u page i u loading.tsx */
export function LessonSkeleton() {
  return (
    <div className="bg-surface pb-24">
      <div className="border-b border-ink/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="rounded-3xl bg-white p-5 shadow-soft sm:p-10">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-10 w-3/4" />
            <Skeleton className="mt-3 h-5 w-16" />
            <div className="mt-8 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="mt-6 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </article>
          <aside className="hidden lg:block">
            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <Skeleton className="h-5 w-32" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

/** Progress/Napredak stranica skeleton */
export function ProgressSkeleton() {
  return (
    <div className="bg-surface pb-20">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-10 w-72" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />

        {/* Stats row */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
              <Skeleton className="h-12 w-12" />
              <Skeleton className="mt-4 h-10 w-24" />
              <Skeleton className="mt-2 h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="mt-10 rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-1 h-4 w-72" />
          <div className="mt-6 grid grid-cols-[repeat(53,1fr)] gap-[2px] sm:max-w-3xl">
            {Array.from({ length: 53 * 7 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-3 rounded-sm" />
            ))}
          </div>
        </div>

        {/* Exercise stats */}
        <div className="mt-10 rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-1 h-4 w-64" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-ink/5 bg-surface p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-3 h-8 w-16" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-10 rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
          <div className="mt-6 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Course detail skeleton */
export function CourseDetailSkeleton() {
  return (
    <div className="bg-surface pb-20">
      <section className="overflow-hidden bg-ink py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="mt-5 h-12 w-3/4 bg-white/10" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl bg-white/10" />
          <Skeleton className="mt-6 h-12 w-56 bg-white/10" />
        </div>
      </section>
      <div className="mx-auto mt-10 w-full max-w-6xl px-5 sm:px-8">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

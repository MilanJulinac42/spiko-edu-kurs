export function DemoLessonPreview() {
  return (
    <div className="relative rounded-3xl border border-ink/5 bg-white p-3 shadow-card">
      {/* Browser frame */}
      <div className="flex items-center gap-1.5 px-3 pb-2 pt-1">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 rounded-md bg-surface px-2 py-0.5 text-[0.65rem] font-mono text-muted">
          spiko.edu/lekcija/modul-2
        </span>
      </div>

      {/* Mock video */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-secondary-dark">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,_rgba(255,255,255,0.18),_transparent_55%)]" />
        {/* Native speaker silhouette */}
        <div className="absolute bottom-0 left-1/2 h-3/4 w-2/3 -translate-x-1/2 rounded-t-full bg-ink/30" />
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          Modul 2 · Predstavljanje
        </div>

        {/* Play button */}
        <button
          type="button"
          className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-card transition-transform hover:scale-110"
          aria-label="Pusti demo"
        >
          <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </button>

        {/* Controls bar */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-xl bg-ink/60 px-3 py-2 backdrop-blur">
          <span className="text-[0.7rem] font-mono text-white/80">0:42 / 4:18</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[16%] rounded-full bg-primary" />
          </div>
          <span className="text-[0.7rem] text-white/80">CC</span>
          <span className="text-[0.7rem] text-white/80">1×</span>
        </div>
      </div>

      {/* Transcript line */}
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-surface p-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary/15 text-xs font-bold text-secondary-dark">
          🎙
        </span>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">Transkript</p>
          <p className="mt-0.5 text-sm text-ink/85">
            Ich heiße Ana. <span className="rounded bg-primary/15 px-1 font-semibold text-primary-dark">Wie heißt du?</span>
          </p>
        </div>
      </div>

      {/* Exercise teaser */}
      <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-ink text-xs font-bold">
            ✎
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-dark">
            Vežba 1 · Multiple choice
          </span>
        </div>
        <p className="mt-3 font-semibold text-ink">Šta &quot;Wie heißt du?&quot; znači?</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <span className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink/80">
            Kako si?
          </span>
          <span className="rounded-lg border-2 border-primary bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark">
            Kako se zoveš?
          </span>
          <span className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink/80">
            Odakle si?
          </span>
          <span className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink/80">
            Šta radiš?
          </span>
        </div>
      </div>
    </div>
  )
}

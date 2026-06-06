'use client'

import { useState } from 'react'

export type FaqItem = { q: string; a: string }

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = open === idx
        return (
          <div
            key={idx}
            className={`overflow-hidden rounded-2xl border transition-colors ${
              isOpen ? 'border-primary/30 bg-white shadow-soft' : 'border-ink/10 bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-display text-base font-bold text-ink sm:text-lg">
                {item.q}
              </span>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all ${
                  isOpen ? 'bg-primary text-ink rotate-45' : 'bg-surface text-muted'
                }`}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 leading-relaxed text-muted">{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

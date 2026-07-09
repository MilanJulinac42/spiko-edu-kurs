'use client'

import confetti from 'canvas-confetti'

const COLORS = ['#86c440', '#a6da6c', '#3e8fd0', '#6fb0e3', '#5e9e2e']

/** Mali burst — koristi za pojedinačno tačan odgovor */
export function celebrateSmall() {
  confetti({
    particleCount: 60,
    spread: 60,
    origin: { y: 0.6 },
    colors: COLORS,
    scalar: 0.8,
  })
}

/** Veliki kaskada — kraj lekcije ili velika prekretnica */
export function celebrateBig() {
  // Levi i desni burst
  const duration = 1500
  const end = Date.now() + duration

  function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
    })
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()

  // Centralni veliki burst
  confetti({
    particleCount: 120,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.5 },
    colors: COLORS,
  })
}

/** Kratki "ding" zvuk preko Web Audio API — bez fajlova */
export function playDing() {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15) // E6 — uplift

    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // ignore — neki brauzeri blokiraju AudioContext bez user gesture
  }
}

/** Lesson completion — kombinacija */
export function celebrateLessonComplete() {
  celebrateBig()
  playDing()
}

/**
 * Definicija achievement-a (značke). Računaju se na klijentskoj strani
 * iz `progress stats` odgovora — bez dodatne DB tabele za sada.
 *
 * Svaki ima `check(stats) => { unlocked, progress }` koji vraća:
 *   - `unlocked`: true ako je već zaradjen
 *   - `progress`: 0..1 koliko je blizu (za zaključane)
 */

export type AchievementStats = {
  streak: number
  bestStreak: number
  lessonsCompleted: number
  totalLessons: number
  exercisesSolved: number
  activeDays: number
}

export type Achievement = {
  id: string
  title: string
  desc: string
  emoji: string
  /** Boja zaključanog/otključanog stanja */
  color: 'primary' | 'secondary' | 'gold' | 'fire'
  check: (s: AchievementStats) => { unlocked: boolean; progress: number; current: number; target: number }
}

function progressOf(current: number, target: number) {
  return Math.min(1, target > 0 ? current / target : 0)
}

export const ACHIEVEMENTS: Achievement[] = [
  /* ───────── Lekcije ───────── */
  {
    id: 'first_lesson',
    title: 'Prva lekcija',
    desc: 'Završi prvu lekciju',
    emoji: '🎯',
    color: 'primary',
    check: (s) => ({
      unlocked: s.lessonsCompleted >= 1,
      progress: progressOf(s.lessonsCompleted, 1),
      current: s.lessonsCompleted,
      target: 1,
    }),
  },
  {
    id: 'five_lessons',
    title: 'Solidan start',
    desc: 'Završi 5 lekcija',
    emoji: '🌱',
    color: 'primary',
    check: (s) => ({
      unlocked: s.lessonsCompleted >= 5,
      progress: progressOf(s.lessonsCompleted, 5),
      current: s.lessonsCompleted,
      target: 5,
    }),
  },
  {
    id: 'ten_lessons',
    title: 'Posvećena',
    desc: 'Završi 10 lekcija',
    emoji: '📚',
    color: 'secondary',
    check: (s) => ({
      unlocked: s.lessonsCompleted >= 10,
      progress: progressOf(s.lessonsCompleted, 10),
      current: s.lessonsCompleted,
      target: 10,
    }),
  },
  {
    id: 'half_course',
    title: 'Pola puta',
    desc: 'Završi polovinu kursa',
    emoji: '⛰',
    color: 'secondary',
    check: (s) => {
      const half = Math.ceil(s.totalLessons / 2)
      return {
        unlocked: s.totalLessons > 0 && s.lessonsCompleted >= half,
        progress: progressOf(s.lessonsCompleted, half),
        current: s.lessonsCompleted,
        target: half,
      }
    },
  },
  {
    id: 'course_complete',
    title: 'Kraj kursa',
    desc: 'Završi sve lekcije',
    emoji: '🏁',
    color: 'gold',
    check: (s) => ({
      unlocked: s.totalLessons > 0 && s.lessonsCompleted >= s.totalLessons,
      progress: progressOf(s.lessonsCompleted, s.totalLessons),
      current: s.lessonsCompleted,
      target: s.totalLessons,
    }),
  },

  /* ───────── Streak ───────── */
  {
    id: 'streak_3',
    title: 'Tri u nizu',
    desc: '3 dana zaredom',
    emoji: '🔥',
    color: 'fire',
    check: (s) => ({
      unlocked: s.bestStreak >= 3,
      progress: progressOf(s.bestStreak, 3),
      current: s.bestStreak,
      target: 3,
    }),
  },
  {
    id: 'streak_7',
    title: 'Nedelja',
    desc: '7 dana zaredom',
    emoji: '🔥',
    color: 'fire',
    check: (s) => ({
      unlocked: s.bestStreak >= 7,
      progress: progressOf(s.bestStreak, 7),
      current: s.bestStreak,
      target: 7,
    }),
  },
  {
    id: 'streak_30',
    title: 'Mesec dana',
    desc: '30 dana zaredom',
    emoji: '💎',
    color: 'gold',
    check: (s) => ({
      unlocked: s.bestStreak >= 30,
      progress: progressOf(s.bestStreak, 30),
      current: s.bestStreak,
      target: 30,
    }),
  },

  /* ───────── Vežbe ───────── */
  {
    id: 'exercises_10',
    title: 'Vežba čini majstora',
    desc: '10 tačnih vežbi',
    emoji: '✎',
    color: 'primary',
    check: (s) => ({
      unlocked: s.exercisesSolved >= 10,
      progress: progressOf(s.exercisesSolved, 10),
      current: s.exercisesSolved,
      target: 10,
    }),
  },
  {
    id: 'exercises_50',
    title: 'Pola sto',
    desc: '50 tačnih vežbi',
    emoji: '🎓',
    color: 'secondary',
    check: (s) => ({
      unlocked: s.exercisesSolved >= 50,
      progress: progressOf(s.exercisesSolved, 50),
      current: s.exercisesSolved,
      target: 50,
    }),
  },
  {
    id: 'exercises_100',
    title: 'Stogodišnjak',
    desc: '100 tačnih vežbi',
    emoji: '🏆',
    color: 'gold',
    check: (s) => ({
      unlocked: s.exercisesSolved >= 100,
      progress: progressOf(s.exercisesSolved, 100),
      current: s.exercisesSolved,
      target: 100,
    }),
  },

  /* ───────── Aktivnost ───────── */
  {
    id: 'active_7',
    title: 'Stalna mušterija',
    desc: 'Aktivna 7 dana',
    emoji: '📅',
    color: 'primary',
    check: (s) => ({
      unlocked: s.activeDays >= 7,
      progress: progressOf(s.activeDays, 7),
      current: s.activeDays,
      target: 7,
    }),
  },
]

export function computeAchievements(stats: AchievementStats) {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    ...a.check(stats),
  }))
}

export const Role = {
  Student: 'student',
  Teacher: 'teacher',
  Admin: 'admin',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CEFR = (typeof CEFR)[number]

export const SubscriptionStatus = {
  Trialing: 'trialing',
  Active: 'active',
  PastDue: 'past_due',
  Canceled: 'canceled',
  Expired: 'expired',
} as const
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const ContentStatus = {
  Draft: 'draft',
  Published: 'published',
  Hidden: 'hidden',
} as const
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus]

export const LessonType = {
  Video: 'video',
  Text: 'text',
  Exercise: 'exercise',
} as const
export type LessonType = (typeof LessonType)[keyof typeof LessonType]

export const ExerciseType = {
  MultipleChoice: 'multiple_choice',
  FillBlank: 'fill_blank',
  Matching: 'matching',
  Ordering: 'ordering',
} as const
export type ExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType]

export const BookingStatus = {
  Confirmed: 'confirmed',
  Canceled: 'canceled',
  Completed: 'completed',
  NoShow: 'no_show',
} as const
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

export const SlotStatus = {
  Open: 'open',
  Booked: 'booked',
  Blocked: 'blocked',
} as const
export type SlotStatus = (typeof SlotStatus)[keyof typeof SlotStatus]

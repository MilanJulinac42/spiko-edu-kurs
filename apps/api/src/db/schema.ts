import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const id = () =>
  uuid('id').primaryKey().default(sql`gen_random_uuid()`)
const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

// ---------- USERS ----------
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('student'),
  nativeLanguage: text('native_language'),
  targetLevel: text('target_level'),
  goal: text('goal'),
  timezone: text('timezone'),
  createdAt: createdAt(),
})

// ---------- SUBSCRIPTIONS ----------
export const plans = pgTable('plans', {
  id: id(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('EUR'),
  interval: text('interval').notNull().default('month'),
  features: jsonb('features'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
})

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id').notNull().references(() => plans.id),
    status: text('status').notNull(),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    trialEnd: timestamp('trial_end', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    provider: text('provider'),
    providerSubscriptionId: text('provider_subscription_id'),
    createdAt: createdAt(),
  },
  (t) => ({
    userStatusIdx: uniqueIndex('subscriptions_user_status_idx').on(t.userId, t.status),
  }),
)

export const payments = pgTable('payments', {
  id: id(),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  providerPaymentId: text('provider_payment_id'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: createdAt(),
})

// ---------- COURSES ----------
export const courses = pgTable('courses', {
  id: id(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  level: text('level'),
  language: text('language'),
  thumbnailUrl: text('thumbnail_url'),
  status: text('status').notNull().default('draft'),
  position: integer('position').notNull().default(0),
  createdAt: createdAt(),
})

export const modules = pgTable('modules', {
  id: id(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: createdAt(),
})

export const lessons = pgTable('lessons', {
  id: id(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(),
  position: integer('position').notNull().default(0),
  status: text('status').notNull().default('draft'),
  content: jsonb('content'),
  videoId: text('video_id'),
  videoReady: boolean('video_ready').notNull().default(false),
  durationSeconds: integer('duration_seconds'),
  createdAt: createdAt(),
})

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    completed: boolean('completed').notNull().default(false),
    progressSeconds: integer('progress_seconds').notNull().default(0),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    userLessonUnique: uniqueIndex('lesson_progress_user_lesson_unique').on(t.userId, t.lessonId),
  }),
)

// ---------- EXERCISES ----------
export const exercises = pgTable('exercises', {
  id: id(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  position: integer('position').notNull().default(0),
  status: text('status').notNull().default('draft'),
  createdAt: createdAt(),
})

export const exerciseAttempts = pgTable('exercise_attempts', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  answers: jsonb('answers').notNull(),
  score: numeric('score'),
  isCorrect: boolean('is_correct'),
  attemptNumber: integer('attempt_number').notNull().default(1),
  createdAt: createdAt(),
})

// ---------- CONVERSATIONS ----------
export const teachers = pgTable('teachers', {
  id: id(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  languages: text('languages').array(),
  isActive: boolean('is_active').notNull().default(true),
  googleRefreshToken: text('google_refresh_token'),
  createdAt: createdAt(),
})

export const availabilitySlots = pgTable('availability_slots', {
  id: id(),
  teacherId: uuid('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('open'),
  createdAt: createdAt(),
})

export const bookings = pgTable('bookings', {
  id: id(),
  slotId: uuid('slot_id').notNull().references(() => availabilitySlots.id),
  studentId: uuid('student_id').notNull().references(() => profiles.id),
  teacherId: uuid('teacher_id').notNull().references(() => teachers.id),
  status: text('status').notNull().default('confirmed'),
  googleEventId: text('google_event_id'),
  meetLink: text('meet_link'),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  createdAt: createdAt(),
})

// ---------- SOCIAL ----------
export const comments = pgTable('comments', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  body: text('body').notNull(),
  status: text('status').notNull().default('visible'),
  createdAt: createdAt(),
})

export const ratings = pgTable(
  'ratings',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    reviewText: text('review_text'),
    status: text('status').notNull().default('visible'),
    createdAt: createdAt(),
  },
  (t) => ({
    userCourseUnique: uniqueIndex('ratings_user_course_unique').on(t.userId, t.courseId),
  }),
)

export const moderationFlags = pgTable('moderation_flags', {
  id: id(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reporterId: uuid('reporter_id').notNull().references(() => profiles.id),
  reason: text('reason'),
  status: text('status').notNull().default('open'),
  createdAt: createdAt(),
})

// ---------- AI ----------
export const aiConversations = pgTable('ai_conversations', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
})

export const aiMessages = pgTable('ai_messages', {
  id: id(),
  conversationId: uuid('conversation_id').notNull().references(() => aiConversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  tokensIn: integer('tokens_in').notNull().default(0),
  tokensOut: integer('tokens_out').notNull().default(0),
  createdAt: createdAt(),
})

export const aiUsage = pgTable(
  'ai_usage',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    period: date('period').notNull(),
    messageCount: integer('message_count').notNull().default(0),
    tokensUsed: integer('tokens_used').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => ({
    userPeriodUnique: uniqueIndex('ai_usage_user_period_unique').on(t.userId, t.period),
  }),
)

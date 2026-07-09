/**
 * Imperative toast API — pozivaš `toast.success(...)`, `toast.error(...)`, itd.
 * iz bilo koje komponente. Ekran ima jedan `<ToastRoot />` koji prati store.
 */

export type ToastKind = 'success' | 'error' | 'info' | 'loading'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type Toast = {
  id: string
  kind: ToastKind
  title: string
  description?: string
  action?: ToastAction
  /** ms do auto-dismiss. 0 ili Infinity = ne nestaje sam */
  duration: number
  createdAt: number
}

const listeners = new Set<() => void>()
let toasts: Toast[] = []

function emit() {
  for (const l of listeners) l()
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): Toast[] {
  return toasts
}

let counter = 0
function nextId(): string {
  counter += 1
  return `t${Date.now().toString(36)}-${counter}`
}

function push(t: Omit<Toast, 'id' | 'createdAt'>): string {
  const id = nextId()
  const toast: Toast = { ...t, id, createdAt: Date.now() }
  toasts = [...toasts, toast]
  emit()
  return id
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function dismissAll() {
  toasts = []
  emit()
}

type ToastOpts = {
  description?: string
  action?: ToastAction
  duration?: number
}

export const toast = {
  success: (title: string, opts: ToastOpts = {}) =>
    push({
      kind: 'success',
      title,
      description: opts.description,
      action: opts.action,
      duration: opts.duration ?? 4000,
    }),
  error: (title: string, opts: ToastOpts = {}) =>
    push({
      kind: 'error',
      title,
      description: opts.description,
      action: opts.action,
      duration: opts.duration ?? 6500,
    }),
  info: (title: string, opts: ToastOpts = {}) =>
    push({
      kind: 'info',
      title,
      description: opts.description,
      action: opts.action,
      duration: opts.duration ?? 4500,
    }),
  loading: (title: string, opts: ToastOpts = {}) =>
    push({
      kind: 'loading',
      title,
      description: opts.description,
      duration: opts.duration ?? Infinity,
    }),
  dismiss: dismissToast,
  dismissAll,
}

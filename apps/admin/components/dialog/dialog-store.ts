/**
 * Imperative dialog API — pozivaš `promptDialog(...)` ili `confirmDialog(...)` iz
 * bilo koje komponente i dobiješ Promise koji se rešava kad korisnik zatvori dialog.
 *
 * Single source of truth: ekran ima jedan `<DialogRoot />` koji prati ovaj store
 * i renderuje aktivni dialog.
 */

export type PromptOptions = {
  title: string
  label?: string
  placeholder?: string
  initialValue?: string
  okLabel?: string
  cancelLabel?: string
  /**
   * Vrati string za poruku o grešci, ili null ako je vrednost validna.
   */
  validate?: (value: string) => string | null
}

export type ConfirmOptions = {
  title: string
  message?: string
  okLabel?: string
  cancelLabel?: string
  /** "danger" prikazuje crveni OK button (destruktivne radnje) */
  tone?: 'primary' | 'danger'
}

type ActiveDialog =
  | {
      kind: 'prompt'
      opts: PromptOptions
      resolve: (value: string | null) => void
    }
  | {
      kind: 'confirm'
      opts: ConfirmOptions
      resolve: (value: boolean) => void
    }

let activeDialog: ActiveDialog | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getActive(): ActiveDialog | null {
  return activeDialog
}

export function promptDialog(opts: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    activeDialog = { kind: 'prompt', opts, resolve }
    emit()
  })
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    activeDialog = { kind: 'confirm', opts, resolve }
    emit()
  })
}

export function closeActive(result: string | boolean | null) {
  if (!activeDialog) return
  const cur = activeDialog
  activeDialog = null
  emit()
  if (cur.kind === 'prompt') {
    cur.resolve(typeof result === 'string' ? result : null)
  } else {
    cur.resolve(result === true)
  }
}

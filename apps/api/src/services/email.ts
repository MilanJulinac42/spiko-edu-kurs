import { env } from '../env'

/**
 * Stub transakcionog emaila. Zameniti provajderom (Resend/Postmark) preko EMAIL_API_KEY.
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}) {
  if (!env.EMAIL_API_KEY) {
    console.warn('[email] EMAIL_API_KEY not set, skipping send', opts.subject)
    return { id: 'noop' }
  }
  // TODO: provider integracija
  console.log('[email] send', opts.to, opts.subject)
  return { id: 'noop' }
}

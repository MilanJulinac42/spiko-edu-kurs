/**
 * Podaci o trgovcu (merchant) — jedno mesto za sve pravne stranice i footer.
 *
 * ⚠️ POPUNI PRE GO-LIVE: vrednosti u [ZAGRADAMA] su placeholder-i. Kad Spiko
 * dobije zvanične podatke (registracija firme + Raiffeisen merchant nalog),
 * zameni ih ovde — sve stranice se automatski ažuriraju.
 *
 * Raiffeisen merchant + srpski zakon (Zakon o zaštiti potrošača, ZZPL)
 * zahtevaju da identitet trgovca bude jasno vidljiv na sajtu.
 */
export const MERCHANT = {
  /** Pun poslovni naziv (kako je registrovan u APR-u) */
  legalName: '[PUN NAZIV FIRME]',
  /** Kraći / brand naziv koji korisnici vide */
  brandName: 'Spiko Edu',
  /** Poreski identifikacioni broj */
  pib: '[PIB]',
  /** Matični broj (APR) */
  registrationNumber: '[MATIČNI BROJ]',
  /** Adresa sedišta */
  address: 'Vase Stajića 2a/10, Bačka Palanka',
  /** Grad + poštanski broj */
  city: '21400 Bačka Palanka, Srbija',
  /** Tekući račun (za uplate / povraćaj) */
  bankAccount: '[TEKUĆI RAČUN]',
  /** Banka */
  bank: 'Raiffeisen banka a.d. Beograd',
  /** Kontakt email */
  email: 'spikoedu@gmail.com',
  /** Kontakt telefon */
  phone: '+381 62 9611743',
  /** Da li je trgovac u sistemu PDV-a — utiče na formulaciju cena */
  vatRegistered: null as boolean | null, // null = neutralna formulacija dok se ne odluči
  /** Valuta naplate — Raiffeisen naplaćuje u RSD */
  currency: 'RSD',
} as const

/** Podržane kartice na Raiffeisen gateway-u */
export const SUPPORTED_CARDS = ['Visa', 'Mastercard', 'Maestro', 'DinaCard'] as const

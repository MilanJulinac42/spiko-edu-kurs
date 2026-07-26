/**
 * Podaci o trgovcu (merchant) — jedno mesto za sve pravne stranice i footer.
 *
 * Zvanični podaci firme popunjeni (APR registracija). Preduzetnik koji vodi
 * poslovne knjige, VAN sistema PDV-a (vatRegistered=false) → cene ne sadrže PDV.
 *
 * Raiffeisen merchant + srpski zakon (Zakon o zaštiti potrošača, ZZPL)
 * zahtevaju da identitet trgovca bude jasno vidljiv na sajtu.
 */
export const MERCHANT = {
  /** Pun poslovni naziv (kako je registrovan u APR-u) */
  legalName: 'Ema Aliđukić PR Edukativni centar Spiko Bačka Palanka',
  /** Kraći / brand naziv koji korisnici vide */
  brandName: 'Spiko Edu',
  /** Pravna forma */
  legalForm: 'Preduzetnik',
  /** Osoba koja zastupa */
  representative: 'Ema Aliđukić',
  /** Poreski identifikacioni broj */
  pib: '115275004',
  /** Matični broj (APR) */
  registrationNumber: '68237190',
  /** Adresa sedišta */
  address: 'Vase Stajića 2a, Bačka Palanka',
  /** Grad + poštanski broj */
  city: '21400 Bačka Palanka, Srbija',
  /** Tekući račun (za uplate / povraćaj) */
  bankAccount: '265-1100310100163-66',
  /** Banka */
  bank: 'Raiffeisen banka a.d. Beograd',
  /** Kontakt email */
  email: 'spikoedu@gmail.com',
  /** Kontakt telefon */
  phone: '+381 62 9611743',
  /** Da li je trgovac u sistemu PDV-a — utiče na formulaciju cena */
  vatRegistered: false as boolean | null, // preduzetnik koji vodi knjige, van sistema PDV-a
  /** Valuta naplate — Raiffeisen naplaćuje u RSD */
  currency: 'RSD',
} as const

/** Podržane kartice na Raiffeisen gateway-u */
export const SUPPORTED_CARDS = ['Visa', 'Mastercard', 'Maestro', 'DinaCard'] as const

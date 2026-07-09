'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import { useEffect } from 'react'

/**
 * SWR konfiguracija za sve hookove u app-u.
 *
 * Strategija:
 * - `dedupingInterval: 5s` — isti zahtev pozvan iz više komponenti u 5s pravi 1 request
 * - `revalidateOnFocus: false` — ne refetchuj kad korisnik vrati tab (može da iznenadi)
 * - `revalidateOnReconnect: true` — kad se internet vrati, osveži
 * - `keepPreviousData: true` — pri promeni ključa (npr. drugi lessonId), zadrži stare
 *   podatke dok stignu novi (sprečava skeleton flicker između susednih lekcija)
 */
const defaults: SWRConfiguration = {
  dedupingInterval: 5_000,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  keepPreviousData: true,
}

// Eden vraća { data: T | { error: string }; error: ... } — generic da prihvatimo
type AnyEden = () => Promise<{ data: unknown; error: unknown }>

/**
 * Wrapper oko useSWR koji radi sa Eden klijent pozivima.
 * Eden vraća `{ data, error }`, mi to konvertujemo u SWR oblik.
 */
export function useApi<T>(
  key: string | null,
  fetcher: AnyEden,
  config?: SWRConfiguration,
) {
  const { data, error, isLoading, mutate } = useSWR<T | null>(
    key,
    async () => {
      const r = await fetcher()
      if (r.error) {
        const err = r.error as { value?: unknown; status?: number; message?: string }
        throw new Error(String(err.value ?? err.status ?? err.message ?? 'API error'))
      }
      return (r.data ?? null) as T | null
    },
    { ...defaults, ...config },
  )

  return { data: data ?? null, error, isLoading, mutate }
}

/**
 * Prefetch — koristi se na Link mouseenter da nagovesti SWR-u da učita podatke
 * pre nego što stignemo na stranicu.
 */
export function prefetch<T>(key: string, fetcher: AnyEden) {
  void key
  return fetcher().then((r) => (r.data ?? null) as T | null)
}

/**
 * Hook koji warm-uje SWR cache za dati key — koristi se kao "prefetch" sa stranice
 * koja predvidi navigaciju (npr. dashboard pretpostavlja da student ide na course).
 */
export function useWarmCache<T>(key: string | null, fetcher: AnyEden) {
  useEffect(() => {
    if (!key) return
    // Fire and forget — SWR će uhvatiti rezultat kad page render-uje
    fetcher().catch(() => { /* ignore prefetch errors */ })
  }, [key, fetcher])
}

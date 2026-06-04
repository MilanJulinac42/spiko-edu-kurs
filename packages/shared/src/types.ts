import type { Role } from './enums'

export type AuthUser = {
  id: string
  email: string | null
  role: Role
}

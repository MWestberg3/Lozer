/** Comma-separated in `.env` as VITE_ALLOWED_EMAILS — keep firestore.rules in sync. */
const fromEnv = import.meta.env.VITE_ALLOWED_EMAILS as string | undefined

export const ALLOWED_EMAILS: readonly string[] = (fromEnv ?? 'mwestberg3@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function isAllowlistedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase())
}

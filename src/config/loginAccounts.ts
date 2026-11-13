/** Emails must match Firebase Auth users and firestore.rules allowlist. */
export const LOGIN_ACCOUNTS = [
  {
    email: 'mwestberg3@gmail.com',
    displayName: 'Michael',
    password: import.meta.env.VITE_MICHAEL_PASSWORD as string | undefined,
  },
  {
    email: 'hirschibreanna@gmail.com',
    displayName: 'Breanna',
    password: import.meta.env.VITE_BREANNA_PASSWORD as string | undefined,
  },
] as const

export function accountForPassword(entered: string) {
  const trimmed = entered.trim()
  if (!trimmed) return null
  return LOGIN_ACCOUNTS.find((account) => account.password && account.password === trimmed) ?? null
}

import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { accountForPassword } from '../config/loginAccounts'
import { isAllowlistedEmail } from '../config/allowedEmails'
import { auth } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  accessDenied: boolean
  signInWithAppPassword: (password: string) => Promise<void>
  signOutUser: () => Promise<void>
  clearAccessDenied: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    void setPersistence(auth, browserLocalPersistence)
    return onAuthStateChanged(auth, async (next) => {
      if (next && !isAllowlistedEmail(next.email)) {
        setAccessDenied(true)
        setUser(null)
        await signOut(auth)
        setLoading(false)
        return
      }
      setAccessDenied(false)
      setUser(next)
      setLoading(false)
    })
  }, [])

  const clearAccessDenied = useCallback(() => setAccessDenied(false), [])

  const signInWithAppPassword = useCallback(async (password: string) => {
    setAccessDenied(false)
    const account = accountForPassword(password)
    if (!account) {
      throw new Error('invalid-password')
    }
    if (!account.password) {
      throw new Error('missing-config')
    }
    await signInWithEmailAndPassword(auth, account.email, account.password)
  }, [])

  const signOutUser = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, loading, accessDenied, signInWithAppPassword, signOutUser, clearAccessDenied }),
    [user, loading, accessDenied, signInWithAppPassword, signOutUser, clearAccessDenied],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

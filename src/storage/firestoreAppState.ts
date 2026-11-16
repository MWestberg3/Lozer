import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AppState } from '../types/workout'

const DOC_PATH = (uid: string) => doc(db, 'users', uid, 'app', 'state')

export type RemoteAppPayload = AppState & { _syncedAt: string }

export async function fetchRemoteAppState(uid: string): Promise<RemoteAppPayload | null> {
  const snap = await getDoc(DOC_PATH(uid))
  if (!snap.exists()) return null
  const data = snap.data() as RemoteAppPayload
  if (data.version !== 1 || !data.profile) return null
  return data
}

export async function writeRemoteAppState(uid: string, state: AppState, syncedAt: string): Promise<void> {
  const payload: RemoteAppPayload = {
    ...JSON.parse(JSON.stringify(state)) as AppState,
    _syncedAt: syncedAt,
  }
  await setDoc(DOC_PATH(uid), payload)
}
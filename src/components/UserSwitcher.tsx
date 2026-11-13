import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

export function UserSwitcher() {
  const { user } = useAuth()
  const { activeUser, renameUser } = useApp()
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')

  const photo = user?.photoURL
  const googleName = user?.displayName ?? user?.email ?? 'Signed in'

  const startEdit = () => {
    setEditing(true)
    setDraftName(activeUser.displayName)
  }

  const saveName = () => {
    if (draftName.trim()) {
      renameUser(draftName.trim())
    }
    setEditing(false)
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {photo ? (
          <img
            src={photo}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: 12, objectFit: 'cover' }}
          />
        ) : (
          <span className="profile-pick-avatar" style={{ width: 40, height: 40, fontSize: '1rem' }} aria-hidden>
            {googleName.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <div className="user-display-name">{activeUser.displayName}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{googleName}</div>
        </div>
      </div>
      {editing ? (
        <div className="card" style={{ marginTop: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--muted)' }}>
            Display name in app
          </label>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={saveName}>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost btn-small" style={{ marginTop: '0.75rem' }} onClick={startEdit}>
          Edit display name
        </button>
      )}
    </div>
  )
}

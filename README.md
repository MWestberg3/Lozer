# Lozer

Mobile-first PWA for workout plans and progress tracking (two local profiles via `localStorage`).

- **Live site:** https://mwestberg3.github.io/Lozer/
- **Stack:** React + TypeScript + Vite + `vite-plugin-pwa`

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (project routes use `/Lozer/` in production; dev uses the same base path).

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml`. In the repo **Settings → Pages**, set **Build and deployment** source to **GitHub Actions** (one-time).

Add GitHub **repository secrets** matching `.env.example` (`VITE_FIREBASE_*`) so production builds include Firebase config.

## Auth

Password login (no Google 2FA):

1. Firebase Console → **Authentication** → enable **Email/Password** (not “Email link”).
2. **Users** tab → **Add user** for `mwestberg3@gmail.com` and `hirschibreanna@gmail.com` with passwords you choose.
3. Set the same passwords in `.env.local` as `VITE_MICHAEL_PASSWORD` and `VITE_BREANNA_PASSWORD` (and GitHub Actions secrets for deploy).
4. The app only asks for a password; whichever one matches decides who is signed in.

**Note:** Those env values are embedded in the built JS. Fine for a private two-person app, not for high-security data.

**Invite-only:** `firestore.rules` + `VITE_ALLOWED_EMAILS` still restrict the two emails.

## Data model

- `user1` and `user2` each have their own display name, session history, and progress charts.
- All data stays in the browser (`localStorage` key `lozer_app_v1`).

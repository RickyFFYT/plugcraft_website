# Plugcraft Web (starter)

This workspace contains a Next.js + TypeScript starter scaffold for Plugcraft - the portal for the Ghosted application.

What is included:
- Supabase client in `lib/supabase.ts`
- Auth helpers using `@supabase/supabase-js` and `@supabase/auth-helpers-react` (client session provider in `_app.tsx`).
- Pages: `index`, `signup`, `login`, `verify-success`, `dashboard`, `admin`.
- API route `pages/api/download.ts` that issues signed URLs for releases using the Supabase service role key.

Environment variables (copy `.env.example` to `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

After editing environment variables, restart the Next.js dev server so changes take effect.

Start the dev server:

```powershell
npm install
npm run dev
```

Notes:
- You should create the `profiles`, `usage`, and `releases` tables in your Supabase project and configure RLS policies before using the dashboard functionality.
- The API route `api/download` uses the service role key and should only be used server-side; ensure it's protected in production.
- New: usage window enforcement
  - The DB exposes a stored procedure `public.record_session(p_user_id, p_start, p_end, p_duration_seconds)` responsible for recording user sessions and maintaining the rolling usage window (`usage_windows`).
  - The `record_session` function now prunes old `usage_sessions` and `usage_events` older than the configured window_seconds for the user (default 18000 seconds / 5 hours) when a window expires, ensuring totals reset after the window elapses.
  - To record play sessions, use the server-side RPC: either call the DB RPC directly from a trusted server using the service role key OR use the protected API route `pages/api/record-session` which validates a user's bearer token and forwards the RPC call using the service role key.
  - Do NOT modify `usage_windows` directly from client code; always use `record_session` or call `pages/api/record-session` so pruning and reset logic are applied consistently.
- Run `npm run build` before deploying to ensure the application compiles for production.

Upgrade notes:
- This project was upgraded to Next.js 15.x in package.json. After pulling these changes, run:

```powershell
npm install
```

- If you observe backdrop-filter / blur issues in development, try running the dev server with the webpack-based dev server instead of Turbopack or use the environment flag to disable Turbopack for dev to avoid certain dev-time rendering bugs:

```powershell
npm run dev -- --turbo=false
```

Or set the environment variable when launching dev server:

```powershell
set NEXT_PRIVATE_TURBOPACK=false; npm run dev
```

Note: In production (`npm run build && npm start`) Turbopack is not used; always test in a full production build if you need to validate visual rendering.

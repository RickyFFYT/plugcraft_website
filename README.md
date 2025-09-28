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
- Run `npm run build` before deploying to ensure the application compiles for production.

# Copilot instructions for Plugcraft Web

Purpose: give AI coding agents the essential, actionable knowledge to be productive in this Next.js + TypeScript site.

Quick summary
- Tech: Next.js (pages router), TypeScript, Tailwind, Supabase (auth + storage), Next/Image for assets.
- Key files: `lib/supabase.ts`, `pages/_app.tsx`, `pages/api/download.ts`, `components/Layout.tsx`, `components/AuthForm.tsx`, `components/ProtectedRoute.tsx`, `styles/globals.css`, `public/assets/` and `assets/`.
- Dev commands: `npm install`, `npm run dev` (dev server with HMR), `npm run build` (production build). Restart the dev server after changing env vars.

Big-picture architecture notes
- This repo is a small server-rendered Next.js app (pages directory). Most UI is client driven; authentication is handled client-side with `@supabase/auth-helpers-react`.
- `lib/supabase.ts` exports a client built with public anon keys for browser use. Server-only operations must create a new Supabase client inside API routes using the service role key (see `pages/api/download.ts`). Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Global layout is provided by `components/Layout.tsx`. Pages opt out by setting `Component.usePlainLayout = true` in `_app.tsx`.
- Protected UI uses `useUser()` to detect auth state and `components/ProtectedRoute.tsx` to redirect unauthorized users to `/login`.
- Data model implied by code: tables `profiles`, `usage`, and `releases`. `pages/api/download.ts` expects those tables and enforces quota and disabled-account checks.

Patterns & conventions to follow
- Authentication: use `useUser()` from `@supabase/auth-helpers-react` in components/pages that need user context. For server-side validation inside APIs use `supabaseAdmin.auth.getUser(token)` after creating a `createClient` with `SUPABASE_SERVICE_ROLE_KEY`.
- Server-only Supabase clients: always construct them inside API routes or getServerSideProps with `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)` and never use service keys client-side.
- API pattern: check HTTP method first, then validate bearer token (if required), then perform DB lookups and return JSON. Refer to `pages/api/download.ts` for a complete example (token validation, profile lookup, quota enforcement, recording usage, signed URL creation).
- Images: use `next/image`. When CSS adjusts image dimensions (e.g. `w-full`), include `style={{ width: 'auto', height: 'auto' }}` or ensure both width and height are consistently specified to avoid hydration warnings and aspect-ratio issues.
- Layouts: wrap pages with `Layout` by default. To create a page without the layout, set `export default function Page() { ... }` and add `Page.usePlainLayout = true` in that page file.
- Header & menus: `components/Layout.tsx` manages header scrolled state and dropdown/mobile menus using `menuOpen` and `mobileOpen`. Mobile menu toggles body scrolling via `document.body.style.overflow`. When modifying header behavior, check `styles/globals.css` for `.site-header` and `.dropdown-menu` styles.

Developer workflows & debugging
- Run locally: `npm install` then `npm run dev`. HMR is enabled; use React DevTools when developing UI.
- Environment changes: after editing `.env.local`, restart `npm run dev` so `lib/supabase.ts` re-evaluates required vars.
- Linting & CSS: Tailwind directives live in `styles/globals.css` (top contains Tailwind `@tailwind base; @tailwind components; @tailwind utilities;`). The project includes custom utilities (`.glass-card`, `.glass-panel`) — use these for consistent UI.
- Common console warnings to watch for: Next/Image warns when width/height are changed by CSS or when `priority`/`fetchPriority` is misused. Follow the Image guidance in this repo (use explicit width/height or inline style to preserve aspect ratio).

Security & operational notes
- The server route `pages/api/download.ts` uses `SUPABASE_SERVICE_ROLE_KEY` and issues signed storage URLs. Keep this key secret and only use it server-side.
- The API enforces quotas and disabled flags by checking `profiles` and `usage` tables. When adding new server endpoints that charge usage or count downloads, follow the same pattern: validate user → check profile → record usage → perform operation.
- RLS (Row Level Security) expectation: this app expects RLS policies on `profiles`, `usage`, and `releases` tables configured appropriately. If you modify DB-related code, check RLS behavior in your Supabase project.

How to make a safe change (example checklist)
1. Update TypeScript code in a feature branch.
2. Run `npm run dev` and check the browser for runtime warnings (esp. Next/Image and auth flows).
3. If changing server/API behavior, add/modify tests or manually exercise endpoints with curl/postman using valid Authorization header tokens.
4. When touching styles that affect `.site-header`/`.dropdown-menu`, verify dropdown is not clipped (CSS `overflow` and z-indexs are important).

Where to look for examples
- Auth flow and signup/login: `components/AuthForm.tsx` and `pages/signup.tsx`, `pages/login.tsx`.
- Server-only Supabase usage: `pages/api/download.ts` (token validation, quota checks, createSignedUrl).
- Layout & header interactions: `components/Layout.tsx` and `styles/globals.css`.

If something is missing or unclear
- Ask the repository owner for examples of database schema (DDL) or the `.env.example` contents (the README mentions the env keys). If you need exact RLS policies or the schema for `profiles`, `usage`, and `releases`, request it before changing API logic.

If you modify this file
- Merge intelligently: preserve any manual adjustments in future edits; keep this file focused on executable knowledge (do not add long policy or design documents).

---
Feedback requested: Are there any repeating tasks or safety checks you'd like the agent to enforce automatically (for example: always check for `SUPABASE_SERVICE_ROLE_KEY` usage in new API routes, or always add the `style` fix for Next/Image where CSS width/height are used)? Reply with preferences to iterate.

\- Usage window enforcement: There is a DB RPC `public.record_session(p_user_id, p_start, p_end, p_duration_seconds)` that records a session in `usage_sessions`, updates `usage_windows`, and prunes old `usage_sessions` and `usage_events` older than a user's `window_seconds` (default 18000s). Always call this RPC (server-side) rather than modifying `usage_windows` directly. See `pages/api/record-session.ts` for a protected server-side example.
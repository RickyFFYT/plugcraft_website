# Plugcraft — Product Requirements Document (PRD)

## 1. Overview
Plugcraft is the marketing and account portal website for Ghosted (desktop software). The site lets users create and log into accounts (via Supabase), verify their email on login from unknown devices, view/download the Ghosted app, and monitor their usage limits/quotas.

Primary audience:
- End users who need to download Ghosted and manage their account and usage.

Key constraints:
- Use Supabase for authentication, database, and storage.
- Email verification required on login from unknown devices; verified users can access dashboard and download.
- Users must be able to see their usage limit (quota) on a dashboard.
- Secure, signed download links for the software artifacts.

Success metrics:
- Successful signup → login (with verification if unknown device) → first download completion.
- Time to onboard: target < 3 minutes from signup to download.
- User actions completed without errors (download, quota check).

---

## 2. Goals & Non-goals
**Goals:**
- Allow new users to create an account, log in (with device-based verification), and download Ghosted.
- Show each user their current usage limit and usage history.
- Implement secure downloads (signed URLs) and quota enforcement.

**Non-goals:**
- In-app licensing/DRM beyond signed download links.
- Complex billing integration (out of scope for MVP).
- Multi-tenant or enterprise SSO (optional future work).
- Admin or operator management features.

---

## 3. High-level user journeys

1) New user signup and login
- User navigates to Plugcraft.
- Clicks "Create account".
- Fills email/password and optional name.
- Account created; user can log in immediately.
- On login, if from an unknown device, Supabase sends verification email.
- User clicks verification link → redirected to dashboard.
- User can then download Ghosted.

2) Returning user login & download
- User logs in via email/password or magic link.
- If from an unknown device, verification email sent; user must click link to proceed.
- On successful login/verification, user lands on their dashboard showing usage limit/quota, usage history, and a "Download Ghosted" CTA.
- Clicking download generates/returns a signed URL from Supabase Storage (or backend) and triggers download.

---

## 4. Functional requirements (detailed)

4.1 Authentication & Verification
- Users can create accounts with email + password.
- Supabase handles auth; enable device-based email verification on login.
- On login from an unknown device (tracked via session or device fingerprint), send verification email.
- After clicking verification link, user is redirected to dashboard.
- Users must verify on unknown devices before accessing dashboard/download. No override needed.
- Sessions should be secure; implement refresh tokens and session timeout (Supabase default recommended).

4.2 User Dashboard
- Show user profile (email, name, verified status).
- Show usage limit: numeric display and percentage used.
- Show recent usage records (time/date, amount).
- Provide Download button for current stable release.
- Provide link to manage account (change password, logout).

4.3 Usage tracking & enforcement
- Track user usage in a `usage` table; increment on relevant events (e.g., downloads, API calls).
- Enforce usage limit: if user exceeds limit, grey out download button and show instructions or contact support.

4.5 Downloads
- Store binaries in Supabase Storage bucket (private).
- Generate time-limited signed URLs for downloads.
- Optionally, use a backend function to further validate quotas before issuing signed URL.

4.6 Security & Compliance
- Use HTTPS everywhere.
- Protect authenticated pages with client/server checks.
- Use RLS policies on Supabase tables to restrict access to user's own data.
- Do not expose storage public URLs for private assets.

---

## 5. Data model (Supabase-focused)

Contract (inputs/outputs, error modes):
- Input: Signup request {email, password, name?}
- Output: Supabase user record; login possible immediately.
- Errors: Duplicate email, invalid email, weak password, rate limiting.

Existing tables (no new creation needed):
- users: Uses Supabase Auth primary users table.
- profiles (linked to auth.users via id): id (uuid) PK, user_id (auth.users.id), full_name, quota_limit (int), created_at, updated_at
- usage: id (uuid), profile_id (fk), type (enum: download, api_call), amount (int), created_at, meta jsonb
- releases: id, filename, version, channel (stable/beta), storage_path, uploaded_at, notes

RLS policies: Ensure existing policies restrict access to user's own data (e.g., profiles: select/update only where profile.user_id = auth.uid(); usage: select/insert only by owner). Verify and adjust if needed for security.

---

## 6. Supabase configuration & implementation notes

6.1 Supabase Auth
- Enable Email/Password provider.
- Turn on "Confirm email" setting for login verification on unknown devices.
- Configure Site URL / Redirect URLs to include dashboard path after verification (e.g., https://plugcraft.example.com/dashboard).
- Use Supabase client on frontend for signup/login and server functions for sensitive ops.

6.2 Storage & Signed URLs
- Use existing private bucket `releases`.
- Fetch release metadata from existing `releases` table.
- On download request, call Supabase Storage createSignedUrl or issue a signed URL from serverless function that checks quota.

6.3 Functions (optional)
- Create edge function (Supabase Functions or serverless) to:
  - Validate user quota before returning signed URL.
  - Increment usage atomically when download begins (or after).

6.4 Email verification redirect
- In Supabase Auth settings, set the email redirect to:
  - https://plugcraft.example.com/dashboard?verified=true
- Implement a frontend route `/dashboard` that checks verification status and displays dashboard. Supabase verification will confirm login automatically.

---

## 7. Pages & UI components

7.1 Public pages
- Home / marketing page: marketing copy, CTA to sign up, link to Download (if logged in).
- Pricing / Features (optional)
- Login page: email/password, magic link option; triggers verification if unknown device.
- Signup page: form, password strength, TOS checkbox (if required).
- Download page: show latest release info and Download button (authenticated).
- Support / Contact

7.2 Authenticated user pages
- Dashboard: profile card, usage limit + progress bar, recent usage events, Download button.
- Account settings: change password/email, logout.

7.4 Components
- AuthForm, ProtectedRoute, UsageCard, ReleaseList, ModalConfirm, NotificationToast.

---

## 8. Implementation plan — step-by-step tasks (MVP)

I'll break this into a sequence of tasks suitable for sprints. Each task is small and actionable.

Sprint 0 — Setup (1 day)
- Create repo and basic project scaffold (recommended: Next.js with React + TypeScript).
- Add Supabase client and environment config.
- Connect to existing Supabase project; verify auth settings (email confirm on login for unknown devices, redirect URL). No new DB schema needed.

Sprint 1 — Auth & Basic UX (2–3 days)
- Implement signup and login pages using Supabase Auth.
- Verify email flow on login: ensure redirect to `/dashboard` after verification.
- Implement protected routes and basic dashboard shell.

Sprint 2 — Profile & Usage (2 days)
- Fetch and display user profiles, quota, and usage from existing tables (mock data first if needed for testing).
- Implement server function to log download events in existing `usage` table.

Sprint 3 — Releases & Downloads (2 days)
- Fetch releases from existing Supabase Storage `releases` private bucket and `releases` table.
- Implement signed URL generation (via server function or Supabase client) on download.
- Enforce quota check before issuing signed URL using existing data.

Sprint 4 — QA, Tests & Deployment (2–3 days)
- Write unit tests for auth flows and RLS policies (verify existing policies).
- Add e2e tests for signup → login (verify if unknown) → download.
- CI pipeline: test/build/deploy to Vercel/Netlify; configure Supabase env vars.

Total MVP estimate: 6–9 working days.

---

## 9. Acceptance criteria (per feature)

Signup & login
- When a new user signs up, they can log in immediately.
- On login from an unknown device, user receives a verification email.
- Clicking the email verification link redirects to `/dashboard` and allows access.
- Verified users can download.

Login & session
- Users can log in and sessions persist per Supabase defaults.
- Protected pages redirect unauthenticated users to login; unknown devices require verification.

Download & quota
- Downloads require an authenticated user (verified on unknown devices).
- If the user is over quota, download is blocked with a clear message.
- Signed URLs expire after configurable TTL (e.g., 1 hour).

Security
- No private storage buckets are publicly accessible.
- RLS policies prevent unauthorized data access.

---

## 10. Edge cases & considerations

- Email not received: provide "resend verification email" flow on login.
- User clicks verification link on a different device/browser: ensure session-less verification works (Supabase handles this).
- Quota race conditions: enforce updates/usage increment using DB transactions or server functions.
- Large release files: use resumable uploads or enforce size limits; consider CDN for hosting large binaries (Out of scope MVP).
- Account deletion: follow a retention policy and anonymize/delete user data.

---

## 11. Security checklist
- Enforce HTTPS and HSTS.
- Use RLS policies on Supabase for profiles and usage tables.
- Sign and TTL protect storage URLs.
- Sanitize any uploaded metadata.
- Monitor for suspicious activity.

---

## 12. QA & tests
- Unit tests for signup/login components and Supabase client wrappers.
- Integration tests for verification redirect and profile creation (mock Supabase or use test project).
- E2E tests (Cypress/Playwright) for:
  - Signup → Login (verify if unknown) → Download.
- RLS tests: verify data cannot be accessed across users.

---

## 13. Deployment & CI/CD
- Frontend: deploy to Vercel or Netlify; set environment variables for Supabase URL and ANON key (only for client operations).
- Backend (functions): Supabase Edge Functions or Vercel serverless endpoints for signed URL logic and quota checks.
- CI: Run tests, build, and deploy on push to main.
- Secrets: store Supabase service_role key only in server environment for server functions; never expose it to clients.

---

## 14. Implementation timeline & estimates (recap)
- Setup & config: 1 day
- Auth & verification flow: 2–3 days
- Profile & usage UI + tracking: 2 days
- Releases & download flow: 2 days
- QA & deploy: 2–3 days
Total: ~6–9 days (MVP)

---

## 15. "How to implement" quick checklist (developer steps)
- [ ] Connect to existing Supabase project; verify Email/Password provider and redirect URL for login verification.
- [ ] Verify existing `profiles`, `usage`, `releases` tables and RLS policies.
- [ ] Scaffold frontend (Next.js + TypeScript recommended), install `@supabase/supabase-js`.
- [ ] Implement signup/login with Supabase client.
- [ ] Implement `/dashboard` page to show after login/verification.
- [ ] Implement protected user dashboard showing quota and download button (fetch from existing data).
- [ ] Implement server function to return signed URL after quota check (using existing data).
- [ ] Add tests, CI, and deploy.

---

## 16. Deliverables
- Full PRD (this document in Markdown).
- Step-by-step implementation tasks for the development team (see checklists and sprint plan).
- Example frontend and server flow snippets (available on request; focus on fetching existing data).

---

## Next steps
If you'd like, I can now:
- Create wireframes and user flows for pages (todo #2).
- Create a starter Next.js + TypeScript scaffold with Supabase integration (I can generate code and run quick tests; include data fetching from existing tables).

Tell me which of the above you'd like me to do next and I'll start the next todo.

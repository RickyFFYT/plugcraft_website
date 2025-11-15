# Auth Redirect Configuration

## Problem
Email verification and magic links were not redirecting to the correct domain when users clicked them. The app needed to work on both production (`plugcraft.online`) and testing servers.

## Solution
Added environment-based redirect URL configuration using `NEXT_PUBLIC_SITE_URL`.

## Setup

### 1. Environment Variables
Add this to your `.env` file:
```bash
NEXT_PUBLIC_SITE_URL=https://plugcraft.online  # For production
# OR
NEXT_PUBLIC_SITE_URL=http://localhost:3000     # For local development
```

### 2. Supabase Dashboard Configuration
In your Supabase project dashboard, go to **Authentication > URL Configuration** and add these redirect URLs:

**Production:**
- `https://plugcraft.online/verify`
- `https://plugcraft.online/verify?method=magic`
- `https://plugcraft.online/verify?method=confirm`
- `https://plugcraft.online/verify?method=device&device_id=*&token=*`

**Local Development:**
- `http://localhost:3000/verify`
- `http://localhost:3000/verify?method=magic`
- `http://localhost:3000/verify?method=confirm`
- `http://localhost:3000/verify?method=device&device_id=*&token=*`

### 3. Deployment
For different environments, set `NEXT_PUBLIC_SITE_URL` accordingly:
- **Vercel/Netlify**: Set environment variable in dashboard
- **Docker**: Pass as environment variable
- **Local**: Use `.env.local` with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

## How It Works
- `lib/supabase.ts` exports `getAuthRedirectUrl()` that uses `NEXT_PUBLIC_SITE_URL`
- All auth flows (signup, login, magic links) use this function instead of `window.location.origin`
- Supabase emails contain links that redirect to the configured domain
- Works seamlessly across production and testing environments

## Testing
1. Set `NEXT_PUBLIC_SITE_URL` to your test domain
2. Update Supabase redirect URLs to include your test domain
3. Test signup, magic link login, and email verification
4. Verify users are redirected to the correct domain

## Troubleshooting: Emails linking to http://localhost:3000
If users report email verification or magic links redirecting to `http://localhost:3000`, check the following:

- Ensure `NEXT_PUBLIC_SITE_URL` is set in the deployment environment (Vercel/Netlify/Docker) to your production domain (e.g., `https://plugcraft.online`). The app will throw an error if started in production with `localhost` as the site URL.
- Confirm your Supabase project's Authentication > URL Configuration does not contain `http://localhost:3000` entries for production — replace them with your production domain.
- Verify that any code paths that cause Supabase to send links (sign up, invites, magic link calls) pass a redirect parameter (the app uses `getAuthRedirectUrl()` to compose the correct redirect). See `lib/supabase.ts` and `pages/*` for examples.
- If you are using Supabase Admin or server-side APIs to create users or send invites, ensure `redirectTo` is included in the options passed to the Admin API.

## Server-side rate limiting and audit log for auth flows
- Basic dev/test script: use the `scripts/test-auth-endpoints.js` script to validate the endpoints locally:

```bash
# Start dev server
npm run dev

# Run the quick endpoint tests
node scripts/test-auth-endpoints.js
```

The script will report HTTP status codes and responses from the `/api/auth/*` endpoints. If your local environment does not have supabase env variables configured, you may see errors from the Supabase API (these are expected in dev). 
To protect against abuse, the app now proxies auth flows through server endpoints which enforce rate limits and log attempts to an audit table.

- New server endpoints:
	- `POST /api/auth/signin` — proxy password sign-ins; enforces a 15-min window and per-email/IP thresholds.
	- `POST /api/auth/otp` — sends magic links & reset emails; enforces a 60-min window and per-email/IP thresholds.
	- `POST /api/auth/signup` — proxies signups to enforce rate limits.

- Database changes:
	- Added `auth_attempts` table via migrations to track sign-in, sign-up, and OTP events with timestamp, IP, user-agent, success flag, and optional metadata.

If you'd like stricter protection, we can add a server-side captcha (e.g., reCAPTCHA) on signup or integrate a centralized rate limiter using Redis for horizontally scaled deployments.
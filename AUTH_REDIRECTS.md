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
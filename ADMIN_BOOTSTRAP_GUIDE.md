# Admin Access Bootstrap Helper

This script grants admin access to your account in development mode.

## How to Use

1. **Start the dev server:**
   ```powershell
   cd c:\Users\Draco\Documents\coding\plugcraft_web\web
   npm run dev
   ```

2. **Log in** to your app with your account at `http://localhost:3000/login`

3. **Open browser DevTools** (F12) → Console tab

4. **Run this script** in the console:
   ```javascript
   (async () => {
     const session = await (await fetch('/api/auth/session')).json();
     const token = session?.access_token;
     if (!token) {
       // If using @supabase/auth-helpers-react, get token from storage
       const stored = JSON.parse(localStorage.getItem('sb-qhajzzrdvqyvdvfbspqo-auth-token') || '{}');
       const accessToken = stored?.access_token;
       if (!accessToken) {
         console.error('No access token found. Please log in first.');
         return;
       }
       const res = await fetch('/api/admin/bootstrap', {
         method: 'POST',
         headers: { Authorization: `Bearer ${accessToken}` }
       });
       const data = await res.json();
       console.log('Bootstrap result:', data);
       if (res.ok) {
         alert('Admin access granted! Refresh the page and navigate to /admin');
       } else {
         alert('Bootstrap failed: ' + JSON.stringify(data));
       }
     } else {
       const res = await fetch('/api/admin/bootstrap', {
         method: 'POST',
         headers: { Authorization: `Bearer ${token}` }
       });
       const data = await res.json();
       console.log('Bootstrap result:', data);
       if (res.ok) {
         alert('Admin access granted! Refresh the page and navigate to /admin');
       } else {
         alert('Bootstrap failed: ' + JSON.stringify(data));
       }
     }
   })();
   ```

5. **Refresh** the page and navigate to `/admin`

## Alternative: Manual SQL

If you prefer to grant admin access directly in Supabase SQL editor:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.admin_emails (email)
VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;

-- Find your user_id from auth.users and update your profile
UPDATE public.profiles
SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

## Security Note

The `/api/admin/bootstrap` endpoint is **disabled in production** for security. Use it only in development to set up your first admin, then use the admin panel UI to manage other admins.

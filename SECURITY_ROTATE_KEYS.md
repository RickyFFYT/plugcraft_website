Security: Supabase keys were found in the repository. You must rotate them immediately.

1) Log in to your Supabase project dashboard.
2) Go to Project Settings -> API.
3) Rotate the ANON and SERVICE_ROLE keys.
4) In GitHub, go to the repository settings -> Secrets -> Actions (or to Vercel), and update the environment variables with the new keys (use NEXT_PUBLIC_* for client-side anon key and SUPABASE_SERVICE_ROLE_KEY only for server/runtime secrets).
5) Revoke any keys that were leaked.

Important: .env.local was removed from the repository in this workspace. Do not commit secrets. Use Vercel Environment Variables for production.

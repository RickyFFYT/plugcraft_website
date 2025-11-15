// small test to verify lib/supabase production guard exports
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'production'

try {
  const { getAuthRedirectUrl } = require('../lib/supabase')
  console.log('lib/supabase loaded unexpectedly. getAuthRedirectUrl: ', getAuthRedirectUrl('/verify'))
} catch (err) {
  console.error('Expected error (production guard):', err?.message || err)
}

process.env.NEXT_PUBLIC_SITE_URL = 'https://plugcraft.online'
process.env.NODE_ENV = 'production'

try {
  const { getAuthRedirectUrl } = require('../lib/supabase')
  console.log('OK - production site url loaded: ', getAuthRedirectUrl('/verify'))
} catch (err) {
  console.error('Unexpected error:', err?.message || err)
}
// Basic local tests to verify endpoints are reachable and return consistent shapes
// Requires dev server running: npm run dev

const BASE = 'http://localhost:3000'

async function testSignup() {
  const resp = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fake+signup@localhost.local', password: 'Password1', full_name: 'Test Signup' }),
  })
  console.log('/api/auth/signup', resp.status)
  console.log(await resp.text())
}

async function testSignIn() {
  const resp = await fetch(`${BASE}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fake@localhost.local', password: 'badpassword' }),
  })
  console.log('/api/auth/signin', resp.status)
  console.log(await resp.text())
}

async function testOtp() {
  const resp = await fetch(`${BASE}/api/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fake@localhost.local', action: 'magic' }),
  })
  console.log('/api/auth/otp', resp.status)
  console.log(await resp.text())
}

(async () => {
  await testSignup()
  await testSignIn()
  await testOtp()
})()

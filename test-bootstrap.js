/**
 * Quick test script for admin bootstrap endpoint
 * Run with: node test-bootstrap.js
 * 
 * Prerequisites:
 * 1. Dev server running (npm run dev)
 * 2. You're logged in and have a valid access token
 * 3. Replace YOUR_ACCESS_TOKEN below with your actual token
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN'; // Replace with your actual token from localStorage or DevTools

async function testBootstrap() {
  console.log('Testing admin bootstrap endpoint...');
  
  try {
    const res = await fetch(`${BASE_URL}/api/admin/bootstrap`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    
    console.log('\nResponse Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('\n✅ SUCCESS! Admin access granted.');
      console.log('Now refresh your browser and navigate to /admin');
    } else {
      console.log('\n❌ FAILED. Check the error above.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testBootstrap();

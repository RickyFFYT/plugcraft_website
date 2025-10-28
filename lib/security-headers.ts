import type { NextApiResponse } from 'next'

/**
 * Set security headers on API responses to protect against common attacks
 */
export function setSecurityHeaders(res: NextApiResponse) {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy to limit information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy to restrict browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Prevent caching of sensitive responses by default
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
}

/**
 * Validate and sanitize email input
 */
export function sanitizeEmail(email: string | undefined): string | null {
  if (!email || typeof email !== 'string') return null
  
  const trimmed = email.trim().toLowerCase()
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) return null
  
  // Prevent excessively long emails
  if (trimmed.length > 254) return null
  
  return trimmed
}

/**
 * Validate authorization header and extract bearer token
 */
export function extractBearerToken(authHeader: string | string[] | undefined): string | null {
  if (!authHeader) return null
  
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader
  if (typeof header !== 'string') return null
  
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string | undefined, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

/**
 * Validate request body size to prevent DOS attacks
 */
export function validateRequestSize(body: any, maxSizeKB: number = 100): boolean {
  const bodyStr = JSON.stringify(body)
  const sizeKB = Buffer.byteLength(bodyStr, 'utf8') / 1024
  return sizeKB <= maxSizeKB
}

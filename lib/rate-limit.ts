// Simple in-memory rate limiter (for production, use Redis or a database)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const MAX_REQUESTS = 1 // 1 request per day per IP

export function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry) {
    // First request from this IP
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  // Check if the window has expired
  if (now > entry.resetTime) {
    // Reset the counter
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  // Check if limit exceeded
  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
    }
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(ip, entry)
  return { allowed: true }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 60 * 60 * 1000) // Clean up every hour


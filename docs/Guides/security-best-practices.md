# Security Best Practices

> **MVP-focused security** - Essential practices without over-engineering

## API Key Management

### Never Commit Keys
\`\`\`bash
# .gitignore should include:
.env
.env.local
.env*.local
\`\`\`

### Environment Variables
\`\`\`bash
# Server-only (no NEXT_PUBLIC prefix)
CLERK_SECRET_KEY=sk_...
CONVEX_DEPLOY_KEY=prod:...
FAL_KEY=...

# Client-safe (with NEXT_PUBLIC prefix)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_CONVEX_URL=https://...
\`\`\`

### Rule: Server vs Client Keys
- **Server-only**: Never prefix with `NEXT_PUBLIC_`, only accessible in Server Actions/Route Handlers
- **Client-safe**: Prefix with `NEXT_PUBLIC_`, can be used in components

## Authentication with Clerk

### Protect Routes
\`\`\`typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook"],
  ignoredRoutes: ["/api/public"]
})
\`\`\`

### Verify User in Server Actions
\`\`\`typescript
// Server Action
import { auth } from "@clerk/nextjs/server"

export async function createProject(data) {
  const { userId } = auth()
  if (!userId) throw new Error("Unauthorized")
  
  // Proceed with action
}
\`\`\`

### Protect API Routes
\`\`\`typescript
// app/api/generate/route.ts
import { auth } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  // Handle request
}
\`\`\`

## Database Security with Convex

### Row-Level Security
\`\`\`typescript
// convex/projects.ts
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")
    
    // Only return user's own projects
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
  }
})
\`\`\`

### Validate All Inputs
\`\`\`typescript
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("wedding"), v.literal("birthday"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")
    
    // Input is validated by Convex schema
    return await ctx.db.insert("projects", {
      ...args,
      userId: identity.subject
    })
  }
})
\`\`\`

## Input Validation

### Frontend Validation
\`\`\`typescript
// Validate before sending to server
const schema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500),
  duration: z.number().min(10).max(30)
})

const result = schema.safeParse(formData)
if (!result.success) {
  // Show errors to user
  return
}
\`\`\`

### Backend Validation (Convex)
\`\`\`typescript
// Convex automatically validates with v.* validators
export const createScene = mutation({
  args: {
    prompt: v.string(), // Required string
    duration: v.number(), // Required number
    projectId: v.id("projects") // Valid project ID
  },
  handler: async (ctx, args) => {
    // Args are already validated
  }
})
\`\`\`

## File Upload Security

### Limit File Size
\`\`\`typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large")
  }
}
\`\`\`

### Validate File Type
\`\`\`typescript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function validateImageType(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Invalid file type")
  }
}
\`\`\`

### Use Convex Storage
\`\`\`typescript
// Secure file upload through Convex
const storageId = await ctx.storage.store(blob)
const url = await ctx.storage.getUrl(storageId)
// URL is time-limited and secure
\`\`\`

## XSS Prevention

### Always Escape User Input
\`\`\`tsx
// React automatically escapes content
<div>{userInput}</div> // Safe

// Dangerous (never do this)
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // Unsafe
\`\`\`

### Sanitize Rich Text
\`\`\`typescript
import DOMPurify from 'dompurify'

const sanitized = DOMPurify.sanitize(userInput)
\`\`\`

## Rate Limiting

### Convex Rate Limiting
\`\`\`typescript
// convex/rateLimit.ts
const rateLimitStore = new Map()

export function checkRateLimit(userId: string, limit: number = 10) {
  const now = Date.now()
  const userRequests = rateLimitStore.get(userId) || []
  
  // Filter requests from last minute
  const recentRequests = userRequests.filter(
    (time: number) => now - time < 60000
  )
  
  if (recentRequests.length >= limit) {
    throw new Error("Rate limit exceeded")
  }
  
  recentRequests.push(now)
  rateLimitStore.set(userId, recentRequests)
}
\`\`\`

### Usage in Actions
\`\`\`typescript
export const generateImage = action({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    checkRateLimit(identity.subject, 10) // 10 requests per minute
    
    // Proceed with generation
  }
})
\`\`\`

## CSRF Protection

### Use Clerk's Built-in Protection
\`\`\`typescript
// Clerk automatically handles CSRF tokens
// No additional configuration needed for MVP
\`\`\`

### For Custom Forms
\`\`\`typescript
// Use SameSite cookies (default in Next.js)
// Set in next.config.js if needed
\`\`\`

## Webhooks Security

### Verify Webhook Signatures (Clerk)
\`\`\`typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  
  const svix = new Webhook(WEBHOOK_SECRET)
  const payload = await req.text()
  const headers = req.headers
  
  try {
    const evt = svix.verify(payload, {
      "svix-id": headers.get("svix-id"),
      "svix-timestamp": headers.get("svix-timestamp"),
      "svix-signature": headers.get("svix-signature")
    })
    // Process webhook
  } catch (err) {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }
}
\`\`\`

## Quick Security Checklist

**Before Launch**:
- [ ] All API keys in environment variables, not code
- [ ] `.env` files in `.gitignore`
- [ ] Authentication on all protected routes
- [ ] User ID verified in all server actions
- [ ] Row-level security in all Convex queries
- [ ] Input validation on frontend and backend
- [ ] File upload size and type limits
- [ ] Rate limiting on expensive operations
- [ ] Webhook signature verification
- [ ] HTTPS enforced (automatic on Vercel)

**MVP vs Production**:
- **MVP**: Focus on authentication, input validation, and API key security
- **Production**: Add advanced rate limiting, DDoS protection, security headers, audit logging

---

**Remember**: Security is not about paranoia, it's about preventing common issues. Start with these basics and add more as you scale.

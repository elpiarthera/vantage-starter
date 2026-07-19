# Troubleshooting Guide

Common errors, solutions, and debug patterns for this stack: Next.js, Convex,
Clerk, and Polar.

## Authentication Issues

### Issue: "Invalid publishable key"

**Symptoms**:
- Clerk provider fails to load
- Console error: `Invalid publishable key`

**Cause**: Incorrect or missing Clerk publishable key

**Solution**:
1. Check `.env.local`:
   \`\`\`bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   \`\`\`
2. Verify key starts with `pk_test_` (dev) or `pk_live_` (prod)
3. Copy key from Clerk Dashboard > API Keys
4. Restart dev server: `npm run dev`

---

### Issue: "Redirect loop on sign-in"

**Symptoms**:
- After sign-in, page redirects infinitely
- Browser shows "ERR_TOO_MANY_REDIRECTS"

**Cause**: Misconfigured redirect URLs

**Solution**:
1. Check Clerk Dashboard > **Paths**:
   \`\`\`
   After sign-in: /dashboard
   After sign-up: /dashboard
   \`\`\`
2. Check environment variables:
   \`\`\`bash
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   \`\`\`
3. Ensure `/dashboard` is not a public route in `middleware.ts`

---

### Issue: "Organization not found"

**Symptoms**:
- Error when trying to access organization features
- `organizationId` is null or undefined

**Cause**: User hasn't created/joined an organization

**Solution**:
1. Check if organizations are enabled in Clerk Dashboard
2. Verify user has created or joined an organization
3. Check organization context:
   \`\`\`typescript
   const { organization } = useOrganization()
   if (!organization) {
     // Prompt user to create/join organization
   }
   \`\`\`
4. Handle optional organization in queries:
   \`\`\`typescript
   organizationId: v.optional(v.string())
   \`\`\`

---

### Issue: "JWT token not recognized by Convex"

**Symptoms**:
- Convex returns `null` for `ctx.auth.getUserIdentity()`
- Auth queries fail

**Cause**: JWT issuer mismatch

**Solution**:
1. Check Clerk JWT issuer:
   - Clerk Dashboard > JWT Templates > convex
   - Copy **Issuer URL**: `https://your-app.clerk.accounts.dev`

2. Verify in Convex Dashboard:
   - Settings > Authentication > Clerk
   - Issuer should match Clerk's

3. Check environment variable:
   \`\`\`bash
   CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev
   \`\`\`

4. Restart both dev servers (Next.js and Convex)

---

## Database Issues

### Issue: "Document not found"

**Symptoms**:
- Error: `Cannot read properties of null`
- Query returns null unexpectedly

**Cause**: Document ID doesn't exist or wrong ID format

**Solution**:
1. Verify ID format:
   \`\`\`typescript
   // Correct format
   const projectId = ctx.db.normalizeId("projects", rawId)
   if (!projectId) throw new Error("Invalid project ID")
   \`\`\`

2. Check if document exists:
   \`\`\`typescript
   const project = await ctx.db.get(projectId)
   if (!project) throw new Error("Project not found")
   \`\`\`

3. Add null checks:
   \`\`\`typescript
   const project = await ctx.db.get(projectId)
   if (!project) {
     return null // Or throw error
   }
   \`\`\`

---

### Issue: "Query timeout"

**Symptoms**:
- Query takes > 5 seconds
- Error: `Query execution timeout`

**Cause**: Missing index or inefficient query

**Solution**:
1. Check Convex Dashboard > **Monitoring** for slow queries

2. Add index to schema:
   \`\`\`typescript
   .index('by_user', ['userId'])
   .index('by_organization', ['organizationId'])
   \`\`\`

3. Use indexes in queries:
   \`\`\`typescript
   // Bad (no index)
   await ctx.db.query('projects')
     .filter(q => q.eq(q.field('userId'), userId))
     .collect()

   // Good (uses index)
   await ctx.db.query('projects')
     .withIndex('by_user', q => q.eq('userId', userId))
     .collect()
   \`\`\`

4. Limit results:
   \`\`\`typescript
   .take(100) // Limit to 100 results
   \`\`\`

---

### Issue: "Schema validation failed"

**Symptoms**:
- Error: `Validator error: Expected string, got number`
- Schema push fails

**Cause**: Data type mismatch

**Solution**:
1. Check schema definition:
   \`\`\`typescript
   userId: v.id('users'), // Not v.string()
   createdAt: v.number(), // Not v.string()
   \`\`\`

2. Verify data types in mutations:
   \`\`\`typescript
   // Correct
   createdAt: Date.now(), // number

   // Wrong
   createdAt: new Date().toISOString(), // string
   \`\`\`

3. Use optional for nullable fields:
   \`\`\`typescript
   organizationId: v.optional(v.string())
   \`\`\`

---

### Issue: "Foreign key constraint violation"

**Symptoms**:
- Can't delete document
- Error: `Referenced by other documents`

**Cause**: Document is referenced by other documents

**Solution**:
1. Implement cascade delete:
   \`\`\`typescript
   // When deleting project, delete related data
   const scenes = await ctx.db
     .query('scenes')
     .withIndex('by_project', q => q.eq('projectId', projectId))
     .collect()

   for (const scene of scenes) {
     await ctx.db.delete(scene._id)
   }

   await ctx.db.delete(projectId)
   \`\`\`

2. Or use soft delete:
   \`\`\`typescript
   // Add to schema
   deletedAt: v.optional(v.number())

   // Soft delete
   await ctx.db.patch(projectId, {
     deletedAt: Date.now()
   })

   // Filter out deleted
   .filter(q => q.eq(q.field('deletedAt'), undefined))
   \`\`\`

---

## AI API Issues

### Issue: "fal.ai API returns 401 Unauthorized"

**Symptoms**:
- Image generation fails
- Error: `Unauthorized`

**Cause**: Invalid or missing API key

**Solution**:
1. Check environment variable:
   \`\`\`bash
   FAL_KEY=xxxxx-xxxxx-xxxxx
   \`\`\`

2. Verify key in fal.ai dashboard

3. Ensure key is used correctly:
   \`\`\`typescript
   const fal = require('@fal-ai/serverless-client')
   fal.config({ credentials: process.env.FAL_KEY })
   \`\`\`

---

### Issue: "Image generation timeout"

**Symptoms**:
- Request hangs for > 30 seconds
- Eventually times out

**Cause**: Long generation time or network issue

**Solution**:
1. Increase timeout:
   \`\`\`typescript
   const result = await fal.subscribe('fal-ai/flux/dev', {
     input: { prompt },
     timeout: 60000, // 60 seconds
   })
   \`\`\`

2. Implement polling:
   \`\`\`typescript
   const job = await fal.queue('fal-ai/flux/dev', {
     input: { prompt }
   })

   let result
   let attempts = 0
   while (attempts < 12) { // 12 * 5s = 60s max
     result = await fal.status('fal-ai/flux/dev', { requestId: job.request_id })
     if (result.status === 'COMPLETED') break
     await new Promise(resolve => setTimeout(resolve, 5000))
     attempts++
   }
   \`\`\`

---

### Issue: "Video generation fails"

**Symptoms**:
- Kling AI returns error
- Generation stuck in "processing"

**Cause**: Various (invalid input, API issues, etc.)

**Solution**:
1. Check API response:
   \`\`\`typescript
   console.log('[v0] Kling AI response:', response)
   \`\`\`

2. Verify input format:
   \`\`\`typescript
   // Correct format
   {
     image_url: 'https://...', // Must be accessible URL
     prompt: 'camera zoom in',
     duration: 5, // 5 or 10 seconds
   }
   \`\`\`

3. Implement retry logic:
   \`\`\`typescript
   async function generateWithRetry(input: any, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await generateVideo(input)
       } catch (error) {
         if (i === maxRetries - 1) throw error
         await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)))
       }
     }
   }
   \`\`\`

---

### Issue: "Rate limit exceeded (429)"

**Symptoms**:
- Error: `Too Many Requests`
- API calls fail after several requests

**Cause**: Exceeded API rate limit

**Solution**:
1. Implement exponential backoff:
   \`\`\`typescript
   async function callWithBackoff(apiCall: () => Promise<any>) {
     let delay = 1000
     let attempts = 0
     
     while (attempts < 5) {
       try {
         return await apiCall()
       } catch (error) {
         if (error.status !== 429) throw error
         await new Promise(resolve => setTimeout(resolve, delay))
         delay *= 2
         attempts++
       }
     }
     throw new Error('Max retries exceeded')
   }
   \`\`\`

2. Implement request queue:
   \`\`\`typescript
   // Create queue in Convex
   await ctx.db.insert('queue', {
     userId: user._id,
     operation: 'image-generation',
     status: 'pending',
     input: { prompt },
     createdAt: Date.now(),
   })

   // Process queue with rate limiting
   // Max 10 requests per minute
   \`\`\`

---

## Storage Issues

### Issue: "File upload fails"

**Symptoms**:
- Upload gets stuck at 0%
- Error: `Failed to upload file`

**Cause**: Network issue, file too large, or incorrect upload URL

**Solution**:
1. Check file size:
   \`\`\`typescript
   // Limit file size to 50MB
   if (file.size > 50 * 1024 * 1024) {
     throw new Error('File too large (max 50MB)')
   }
   \`\`\`

2. Verify upload URL:
   \`\`\`typescript
   // Generate fresh upload URL
   const uploadUrl = await generateUploadUrl()
   console.log('[v0] Upload URL:', uploadUrl)
   \`\`\`

3. Add progress tracking:
   \`\`\`typescript
   const xhr = new XMLHttpRequest()
   xhr.upload.addEventListener('progress', (e) => {
     const percent = (e.loaded / e.total) * 100
     console.log('[v0] Upload progress:', percent + '%')
   })
   \`\`\`

---

### Issue: "Asset URL not accessible"

**Symptoms**:
- Image/video doesn't load
- 404 error on asset URL

**Cause**: Incorrect storage ID or deleted file

**Solution**:
1. Verify storage ID:
   \`\`\`typescript
   const url = await ctx.storage.getUrl(storageId)
   if (!url) {
     throw new Error('File not found in storage')
   }
   \`\`\`

2. Check file exists:
   \`\`\`typescript
   // In Convex dashboard, go to Storage tab
   // Verify file is present
   \`\`\`

3. Use fallback:
   \`\`\`typescript
   <img 
     src={assetUrl || '/placeholder.svg?height=200&width=200'} 
     alt="Asset"
   />
   \`\`\`

---

## Performance Issues

### Issue: "Dashboard loads slowly"

**Symptoms**:
- Page takes > 5 seconds to load
- Multiple loading spinners

**Cause**: Too many sequential queries

**Solution**:
1. Use parallel queries:
   \`\`\`typescript
   // Bad (sequential)
   const user = useQuery(api.users.getCurrentUser)
   const projects = useQuery(api.projects.listProjects)

   // Good (parallel - happens automatically with multiple useQuery)
   \`\`\`

2. Paginate results:
   \`\`\`typescript
   export const listProjects = query({
     args: {
       page: v.number(),
       limit: v.number(),
     },
     handler: async (ctx, args) => {
       return await ctx.db
         .query('projects')
         .order('desc')
         .paginate({ cursor: args.page, numItems: args.limit })
     },
   })
   \`\`\`

3. Cache with SWR:
   \`\`\`typescript
   const { data: projects } = useSWR('projects', () => 
     convex.query(api.projects.listProjects)
   )
   \`\`\`

---

### Issue: "Image generation queue backed up"

**Symptoms**:
- Images take minutes to generate
- Queue grows faster than processing

**Cause**: Too many concurrent requests

**Solution**:
1. Limit concurrent generations:
   \`\`\`typescript
   const activeGenerations = await ctx.db
     .query('scenes')
     .filter(q => q.eq(q.field('status'), 'generating'))
     .collect()

   if (activeGenerations.length >= 5) {
     throw new Error('Too many active generations. Please wait.')
   }
   \`\`\`

2. Show queue position:
   \`\`\`typescript
   const queuePosition = await ctx.db
     .query('queue')
     .filter(q => q.eq(q.field('status'), 'pending'))
     .filter(q => q.lt(q.field('createdAt'), myJob.createdAt))
     .collect()

   return { position: queuePosition.length + 1 }
   \`\`\`

---

## Debug Patterns

### Pattern 1: Add Debug Logs

\`\`\`typescript
console.log('[v0] Function called with args:', args)
console.log('[v0] User identity:', await ctx.auth.getUserIdentity())
console.log('[v0] Query result:', result)
\`\`\`

### Pattern 2: Check Convex Logs

1. Go to Convex Dashboard
2. Click **Logs**
3. Filter by function name
4. Check for errors or slow queries

### Pattern 3: Use Network Tab

1. Open Chrome DevTools > Network
2. Filter by "Fetch/XHR"
3. Check API requests and responses
4. Look for 4xx or 5xx errors

### Pattern 4: Test in Isolation

Create test endpoint:
\`\`\`typescript
// app/api/test/route.ts
export async function GET() {
  try {
    const result = await testFunction()
    return Response.json({ success: true, result })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
\`\`\`

---

## Getting Help

If you can't resolve an issue:

1. **Check documentation**:
   - Convex: [docs.convex.dev](https://docs.convex.dev)
   - Clerk: [clerk.com/docs](https://clerk.com/docs)
   - Next.js: [nextjs.org/docs](https://nextjs.org/docs)

2. **Search GitHub issues**:
   - Check if issue is already reported
   - Look for similar problems and solutions

3. **Ask for help**:
   - Convex Discord: [convex.dev/community](https://convex.dev/community)
   - Clerk Discord: [clerk.com/discord](https://clerk.com/discord)
   - Stack Overflow with tags: `convex`, `clerk`, `nextjs`

4. **Contact support**:
   - Convex: support@convex.dev
   - Clerk: support@clerk.com
   - Vercel: vercel.com/help
\`\`\`

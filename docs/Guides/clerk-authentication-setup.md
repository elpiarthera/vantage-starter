# Clerk Authentication Setup Guide

Complete step-by-step guide for setting up Clerk authentication before implementation.

## Prerequisites

- Next.js 14+ project
- Node.js 18+
- Vercel account (optional, for deployment)

## Phase 1: Clerk Dashboard Setup (15 minutes)

### Step 1: Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign up/login
2. Click **"Create Application"**
3. Configure your application:
   - **Application Name**: VantageStarter (or your app name)
   - **Authentication Methods**: Enable:
     - ✅ Email
     - ✅ Password
     - ✅ Google OAuth (optional)
   - Click **"Create Application"**

### Step 2: Get API Keys

1. In Clerk Dashboard, go to **API Keys**
2. Copy the following keys:
   \`\`\`
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   \`\`\`
3. Save these for environment variables setup

### Step 3: Configure Sign In/Sign Up URLs

1. In Clerk Dashboard, go to **Paths**
2. Configure the following paths:
   \`\`\`
   Sign-in page: /sign-in
   Sign-up page: /sign-up
   After sign-in: /dashboard
   After sign-up: /dashboard
   \`\`\`

## Phase 2: Organization Setup (15 minutes)

### Step 4: Enable Organizations

1. In Clerk Dashboard, go to **Organizations**
2. Toggle **"Enable Organizations"** to ON
3. Configure organization settings:
   - **Personal Account Option**: Allow (users can have personal + org accounts)
   - **Maximum Memberships**: 10 (adjust as needed)
   - **Domains**: Add your domain (optional)

### Step 5: Configure Organization Roles

1. In Organizations section, go to **Roles & Permissions**
2. Default roles are already created:
   - `org:admin` - Full access
   - `org:member` - Basic access
3. Add custom role if needed:
   - Click **"Add Role"**
   - Name: `org:editor`
   - Permissions: Add specific permissions

### Step 6: Configure Organization Permissions

Define permissions for your application:

**Recommended Permissions**:
\`\`\`
org:project:create
org:project:read
org:project:update
org:project:delete
org:asset:upload
org:video:generate
org:template:create
\`\`\`

Add these in **Roles & Permissions** > **Permissions** tab.

## Phase 3: JWT Template Configuration (10 minutes)

### Step 7: Create JWT Template for Convex

1. In Clerk Dashboard, go to **JWT Templates**
2. Click **"New Template"**
3. Select **"Convex"** from template options
4. Configure the template:
   - **Name**: convex
   - **Token Lifetime**: 60 seconds (default)
5. Add custom claims (click **"Add Claim"**):

\`\`\`json
{
  "userId": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "organizationId": "{{org.id}}",
  "role": "{{org.role}}"
}
\`\`\`

6. Click **"Save"**
7. Copy the **Issuer URL** (format: `https://your-app.clerk.accounts.dev`)

## Phase 4: Webhook Configuration (15 minutes)

### Step 8: Set Up Webhooks

1. In Clerk Dashboard, go to **Webhooks**
2. Click **"Add Endpoint"**
3. Configure webhook:
   - **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/clerk`
   - **Subscribe to events**:
     - ✅ user.created
     - ✅ user.updated
     - ✅ user.deleted
     - ✅ organization.created
     - ✅ organization.updated
     - ✅ organization.deleted
     - ✅ organizationMembership.created
     - ✅ organizationMembership.updated
     - ✅ organizationMembership.deleted

4. Click **"Create"**
5. Copy the **Signing Secret** (format: `whsec_...`)

## Phase 5: Environment Variables Setup (5 minutes)

### Step 9: Configure Environment Variables

Create/update `.env.local` file:

\`\`\`bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Clerk URLs (auto-configured, but can override)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Clerk JWT Issuer (for Convex integration)
CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev
\`\`\`

### Step 10: Add to Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add all variables from `.env.local`
5. Set environment: **Production, Preview, Development**

## Phase 6: Middleware Configuration (Already in Project)

The middleware is already configured in `middleware.ts`:

\`\`\`typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)'
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
\`\`\`

## Phase 7: Testing Setup (10 minutes)

### Step 11: Test Authentication Flow

1. Start development server: `npm run dev`
2. Navigate to `/sign-in`
3. Create test account
4. Verify redirect to `/dashboard`
5. Check user data in Clerk Dashboard

### Step 12: Test Organization Flow

1. In dashboard, create organization
2. Invite a test member
3. Verify organization context switching
4. Test organization permissions

### Step 13: Verify JWT Claims

1. Install JWT decoder: `npm install jsonwebtoken`
2. Add test endpoint to decode token:

\`\`\`typescript
// app/api/test-jwt/route.ts
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId, orgId, orgRole } = auth()
  return Response.json({ userId, orgId, orgRole })
}
\`\`\`

3. Access `/api/test-jwt` to verify claims

## Common Issues & Solutions

### Issue: "Invalid publishable key"
**Solution**: Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correctly set and starts with `pk_test_` or `pk_live_`

### Issue: "Redirect loop on sign-in"
**Solution**: Check that sign-in URL matches in both Clerk Dashboard and environment variables

### Issue: "Organization not found"
**Solution**: Ensure organizations are enabled in Clerk Dashboard and user has created/joined an organization

### Issue: "JWT template not found"
**Solution**: Verify JWT template name matches `convex` and issuer domain is correct

## Security Checklist

- [ ] API keys are in `.env.local` (not committed to git)
- [ ] Webhook signing secret is configured
- [ ] JWT template has correct claims
- [ ] Middleware protects all dashboard routes
- [ ] Organization permissions are properly configured
- [ ] Production environment variables are set in Vercel

## Next Steps

After completing this setup:
1. Proceed to Convex Setup Guide
2. Test Clerk + Convex integration
3. Implement auth-protected features

## Time Estimate

Total setup time: **70 minutes**

- Dashboard setup: 15 min
- Organization setup: 15 min
- JWT configuration: 10 min
- Webhook setup: 15 min
- Environment variables: 5 min
- Testing: 20 min

## Support Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk + Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk + Convex Integration](https://clerk.com/docs/integrations/databases/convex)
- [Clerk Organizations](https://clerk.com/docs/organizations/overview)

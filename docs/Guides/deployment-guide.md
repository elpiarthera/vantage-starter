# Production Deployment Guide

Complete checklist and guide for deploying MyShortReel to production.

## Prerequisites

- [ ] All implementation phases completed
- [ ] Integration testing passed
- [ ] Clerk setup completed
- [ ] Convex setup completed
- [ ] GitHub repository configured
- [ ] Vercel account connected

---

## Phase 1: Pre-Deployment Checklist (30 minutes)

### Code Quality

- [ ] All console.log("[v0] ...") debug statements removed
- [ ] No commented-out code blocks
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings addressed
- [ ] Build completes without errors (`npm run build`)

### Environment Variables

- [ ] All `.env.local` variables documented
- [ ] `.env.example` file created
- [ ] No secrets committed to Git
- [ ] Production API keys obtained

### Testing

- [ ] All integration tests passed
- [ ] Manual testing completed on all flows
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing done (Chrome, Safari, Firefox)

### Security

- [ ] Authentication working correctly
- [ ] Authorization enforced on all protected routes
- [ ] API rate limiting configured
- [ ] Organization isolation verified
- [ ] File upload validation implemented

---

## Phase 2: Clerk Production Setup (20 minutes)

### Step 1: Switch to Production Instance

1. In Clerk Dashboard, create **Production** instance (or enable production mode)
2. Copy **Production** API keys:
   \`\`\`
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
   CLERK_SECRET_KEY=sk_live_xxxxx
   \`\`\`

### Step 2: Configure Production URLs

1. In Clerk Dashboard > **Paths**, set production URLs:
   \`\`\`
   Sign-in: https://myshortreel.com/sign-in
   Sign-up: https://myshortreel.com/sign-up
   After sign-in: https://myshortreel.com/dashboard
   After sign-up: https://myshortreel.com/dashboard
   \`\`\`

2. In Clerk Dashboard > **Domain**, add custom domain (optional):
   - Add: `accounts.myshortreel.com`
   - Configure DNS records as shown

### Step 3: Configure Production Webhooks

1. Update webhook endpoint URL:
   \`\`\`
   https://myshortreel.com/api/webhooks/clerk
   \`\`\`

2. Verify webhook signing secret updated in environment variables

### Step 4: Test Production Authentication

1. Create test account in production
2. Verify sign-up/sign-in flow
3. Verify organization creation
4. Test JWT claims

**Checklist**:
- [ ] Production API keys configured
- [ ] Production URLs set
- [ ] Custom domain configured (optional)
- [ ] Webhooks updated
- [ ] Test account created

---

## Phase 3: Convex Production Setup (20 minutes)

### Step 1: Deploy Convex to Production

\`\`\`bash
# From project root
npx convex deploy --prod
\`\`\`

This creates production deployment and outputs:
\`\`\`
Production deployment: https://your-project.convex.cloud
\`\`\`

### Step 2: Configure Production Environment

1. Copy production deployment URL
2. Update Convex environment variables

### Step 3: Update Clerk Integration

1. In Convex Dashboard (Production), go to **Settings** > **Authentication**
2. Verify Clerk provider configured with production issuer:
   \`\`\`
   https://your-app.clerk.accounts.dev
   \`\`\`

### Step 4: Verify Schema Deployed

1. In Convex Dashboard, click **Data**
2. Verify all tables created
3. Check indexes configured

**Checklist**:
- [ ] Convex deployed to production
- [ ] Production URL obtained
- [ ] Clerk integration verified
- [ ] Schema deployed
- [ ] Indexes created

---

## Phase 4: Vercel Deployment (30 minutes)

### Step 1: Connect GitHub Repository

1. Go to Vercel Dashboard
2. Click **"Add New"** > **"Project"**
3. Import GitHub repository
4. Select repository: `your-username/myshortreel`

### Step 2: Configure Build Settings

Vercel auto-detects Next.js, but verify:

\`\`\`
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
\`\`\`

### Step 3: Add Environment Variables

Add all production environment variables:

#### Clerk (Production)
\`\`\`bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
\`\`\`

#### Convex (Production)
\`\`\`bash
CONVEX_DEPLOYMENT=prod:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
\`\`\`

#### AI APIs (Production)
\`\`\`bash
# fal.ai
FAL_KEY=xxxxx-xxxxx-xxxxx

# Kling AI
KLING_API_KEY=xxxxx

# OpenAI (if using)
OPENAI_API_KEY=sk-xxxxx

# Tavus (if using)
TAVUS_API_KEY=xxxxx
\`\`\`

#### Other
\`\`\`bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://myshortreel.com
\`\`\`

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (3-5 minutes)
3. Verify deployment successful

### Step 5: Configure Custom Domain

1. In Vercel Dashboard, go to **Settings** > **Domains**
2. Add custom domain: `myshortreel.com`
3. Configure DNS records:
   \`\`\`
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   \`\`\`

4. Wait for DNS propagation (5-30 minutes)
5. Verify SSL certificate issued

**Checklist**:
- [ ] GitHub connected
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Custom domain configured
- [ ] SSL certificate active

---

## Phase 5: Post-Deployment Verification (30 minutes)

### Step 1: Smoke Testing

Test critical flows in production:

**Authentication**:
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Password reset (if enabled)

**Dashboard**:
- [ ] Dashboard loads
- [ ] Stats display correctly
- [ ] Quick actions work
- [ ] Recent projects display

**Project Creation**:
- [ ] Create new project
- [ ] Project saved to Convex
- [ ] Project appears in list

**Guided Flow**:
- [ ] Step 1: Project details work
- [ ] Step 2: Event details work
- [ ] Step 3: Image generation works
- [ ] Step 4: Video generation works
- [ ] Step 5: Audio generation works
- [ ] Step 6: Final video assembled

**Organizations**:
- [ ] Create organization
- [ ] Invite member
- [ ] Member accepts invitation
- [ ] Organization projects isolated

### Step 2: Performance Check

**Page Load Times**:
- [ ] Homepage < 2s
- [ ] Dashboard < 3s
- [ ] Project detail < 2s

**API Response Times**:
- [ ] Database queries < 200ms
- [ ] Image generation < 30s
- [ ] Video generation < 5min

**Lighthouse Scores** (aim for):
- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 95+
- [ ] SEO: 90+

### Step 3: Error Monitoring Setup

**Vercel Analytics**:
1. In Vercel Dashboard, enable **Analytics**
2. Monitor real user metrics

**Sentry (Optional)**:
\`\`\`bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
\`\`\`

Configure Sentry DSN in environment variables.

### Step 4: Setup Monitoring Alerts

**Convex Dashboard**:
1. Go to **Monitoring**
2. Set up alerts for:
   - Query errors
   - Slow queries (> 1s)
   - Storage usage (> 80%)

**Vercel Dashboard**:
1. Go to **Integrations**
2. Connect Slack/Discord for deployment notifications

**Checklist**:
- [ ] Smoke tests passed
- [ ] Performance acceptable
- [ ] Error monitoring setup
- [ ] Alerts configured

---

## Phase 6: Cost Monitoring (15 minutes)

### Step 1: Set Budget Alerts

**Vercel**:
1. Go to **Settings** > **Billing**
2. Set budget alert: $50/month (adjust as needed)

**Convex**:
1. Free tier: 1GB storage, 1M reads/month
2. Monitor usage in dashboard
3. Upgrade to Pro if needed ($25/month)

**AI APIs**:
1. **fal.ai**: Monitor credit usage
2. **Kling AI**: Monitor API usage
3. Set spending limits in each dashboard

### Step 2: Track Per-User Costs

Implement cost tracking in `usageTracking` table:

\`\`\`typescript
// Track AI API usage per user
await ctx.db.insert('usageTracking', {
  userId: user._id,
  organizationId: org?._id,
  service: 'fal-ai',
  model: 'fal-ai/stable-audio-25/text-to-audio',
  operation: 'music-generation',
  cost: 0.25, // USD
  timestamp: Date.now(),
})
\`\`\`

Query monthly costs:
\`\`\`typescript
// Get user's monthly spend
const startOfMonth = new Date()
startOfMonth.setDate(1)
startOfMonth.setHours(0, 0, 0, 0)

const usage = await ctx.db
  .query('usageTracking')
  .withIndex('by_user', (q) => q.eq('userId', userId))
  .filter((q) => q.gte(q.field('timestamp'), startOfMonth.getTime()))
  .collect()

const totalCost = usage.reduce((sum, record) => sum + record.cost, 0)
\`\`\`

### Step 3: Implement Usage Limits

Set per-user limits:

\`\`\`typescript
// Check user's monthly limit
const MONTHLY_LIMIT = 10.00 // $10 per user per month

if (totalCost >= MONTHLY_LIMIT) {
  throw new Error('Monthly usage limit exceeded. Please upgrade your plan.')
}
\`\`\`

**Checklist**:
- [ ] Budget alerts set
- [ ] Usage tracking implemented
- [ ] Per-user costs tracked
- [ ] Usage limits enforced

---

## Phase 7: Backup & Rollback Strategy (15 minutes)

### Step 1: Database Backups

**Convex**:
- Convex automatically backs up data
- Export data via CLI: `npx convex export`
- Schedule weekly exports (manual or CI/CD)

### Step 2: GitHub Backups

Ensure code is backed up:
- [ ] All changes pushed to GitHub
- [ ] Production branch protected
- [ ] Tags created for releases

### Step 3: Rollback Procedure

**Vercel Rollback**:
1. Go to Vercel Dashboard > **Deployments**
2. Find previous working deployment
3. Click **"Promote to Production"**

**Convex Rollback**:
\`\`\`bash
# Deploy previous version
npx convex deploy --prod --version <previous-version>
\`\`\`

**Environment Variables Rollback**:
- Keep copy of previous environment variables
- Restore via Vercel Dashboard if needed

### Step 4: Disaster Recovery Plan

Document recovery procedure:

1. **Database corruption**:
   - Restore from Convex backup
   - Import data: `npx convex import <backup-file>`

2. **Deployment failure**:
   - Rollback to previous Vercel deployment
   - Check logs for errors
   - Fix and redeploy

3. **Auth issues**:
   - Verify Clerk configuration
   - Check JWT issuer domain
   - Test with test account

**Checklist**:
- [ ] Backup strategy documented
- [ ] Rollback procedure tested
- [ ] Disaster recovery plan written

---

## Phase 8: Documentation & Handoff (20 minutes)

### Step 1: Update README

Ensure README includes:
- [ ] Production URL
- [ ] Deployment status badge
- [ ] Setup instructions for new developers
- [ ] Environment variables list
- [ ] Contribution guidelines

### Step 2: Create Runbook

Document common operations:

**Deployment Checklist**: (this guide)  
**Monitoring**: Where to check logs and metrics  
**Incident Response**: Who to contact, how to rollback  
**Scaling**: When and how to scale (Convex Pro, Vercel Pro)

### Step 3: Create User Documentation

- [ ] User guide for end users
- [ ] FAQ page
- [ ] Tutorial videos (optional)
- [ ] Support contact info

**Checklist**:
- [ ] README updated
- [ ] Runbook created
- [ ] User docs created

---

## Final Production Checklist

Before announcing launch:

### Technical
- [ ] All environment variables set
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Error monitoring active
- [ ] Backups configured

### Business
- [ ] Terms of Service added
- [ ] Privacy Policy added
- [ ] Pricing page created (if applicable)
- [ ] Support email configured
- [ ] Analytics tracking enabled (Google Analytics, etc.)

### Marketing
- [ ] Landing page finalized
- [ ] Social media accounts created
- [ ] Launch announcement prepared
- [ ] Beta users invited

---

## Time Estimate

**Total deployment time: 3 hours**

- Pre-deployment: 30 min
- Clerk setup: 20 min
- Convex setup: 20 min
- Vercel deployment: 30 min
- Post-deployment verification: 30 min
- Cost monitoring: 15 min
- Backup strategy: 15 min
- Documentation: 20 min

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily**:
- [ ] Check error logs
- [ ] Monitor API usage

**Weekly**:
- [ ] Review performance metrics
- [ ] Check cost reports
- [ ] Review user feedback

**Monthly**:
- [ ] Security updates
- [ ] Dependency updates (`npm update`)
- [ ] Review and optimize slow queries
- [ ] Export database backup

### Scaling Triggers

**When to upgrade Convex**:
- Storage > 1GB
- Reads > 1M/month
- Queries > 100ms consistently

**When to upgrade Vercel**:
- Bandwidth > 100GB/month
- Build minutes > 400 min/month
- Team members > 1

---

## Troubleshooting Production Issues

See **docs/Guides/troubleshooting-guide.md** for detailed troubleshooting steps.

Quick reference:

| Issue | Check | Solution |
|-------|-------|----------|
| Auth not working | Clerk dashboard | Verify production keys |
| Database errors | Convex logs | Check schema, indexes |
| Slow queries | Convex monitoring | Add indexes, optimize |
| API rate limits | AI API dashboards | Implement queuing |
| High costs | Usage tracking table | Enforce user limits |

---

## Success Metrics

Track these metrics post-launch:

### User Metrics
- [ ] Sign-ups per day
- [ ] Active users (DAU/MAU)
- [ ] Retention rate
- [ ] Time to first project

### Technical Metrics
- [ ] Uptime (aim for 99.9%)
- [ ] Error rate (aim for < 1%)
- [ ] API latency (aim for < 200ms)
- [ ] Page load time (aim for < 3s)

### Business Metrics
- [ ] Monthly costs
- [ ] Cost per user
- [ ] Revenue (if applicable)
- [ ] Support tickets

---

**Congratulations! Your app is now live in production. 🎉**

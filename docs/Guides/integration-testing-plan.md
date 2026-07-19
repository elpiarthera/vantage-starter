# Integration Testing Plan

End-to-end testing plan for Convex + Clerk + AI APIs integration.

## Testing Phases

### Phase 1: Authentication Flow Testing
### Phase 2: Database Operations Testing  
### Phase 3: External API & AI Integration Testing
### Phase 4: Error Handling & Edge Cases
### Phase 5: Performance & Load Testing

---

## Phase 1: Authentication Flow Testing

### Test 1.1: User Sign Up & Sign In

**Objective**: Verify Clerk authentication works correctly

**Steps**:
1. Navigate to `/sign-up`
2. Create account with email + password
3. Verify email (if required)
4. Check redirect to `/dashboard`
5. Verify user data in Clerk Dashboard
6. Sign out
7. Sign in with same credentials
8. Verify redirect to `/dashboard`

**Expected Results**:
- [ ] Sign up creates user in Clerk
- [ ] User redirected to dashboard after sign up
- [ ] Sign in works with correct credentials
- [ ] Sign in fails with incorrect credentials
- [ ] User session persists across page refreshes

**Convex Verification**:
- [ ] User record created in `users` table
- [ ] `clerkId` matches Clerk user ID
- [ ] `email` matches Clerk email

### Test 1.2: JWT Claims & Convex Auth

**Objective**: Verify JWT tokens work with Convex

**Steps**:
1. Sign in as user
2. Open browser DevTools > Application > Cookies
3. Find `__session` cookie (Clerk session)
4. Call Convex query: `api.users.getCurrentUser`
5. Verify user identity returned

**Expected Results**:
- [ ] JWT token present in cookies
- [ ] Convex accepts JWT token
- [ ] `ctx.auth.getUserIdentity()` returns user info
- [ ] User ID matches Clerk subject

### Test 1.3: Organization Context

**Objective**: Verify organization membership works

**Steps**:
1. Sign in as user
2. Create organization from dashboard
3. Verify organization created in Clerk
4. Switch to organization context
5. Call Convex query with `organizationId`
6. Verify data filtered by organization

**Expected Results**:
- [ ] Organization created in Clerk
- [ ] User is org admin by default
- [ ] `organizationId` passed to Convex
- [ ] Queries return org-specific data only

### Test 1.4: Organization Permissions

**Objective**: Verify role-based access control

**Steps**:
1. Create organization as user A (admin)
2. Invite user B as member
3. User B accepts invitation
4. User A creates a record in the org
5. User B tries to view it (should succeed)
6. User B tries to delete it (should fail)

**Expected Results**:
- [ ] Admin can create/edit/delete records
- [ ] Member can view records
- [ ] Member cannot delete records
- [ ] Permissions enforced in Convex mutations, not only hidden in the UI
- [ ] A member of org A cannot read a record belonging to org B, even with its exact document ID

---

## Phase 2: Database Operations Testing

### Test 2.1: User CRUD Operations

**Objective**: Verify user creation and updates

**Test Cases**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| 2.1.1 | Create user via Clerk | User created in Convex |
| 2.1.2 | Update user profile | Convex record updated |
| 2.1.3 | Delete user | Soft delete in Convex |
| 2.1.4 | Query by clerkId | Returns correct user |
| 2.1.5 | Query by email | Returns correct user |

**Verification**:
\`\`\`typescript
// Test in Convex dashboard or test page
const user = await ctx.db.query('users')
  .withIndex('by_clerk_id', q => q.eq('clerkId', 'user_xxx'))
  .first()
\`\`\`

### Test 2.2: Primary Entity CRUD Operations

Run this suite against your app's main table — whatever a user creates most of.

**Test Cases**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| 2.2.1 | Create record | Record saved to Convex |
| 2.2.2 | List records | Returns the caller's records only |
| 2.2.3 | Update record | Changes saved |
| 2.2.4 | Delete record | Record removed |
| 2.2.5 | Filter by status | Returns filtered results |
| 2.2.6 | Filter by category | Returns filtered results |

**Verification**:
- [ ] Record has correct `userId`
- [ ] Record has correct `organizationId` (if org context)
- [ ] Timestamps set correctly
- [ ] Status transitions work (draft → in-progress → completed)
- [ ] Filtering happens server-side via an index, not `.collect()` then filter in the client

### Test 2.3: Child Entity CRUD & Ordering

For any table that hangs off the primary entity (line items, comments, attachments, steps).

**Test Cases**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| 2.3.1 | Add child to parent | Created with correct parent ID |
| 2.3.2 | Reorder children | Order field updated correctly |
| 2.3.3 | Update child content | Changes saved |
| 2.3.4 | Delete child | Removed, order recalculated with no gaps |
| 2.3.5 | Query children by parent | Returns all children, in order |

**Verification**:
- [ ] Ordering is stable across refetches
- [ ] Parent reference valid
- [ ] Foreign-key-style `Id<>` references still resolve

### Test 2.4: Asset Upload & Storage

**Objective**: Verify file upload to Convex storage

**Steps**:
1. Generate upload URL via `generateUploadUrl` mutation
2. Upload file to storage URL
3. Save asset metadata via `saveAsset` mutation
4. Retrieve asset URL
5. Verify file accessible

**Expected Results**:
- [ ] Upload URL generated successfully
- [ ] File uploads to Convex storage
- [ ] Storage ID returned
- [ ] Asset metadata saved to database
- [ ] Asset URL returns file

**Test Files**: cover both ends of the size range you allow, plus one file just over the limit
to prove the limit is enforced server-side and not only by the file picker.

### Test 2.5: Relational Data Integrity

**Objective**: Verify foreign key relationships

**Test Cases**:

| Test | Relationship | Expected Behavior |
|------|--------------|-------------------|
| 2.5.1 | Parent → children | Deleting the parent cascades to its children |
| 2.5.2 | Child → assets | Asset references remain valid, no orphaned storage IDs |
| 2.5.3 | User → records | User can query their own records |
| 2.5.4 | Org → records | Org members see org records, and only those |
| 2.5.5 | Deleted parent | Querying a child of a deleted parent fails cleanly, not with a crash |

---

## Phase 3: External API & AI Integration Testing

Every external call in this template lives in a Convex **action** (queries and mutations cannot
reach the network). These tests target that boundary: the action, its retry behaviour, and the
mutation it runs on the way back.

### Test 3.1: Happy Path

**Objective**: Verify a successful external call round-trips into the database

**Steps**:
1. Trigger the action from the UI
2. Confirm the request leaves with the correct credentials and payload
3. Await completion (poll if the provider is asynchronous)
4. Persist the result via `ctx.runMutation`
5. Confirm the UI updates reactively, without a manual refresh

**Expected Results**:
- [ ] Request succeeds
- [ ] Result persisted to Convex
- [ ] Subscribed components re-render with no refetch code
- [ ] Secrets read from environment variables, never from the client

### Test 3.2: Long-Running Jobs

**Objective**: Verify jobs that outlive a single request

**Steps**:
1. Trigger a job whose provider returns a job ID rather than a result
2. Confirm a row is written immediately with status `queued`/`processing`
3. Poll or receive the webhook
4. Confirm the terminal status is written exactly once

**Expected Results**:
- [ ] Status visible to the user for the whole duration
- [ ] Polling backs off rather than hammering the provider
- [ ] A job that never completes ends in `failed`, not stuck in `processing` forever
- [ ] Re-delivered webhooks are idempotent (no duplicate rows, no double charge)

### Test 3.3: Failure Modes

Each of these must be provoked deliberately — a test that never saw the failure has not tested it.

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| 3.3.1 | Invalid API key | Clear error, no partial row written |
| 3.3.2 | Provider timeout | Retry with backoff, then a terminal `failed` status |
| 3.3.3 | Rate limit (429) | Retry honouring `Retry-After` |
| 3.3.4 | Malformed provider response | Rejected by validation, not persisted |
| 3.3.5 | Provider succeeds, mutation fails | Result not silently lost |

### Test 3.4: Usage & Cost Tracking

**Objective**: Verify every billable call is recorded

**Steps**:
1. Trigger each kind of external call
2. Query the usage table
3. Compare against the provider dashboard for the same window

**Expected Results**:
- [ ] Each call tracked exactly once
- [ ] Service and model names recorded in a consistent format
- [ ] Cost computed from the provider response, never hardcoded
- [ ] Credits deducted transactionally with the usage row
- [ ] A failed call does not deduct credits
- [ ] Usage limit enforced server-side before the external call is made


## Phase 4: Error Handling & Edge Cases

### Test 4.1: Authentication Errors

**Test Cases**:

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| 4.1.1 | No auth token | 401 error, redirect to sign-in |
| 4.1.2 | Expired token | Token refreshed automatically |
| 4.1.3 | Invalid token | 401 error, redirect to sign-in |
| 4.1.4 | Org not found | Error message displayed |

### Test 4.2: Database Errors

**Test Cases**:

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| 4.2.1 | Invalid document ID | 404 error with message |
| 4.2.2 | Missing required field | Validation error |
| 4.2.3 | Duplicate entry | Conflict error |
| 4.2.4 | Query timeout | Retry or error message |

### Test 4.3: API Rate Limits

**Test Cases**:

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| 4.3.1 | Hit rate limit | 429 error, retry with backoff |
| 4.3.2 | Concurrent requests | Queue system prevents overload |
| 4.3.3 | Credit exhausted | Error message, block generation |

### Test 4.4: Network Errors

**Test Cases**:

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| 4.4.1 | API timeout | Retry up to 3 times |
| 4.4.2 | Connection lost | Show offline message |
| 4.4.3 | Slow connection | Loading state displayed |

---

## Phase 5: Performance & Load Testing

### Test 5.1: Query Performance

**Objective**: Verify queries are fast

**Metrics** (indicative budgets — set your own, then hold them):
- [ ] Single-document query < 100ms
- [ ] Primary list query < 200ms
- [ ] Child list query < 150ms
- [ ] Asset list query < 200ms
- [ ] No query without a `.withIndex()` on a table that grows unbounded

**Load Test**:
- Run 10 concurrent queries
- Verify response times remain acceptable

### Test 5.2: Storage Performance

**Objective**: Verify file uploads/downloads are fast

**Metrics**:
- [ ] Small file (~1MB) upload completes promptly
- [ ] Largest allowed file completes within your stated limit
- [ ] File download starts < 500ms

### Test 5.3: External API Response Times

**Objective**: Establish a baseline per provider, so a regression is visible

Measure each external call in your app and record the observed range. Do not copy budgets from
another product — a provider's latency is a property of that provider, measure it.

- [ ] Baseline recorded per provider and per operation
- [ ] Any operation slower than its baseline surfaces progress UI to the user
- [ ] Timeouts configured above the observed p99, not guessed

### Test 5.4: Concurrent Users

**Objective**: Verify app handles multiple users

**Test**:
1. Simulate 10 concurrent users
2. Each user creates a record
3. Each user triggers an external call
4. Verify no conflicts or errors

**Expected Results**:
- [ ] No data corruption
- [ ] No rate limit exceeded
- [ ] All users complete successfully

---

## Testing Tools

### Manual Testing
- Browser: Chrome DevTools
- Network tab: Monitor API calls
- Console: Check for errors

### Automated Testing (Future)
- Playwright for E2E tests
- Jest for unit tests
- Convex test framework

---

## Testing Checklist

Before deploying to production:

### Authentication
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] JWT tokens valid
- [ ] Organization context works
- [ ] Permissions enforced

### Database
- [ ] CRUD operations work
- [ ] Indexes perform well
- [ ] Relationships maintained
- [ ] Queries optimized

### AI APIs
- [ ] Each external integration round-trips into the database
- [ ] Long-running jobs reach a terminal status
- [ ] Webhooks are idempotent
- [ ] Cost and usage tracking accurate

### Error Handling
- [ ] Auth errors handled
- [ ] Database errors handled
- [ ] API errors handled
- [ ] Network errors handled
- [ ] Rate limits handled

### Performance
- [ ] Queries under 200ms
- [ ] Uploads complete in reasonable time
- [ ] No memory leaks
- [ ] Concurrent users supported

---

## Reporting Issues

When you find a bug:

1. Document the issue:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots or a screen recording
   - Browser/device info

2. Check logs:
   - Browser console errors
   - Network tab errors
   - Convex dashboard logs
   - Clerk dashboard logs

3. Create issue in GitHub with label:
   - `bug`: General bugs
   - `auth`: Authentication issues
   - `database`: Database issues
   - `api`: AI API issues
   - `performance`: Performance issues

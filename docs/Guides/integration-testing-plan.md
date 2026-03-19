# Integration Testing Plan

End-to-end testing plan for Convex + Clerk + AI APIs integration.

## Testing Phases

### Phase 1: Authentication Flow Testing
### Phase 2: Database Operations Testing  
### Phase 3: AI API Integration Testing
### Phase 4: Error Handling & Edge Cases
### Phase 5: Performance & Load Testing

---

## Phase 1: Authentication Flow Testing (1 hour)

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
4. User A creates project in org
5. User B tries to view project (should succeed)
6. User B tries to delete project (should fail)

**Expected Results**:
- [ ] Admin can create/edit/delete projects
- [ ] Member can view projects
- [ ] Member cannot delete projects
- [ ] Permissions enforced in Convex mutations

---

## Phase 2: Database Operations Testing (1.5 hours)

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

### Test 2.2: Project CRUD Operations

**Objective**: Verify project management

**Test Cases**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| 2.2.1 | Create project | Project saved to Convex |
| 2.2.2 | List projects | Returns user's projects |
| 2.2.3 | Update project | Changes saved |
| 2.2.4 | Delete project | Project removed |
| 2.2.5 | Filter by status | Returns filtered results |
| 2.2.6 | Filter by category | Returns filtered results |

**Verification**:
- [ ] Project has correct `userId`
- [ ] Project has correct `organizationId` (if org context)
- [ ] Timestamps set correctly
- [ ] Status transitions work (draft → in-progress → completed)

### Test 2.3: Scene CRUD Operations

**Objective**: Verify scene management

**Test Cases**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| 2.3.1 | Add scene to project | Scene created with correct projectId |
| 2.3.2 | Update scene order | `sceneNumber` updated correctly |
| 2.3.3 | Update scene content | Changes saved |
| 2.3.4 | Delete scene | Scene removed, order recalculated |
| 2.3.5 | Query scenes by project | Returns all project scenes |

**Verification**:
- [ ] Scenes maintain correct order
- [ ] `projectId` reference valid
- [ ] Asset references (`startFrame`, `endFrame`) valid

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

**Test Files**:
- Image: PNG, JPG (various sizes: 1KB, 1MB, 5MB)
- Video: MP4 (various sizes: 1MB, 10MB, 50MB)
- Audio: MP3 (various sizes: 500KB, 5MB)

### Test 2.5: Relational Data Integrity

**Objective**: Verify foreign key relationships

**Test Cases**:

| Test | Relationship | Expected Behavior |
|------|--------------|-------------------|
| 2.5.1 | Project → Scenes | Deleting project cascades to scenes |
| 2.5.2 | Scene → Assets | Asset references remain valid |
| 2.5.3 | Project → Videos | Videos link to correct project |
| 2.5.4 | User → Projects | User can query their projects |
| 2.5.5 | Org → Projects | Org members see org projects |

---

## Phase 3: AI API Integration Testing (2 hours)

### Test 3.1: Image Generation (fal.ai)

**Objective**: Verify image generation works

**Steps**:
1. Trigger image generation from step-3
2. Pass prompt to fal.ai API
3. Verify job queued
4. Poll for completion
5. Save generated image to Convex storage
6. Verify image URL accessible

**Expected Results**:
- [ ] API request succeeds
- [ ] Job ID returned
- [ ] Polling returns completed status
- [ ] Image URL returned
- [ ] Image saved to Convex storage
- [ ] Image displays in UI

**Error Cases**:
- [ ] Invalid API key handled
- [ ] Timeout handled (30s limit)
- [ ] Rate limit handled (429 error)
- [ ] Invalid prompt handled

### Test 3.2: Video Generation (Kling Video v2.5 Turbo Pro)

**Objective**: Verify video generation works

**Steps**:
1. Select generated images for scene
2. Trigger video generation (Kling v2.5 Turbo Pro)
3. Verify fal.ai API called
4. Poll for completion (can take 1-3 min)
5. Save video to Convex storage
6. Verify video URL accessible

**Expected Results**:
- [ ] API request succeeds
- [ ] Job queued successfully
- [ ] Polling handles long wait times
- [ ] Video URL returned
- [ ] Video saved to Convex storage
- [ ] Video plays in UI

**Error Cases**:
- [ ] Long generation time handled (5+ min)
- [ ] Generation failure handled
- [ ] Retry logic works (max 3 retries)

### Test 3.3: Audio Generation (fal.ai Music & Speech)

**Objective**: Verify audio generation works

**Music Test**:
1. Enter music prompt
2. Trigger music generation (Stable Audio 2.5 or MiniMax Music)
3. Poll for completion
4. Save audio to Convex storage
5. Verify audio plays

**Narration Test**:
1. Enter narration text
2. Select voice
3. Trigger speech generation (MiniMax Speech 2.6 HD)
4. Save audio to Convex storage
5. Verify audio plays

**Expected Results**:
- [ ] Music generation succeeds
- [ ] Narration generation succeeds
- [ ] Audio files saved correctly
- [ ] Audio plays in browser
- [ ] Duration tracked correctly

### Test 3.4: Video Assembly (fal.ai + Rendi)

**Objective**: Verify video assembly works

**Steps**:
1. Complete project with scenes, narration, music
2. Trigger video assembly
3. Step 1 (Parallel A): Rendi mixes narration + music with ducking
4. Step 1 (Parallel B): fal.ai merges scene videos
5. Step 2: fal.ai merges video + mixed audio track
6. Verify final video generated

**Expected Results**:
- [ ] All 3 assembly steps complete
- [ ] Video IDs saved to database
- [ ] Final video URL accessible
- [ ] Video plays with audio synced
- [ ] Duration matches expected

### Test 3.5: Cost Tracking

**Objective**: Verify usage tracking works

**Steps**:
1. Generate image (track cost)
2. Generate video (track cost)
3. Generate audio (track cost)
4. Query `usageTracking` table
5. Verify costs recorded

**Expected Results**:
- [ ] Each API call tracked
- [ ] Model name recorded correctly
- [ ] Cost calculated correctly
- [ ] User credits deducted
- [ ] Usage limit enforced

---

## Phase 4: Error Handling & Edge Cases (1 hour)

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

## Phase 5: Performance & Load Testing (1 hour)

### Test 5.1: Query Performance

**Objective**: Verify queries are fast

**Metrics**:
- [ ] User query < 100ms
- [ ] Project list query < 200ms
- [ ] Scene list query < 150ms
- [ ] Asset list query < 200ms

**Load Test**:
- Run 10 concurrent queries
- Verify response times remain acceptable

### Test 5.2: Storage Performance

**Objective**: Verify file uploads/downloads are fast

**Metrics**:
- [ ] 1MB image upload < 2s
- [ ] 10MB video upload < 10s
- [ ] File download starts < 500ms

### Test 5.3: AI API Response Times

**Objective**: Track AI generation times

**Expected Times**:
- [ ] Image generation: 10-30s
- [ ] Video generation: 2-5 min
- [ ] Music generation: 30-60s
- [ ] Narration generation: 5-15s

### Test 5.4: Concurrent Users

**Objective**: Verify app handles multiple users

**Test**:
1. Simulate 10 concurrent users
2. Each user creates project
3. Each user generates images
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
- [ ] Image generation works
- [ ] Video generation works
- [ ] Audio generation works
- [ ] Video assembly works
- [ ] Cost tracking accurate

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

## Time Estimate

**Total testing time: 6.5 hours**

- Auth testing: 1 hour
- Database testing: 1.5 hours
- AI API testing: 2 hours
- Error handling: 1 hour
- Performance: 1 hour

---

## Reporting Issues

When you find a bug:

1. Document the issue:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/videos
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

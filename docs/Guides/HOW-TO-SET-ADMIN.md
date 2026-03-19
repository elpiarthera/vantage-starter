# How to Set Admin Role for Users

This guide explains how to grant admin access to users in MyShortReel.

---

## Prerequisites

- Access to the project's terminal/command line
- User must have already signed up in the application
- Convex CLI access (comes with the project)

---

## Quick Start

### Set Admin by Email (Recommended)

```bash
cd /home/laurentperello/MyShortReel-beta
npx convex run adminHelpers:setAdminByEmail '{"email": "user@example.com", "role": "admin"}'
```

**Expected Output:**
```json
{
  "success": true,
  "userId": "...",
  "email": "user@example.com",
  "role": "admin",
  "message": "User role updated to admin"
}
```

---

## Role Types

MyShortReel uses a role-based access control system:

| Role | Description | Admin Panel Access |
|------|-------------|-------------------|
| **owner** | Full system access, can manage all resources | ✅ Yes |
| **admin** | Administrative access, can use admin tools | ✅ Yes |
| **member** | Standard user, normal application access | ❌ No |
| **client** | Limited access, client-specific features | ❌ No |

---

## All Available Commands

### 1. Set Admin by Email

Use this when you know the user's email address:

```bash
npx convex run adminHelpers:setAdminByEmail '{"email": "user@example.com", "role": "admin"}'
```

**Change role:**
```bash
# Make user an owner
npx convex run adminHelpers:setAdminByEmail '{"email": "user@example.com", "role": "owner"}'

# Demote to member (remove admin)
npx convex run adminHelpers:setAdminByEmail '{"email": "user@example.com", "role": "member"}'
```

---

### 2. Set Admin by Clerk User ID

Use this when you have the Clerk user ID:

```bash
npx convex run adminHelpers:setAdminByClerkId '{"clerkUserId": "user_xxxxx", "role": "admin"}'
```

**Where to find Clerk User ID:**
- Convex Dashboard → Data → `users` table → Look at `clerkUserId` field
- Clerk Dashboard → Users → Click on user → Copy User ID

---

### 3. List All Admins

Check who currently has admin access:

```bash
npx convex run adminHelpers:listAdmins
```

**Output:**
```json
[
  {
    "userId": "...",
    "email": "admin@example.com",
    "clerkUserId": "user_xxxxx",
    "role": "admin"
  },
  {
    "userId": "...",
    "email": "owner@example.com",
    "clerkUserId": "user_yyyyy",
    "role": "owner"
  }
]
```

---

### 4. Check User Role

Verify a specific user's current role:

```bash
npx convex run adminHelpers:getUserByEmail '{"email": "user@example.com"}'
```

**Output:**
```json
{
  "userId": "...",
  "email": "user@example.com",
  "clerkUserId": "user_xxxxx",
  "role": "member",
  "organizationId": null
}
```

---

## Using the Admin Panel

Once a user has been granted admin role:

1. **Sign in to the application:**
   - Go to your app URL (e.g., `https://your-app.vercel.app/sign-in`)
   - Sign in with the email you set as admin

2. **Access the admin panel:**
   - Navigate to `/admin/wall-builder` (or `/en/admin/wall-builder` with locale)
   - You should now see the Wall Builder interface

3. **Start managing:**
   - Configure tool selection walls
   - Drag and drop to reorder items
   - Add/remove items from walls
   - Toggle items active/inactive

---

## Via Convex Dashboard (Alternative Method)

If you prefer a UI instead of command line:

1. **Go to Convex Dashboard:**
   - Visit: https://dashboard.convex.dev/
   - Select your project (myshortreel)

2. **Navigate to users table:**
   - Click "Data" in the left sidebar
   - Select the `users` table

3. **Find the user:**
   - Search by email or scroll to find the user

4. **Edit the role:**
   - Click on the user row to open details
   - Find the `role` field
   - Click to edit and change to `"admin"` or `"owner"`
   - Save changes

5. **Verify:**
   - The user should now have admin access
   - They may need to sign out and sign back in

---

## Troubleshooting

### "User not found" Error

**Problem:** The email doesn't exist in the database.

**Solution:**
- Verify the user has signed up at least once
- Check for typos in the email address
- Use `getUserByEmail` to verify the email exists

### "Admin Access Required" Still Shows

**Problem:** User sees error even after being set as admin.

**Solution:**
- Sign out completely and sign back in
- Clear browser cookies/cache
- Verify role was set correctly with `getUserByEmail`
- Check browser console for errors

### Changes Don't Take Effect

**Problem:** User role updated but still no access.

**Solution:**
- User must refresh their authentication token (sign out/in)
- Check the `getCurrentUser` query is using the correct field
- Verify the admin check uses `role === "admin" || role === "owner"`

---

## Security Best Practices

1. **Limit Admin Users:**
   - Only grant admin role to trusted users
   - Regularly audit admin list with `listAdmins`

2. **Use Owner Role Sparingly:**
   - Reserve `owner` role for project maintainers
   - Use `admin` role for day-to-day administrators

3. **Track Changes:**
   - Document who was granted admin access and when
   - Keep a log of role changes

4. **Revoke Access:**
   - When someone leaves, change their role to `member`:
     ```bash
     npx convex run adminHelpers:setAdminByEmail '{"email": "former-admin@example.com", "role": "member"}'
     ```

---

## Quick Reference Card

```bash
# Set someone as admin
npx convex run adminHelpers:setAdminByEmail '{"email": "user@example.com", "role": "admin"}'

# Remove admin access (make them member)
npx convex run adminHelpers:setAdminByEmail '{"email": "user@example.com", "role": "member"}'

# List all admins
npx convex run adminHelpers:listAdmins

# Check a user's role
npx convex run adminHelpers:getUserByEmail '{"email": "user@example.com"}'
```

---

## Related Files

- **Admin Helpers:** `convex/adminHelpers.ts` - Contains all admin management functions
- **Admin Page:** `app/[locale]/admin/wall-builder/page.tsx` - Admin panel with auth checks
- **Auth Helper:** `convex/tools.ts` - `requireAdmin()` function used for authorization

---

**Need Help?** Check the Convex logs or browser console for detailed error messages.

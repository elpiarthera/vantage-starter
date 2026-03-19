# Sprint 10 i18n Review: Polar.sh Subscription Integration

**Date**: February 24, 2026  
**Reviewer**: i18n-master  
**Status**: ✅ Review Complete - Translation Keys Required

---

## Executive Summary

This review analyzes the Sprint 10 implementation document from an internationalization (i18n) perspective. The implementation involves integrating Polar.sh for subscription billing, which requires new UI components and toast messages.

**Key Finding**: Several hardcoded strings need to be extracted for translation, and new translation keys are required for the success/error handling flow.

---

## 1. Existing Component Analysis

### 1.1 ManageSubscriptionModal.tsx ✅
**Status**: Already properly internationalized

The component uses `useTranslations("manage_subscription_modal")` and all UI strings are already in `messages/en.json`:
- `plan_name_free`, `plan_name_starter`, `plan_name_pro`, `plan_name_enterprise`
- All feature descriptions (e.g., `free_feature_projects_per_month`)
- Action buttons: `upgrade_button`, `downgrade_button`, `current_plan_button`
- Cancel flow: `cancel_subscription_button`, `cancel_confirm_title`, etc.

### 1.2 SubscriptionTab.tsx ✅
**Status**: Already properly internationalized

Uses `useTranslations("subscription_tab")` with keys already present:
- `current_plan`, `per_month`, `manage_subscription`
- `plan_features`, `current_period`, `payment_method`
- `billing_history`, `status_active`, etc.

### 1.3 PurchaseCreditsModal.tsx ⚠️ HARDCODED STRINGS FOUND
**Status**: Needs i18n extraction

**Hardcoded strings identified**:

```typescript
// Line ~50 - Badge
<div className="...">Popular</div>

// Line ~57 - Bonus text
<span className="...">+${pkg.bonus} bonus</span>

// Line ~62 - Total credits text
<p className="...">Total: ${pkg.amount + pkg.bonus} credits</p>

// Line ~68 - Selected indicator
<span>Selected</span>

// Line ~79 - Payment method title
<span>Payment Method</span>

// Line ~82 - Payment description
<p className="...">
  You will be redirected to our secure payment processor to complete
  your purchase.
</p>

// Line ~95 - Cancel button
<Button ...>Cancel</Button>

// Line ~98 - Purchase button
<Button ...>
  <CreditCard className="h-4 w-4 mr-2" />
  Purchase Credits
</Button>
```

### 1.4 Account Page (app/[locale]/dashboard/account/page.tsx) ✅
**Status**: Already properly internationalized

Uses `useTranslations("account")` with existing keys: `title`, `subtitle`, `error_title`, `error_description`, `sign_in`.

---

## 2. Sprint 10 Proposed Code - i18n Issues

### 2.1 Task 5: Connect UI to Polar Backend

The proposed code in the Sprint 10 document contains **hardcoded toast messages** that need translation keys.

#### Location: `app/dashboard/account/page.tsx` (Success/Cancel Handler)

**Current proposed code (hardcoded)**:
```typescript
// Handle subscription checkout success
if (searchParams.get("subscription") === "success" && user) {
  // ...
  initSubscription({ clerkUserId: user.id, tierKey: tier })
    .then(() => {
      toast.success("Subscription activated! Your credits have been added."); // ❌ Hardcoded
    })
    .catch((err) => {
      toast.error("Subscription active, but credit initialization failed. Contact support."); // ❌ Hardcoded
    });
} else if (searchParams.get("subscription") === "canceled") {
  toast.info("Subscription canceled. No changes were made."); // ❌ Hardcoded
}

// Handle credit purchase success
if (searchParams.get("credits") === "success") {
  toast.success("Credits purchased successfully! They will appear shortly."); // ❌ Hardcoded
} else if (searchParams.get("credits") === "canceled") {
  toast.info("Credit purchase canceled. No charges were made."); // ❌ Hardcoded
}
```

#### Error Messages (hardcoded)
```typescript
// In handleUpgrade:
toast.error("Failed to start checkout. Please try again."); // ❌ Hardcoded

// In handleManageSubscription:
toast.error("Failed to open subscription management. Please try again."); // ❌ Hardcoded
```

#### Loading States (if implemented)
The document mentions these loading states but doesn't show implementation:
- "Processing..."
- "Redirecting to secure checkout..."

---

## 3. Required Translation Keys

### 3.1 New Namespace: `purchase_credits_modal`

For the `PurchaseCreditsModal.tsx` component (needs to be refactored to use `useTranslations`):

```json
{
  "purchase_credits_modal": {
    "title": "Purchase Credits",
    "popular_badge": "Popular",
    "bonus_label": "+{bonus} bonus",
    "total_credits": "Total: {total} credits",
    "selected_label": "Selected",
    "payment_method": "Payment Method",
    "payment_redirect_desc": "You will be redirected to our secure payment processor to complete your purchase.",
    "cancel_button": "Cancel",
    "purchase_button": "Purchase Credits",
    "package_starter": "Starter",
    "package_popular": "Popular",
    "package_pro": "Pro",
    "package_enterprise": "Enterprise"
  }
}
```

### 3.2 New Keys in `billing` Namespace (RECOMMENDED)

Create a new `billing` namespace for all subscription/payment related messages:

```json
{
  "billing": {
    "toast": {
      "subscription_success": "Subscription activated! Your credits have been added.",
      "subscription_success_credits_failed": "Subscription active, but credit initialization failed. Contact support.",
      "subscription_canceled": "Subscription canceled. No changes were made.",
      "credits_purchase_success": "Credits purchased successfully! They will appear shortly.",
      "credits_purchase_canceled": "Credit purchase canceled. No charges were made.",
      "checkout_start_failed": "Failed to start checkout. Please try again.",
      "portal_open_failed": "Failed to open subscription management. Please try again."
    },
    "loading": {
      "processing": "Processing...",
      "redirecting_checkout": "Redirecting to secure checkout..."
    }
  }
}
```

### 3.3 Alternative: Add to `account` Namespace

If you prefer to keep messages closer to where they're used, add to existing `account` namespace:

```json
{
  "account": {
    "existing_keys": "...",
    "toast_subscription_success": "Subscription activated! Your credits have been added.",
    "toast_subscription_credits_failed": "Subscription active, but credit initialization failed. Contact support.",
    "toast_subscription_canceled": "Subscription canceled. No changes were made.",
    "toast_credits_success": "Credits purchased successfully! They will appear shortly.",
    "toast_credits_canceled": "Credit purchase canceled. No charges were made.",
    "error_checkout_start": "Failed to start checkout. Please try again.",
    "error_portal_open": "Failed to open subscription management. Please try again."
  }
}
```

---

## 4. Recommended Implementation Changes

### 4.1 PurchaseCreditsModal.tsx Changes

```typescript
"use client";

import { useTranslations } from "next-intl"; // Add import

export function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const { isMobile } = useDevice();
  const t = useTranslations("purchase_credits_modal"); // Add hook
  
  // ... rest of component

  {pkg.popular && (
    <div className="...">
      {t("popular_badge")} // ✅ Use translation
    </div>
  )}

  <span className="...">
    {t("bonus_label", { bonus: pkg.bonus })} // ✅ Use translation with variable
  </span>

  <p className="...">
    {t("total_credits", { total: pkg.amount + pkg.bonus })} // ✅ Use translation with variable
  </p>

  <span>{t("selected_label")}</span> // ✅ Use translation

  <span>{t("payment_method")}</span> // ✅ Use translation

  <p className="...">
    {t("payment_redirect_desc")} // ✅ Use translation
  </p>

  <Button ...>{t("cancel_button")}</Button> // ✅ Use translation

  <Button ...>
    <CreditCard className="h-4 w-4 mr-2" />
    {t("purchase_button")} // ✅ Use translation
  </Button>
}
```

### 4.2 Account Page Changes (Task 5 Implementation)

```typescript
"use client";

import { useTranslations } from "next-intl"; // Ensure imported

export default function AccountPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const initSubscription = useAction(api.credits.initializeForSubscription);
  const t = useTranslations("billing"); // Add billing namespace

  useEffect(() => {
    if (searchParams.get("subscription") === "success" && user) {
      const tier = searchParams.get("tier") || localStorage.getItem("pendingSubscriptionTier");
      
      if (tier) {
        initSubscription({ clerkUserId: user.id, tierKey: tier })
          .then(() => {
            toast.success(t("toast.subscription_success")); // ✅ Use translation
            localStorage.removeItem("pendingSubscriptionTier");
          })
          .catch((err) => {
            console.error("Failed to initialize subscription:", err);
            toast.error(t("toast.subscription_success_credits_failed")); // ✅ Use translation
          });
      }
    } else if (searchParams.get("subscription") === "canceled") {
      toast.info(t("toast.subscription_canceled")); // ✅ Use translation
      localStorage.removeItem("pendingSubscriptionTier");
    }

    if (searchParams.get("credits") === "success") {
      toast.success(t("toast.credits_purchase_success")); // ✅ Use translation
    } else if (searchParams.get("credits") === "canceled") {
      toast.info(t("toast.credits_purchase_canceled")); // ✅ Use translation
    }
  }, [searchParams, user, initSubscription, t]); // Add t to dependencies
}
```

---

## 5. Translation Keys Summary Table

| Component | Current Status | Action Required |
|-----------|---------------|-----------------|
| `ManageSubscriptionModal.tsx` | ✅ Already i18n ready | None |
| `SubscriptionTab.tsx` | ✅ Already i18n ready | None |
| `PurchaseCreditsModal.tsx` | ⚠️ 8 hardcoded strings | Extract to `purchase_credits_modal` namespace |
| `AccountPage` (proposed) | ❌ 6 hardcoded toast messages | Add to `billing` or `account` namespace |

### New Keys Required

#### For `messages/en.json` (and all 6 other language files):

**New namespace: `purchase_credits_modal`** (8 keys)
```json
{
  "purchase_credits_modal": {
    "title": "Purchase Credits",
    "popular_badge": "Popular",
    "bonus_label": "+{bonus} bonus",
    "total_credits": "Total: {total} credits",
    "selected_label": "Selected",
    "payment_method": "Payment Method",
    "payment_redirect_desc": "You will be redirected to our secure payment processor to complete your purchase.",
    "cancel_button": "Cancel",
    "purchase_button": "Purchase Credits"
  }
}
```

**New namespace: `billing`** (7 keys - RECOMMENDED)
```json
{
  "billing": {
    "toast": {
      "subscription_success": "Subscription activated! Your credits have been added.",
      "subscription_success_credits_failed": "Subscription active, but credit initialization failed. Contact support.",
      "subscription_canceled": "Subscription canceled. No changes were made.",
      "credits_purchase_success": "Credits purchased successfully! They will appear shortly.",
      "credits_purchase_canceled": "Credit purchase canceled. No charges were made."
    },
    "error": {
      "checkout_start_failed": "Failed to start checkout. Please try again.",
      "portal_open_failed": "Failed to open subscription management. Please try again."
    }
  }
}
```

---

## 6. ICU Message Format Check

All new keys use simple strings or basic variable interpolation. No complex plurals or selects required.

- `bonus_label`: Uses `{bonus}` variable ✅
- `total_credits`: Uses `{total}` variable ✅

---

## 7. Naming Convention Assessment

| Proposed Key | Convention Check | Status |
|-------------|------------------|--------|
| `purchase_credits_modal.title` | Matches file path pattern ✅ | ✅ Approved |
| `billing.toast.subscription_success` | Grouped by feature, action-based ✅ | ✅ Approved |
| `purchase_credits_modal.bonus_label` | Uses snake_case ✅ | ✅ Approved |

---

## 8. Implementation Checklist for Sprint 10

### Before Implementation:
- [ ] Add `purchase_credits_modal` namespace to `messages/en.json` (8 keys)
- [ ] Add `billing` namespace to `messages/en.json` (7 keys)
- [ ] Run `pnpm translate` to generate FR, DE, IT, ES, PT, RU translations
- [ ] Run `pnpm i18n:verify` to verify all files are synchronized

### During Implementation:
- [ ] Refactor `PurchaseCreditsModal.tsx` to use `useTranslations("purchase_credits_modal")`
- [ ] Replace all 8 hardcoded strings with `t()` calls
- [ ] Update proposed `AccountPage` code to use `useTranslations("billing")`
- [ ] Replace all toast messages with translation keys

### After Implementation:
- [ ] Verify TypeScript compilation: `npx tsc --noEmit`
- [ ] Test in at least 2 languages (EN + one other)
- [ ] Verify all toast messages display correctly

---

## 9. Questions for Development Team

1. **Namespace Preference**: Should toast messages go in a new `billing` namespace or be added to the existing `account` namespace?

2. **Credit Package Names**: The credit packages (Starter, Popular, Pro, Enterprise) - should these be translated or stay in English? Currently they're defined in a const array without translation keys.

3. **Error Message Detail**: The error message "Failed to start checkout. Please try again." - should we include more specific error reasons (network error, server error, etc.)?

---

## 10. Conclusion

**Overall Assessment**: The existing components are mostly i18n-ready. The main work involves:

1. **Extracting 8 hardcoded strings** from `PurchaseCreditsModal.tsx`
2. **Adding 15 new translation keys** (8 for purchase modal, 7 for billing toast/error messages)
3. **Ensuring the Sprint 10 proposed code** uses `t()` functions instead of hardcoded strings

**Estimated i18n Work**: 30 minutes (adding keys) + 45 minutes (refactoring components) = **~1.25 hours total**

**Risk Level**: Low - No complex ICU patterns needed, just simple string extractions.

---

**Document prepared by**: i18n-master  
**Last Updated**: February 24, 2026

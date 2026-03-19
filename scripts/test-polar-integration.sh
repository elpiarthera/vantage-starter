#!/usr/bin/env bash
# =============================================================================
# Test 7: Polar Integration — Static + API checks
#
# 10 checks:
#   1. Required Convex files exist
#   2. Schema indexes present (by_polar_subscription_id, by_tier_key,
#      by_sort_order, by_polar_product_id)
#   3. Required functions exported (addPurchaseCredits,
#      addMonthlyRenewalCredits, getByPolarProductId, listCreditPackages)
#   4. All POLAR_* env vars set in .env.local
#   5. TypeScript — no errors in Polar files
#   6. Biome — Polar files are lint-clean
#   7. http.ts uses `internal` (not `api`) for all runQuery/runMutation calls
#   8. i18n — all translation files in sync (pnpm i18n:verify)
#   9. All CheckoutLink usages in modals have `lazy` prop (prevents race condition)
#  10. REAL API CALL — Polar sandbox returns HTTP 200 with valid token
# =============================================================================

set -euo pipefail

PASS=0
FAIL=0
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

green() { printf "\033[32m✅ PASS\033[0m %s\n" "$1"; }
red()   { printf "\033[31m❌ FAIL\033[0m %s\n" "$1"; }

check_pass() { green "$1"; PASS=$((PASS + 1)); }
check_fail() { red   "$1"; FAIL=$((FAIL + 1)); }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Polar Integration Checks — $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Required files exist ───────────────────────────────────────────────────
echo "Check 1: Required Convex files exist"
MISSING_FILES=()
for f in \
  "convex/polar.ts" \
  "convex/http.ts" \
  "convex/credits.ts" \
  "convex/subscriptions.ts" \
  "convex/subscriptionTiers.ts"
do
  [[ -f "$ROOT/$f" ]] || MISSING_FILES+=("$f")
done

if [[ ${#MISSING_FILES[@]} -eq 0 ]]; then
  check_pass "polar.ts  http.ts  credits.ts  subscriptions.ts  subscriptionTiers.ts"
else
  check_fail "Missing files: ${MISSING_FILES[*]}"
fi

# ── 2. Schema indexes present ────────────────────────────────────────────────
echo ""
echo "Check 2: Schema indexes present"
MISSING_INDEXES=()
SCHEMA="$ROOT/convex/schema.ts"
for idx in \
  "by_polar_subscription_id" \
  "by_tier_key" \
  "by_sort_order" \
  "by_polar_product_id"
do
  grep -q "\"$idx\"" "$SCHEMA" || MISSING_INDEXES+=("$idx")
done

if [[ ${#MISSING_INDEXES[@]} -eq 0 ]]; then
  check_pass "by_polar_subscription_id  by_tier_key  by_sort_order  by_polar_product_id"
else
  check_fail "Missing indexes: ${MISSING_INDEXES[*]}"
fi

# ── 3. Required functions exported ───────────────────────────────────────────
echo ""
echo "Check 3: Required internal functions exported"
MISSING_FNS=()

grep -q "export const addPurchaseCredits"      "$ROOT/convex/credits.ts"           || MISSING_FNS+=("addPurchaseCredits")
grep -q "export const addMonthlyRenewalCredits" "$ROOT/convex/credits.ts"           || MISSING_FNS+=("addMonthlyRenewalCredits")
grep -q "export const getByPolarProductId"      "$ROOT/convex/subscriptionTiers.ts" || MISSING_FNS+=("getByPolarProductId")
grep -q "export const listCreditPackages"       "$ROOT/convex/subscriptionTiers.ts" || MISSING_FNS+=("listCreditPackages")

if [[ ${#MISSING_FNS[@]} -eq 0 ]]; then
  check_pass "addPurchaseCredits  addMonthlyRenewalCredits  getByPolarProductId  listCreditPackages"
else
  check_fail "Missing functions: ${MISSING_FNS[*]}"
fi

# ── 4. Env vars in .env.local ────────────────────────────────────────────────
echo ""
echo "Check 4: POLAR_* env vars set in .env.local"
ENV_FILE="$ROOT/.env.local"
MISSING_VARS=()

if [[ ! -f "$ENV_FILE" ]]; then
  check_fail ".env.local not found"
else
  for var in \
    "POLAR_ORGANIZATION_TOKEN" \
    "POLAR_WEBHOOK_SECRET" \
    "POLAR_SERVER" \
    "POLAR_PRODUCT_TIER_1" \
    "POLAR_PRODUCT_TIER_2" \
    "POLAR_PRODUCT_TIER_3" \
    "POLAR_PRODUCT_CREDITS_STARTER" \
    "POLAR_PRODUCT_CREDITS_POPULAR" \
    "POLAR_PRODUCT_CREDITS_PRO" \
    "POLAR_PRODUCT_CREDITS_ENTERPRISE"
  do
    grep -q "^${var}=" "$ENV_FILE" || MISSING_VARS+=("$var")
  done

  if [[ ${#MISSING_VARS[@]} -eq 0 ]]; then
    check_pass "All 10 POLAR_* vars present"
  else
    check_fail "Missing vars: ${MISSING_VARS[*]}"
  fi
fi

# ── 5. TypeScript — no errors in Polar files ─────────────────────────────────
echo ""
echo "Check 5: TypeScript — no errors in Polar files"
cd "$ROOT"
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -E "^convex/(polar|http|credits|subscriptions)" || true)

if [[ -z "$TS_ERRORS" ]]; then
  check_pass "No TypeScript errors in Polar files"
else
  check_fail "TypeScript errors in Polar files:"
  echo "$TS_ERRORS" | sed 's/^/    /'
fi

# ── 6. Biome — Polar files lint-clean ────────────────────────────────────────
echo ""
echo "Check 6: Biome lint on Polar files"
BIOME_OUT=$(npx @biomejs/biome check \
  convex/polar.ts \
  convex/http.ts \
  convex/credits.ts \
  convex/subscriptions.ts \
  convex/subscriptionTiers.ts \
  2>&1 || true)

if echo "$BIOME_OUT" | grep -q "error\|Found"; then
  check_fail "Biome reported issues:"
  echo "$BIOME_OUT" | grep -E "error|Found" | sed 's/^/    /'
else
  check_pass "Biome clean on all 5 Polar files"
fi

# ── 7. http.ts uses `internal` for runQuery/runMutation ──────────────────────
echo ""
echo "Check 7: http.ts uses internal (not api) for runQuery/runMutation"
HTTP="$ROOT/convex/http.ts"

# Count total runQuery/runMutation calls.
TOTAL_CALLS=$({ grep -oE "ctx\.(runQuery|runMutation)\(" "$HTTP" 2>/dev/null || true; } | wc -l | tr -d ' ')
# Count internal.* on the SAME line as the call (e.g. ctx.runMutation(internal.foo, {)
INTERNAL_INLINE=$({ grep -oE "ctx\.(runQuery|runMutation)\(internal\." "$HTTP" 2>/dev/null || true; } | wc -l | tr -d ' ')
# Count internal.* on the NEXT line (multiline call style)
INTERNAL_NEXTLINE=$({ grep -oE "^\s+internal\." "$HTTP" 2>/dev/null || true; } | wc -l | tr -d ' ')
INTERNAL_TOTAL=$(( INTERNAL_INLINE + INTERNAL_NEXTLINE ))
# Ensure no call uses api.* (same-line)
API_SAME_LINE=$({ grep -oE "ctx\.(runQuery|runMutation)\(api\." "$HTTP" 2>/dev/null || true; } | wc -l | tr -d ' ')

if [[ "$TOTAL_CALLS" -gt 0 && "$INTERNAL_TOTAL" -ge "$TOTAL_CALLS" && "$API_SAME_LINE" -eq 0 ]]; then
  check_pass "http.ts has $TOTAL_CALLS call(s), all using internal.* — no api.* usage"
elif [[ "$API_SAME_LINE" -gt 0 ]]; then
  check_fail "http.ts has $API_SAME_LINE call(s) using api.* directly — must use internal.*"
elif [[ "$TOTAL_CALLS" -eq 0 ]]; then
  check_fail "http.ts has no ctx.runQuery/ctx.runMutation calls — expected at least 1"
else
  check_fail "http.ts has $TOTAL_CALLS call(s) but only $INTERNAL_TOTAL use internal.* (expected >= $TOTAL_CALLS)"
fi

# ── 8. i18n — translation files in sync ─────────────────────────────────────
echo ""
echo "Check 8: i18n — all translation files in sync (pnpm i18n:verify)"
I18N_OUT=$(cd "$ROOT" && pnpm i18n:verify 2>&1 || true)
if echo "$I18N_OUT" | grep -qi "missing\|error\|mismatch"; then
  check_fail "i18n out of sync — run pnpm translate:"
  echo "$I18N_OUT" | grep -i "missing\|error\|mismatch" | sed 's/^/    /'
else
  check_pass "All 7 translation files in sync — no missing keys"
fi

# ── 9. All CheckoutLink usages have `lazy` prop ───────────────────────────────
echo ""
echo "Check 9: All CheckoutLink usages in modals have 'lazy' prop (prevents race condition)"

MODAL_FILES=(
  "$ROOT/components/dashboard/account/modals/ManageSubscriptionModal.tsx"
  "$ROOT/components/dashboard/account/modals/PurchaseCreditsModal.tsx"
)
MISSING_LAZY=()

for modal in "${MODAL_FILES[@]}"; do
  if [[ ! -f "$modal" ]]; then
    MISSING_LAZY+=("$(basename "$modal") not found")
    continue
  fi
  # Extract each <CheckoutLink block and check it has a lazy prop before the closing >
  # Strategy: find line numbers of <CheckoutLink, then look for `lazy` within the next 10 lines
  while IFS= read -r line_num; do
    block=$(sed -n "${line_num},$((line_num + 10))p" "$modal")
    if ! echo "$block" | grep -q '\blazy\b'; then
      MISSING_LAZY+=("$(basename "$modal"):${line_num} — CheckoutLink missing 'lazy'")
    fi
  done < <(grep -n '<CheckoutLink' "$modal" | cut -d: -f1)
done

if [[ ${#MISSING_LAZY[@]} -eq 0 ]]; then
  check_pass "All CheckoutLink instances have 'lazy' — no concurrent checkout race condition"
else
  check_fail "CheckoutLink missing 'lazy' prop (concurrent calls cause 'customer already exists' error):"
  for m in "${MISSING_LAZY[@]}"; do
    echo "    $m"
  done
fi

# ── 10. Real Polar sandbox API call ──────────────────────────────────────────
echo ""
echo "Check 10: Real Polar sandbox API — GET /v1/products/ returns HTTP 200"

TOKEN=$(grep "^POLAR_ORGANIZATION_TOKEN=" "$ROOT/.env.local" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [[ -z "$TOKEN" ]]; then
  check_fail "POLAR_ORGANIZATION_TOKEN not found in .env.local — cannot make API call"
else
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "https://sandbox-api.polar.sh/v1/products/?limit=1" \
    2>/dev/null || echo "000")

  if [[ "$HTTP_STATUS" == "200" ]]; then
    check_pass "Polar sandbox API returned HTTP $HTTP_STATUS — token valid, sandbox reachable"
  else
    check_fail "Polar sandbox API returned HTTP $HTTP_STATUS (expected 200)"
  fi
fi



# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: $PASS passed / $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
exit 0

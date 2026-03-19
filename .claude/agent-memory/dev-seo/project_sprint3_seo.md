---
name: Sprint 3 SEO layer
description: SEO infrastructure built during Sprint 3 — files created, patterns used, env var convention
type: project
---

SEO layer ported from VantageCRM and adapted for VantageStarter.

**Why:** Sprint 3 task 3.2 — establish SEO baseline before launch.

**Files created/modified:**
- `app/sitemap.ts` — 12 URLs: landing (EN+FR), waitlist, auth, legal, accessibility pages
- `app/robots.ts` — disallows /api/, /admin/, /dashboard/, /guided/, /tools/, /settings/
- `app/opengraph-image.tsx` — 1200x630, amber brand color oklch(0.62 0.16 44), edge runtime
- `app/layout.tsx` — SoftwareApplication JSON-LD, metadataBase, title template, hreflang EN+FR
- `next.config.mjs` — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy added before CSP
- `convex/lib/auth.ts` — RBAC helpers (requireAdmin, requireAuth, requireUser, getAuthUserId) adapted for MSR's clerkUserId field (NOT tokenIdentifier/clerkId like VantageCRM)
- `convex/adminHelpers.ts` — wired requireAdmin into all 4 functions

**Base URL convention:** `process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai"` — set NEXT_PUBLIC_SITE_URL in .env.local for local dev.

**Accessibility pages created (4):**
- `/[locale]/accessibility` (EN declaration)
- `/[locale]/accessibilite` (FR declaration)
- `/[locale]/accessibility-plan` (EN improvement plan)
- `/[locale]/schema-accessibilite` (FR schéma pluriannuel)

All pages have generateMetadata with per-page canonical + hreflang EN/FR.

**How to apply:** When adding new public routes, add them to sitemap.ts. Admin/API routes go in robots.ts disallow list.

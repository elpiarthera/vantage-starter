# VantageStarter Design System v2 — Exact Specs

**Reference:** https://hacks.elevenlabs.io/
**Goal:** From "SaaS template" to "designed product"
**Principle:** Restraint. One accent per element. Let typography and whitespace work.

---

## 1. Typography

### Fonts
| Role | Font | Source | Weight range |
|------|------|--------|-------------|
| **Headings** | Space Grotesk | Google Fonts | 500, 700 |
| **Body** | Inter | Google Fonts | 400, 500 |
| **Code** | Geist Mono | keep current | 400 |

**Why Space Grotesk:** Geometric, distinctive letterforms (the "g", the "a"), instantly recognizable. Not Inter, not Instrument Sans, not the font every other boilerplate uses.

### Scale
| Element | Size | Weight | Letter spacing | Line height |
|---------|------|--------|---------------|-------------|
| H1 (hero) | `clamp(2.5rem, 6vw, 4.5rem)` | 700 | -0.03em | 1.05 |
| H2 (section) | `clamp(1.75rem, 3.5vw, 2.75rem)` | 700 | -0.025em | 1.15 |
| H3 (card) | 1.25rem / 20px | 500 | -0.015em | 1.3 |
| Body | 1rem / 16px | 400 | -0.01em | 1.6 |
| Small / caption | 0.875rem / 14px | 400 | 0em | 1.5 |
| Eyebrow / badge | 0.75rem / 12px | 500 | 0.05em (WIDE) | 1 |
| Nav link | 0.875rem / 14px | 500 | 0em | 1 |

### Rules
- H1 is SMALLER than before (was 6rem, now 4.5rem max) — impact comes from font quality, not size
- Eyebrow text (above H1, above H2) is always uppercase, wide-tracked, 12px, muted color
- No gradient text on headings — single color, let the font speak

---

## 2. Color Palette

### Dark mode (primary — landing page is dark-only above the fold)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.08 0.01 240)` | Page background — near-black with blue-ish undertone |
| `--foreground` | `oklch(0.93 0.01 240)` | Primary text — warm white |
| `--muted-foreground` | `oklch(0.55 0.01 240)` | Secondary text, captions |
| `--primary` | `oklch(0.62 0.18 240)` | Accent — desaturated electric blue (less neon) |
| `--primary-foreground` | `oklch(0.08 0.01 240)` | Text on primary |
| `--accent-warm` | `oklch(0.75 0.14 65)` | Warm accent — gold/amber for highlights, badges |
| `--card` | `oklch(0.12 0.015 240)` | Card surface — barely lighter than bg |
| `--card-hover` | `oklch(0.15 0.02 240)` | Card hover state |
| `--border` | `oklch(0.20 0.02 240)` | Subtle borders — barely visible |
| `--border-hover` | `oklch(0.30 0.03 240)` | Border on hover — slightly more visible |
| `--muted` | `oklch(0.14 0.01 240)` | Muted background surfaces |

### Key color rules
- **Primary blue is used SPARINGLY** — only for: CTA buttons, one accent word, active states
- **Warm accent (gold)** — for: badges, eyebrow text, pricing highlights, "new" indicators
- **No blue glow shadows.** No `shadow-primary/20`. No `ring-primary/30`. These are template signals.
- **Borders are barely visible** — 20% lightness, not 24%. Separation through spacing, not lines.

---

## 3. Shape Language

### Border radius
| Element | Radius | Rationale |
|---------|--------|-----------|
| Cards | `0px` | Sharp, editorial. Confidence. |
| Buttons | `999px` (full pill) | Contrast with sharp cards — intentional. |
| Inputs | `0px` | Match cards |
| Badges / pills | `999px` | Match buttons |
| Images | `0px` | Sharp |
| Avatars | `999px` (circle) | Only round element besides buttons |

**This is the ElevenLabs pattern:** sharp rectangles everywhere, pills for interactive elements. The contrast between sharp and round is the design language.

### Shadows
- **Cards:** No box-shadow at rest. On hover: `0 1px 2px oklch(0 0 0 / 0.3)` — barely there.
- **Buttons:** No shadow. Ever.
- **Modals/popovers:** `0 4px 24px oklch(0 0 0 / 0.5)` — soft, large, distant.
- **No colored shadows.** No blue glow. No primary/20 drop shadow.

---

## 4. Spacing

### Base unit: 8px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Icon gaps, inline spacing |
| `--space-sm` | 8px | Tight internal padding |
| `--space-md` | 16px | Default internal padding |
| `--space-lg` | 24px | Card padding |
| `--space-xl` | 32px | Section internal spacing |
| `--space-2xl` | 48px | Between card groups |
| `--space-3xl` | 80px | Between major sections |
| `--space-4xl` | 120px | Hero vertical padding |

### Section rhythm
- Between major sections: `py-20 md:py-32` (80px / 128px) — MORE than before
- Between heading and content: `mb-12 md:mb-16` (48px / 64px)
- Between cards in a grid: `gap-4 md:gap-6` (16px / 24px) — LESS than before (tighter grid)
- Card internal padding: `p-6 md:p-8` (24px / 32px)

---

## 5. Components — Exact Specs

### Nav
- Height: 64px
- Background: `transparent` (no blur, no backdrop) until scroll, then `bg-background/80 backdrop-blur-md`
- Logo: "VantageStarter" in Space Grotesk 700, no icon box — just text
- Links: Inter 500, 14px, muted-foreground, hover → foreground
- CTA: pill button, small (h-8), primary background
- Border bottom: none at top, `1px border-border` after scroll
- Mobile: hamburger → full-screen overlay (not dropdown)

### Hero
- Background: pure `#000000` (not 0a0a0a)
- Min height: `100vh` (not 85vh) — full viewport, confident
- Layout: centered text, no split layout
- Eyebrow: uppercase, 12px, wide tracking, `--accent-warm` color
- H1: Space Grotesk 700, max 4.5rem, white, single line max 18ch
- Subtitle: Inter 400, 18px, muted-foreground, max 50ch, centered
- CTAs: two pill buttons side by side
  - Primary: `--primary` bg, white text, h-12
  - Secondary: transparent bg, `border border-border`, foreground text, h-12
- Shader: keep the generative tree, but BEHIND a dark overlay at 40% opacity — it's texture, not the hero
- Bottom fade: 200px gradient from `#000` to `--background`
- No vignette overlay. No gradient text. Clean.

### Feature cards
- Grid: 3 columns on desktop, 1 on mobile
- Card: `bg-card`, `border border-border`, `p-8`, NO border-radius (sharp)
- Hover: `border-border-hover` + `bg-card-hover` — subtle shift, no scale, no shadow
- Icon: 20px, `--muted-foreground` color, no container box — bare icon
- Title: H3, 20px, Space Grotesk 500
- Description: body, muted-foreground
- Primary card (if any): `border-primary` left border only (4px), not full border

### Pricing
- 3 columns, equal height
- Each card: `bg-card`, `border border-border`, sharp edges, `p-8`
- Highlighted (Pro): `border-primary` (1px, not 2px), NO scale, NO ring, NO shadow
  - Badge: pill, `bg-accent-warm`, black text, "Most popular"
  - That's it. One signal. Not four competing signals.
- Price: Space Grotesk 700, 48px
- Period: Inter 400, 14px, muted-foreground
- Features list: 16px, check icon in `--primary` for highlighted, `--muted-foreground` for others
- CTA: pill button, full width
  - Highlighted: primary bg
  - Others: outline (border-border, transparent bg)

### Testimonials
- Remove dashed borders entirely
- Simple: avatar (circle, 48px) + name + role + quote
- Quote: Inter 400, 16px, italic, foreground
- Name: Space Grotesk 500, 14px
- Role: Inter 400, 14px, muted-foreground
- If placeholder: show nothing. Don't show skeleton. Either real content or remove section.

### Footer
- Minimal: logo text left, links right, single row
- Border top: `1px border-border`
- Background: same as page (`--background`)
- Links: 14px, muted-foreground, hover → foreground
- No language/theme toggle in footer — only in nav
- Copyright: 14px, muted-foreground
- Padding: `py-8`

---

## 6. Animation

### Principles
- **Entrance only.** Elements fade in once. No hover animations on cards.
- **Subtle.** Max 20px translateY, 400ms duration, ease-out.
- **Stagger:** 50ms between sibling elements.
- **No scale transitions.** No `hover:scale-105`. No `scale-[1.02]`.

### Scroll reveals
- Sections: `opacity 0 → 1`, `translateY 20px → 0`, 400ms, ease-out
- Trigger: `whileInView`, `once: true`, `amount: 0.15`
- Initial state: `opacity: 0` is OK but with `amount: 0.15` (not 0.01 — prevents invisible sections)

### Hover states
- Cards: border color shift + background shift only. 150ms transition.
- Buttons: opacity 0.9 on hover. 100ms.
- Links: color shift only.
- **Nothing moves, scales, or glows on hover.**

### Noise texture
- Keep it. But reduce to 2% opacity (from 3%).

---

## 7. Deletions (remove from current design)

1. **Delete** all `shadow-primary/*` (blue glow) from every component
2. **Delete** `ring-2 ring-primary/30` from Pro card
3. **Delete** `scale-[1.02]` from Pro card
4. **Delete** gradient backgrounds on feature cards (`from-primary/8 via-primary/4`)
5. **Delete** the 48px icon container box on primary feature card
6. **Delete** border-radius from all cards (set to 0)
7. **Delete** gradient text on H1 (`bg-gradient-to-r ... bg-clip-text`)
8. **Delete** the vignette overlay from hero
9. **Delete** theme toggle from footer (keep in nav only)
10. **Delete** language toggle from footer (keep in nav only)
11. **Delete** testimonials section entirely if content is placeholder
12. **Delete** `hover:shadow-md` from feature cards

---

## 8. Implementation Order

1. **Typography** — swap fonts, update scale (layout.tsx, tailwind.config.ts, globals.css)
2. **Colors** — update dark-electric-blue.css preset, remove blue glow tokens
3. **Shape** — border-radius to 0 on cards, 999px on buttons/badges
4. **Hero** — simplify to centered layout, full viewport, clean
5. **Features** — sharp cards, bare icons, subtle hover
6. **Pricing** — single highlight signal, remove competing effects
7. **Nav + Footer** — minimal, text logo, clean
8. **Verify** — screenshot both sites, compare side by side

Each phase: implement → screenshot → compare → next phase. Never batch.

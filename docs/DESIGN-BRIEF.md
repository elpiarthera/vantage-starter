# VantageStarter — Complete Design Brief

**Version:** 1.0
**Date:** 2026-03-19
**Author:** agency-artistic-director
**Status:** Approved — implement without deviation

---

## CRITICAL DIAGNOSIS — What Is Broken Right Now

Before any design work begins, understand the root cause of every visual problem:

**There are TWO `globals.css` files and the wrong one is active.**

- `styles/globals.css` — OLD. HSL-based. Gray neutral. No amber. This is what the browser sees if imported from `_app.tsx` or layout. This produces the "2000s peachy/gray default" symptom.
- `app/globals.css` — CORRECT. OKLCH. Amber primary defined. This is the design system.

**The `styles/globals.css` must be deleted or its import removed immediately.** Every visual symptom (flat light mode, no warmth in dark mode, no personality) traces back to the active CSS file being the wrong one.

Additionally, `tailwind.config.ts` sidebar tokens still use `hsl(var(...))` with HSL CSS variables. These must be converted to OKLCH to match the rest of the system.

Font status: `Instrument Sans` is correctly registered in `tailwind.config.ts` `fontFamily.sans` and in `app/globals.css` `body`. But if the wrong CSS file is active, the font-family declaration in `body` is absent. Fix the CSS file issue first — the font is already wired correctly.

---

## 1. COLOR SYSTEM

### 1.1 Design Decisions

- **Color space:** OKLCH throughout. Never HSL, never hex (except third-party API constraints).
- **Primary hue:** 44° (warm amber-gold). Not blue (220–240°), not purple (270–290°), not green.
- **Tinted neutrals:** all grays carry 0.01–0.04 chroma at hue 44°. Pure neutral gray (`chroma: 0`) is banned from cards, backgrounds, and borders — it reads as generic.
- **Dark mode philosophy:** deeper black (`0.10`) as base, not dark gray. Cards are slightly lighter (`0.15`) and carry a trace of amber chroma (`0.01`) — this is what creates "warmth in dark mode." Without the chroma, dark mode is indistinguishable from every other dark theme.

### 1.2 Light Mode Token Values

```css
/* app/globals.css :root — exact values */

--background:           oklch(0.99 0 0);
--foreground:           oklch(0.12 0 0);

--card:                 oklch(0.99 0 0);
--card-foreground:      oklch(0.12 0 0);

--popover:              oklch(0.99 0 0);
--popover-foreground:   oklch(0.12 0 0);

/* Primary — warm amber-gold
   Dark foreground (0.12) not white — contrast 4.99:1 (WCAG AA pass) */
--primary:              oklch(0.62 0.16 44);
--primary-foreground:   oklch(0.12 0 0);

/* Secondary — very subtle amber tint */
--secondary:            oklch(0.96 0.01 44);
--secondary-foreground: oklch(0.20 0 0);

/* Muted — neutral, no hue */
--muted:                oklch(0.96 0.00 0);
--muted-foreground:     oklch(0.52 0 0);

/* Accent — warm amber hover surface */
--accent:               oklch(0.94 0.04 44);
--accent-foreground:    oklch(0.20 0 0);

/* Destructive — red-orange */
--destructive:          oklch(0.55 0.22 25);
--destructive-foreground: oklch(0.99 0 0);

/* Borders and inputs — warm tint */
--border:               oklch(0.90 0.01 44);
--input:                oklch(0.90 0.01 44);
--ring:                 oklch(0.62 0.16 44);

/* Status */
--success:              oklch(0.55 0.18 145);
--warning:              oklch(0.72 0.18 65);

/* Border radius */
--radius:               0.75rem; /* 12px */
```

### 1.3 Dark Mode Token Values

```css
/* app/globals.css .dark — exact values */

--background:           oklch(0.10 0 0);
--foreground:           oklch(0.97 0 0);

/* Cards: SLIGHTLY lighter than background + amber chroma trace */
--card:                 oklch(0.15 0.01 44);
--card-foreground:      oklch(0.97 0 0);

--popover:              oklch(0.15 0.01 44);
--popover-foreground:   oklch(0.97 0 0);

/* Primary — slightly brighter in dark mode */
--primary:              oklch(0.72 0.16 44);
--primary-foreground:   oklch(0.10 0 0);

/* Secondary */
--secondary:            oklch(0.22 0.02 44);
--secondary-foreground: oklch(0.97 0 0);

/* Muted */
--muted:                oklch(0.18 0.00 0);
--muted-foreground:     oklch(0.65 0 0);

/* Accent */
--accent:               oklch(0.22 0.04 44);
--accent-foreground:    oklch(0.97 0 0);

/* Destructive */
--destructive:          oklch(0.65 0.22 25);
--destructive-foreground: oklch(0.99 0 0);

/* Borders — subtle white-on-dark */
--border:               oklch(1.00 0 0 / 10%);
--input:                oklch(1.00 0 0 / 12%);
--ring:                 oklch(0.72 0.16 44);

/* Status */
--success:              oklch(0.65 0.18 145);
--warning:              oklch(0.78 0.18 65);
```

### 1.4 Sidebar Tokens — Convert from HSL to OKLCH

The `tailwind.config.ts` and `app/globals.css` sidebar section still uses HSL. Replace entirely:

```css
/* In :root */
--sidebar-background:           oklch(0.97 0.005 44);
--sidebar-foreground:           oklch(0.25 0 0);
--sidebar-primary:              oklch(0.62 0.16 44);
--sidebar-primary-foreground:   oklch(0.12 0 0);
--sidebar-accent:               oklch(0.93 0.02 44);
--sidebar-accent-foreground:    oklch(0.20 0 0);
--sidebar-border:               oklch(0.90 0.01 44);
--sidebar-ring:                 oklch(0.62 0.16 44);

/* In .dark */
--sidebar-background:           oklch(0.12 0.01 44);
--sidebar-foreground:           oklch(0.90 0 0);
--sidebar-primary:              oklch(0.72 0.16 44);
--sidebar-primary-foreground:   oklch(0.10 0 0);
--sidebar-accent:               oklch(0.20 0.02 44);
--sidebar-accent-foreground:    oklch(0.90 0 0);
--sidebar-border:               oklch(1.00 0 0 / 8%);
--sidebar-ring:                 oklch(0.72 0.16 44);
```

In `tailwind.config.ts`, update sidebar colors from `hsl(var(...))` to `oklch(var(...))`.

### 1.5 Data Visualization Colors

```css
--chart-1: oklch(0.62 0.16 44);   /* amber-gold — primary */
--chart-2: oklch(0.60 0.14 200);  /* teal */
--chart-3: oklch(0.52 0.12 260);  /* blue */
--chart-4: oklch(0.72 0.18 120);  /* green */
--chart-5: oklch(0.65 0.20 0);    /* red */

/* dark mode */
--chart-1: oklch(0.72 0.16 44);
--chart-2: oklch(0.68 0.16 200);
--chart-3: oklch(0.62 0.16 260);
--chart-4: oklch(0.70 0.20 120);
--chart-5: oklch(0.68 0.22 0);
```

---

## 2. TYPOGRAPHY

### 2.1 Font Stack

```
Display + Body: Instrument Sans (Google Fonts or next/font/google)
Code:           Geist Mono
Banned:         Inter, Plus Jakarta Sans, DM Sans, Outfit, Roboto, Arial
```

**Instrument Sans is already in `tailwind.config.ts`** as `fontFamily.sans`. It is also set in `app/globals.css` `body`. The font is not loading in the browser because `styles/globals.css` (the wrong file) overrides it with Geist Sans. Fix: delete/deactivate `styles/globals.css`.

**Verify loading:** add to the layout file's `<html>` or `<head>`:
```tsx
// app/layout.tsx or app/[locale]/layout.tsx
import { Instrument_Sans } from 'next/font/google'
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
  weight: ['400', '500', '600'],
})
// Apply: <html className={instrumentSans.variable}>
// In tailwind.config.ts fontFamily.sans: ['var(--font-instrument-sans)', 'system-ui', 'sans-serif']
```

### 2.2 Type Scale

All sizes defined for desktop. Mobile scales down one step via Tailwind responsive prefix or `clamp()`.

| Role | Element | Size | Weight | Line-height | Letter-spacing |
|------|---------|------|--------|-------------|----------------|
| Hero H1 | `h1.hero` | `clamp(3rem, 6vw, 5rem)` (48–80px) | 600 | 1.05 | `-0.03em` |
| Section H2 | `h2` | `2rem` (32px) | 600 | 1.2 | `-0.03em` |
| Card H3 | `h3` | `1.25rem` (20px) | 600 | 1.3 | `-0.02em` |
| Body | `p`, `li` | `1rem` (16px) | 400 | 1.6 | `-0.01em` |
| Small / Caption | `.text-sm` | `0.875rem` (14px) | 400 | 1.5 | `-0.01em` |
| Code | `code`, `pre` | `0.875rem` (14px) | 400 | 1.6 | `0em` |
| Subheadline | `.text-muted` | `1rem` (16px) | 400 | 1.6 | `-0.01em` |
| Badge / Tag | `.badge` | `0.75rem` (12px) | 500 | 1 | `0.02em` |

**Locked rules:**
- Weight cap: 600 maximum. Never 700 or 800.
- No all-caps headings. Ever.
- No gradient text on headings (gradient-text utility exists for landing page callouts only — one sentence max).
- H1 in the hero: `text-balance` for natural line breaks on mobile.
- Letter-spacing on H1/H2 applied globally in `app/globals.css` already: `h1, h2 { letter-spacing: -0.03em; }`.

### 2.3 Code Blocks

```css
font-family: 'Geist Mono', monospace;
font-size: 0.875rem;
color: oklch(0.72 0.12 44); /* amber-tinted in dark mode */
background: oklch(0.13 0.01 44); /* very dark amber surface */
border: 1px solid oklch(1.00 0 0 / 8%);
border-radius: 8px;
padding: 1rem 1.25rem;
```

---

## 3. SPACING SYSTEM

This is a contract. Every component uses these values. No exceptions without explicit note.

| Context | Tailwind classes | px equivalent |
|---------|-----------------|---------------|
| Section vertical padding | `py-20 md:py-32` | 80px / 128px |
| Content max-width | `max-w-5xl mx-auto px-6` | 1024px max, 24px side padding |
| Wide content max-width | `max-w-6xl mx-auto px-6` | 1152px max |
| Grid gutter | `gap-8 md:gap-12` | 32px / 48px |
| Card internal padding | `p-6` | 24px |
| Inline element gap | `gap-3` | 12px |
| Button padding | `px-4 py-2` (sm) / `px-6 py-3` (default) | — |
| Sidebar width | `w-64` collapsed `w-[72px]` | 256px / 72px |

**4-point base grid:** all spacing values are multiples of 4px (4, 8, 12, 16, 24, 32, 48, 64, 96).

---

## 4. BORDER RADIUS CONTRACT

| Element | Value | Tailwind class |
|---------|-------|----------------|
| Cards, dialogs, panels | 12px | `rounded-xl` |
| Buttons | 8px | `rounded-lg` |
| Inputs | 8px | `rounded-lg` |
| Badges, tags, pills | 9999px | `rounded-full` |
| Small UI chips | 6px | `rounded-sm` (custom: 6px) |
| Images in cards | 8px inner | `rounded-lg` |

Note: `tailwind.config.ts` already sets `borderRadius.xl = 12px` and `borderRadius.lg = 8px`. Use these — do not use arbitrary values.

---

## 5. ANIMATION PHILOSOPHY

### 5.1 The Rule

**Premium signal = restraint. Every animation that draws attention to itself is a commodity signal.**

Two systems. Clear boundary:
- **Framer Motion:** landing page hero entrance ONLY. One component. Never inside the authenticated app.
- **Tailwind transitions:** all hover states, state changes, sidebar transitions, modals, sheets. Defined via `transition-all duration-150 ease-out` or `transition-colors duration-200`.

### 5.2 Timing Reference

| Type | Duration | Easing | Use case |
|------|----------|--------|----------|
| Micro feedback | 150ms | ease-out | Hover color, button active state |
| State change | 200ms | ease-out | Checkbox, toggle, dropdown open |
| Panel | 200ms | ease-out | Sheet drawer, dialog enter |
| Entrance (CSS) | 300ms | ease-out | Section reveal-up on scroll |
| Entrance (Framer) | 400ms | ease-out | Hero H1 + subline stagger |
| Exit | 75% of enter | same | Modals, panels — shorter than enter |

**Banned:** bounce, elastic, spring, anything with overshoot. Banned durations: >500ms inside the app. No width/height/margin animations — only `transform` and `opacity`.

### 5.3 Framer Motion Hero Entrance

```tsx
// Hero headline
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: 'easeOut' }}

// Hero subline (staggered after headline)
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}

// Hero CTA button (after subline)
transition={{ delay: 0.16 }}
```

Maximum stagger delay between elements: 80ms. Total entrance sequence: under 600ms from page load to fully visible.

### 5.4 Scroll Reveal (CSS only)

Used only on: the bridging callout between demo and stack sections, and the final CTA section. NOT on every section. Restraint is the signal.

```css
/* Already in app/globals.css — use .animate-reveal-up */
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-reveal-up { animation: reveal-up 300ms ease-out forwards; }
```

Implement with IntersectionObserver in a `useScrollReveal` hook. Add `opacity-0` by default; add `animate-reveal-up` class when element enters viewport.

### 5.5 What Does NOT Animate

- Feature cards (no scale, no translate on hover — only color transition)
- Section backgrounds
- Nav links (color only)
- Pricing cards (color + shadow only)
- Dashboard content (nothing — Framer is banned in the app)

---

## 6. RADIANT SHADER INTEGRATION

### 6.1 Component Architecture

Create a universal `<ShaderBackground>` component. Any page can use it. The hero uses it. Other landing sections can optionally use it.

```tsx
// components/shaders/ShaderBackground.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion'; // or a simple hook

interface ShaderBackgroundProps {
  shader?: 'fluid-amber' | 'flow-field' | 'velvet-spotlight' | 'gilt-mosaic';
  opacity?: number;      // default 0.6
  timeScale?: number;    // default 0.08 (slower = calmer)
  className?: string;
}

export function ShaderBackground({
  shader = 'fluid-amber',
  opacity = 0.6,
  timeScale = 0.08,
  className = '',
}: ShaderBackgroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'param', name: 'timeScale', value: timeScale },
        '*'
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [timeScale, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div
        className={`absolute inset-0 bg-gradient-to-br from-amber-950/30 via-background to-background ${className}`}
      />
    );
  }

  return (
    <>
      {/* CSS fallback for WebGL unavailable */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-background to-background" />
      <iframe
        ref={iframeRef}
        src={`/shaders/${shader}.html`}
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{ border: 'none', pointerEvents: 'none', opacity }}
        aria-hidden="true"
        tabIndex={-1}
        loading="lazy"
      />
    </>
  );
}
```

### 6.2 Shader Files to Download

Download to `public/shaders/`:

| File | Use | Type | Size |
|------|-----|------|------|
| `fluid-amber.html` | Hero background | WebGL | ~20 KB |
| `velvet-spotlight.html` | Final CTA section | Canvas 2D | ~16 KB |
| `flow-field.html` | Optional: features section | Canvas 2D | ~18 KB |

Source: `https://raw.githubusercontent.com/pbakaus/radiant/main/static/[name].html`

**Do not bundle via npm — copy HTML files directly to `public/shaders/`.**

### 6.3 Hero Usage

```tsx
// In hero-section.tsx
<section className="relative min-h-screen flex items-center overflow-hidden">
  {/* Layer 1: Shader background */}
  <ShaderBackground shader="fluid-amber" opacity={0.55} timeScale={0.07} />

  {/* Layer 2: Gradient fade to background at bottom */}
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

  {/* Layer 3: Content — must pass WCAG AA contrast */}
  <div className="relative z-10 max-w-5xl mx-auto px-6 py-32">
    {/* hero content */}
  </div>
</section>
```

### 6.4 Mobile Handling

`fluid-amber` is WebGL — works on mobile (DPR capped at 2x). No special treatment needed beyond `loading="lazy"`.

For `velvet-spotlight` and `flow-field` (Canvas 2D, CPU-intensive): render a static CSS gradient fallback on mobile:

```tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
if (isMobile) return <StaticGradientFallback />;
```

---

## 7. CARD DESIGN

### 7.1 Base Card Style

Cards in VantageStarter are NOT generic white boxes. They carry the amber system through small but deliberate signals.

**Default card (light mode):**
```css
background: oklch(0.99 0 0);   /* white */
border: 1px solid oklch(0.90 0.01 44); /* warm border, not pure gray */
border-radius: 12px;           /* rounded-xl */
padding: 24px;                 /* p-6 */
box-shadow: 0 1px 3px oklch(0 0 0 / 6%), 0 1px 2px oklch(0 0 0 / 4%);
```

**Default card (dark mode):**
```css
background: oklch(0.15 0.01 44); /* slightly lighter than bg, amber trace */
border: 1px solid oklch(1.00 0 0 / 10%);
box-shadow: none; /* dark mode uses surface lightness for depth, not shadows */
```

### 7.2 Elevated Feature Card (Landing Page)

Feature cards have a subtle amber top-border accent on hover — not a colored left border (that's the "lazy accent" anti-pattern).

```css
/* Default state */
background: oklch(0.99 0 0);
border: 1px solid oklch(0.90 0.01 44);
border-radius: 12px;
padding: 24px;
transition: border-color 150ms ease-out, box-shadow 150ms ease-out;

/* Hover state */
border-color: oklch(0.62 0.16 44 / 30%); /* amber tint on border */
box-shadow: 0 4px 16px oklch(0.62 0.16 44 / 8%); /* amber glow */
```

Dark mode hover:
```css
border-color: oklch(0.72 0.16 44 / 25%);
box-shadow: 0 4px 24px oklch(0.72 0.16 44 / 10%);
```

**No `hover:scale-105`. No `hover:-translate-y-1`.** Color and shadow only.

### 7.3 Dashboard Data Cards

Simpler. No hover effect — these are data containers, not clickable.

```css
background: var(--card); /* oklch token */
border: 1px solid var(--border);
border-radius: 12px;
padding: 20px 24px;
```

### 7.4 Pro Pricing Card (Highlighted)

The Pro card is the exception — it has an amber background treatment to signal selection.

Light mode:
```css
background: oklch(0.62 0.16 44); /* primary amber fill */
color: oklch(0.12 0 0);          /* dark foreground */
border: none;
box-shadow: 0 8px 32px oklch(0.62 0.16 44 / 30%);
```

Dark mode:
```css
background: oklch(0.22 0.06 44); /* deep amber surface */
color: oklch(0.97 0 0);
border: 1px solid oklch(0.72 0.16 44 / 40%);
box-shadow: 0 8px 32px oklch(0.72 0.16 44 / 15%);
```

---

## 8. BUTTON SYSTEM

### 8.1 Primary Button

```css
/* Light mode */
background: oklch(0.62 0.16 44);
color: oklch(0.12 0 0);
border: none;
border-radius: 8px;
padding: 10px 24px; /* py-2.5 px-6 */
font-weight: 500;
font-size: 0.875rem;
transition: background 150ms ease-out, box-shadow 150ms ease-out;

/* Hover */
background: oklch(0.57 0.16 44); /* slightly darker */
box-shadow: 0 2px 8px oklch(0.62 0.16 44 / 30%);

/* Active */
background: oklch(0.54 0.16 44);
box-shadow: none;

/* Focus-visible */
outline: 2px solid oklch(0.62 0.16 44);
outline-offset: 2px;

/* Disabled */
opacity: 0.45;
cursor: not-allowed;
```

Dark mode primary:
```css
background: oklch(0.72 0.16 44);
color: oklch(0.10 0 0);
```

### 8.2 Secondary Button (Outline)

```css
background: transparent;
border: 1px solid oklch(0.90 0.01 44);
color: oklch(0.12 0 0);

/* Hover */
background: oklch(0.94 0.04 44); /* accent fill */
border-color: oklch(0.62 0.16 44 / 40%);
```

Dark mode:
```css
border: 1px solid oklch(1.00 0 0 / 15%);
color: oklch(0.97 0 0);
/* Hover */
background: oklch(0.22 0.04 44);
border-color: oklch(0.72 0.16 44 / 30%);
```

### 8.3 Ghost Button

```css
background: transparent;
border: none;
color: oklch(0.52 0 0); /* muted-foreground */

/* Hover */
background: oklch(0.94 0.04 44); /* accent */
color: oklch(0.12 0 0);
```

### 8.4 Destructive Button

```css
background: oklch(0.55 0.22 25);
color: oklch(0.99 0 0);
/* Hover */
background: oklch(0.50 0.22 25);
```

### 8.5 Size Variants

| Size | Padding | Font size | Use |
|------|---------|-----------|-----|
| sm | `px-3 py-1.5` | `text-xs` | Table actions, compact UI |
| default | `px-4 py-2` | `text-sm` | Most UI |
| lg | `px-6 py-3` | `text-sm` | Landing page CTAs |
| icon | `p-2` | — | Icon-only buttons |

---

## 9. SHADOW SCALE

Tailwind default shadows are visually inconsistent. Use this custom scale only.

```css
/* Add to tailwind.config.ts theme.extend.boxShadow */
'xs':  '0 1px 2px oklch(0 0 0 / 5%)',
'sm':  '0 1px 3px oklch(0 0 0 / 8%), 0 1px 2px oklch(0 0 0 / 5%)',
'md':  '0 4px 8px oklch(0 0 0 / 8%), 0 2px 4px oklch(0 0 0 / 5%)',
'lg':  '0 8px 24px oklch(0 0 0 / 10%), 0 4px 8px oklch(0 0 0 / 6%)',
'xl':  '0 16px 48px oklch(0 0 0 / 12%), 0 8px 16px oklch(0 0 0 / 8%)',
'amber-sm': '0 2px 8px oklch(0.62 0.16 44 / 25%)',
'amber-md': '0 4px 16px oklch(0.62 0.16 44 / 20%)',
'amber-lg': '0 8px 32px oklch(0.62 0.16 44 / 25%)',
/* dark mode amber */
'amber-dark-sm': '0 2px 8px oklch(0.72 0.16 44 / 15%)',
'amber-dark-lg': '0 8px 32px oklch(0.72 0.16 44 / 12%)',
```

---

## 10. ICONOGRAPHY CONTRACT

- **Library:** Lucide React exclusively.
- **Default size:** `size-4` (16px) — inline with text.
- **Functional icons in UI:** `size-4` or `size-5` (20px). Inherit text color via `currentColor`.
- **Sidebar nav icons:** `size-5` (20px). Active state: `text-primary`. Inactive: `text-muted-foreground`.
- **Empty state icons:** `size-12` (48px). Color: `text-muted-foreground`. Only exception to default size.
- **Error state icons:** `size-10` (40px). Color: `text-destructive`.

**Banned:**
- Icons above every heading (the "massive icons" anti-pattern).
- Colored icon containers/circles in feature grids.
- Icons larger than `size-6` inside cards.
- Emoji as UI elements.

---

## 11. LANDING PAGE — SECTION-BY-SECTION VISUAL BRIEF

### 11.1 Hero Section

**Goal:** Establish the claim. Show it is real. Make the developer feel capable.

```
Layout: min-h-screen, flex items-center, overflow-hidden
Background: ShaderBackground (fluid-amber, opacity 0.55, timeScale 0.07)
           + gradient fade to background at bottom (gradient-to-b from-transparent to-background)
Content zone: max-w-5xl mx-auto px-6, z-10 relative
```

**Content hierarchy (top to bottom):**
1. Eyebrow badge: `rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary` — e.g., "Next.js + Convex + Clerk — Production ready"
2. H1: `text-[clamp(3rem,6vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground text-balance`
3. Subline: `text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed` — one sentence, no stack names
4. CTA row: primary button (lg) + ghost button. Gap: `gap-4`. Align: left on desktop, centered on mobile.

**Framer Motion entrance:**
- H1: `y: 12 → 0, opacity: 0 → 1, duration: 0.4s, delay: 0`
- Subline: `delay: 0.08s`
- CTA: `delay: 0.16s`

**Light mode:** hero has the shader layer visible over a near-white background. The amber shader creates a warm glow in the upper portion. Text is dark (`oklch(0.12 0 0)`) for contrast.

**Dark mode:** hero shader is richly visible against the dark background. Text is near-white. The gradient fade to dark background at bottom creates a smooth visual separation from the next section.

**No dashboard screenshot in the hero.** The shader IS the visual. The demo section (below) carries the proof.

### 11.2 Problem Strip (Inline, Below Hero)

Full-width strip, not a section. Dark background in both modes (`bg-foreground` with `text-background`). Single line of centered copy. No CTA.

```
Height: py-5
Background: oklch(0.12 0 0) light / oklch(0.97 0 0) dark (inverted strip)
Copy: "80 hours of plumbing. Every project. Done."
Typography: text-sm font-medium tracking-[-0.01em]
```

### 11.3 Features Section (1+3+4 Grid)

**Grid layout:**
- Row 1: 1 feature card (full-width, hero feature — the Generative UI AI)
- Row 2: 3 feature cards
- Row 3: 4 feature cards

```
Container: max-w-5xl mx-auto px-6 py-20 md:py-32
Section heading: text-3xl font-semibold tracking-[-0.03em] mb-3
Section subheading: text-muted-foreground mb-12
Grid: grid gap-4 (tight gap — features feel connected)
```

**Hero feature card (row 1, full-width):**
- Larger padding: `p-8`
- Subtle amber gradient background: `bg-gradient-to-br from-primary/8 to-transparent`
- A `<!-- demo GIF goes here -->` slot inside the card, dark background frame, border `border-border`
- The callout badge: amber background, "AI-Powered — No other boilerplate has this"

**Standard feature cards (rows 2–3):**
```
p-6 rounded-xl border border-border
background: card token
Hover: border-color shifts to oklch(0.62 0.16 44 / 30%), amber shadow
Icon: size-5 text-primary mb-4 (icon BELOW any text — NOT above heading)
```

Actually: no icon above the heading. Icon is used as an inline accent to the left of the heading, or omitted in favor of a small amber dot/line accent.

**Feature card pattern (preferred):**
```tsx
<div className="rounded-xl border border-border p-6 transition-all duration-150 hover:border-primary/30 hover:shadow-amber-sm">
  <h3 className="text-lg font-semibold tracking-[-0.02em] mb-2">{title}</h3>
  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
</div>
```

### 11.4 Demo Section

The highest-leverage section. Frame: dark card, amber border trace, label "Live demonstration."

```
Container: bg-muted/40 (subtle background section break), py-20 md:py-32
Inner card: max-w-4xl mx-auto rounded-xl overflow-hidden
  - Dark background: oklch(0.10 0 0) or var(--background) in dark mode
  - Border: 1px solid oklch(0.62 0.16 44 / 25%)
  - Inner shadow: box-shadow: inset 0 1px 0 oklch(1.00 0 0 / 5%)
Above demo card: "Type a request. Watch your AI build it." — centered, text-2xl font-semibold
Below demo card: small amber label "Real component. Live environment. Yours to customize."
```

The demo GIF/video renders inside the card. When GIF is not yet available: a placeholder with `border-dashed border-2 border-muted-foreground/30` and `text-muted-foreground text-sm text-center py-24` with text "// demo.gif — add to /public/demo.gif".

### 11.5 Bridging Callout (Between Demo and Stack)

Single sentence. Full-width. No CTA.

```
Background: oklch(0.10 0 0) (dark strip in both modes — contrast with sections)
Padding: py-8
Text: text-center text-base md:text-lg font-medium text-amber/90 (oklch(0.72 0.16 44))
Copy: "Every VantageStarter developer ships what their competitors call 'future roadmap'."
Animation: .animate-reveal-up triggered by IntersectionObserver
```

### 11.6 Stack Section

Technology logos in a horizontal row. Muted, not loud.

```
Container: py-16 (smaller padding — this is a logic section, not emotional)
Label: text-sm text-muted-foreground text-center mb-8 tracking-wide uppercase (one exception to no-all-caps: tech logo label)
Logo row: flex flex-wrap justify-center gap-6 md:gap-10 items-center
Logo treatment: grayscale opacity-50, hover: grayscale-0 opacity-100, transition 200ms
```

### 11.7 Pricing Section (3 Tiers)

```
Container: py-20 md:py-32
Section heading + subheading: centered, mb-12
Grid: grid md:grid-cols-3 gap-6 max-w-5xl mx-auto
```

**Free tier card:**
```
bg-card border border-border rounded-xl p-6 md:p-8
Price: "Free" large, text-foreground
Features: list-none, text-sm text-muted-foreground, each item with check icon size-4 text-success
CTA: ghost button "Get started"
```

**Pro tier card (highlighted):**
```
bg-primary border-none rounded-xl p-6 md:p-8
text-primary-foreground (dark on amber)
Price: "$499" large, font-semibold
Callout badge inside: bg-primary-foreground/15 text-primary-foreground text-xs px-3 py-1 rounded-full
  Text: "The AI layer. No other boilerplate has it."
Shadow: shadow-amber-lg
CTA: bg-primary-foreground text-primary rounded-lg (inverted button)
Slight visual lift via transform: scale(1.02) — only this card, applied statically not on hover
```

**Team tier card:**
```
bg-card border border-border rounded-xl p-6 md:p-8 (same as Free)
Price: "$899" or custom
CTA: secondary button
```

**No "Most Popular" badge.** The Pro card's visual weight communicates priority without text badges. The amber fill IS the signal.

### 11.8 Testimonials Section

**3 testimonial cards.** Until real testimonials exist, ship designed placeholder slots.

```
Grid: grid md:grid-cols-3 gap-6
Placeholder treatment:
  border border-dashed border-muted-foreground/30 rounded-xl p-6
  Heading: text-sm font-medium text-muted-foreground "[Your testimonial here]"
  Body: h-16 bg-muted/40 rounded-md (placeholder lines)
  Attribution: h-4 w-32 bg-muted/40 rounded-full mt-4
```

When real testimonials exist, replace with:
```
bg-card border border-border rounded-xl p-6
Quote: text-sm leading-relaxed text-foreground/80 italic
Attribution: flex items-center gap-3 mt-4
  Avatar: w-8 h-8 rounded-full bg-accent (no real photo required — use initials)
  Name: text-sm font-medium
  Role: text-xs text-muted-foreground
```

### 11.9 Final CTA Section

High emotional moment. Closing argument.

```
Background: dark strip — bg-foreground (inverted) or deep amber bg-primary (only place)
  Prefer: deep amber oklch(0.15 0.04 44) — warm dark, not the brand amber
Padding: py-24 md:py-32
Content: centered, max-w-2xl mx-auto
  H2: text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-background (light text on dark)
  Subline: text-lg text-background/70 mt-4 mb-8
  CTA: primary button (lg) with inverted colors — bg-background text-foreground
  Below CTA: text-sm text-background/50 "One-time purchase. Lifetime updates."
ShaderBackground (velvet-spotlight, opacity 0.4): for atmosphere, same pattern as hero
Animation: .animate-reveal-up via IntersectionObserver
```

Copy locked:
```
H2: "Stop rebuilding plumbing. Start building products."
CTA: "Get VantageStarter — $499"
```

### 11.10 Footer

Minimal. Not a sitemap.

```
border-t border-border
py-8
Container: max-w-5xl mx-auto px-6 flex items-center justify-between
Left: "VantageStarter" in Instrument Sans 600 + "© 2026 ElPi Corp"
Right: links (Docs, GitHub, License) — text-sm text-muted-foreground hover:text-foreground
```

---

## 12. DASHBOARD DESIGN

### 12.1 Layout

```
Sidebar: w-64 bg-sidebar border-r border-sidebar-border
Main: flex-1 bg-background overflow-auto
Header bar: h-[64px] bg-background/80 backdrop-blur-sm border-b border-border sticky top-0
```

Note: `backdrop-blur-xl` is used on the sidebar in the current admin layout. This is borderline glassmorphism. Use `bg-background` (solid) for the sidebar. `backdrop-blur` is acceptable ONLY on the sticky header bar (standard pattern, not decorative).

### 12.2 Sidebar Colors

After converting to OKLCH sidebar tokens:

```
Sidebar bg (light): oklch(0.97 0.005 44) — very slightly warmer than page bg
Sidebar bg (dark): oklch(0.12 0.01 44) — slightly lighter than page bg, amber trace

Nav link (default): text-muted-foreground, no background
Nav link (hover): bg-sidebar-accent text-sidebar-accent-foreground, transition-colors 150ms
Nav link (active): bg-sidebar-primary text-sidebar-primary-foreground font-medium
  OR: no background, but left border 2px solid primary (architectural signal)
  RECOMMENDATION: left border pattern — more architectural, less "tab-like"

Active link pattern:
  className="relative pl-3 border-l-2 border-primary text-foreground"
```

### 12.3 Dashboard Cards

Data metric cards:
```
bg-card border border-border rounded-xl p-5
  Metric label: text-xs text-muted-foreground uppercase tracking-wide mb-1
  Metric value: text-2xl font-semibold text-foreground tracking-[-0.02em]
  Delta/trend: text-xs text-success or text-destructive with inline icon size-3
  No hover states on pure data cards
```

### 12.4 Empty States

Required on every data-fetching component. No exceptions.

```tsx
// Standard empty state component
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="size-12 text-muted-foreground mb-4" />  {/* contextual icon */}
  <h3 className="text-sm font-medium text-foreground mb-1">No {entityName} yet</h3>
  <p className="text-sm text-muted-foreground max-w-[200px] mb-4">
    {explanation — one sentence}
  </p>
  <Button variant="outline" size="sm">{primaryAction}</Button>
</div>
```

Copy pattern: "No [entities] yet." then "When you [action], they'll appear here." then a CTA to do the action.
No exclamation marks. No emojis. Factual and warm.

### 12.5 Loading States

- Data areas: `<Skeleton>` components matching the shape of the loaded content.
- Sidebar loading: show skeleton items (3 rect skeletons at nav-link height).
- Full page (before hydration): thin top progress bar `h-0.5 bg-primary animate-[progress_1s_ease-in-out_infinite]` — not a spinner.
- Inline loading (button): replace button text with `<Loader2 className="size-4 animate-spin" />`.

### 12.6 Error States

```tsx
// Full-page error boundary
<div className="min-h-screen bg-background flex items-center justify-center">
  <div className="text-center max-w-md px-6">
    <AlertCircle className="size-10 text-destructive mx-auto mb-4" />
    <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
    <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
    <Button onClick={reset} variant="outline">Try again</Button>
    <Button asChild variant="ghost" className="ml-2">
      <Link href="/dashboard">Back to dashboard</Link>
    </Button>
  </div>
</div>
```

---

## 13. ONBOARDING FLOW

### 13.1 Emotional Arc (4 Steps)

1. **Welcome (name + avatar):** Warm. Low-stakes. Max-w-md. Copy: "What should we call you?" not "Enter display name."
2. **Choose plan:** Upgrade moment, not a gate. Free tier looks genuinely useful. Pro has one visual signal (amber background, single callout line — not "Most Popular").
3. **First action:** A slot with amber dashed border. Text: "Your first [action] goes here." Developers who customize the boilerplate fill this in.
4. **Done:** A Framer Motion checkmark. Clean `scale(0.8) → scale(1)` with `opacity: 0 → 1`. No confetti. CTA: "Open your dashboard." Period, not exclamation.

### 13.2 Progress Indicator

Fraction counter only: "2 of 4" — `text-sm text-muted-foreground`. Centered above the card. Zero visual weight.

### 13.3 Navigation

Users CAN go back on steps 1 and 3. Step 2 (plan selection) blocks backward navigation with a message: "You've selected a plan. Contact support to change it." This is a UX decision — make it clear in the component comment.

### 13.4 Step Card Layout

```
Container: min-h-screen bg-background flex items-center justify-center
Card: max-w-md w-full mx-auto p-8 bg-card border border-border rounded-xl shadow-sm
Progress: "X of 4" — text-sm text-muted-foreground mb-6 text-center
Heading: text-2xl font-semibold tracking-[-0.02em] mb-2
Subline: text-sm text-muted-foreground mb-6
Actions: flex justify-between — back button (ghost) on left, next button (primary) on right
```

---

## 14. VISUAL IDENTITY

### 14.1 Logo / Wordmark

"VantageStarter" set in Instrument Sans 600. Light mode: `text-foreground`. Dark mode: `text-foreground`. No amber in the wordmark — amber is for accents and CTAs.

No logomark before launch. Wordmark only.

### 14.2 Favicon

Bold `V` in Instrument Sans 600. Amber fill on dark background.
- 32×32 PNG (browser tab)
- 180×180 PNG (Apple touch icon)
- SVG variant for scalability

Background: `oklch(0.12 0 0)`. Letter: `oklch(0.72 0.16 44)`.

Build: use Playwright html-to-image or a 30-line script.

### 14.3 OG Image (1200×630)

```
Background: oklch(0.10 0 0)
Center top: "Your AI builds the UI." — Instrument Sans 600, ~68px, oklch(0.97 0 0)
Below headline: "VantageStarter" — Instrument Sans 400, 24px, oklch(0.72 0.16 44)
Bottom-right: cropped demo screenshot (the rendered chart) with amber glow border
Top-left: V favicon mark at 28px
```

Generate via Playwright script at `scripts/generate-og.ts`. Not manual Figma export.

---

## 15. ANTI-PATTERNS ENFORCEMENT

These are banned. If any appear in code review, block the PR.

| Anti-pattern | What it looks like | Why banned |
|-------------|-------------------|-----------|
| Inter font | `font-sans: Inter` | Generic, signals no design decision |
| Gradient text on headings | `-webkit-background-clip: text` on H1/H2 | Trend follower signal, visual noise |
| Glassmorphism in auth UI | `backdrop-blur` + `bg-white/10` on forms | AI slop fingerprint |
| Purple/blue gradients | Any gradient using hue 220–290° | The AI color palette |
| Large icons above headings | `size-12` or `size-16` in feature cards above H3 | "Massive icons" anti-pattern |
| `hover:scale-105` on cards | Transform hover on static cards | Commodity SaaS pattern |
| Card-in-card | A card component inside another card | Flatten hierarchy |
| Bounce/elastic easing | `type: 'spring'` or `bounce` in Framer | Dated, unprofessional |
| Exclamation marks in UI | "Success!" "Done!" "Welcome!" | Performative, not confident |
| Emojis in UI copy | Any emoji in headings, buttons, empty states | Banned per .impeccable.md |
| `text-gray-500` bare color | Non-token color values | Breaks dark mode, inconsistent |
| Identical card grid (icon+heading+text) | 6× same-size card with same layout | "Cardocalypse" — no visual rhythm |
| HSL anywhere | `hsl(...)` in CSS | Wrong color space, breaks at edges |
| Shadow on dark mode cards | `box-shadow` on cards in `.dark` | Dark mode uses surface lightness, not shadows |
| `backdrop-blur` on sidebar | Semi-transparent sidebar | Glassmorphism territory — use solid bg |

---

## 16. IMPLEMENTATION CHECKLIST (FOR DEVELOPER)

Before writing any component:

- [ ] Delete or deactivate `styles/globals.css` — verify `app/globals.css` is the active CSS file
- [ ] Verify Instrument Sans loads: check Network tab, confirm font file requests succeed
- [ ] Convert sidebar CSS variables in `app/globals.css` from HSL to OKLCH (section 1.4 above)
- [ ] Update `tailwind.config.ts` sidebar colors from `hsl(var(...))` to `oklch(var(...))`
- [ ] Download shader files to `public/shaders/` (fluid-amber.html, velvet-spotlight.html)
- [ ] Add custom shadow scale to `tailwind.config.ts` (section 9)
- [ ] Verify `app/globals.css` is imported in root layout (not `styles/globals.css`)

When building each section:
- [ ] Hero: ShaderBackground component implemented, overlay gradient present, Framer Motion entrance only here
- [ ] Features: no icons above headings, no scale-105 hover
- [ ] Pricing: Pro card uses amber fill, callout says "The AI layer.", no "Most Popular" badge
- [ ] Demo section: dark card with amber border trace, placeholder slot if GIF not ready
- [ ] Bridging callout: full-width dark strip, single sentence, reveal-up animation
- [ ] Final CTA: dark section with inverted colors
- [ ] All empty states: icon size-12, two-sentence copy, one CTA button
- [ ] Sidebar: OKLCH tokens active, active link uses left border pattern (not background fill)
- [ ] OG image + favicon: produced before first public share

---

## 17. FILE STRUCTURE FOR NEW COMPONENTS

```
components/
  landing/
    hero-section.tsx
    features-section.tsx
    demo-section.tsx
    bridging-callout.tsx
    stack-section.tsx
    pricing-section.tsx
    testimonials-section.tsx
    cta-section.tsx
    footer.tsx
  shaders/
    ShaderBackground.tsx
  dashboard/
    MetricCard.tsx
    EmptyState.tsx
    LoadingSkeleton.tsx
    ErrorBoundary.tsx
  onboarding/
    StepCard.tsx
    StepProgress.tsx
    WelcomeStep.tsx
    PlanStep.tsx
    FirstActionStep.tsx
    DoneStep.tsx

public/
  shaders/
    fluid-amber.html
    velvet-spotlight.html
    flow-field.html  (optional)
  og-image.png
  favicon-32.png
  favicon-180.png

scripts/
  generate-og.ts
```

---

## BRIEF SUMMARY

One key message: **Warm, confident, architectural. Not another AI slop dev tool.**

Visual proof of that message:
1. Amber OKLCH system (not gray, not blue, not purple)
2. Instrument Sans with tight tracking on display text
3. Radiant fluid-amber shader as hero background
4. Restrained motion (Framer in hero only, CSS elsewhere)
5. Cards that carry the color system through subtle border warmth
6. Demo section that shows the product doing the work

Everything in this brief serves that one signal. Any deviation from these specs should require explicit justification before implementation.

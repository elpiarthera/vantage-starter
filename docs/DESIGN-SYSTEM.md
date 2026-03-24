# VantageStarter Design System

**Single source of truth.** All agents read this file before any UI work.

Reference: v0.app Base (Default) theme
Token file: `styles/presets/base.css`
Last updated: 2026-03-24

---

## Tokens

### Colors (OKLCH, zero chroma = pure achromatic)

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| Primary | `--primary` | oklch(0.922 0 0) | CTA buttons, active states |
| Primary Foreground | `--primary-foreground` | oklch(0.205 0 0) | Text on primary bg |
| Secondary | `--secondary` | oklch(0.269 0 0) | Secondary buttons, tags |
| Secondary Foreground | `--secondary-foreground` | oklch(0.985 0 0) | Text on secondary |
| Accent | `--accent` | oklch(0.371 0 0) | Hover states, highlights |
| Accent Foreground | `--accent-foreground` | oklch(0.985 0 0) | Text on accent |
| Background | `--background` | oklch(0.145 0 0) | Page background |
| Foreground | `--foreground` | oklch(0.985 0 0) | Primary text |
| Card | `--card` | oklch(0.205 0 0) | Card backgrounds |
| Card Foreground | `--card-foreground` | oklch(0.985 0 0) | Text on cards |
| Popover | `--popover` | oklch(0.269 0 0) | Dropdowns, tooltips, modals |
| Popover Foreground | `--popover-foreground` | oklch(0.985 0 0) | Text in popovers |
| Muted | `--muted` | oklch(0.269 0 0) | Subtle backgrounds, disabled |
| Muted Foreground | `--muted-foreground` | oklch(0.708 0 0) | Secondary text, labels, hints |
| Destructive | `--destructive` | oklch(0.704 0.191 22.216) | Errors, delete, danger |
| Destructive Foreground | `--destructive-foreground` | oklch(0.985 0 0) | Text on destructive |
| Border | `--border` | oklch(1 0 0 / 10%) | Card borders, dividers |
| Input | `--input` | oklch(1 0 0 / 15%) | Input field borders |
| Ring | `--ring` | oklch(0.556 0 0) | Focus ring |
| Success | `--success` | oklch(0.696 0.17 162.48) | Success states |
| Warning | `--warning` | oklch(0.769 0.188 70.08) | Warning states |

### Sidebar

| Token | Value | Note |
|-------|-------|------|
| Sidebar Background | oklch(0.145 0 0) | Same as page bg (seamless blend) |
| Sidebar Foreground | oklch(0.985 0 0) | |
| Sidebar Accent | oklch(0.269 0 0) | Active item + hover bg |
| Sidebar Border | oklch(1 0 0 / 10%) | |

### Charts (colorful)

| Token | Value | Color |
|-------|-------|-------|
| Chart 1 | oklch(0.488 0.243 264.376) | Blue |
| Chart 2 | oklch(0.696 0.17 162.48) | Green |
| Chart 3 | oklch(0.769 0.188 70.08) | Orange |
| Chart 4 | oklch(0.627 0.265 303.9) | Purple |
| Chart 5 | oklch(0.645 0.246 16.439) | Red |

### Typography

| Role | Font | Variable |
|------|------|----------|
| Sans (all text) | Geist | `--font-sans` |
| Mono (code) | Geist Mono | `--font-mono` |

### Layout

| Property | Value |
|----------|-------|
| Radius | 0.625rem (`--radius`) |
| Shadow | 0 1px 2px 0 #0000000d |

---

## Component Patterns

Every UI element must use these exact class patterns. No exceptions.

### Cards

```
bg-card border border-border rounded-xl p-6
```

Hover (if interactive): `hover:bg-accent transition-colors`
With elevation: add `card-elevated` class

### Buttons

**Primary CTA:**
```
bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium
hover:bg-primary/90 transition-colors
```

**Secondary / Outline:**
```
border border-border bg-transparent text-foreground rounded-lg px-4 py-2 text-sm font-medium
hover:bg-accent transition-colors
```

**Ghost:**
```
text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg px-3 py-2 text-sm
transition-colors
```

**Destructive:**
```
bg-destructive text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium
hover:bg-destructive/90 transition-colors
```

### Inputs

```
w-full bg-transparent border border-input rounded-lg px-3 py-2 text-sm text-foreground
placeholder:text-muted-foreground
focus:outline-none focus:ring-2 focus:ring-ring
```

### Dropdowns / Popovers

Container (Radix portals lose CSS var cascade — use explicit oklch):
```
rounded-xl border border-border p-1.5 shadow-lg
style={{ backgroundColor: "oklch(0.269 0 0)", color: "oklch(0.985 0 0)" }}
```

Items:
```
flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors
hover:bg-accent cursor-pointer
```

Separator: `bg-border` (oklch 1 0 0 / 10%)

### Modals / Dialogs

Backdrop:
```
fixed inset-0 z-50 bg-background/80 backdrop-blur-sm
```

Container:
```
bg-card border border-border rounded-xl shadow-lg max-w-lg mx-auto p-6
```

### Side Panels / Sheets

```
fixed right-0 inset-y-0 w-[400px] bg-card border-l border-border shadow-lg z-50
```

### Badges / Pills

```
inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
bg-muted text-muted-foreground
```

Status variants: use `bg-destructive/10 text-destructive`, `bg-warning/10 text-warning`, `bg-success/10 text-success`, `bg-primary/10 text-primary`

### Text

| Purpose | Classes |
|---------|---------|
| Heading | `text-foreground font-semibold` |
| Body | `text-foreground` |
| Secondary / Description | `text-sm text-muted-foreground` |
| Label | `text-sm font-medium text-foreground` |
| Hint / Caption | `text-xs text-muted-foreground` |
| Section label | `text-xs font-medium text-muted-foreground uppercase tracking-wider` |

### Sidebar Items

Active: `bg-sidebar-accent text-foreground rounded-md` (bg fill, NOT left-border)
Inactive: `text-muted-foreground hover:bg-sidebar-accent hover:text-foreground rounded-md transition-colors`

### List Items (interactive rows)

```
hover:bg-accent transition-colors rounded-lg px-3 py-2 cursor-pointer
```

### Separators

```
border-border
```
Never `border-muted`, never `border-gray-*`.

---

## Architecture

### Token File

`styles/presets/base.css` — single `:root` block with ALL tokens. No `.dark` block (dark-first design). No token definitions in `globals.css`.

### Tailwind Config

`tailwind.config.ts` — colors reference CSS vars via `var(--X)`. Never `oklch(var(--X))` (double-wrapping breaks CSS).

### Radix UI Portals

Radix components (DropdownMenu, Dialog, Popover, etc.) render into `document.body` outside the normal cascade. CSS vars on `:root` work, but Radix's own reset styles can override. **Use explicit oklch values in `style={{}}` for portal containers** as a reliable fallback.

### Opacity Modifiers

`@apply bg-muted/50` does NOT work with `var()`-based colors. Use `color-mix(in oklch, var(--muted) 50%, transparent)` instead.

---

## Anti-patterns (never ship)

- Hardcoded colors: `bg-blue-500`, `text-red-600`, `#182634` — use tokens
- shadcn defaults: `bg-accent` without checking it resolves to oklch(0.371)
- lucide-react icons — use inline SVGs
- `rounded-md` on cards (use `rounded-xl`)
- `rounded-sm` on buttons (use `rounded-lg`)
- Light/white dropdown backgrounds — must be dark (oklch 0.269)
- `border-muted` for separators — use `border-border`
- Multiple design system docs — THIS file is the only reference

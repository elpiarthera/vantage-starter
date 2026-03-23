# VantageStarter Design System

Reference: v0.app Base (Default) theme
Source: v0.app/chat/design-systems/v0example-base
Last updated: 2026-03-23

---

## Theme: Base (Default)

### Colors (OKLCH)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | oklch(0.922 0 0) | Buttons, links, active states |
| Primary Foreground | oklch(0.205 0 0) | Text on primary |
| Secondary | oklch(0.269 0 0) | Secondary buttons, tags |
| Secondary Foreground | oklch(0.985 0 0) | Text on secondary |
| Accent | oklch(0.371 0 0) | Hover states, highlights |
| Accent Foreground | oklch(0.985 0 0) | Text on accent |
| Background | oklch(0.145 0 0) | Page background |
| Foreground | oklch(0.985 0 0) | Primary text |
| Card | oklch(0.205 0 0) | Card backgrounds |
| Card Foreground | oklch(0.985 0 0) | Text on cards |
| Popover | oklch(0.269 0 0) | Dropdowns, tooltips |
| Popover Foreground | oklch(0.985 0 0) | Text in popovers |
| Muted | oklch(0.269 0 0) | Disabled, subtle backgrounds |
| Muted Foreground | oklch(0.708 0 0) | Secondary text, labels |
| Destructive | oklch(0.704 0.191 22.216) | Errors, delete buttons |
| Destructive Foreground | oklch(0.985 0 0) | Text on destructive |
| Border | oklch(1 0 0 / 10%) | Card borders, dividers |
| Input | oklch(1 0 0 / 15%) | Input field borders |
| Ring | oklch(0.556 0 0) | Focus ring |

### Charts (colorful)

| Token | Value | Color |
|-------|-------|-------|
| Chart 1 | oklch(0.488 0.243 264.376) | Blue |
| Chart 2 | oklch(0.696 0.17 162.48) | Green |
| Chart 3 | oklch(0.769 0.188 70.08) | Orange |
| Chart 4 | oklch(0.627 0.265 303.9) | Purple |
| Chart 5 | oklch(0.645 0.246 16.439) | Red |

### Sidebar

| Token | Value |
|-------|-------|
| Sidebar | oklch(0.205 0 0) |
| Sidebar Foreground | oklch(0.985 0 0) |
| Sidebar Primary | oklch(0.488 0.243 264.376) |
| Sidebar Primary Foreground | oklch(0.985 0 0) |
| Sidebar Accent | oklch(0.269 0 0) |
| Sidebar Accent Foreground | oklch(0.985 0 0) |
| Sidebar Border | oklch(1 0 0 / 10%) |
| Sidebar Ring | oklch(0.439 0 0) |

### Status

| Token | Value | Color |
|-------|-------|-------|
| Success | oklch(0.696 0.17 162.48) | Green (= Chart 2) |
| Warning | oklch(0.769 0.188 70.08) | Orange (= Chart 3) |

### Typography

| Role | Font |
|------|------|
| Sans | Geist |
| Mono | Geist Mono |

### Other

| Property | Value |
|----------|-------|
| Radius | 0.625rem |
| Shadow | 0 1px 2px 0 #0000000d |

### CSS Variables

All tokens live in `styles/presets/base.css` as `:root` custom properties. This is the single source of truth. No token definitions exist in `globals.css`.

---

## Usage

- **Cards**: `bg-card border border-border rounded-xl p-6`
- **Primary CTA**: `bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium`
- **Outline CTA**: `border border-border bg-card text-foreground rounded-lg px-4 py-2 font-medium hover:bg-accent`
- **Text**: Primary = `text-foreground`, Secondary = `text-muted-foreground`
- **Sidebar active item**: `bg-sidebar-accent text-foreground` (bg fill, no left-border)
- **Input fields**: `border-input bg-background rounded-md`
- **Focus ring**: `ring-ring` via focus-visible utilities

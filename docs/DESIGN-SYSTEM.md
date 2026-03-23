# VantageStarter Design System

Reference: v0.app Base (Default) theme
Last updated: 2026-03-23

---

## Theme: Base (Default)

Source: v0.app/chat/design-systems/v0example-base

### Colors (OKLCH, zero chroma = pure achromatic)

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
| Ring | oklch(0.922 0 0) | Focus ring |

### Typography

| Role | Font |
|------|------|
| Sans | Geist |
| Serif | Source Serif 4 |
| Mono | Geist Mono |

### Other

| Property | Value |
|----------|-------|
| Radius | 0.625rem |
| Shadow X Offset | 0px |
| Shadow Y Offset | 1px |
| Shadow Blur | 2px |
| Shadow Spread | 0px |
| Shadow Color | #0000000d |

### CSS Variables (copy-paste ready)

```css
/* v0 Base (Default) — Dark Mode */
:root {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.269 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.371 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.922 0 0);
  --radius: 0.625rem;
}
```

---

## Adding New Themes

To add a new theme:
1. Screenshot the v0.app design system panel (Colors, Typography, Other)
2. Add a new section below with the theme name
3. Copy all OKLCH values from the screenshot
4. Create a CSS file in `styles/themes/[theme-name].css`
5. The theme switcher reads from `styles/themes/`

### Template

```markdown
## Theme: [Name]

Source: [URL or description]

### Colors
| Token | Value |
|-------|-------|
| Primary | oklch(... ... ...) |
| Primary Foreground | oklch(... ... ...) |
| ... | ... |

### Typography
| Role | Font |
|------|------|
| Sans | ... |
| Serif | ... |
| Mono | ... |

### Other
| Property | Value |
|----------|-------|
| Radius | ...rem |
| Shadow | ... |
```

---

## Future Themes (to capture from v0.app)

- [ ] Base Light
- [ ] Neutral
- [ ] Slate
- [ ] Stone
- [ ] Zinc
- [ ] Rose
- [ ] Orange
- [ ] Green
- [ ] Blue
- [ ] Violet

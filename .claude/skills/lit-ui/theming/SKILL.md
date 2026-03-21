---
name: lit-ui-theming
description: >-
  Theming guide for lit-ui components. Use for CSS custom properties, design tokens,
  dark mode, ::part() selectors, and global semantic color tokens. Token prefix is --ui-*.
---

# Theming

## Token Namespaces

Rules:
1. Component tokens use the `--ui-<component>-<property>` pattern.
2. Global semantic tokens use the `--color-*` pattern.
3. All tokens are defined on `:root` in your CSS entry point.
4. Override any token to customize the component — no need to fork the source.

Component token namespaces:

| Component | Token Prefix |
|-----------|-------------|
| Button | `--ui-button-*` |
| Checkbox | `--ui-checkbox-*` |
| Radio | `--ui-radio-*` |
| Switch | `--ui-switch-*` |
| Input | `--ui-input-*` |
| Textarea | shares `--ui-input-*` |
| Select | `--ui-select-*` |
| Calendar | `--ui-calendar-*` |
| Date Picker | `--ui-date-picker-*` |
| Date Range Picker | `--ui-date-range-*` |
| Time Picker | `--ui-time-picker-*` |
| Dialog | `--ui-dialog-*` |
| Accordion | `--ui-accordion-*` |
| Tabs | `--ui-tabs-*` |
| Tooltip | `--ui-tooltip-*` |
| Popover | `--ui-popover-*` |
| Toast | `--ui-toast-*` |
| Data Table | `--ui-table-*` |

## Global Semantic Tokens

Rules:
1. Set global semantic tokens on `:root` in your CSS entry point.
2. Components consume these tokens internally — changing them reshapes all components.
3. Define both light and dark values (in `:root` and `.dark`).

```css
:root {
  /* Brand colors */
  --color-primary: oklch(0.6 0.2 264);
  --color-secondary: oklch(0.55 0.15 200);
  --color-destructive: oklch(0.55 0.22 30);
  --color-muted: oklch(0.94 0.01 260);
  --color-accent: oklch(0.92 0.04 264);

  /* Surface colors */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.14 0.01 260);
  --color-border: oklch(0.88 0.01 260);
  --color-ring: oklch(0.6 0.2 264);
}
```

## Dark Mode

Rules:
1. Add the `.dark` class to `<html>` or `<body>` to activate dark mode.
2. Components use `:host-context(.dark)` inside Shadow DOM — no extra config needed.
3. Override semantic tokens inside a `.dark` selector in your CSS.
4. Do NOT toggle individual component properties for dark mode — rely on the token system.

```css
.dark {
  --color-background: oklch(0.14 0.01 260);
  --color-foreground: oklch(0.96 0.01 260);
  --color-border: oklch(0.28 0.02 260);
  --color-muted: oklch(0.22 0.01 260);
}
```

```javascript
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// Or set explicitly
document.documentElement.classList.add('dark');
document.documentElement.classList.remove('dark');
```

## Component-Level Token Overrides

Rules:
1. Override component tokens on the element, a parent, or `:root`.
2. Token names follow `--ui-<component>-<property>` (kebab-case throughout).
3. Token overrides cascade normally — more specific wins.

```css
/* Override button radius globally */
:root {
  --ui-button-radius: 0.25rem;
}

/* Override only within a specific container */
.my-sidebar {
  --ui-button-radius: 0;
  --ui-button-primary-bg: var(--color-secondary);
}

/* Override on a single element */
lui-button#submit-btn {
  --ui-button-padding-x-md: 2rem;
}
```

Common component tokens:

```css
/* Button */
--ui-button-radius: 0.375rem;
--ui-button-shadow: none;
--ui-button-font-weight: 500;
--ui-button-primary-bg: var(--color-primary);
--ui-button-primary-text: white;
--ui-button-destructive-bg: var(--color-destructive);

/* Input / Textarea */
--ui-input-radius: 0.375rem;
--ui-input-border: var(--color-border);
--ui-input-bg: var(--color-background);
--ui-input-focus-ring: var(--color-ring);

/* Dialog */
--ui-dialog-radius: 0.5rem;
--ui-dialog-shadow: 0 20px 60px rgba(0,0,0,0.3);
--ui-dialog-backdrop: rgba(0, 0, 0, 0.5);
```

## ::part() Selectors

Rules:
1. Use `::part()` to style elements inside Shadow DOM without token overrides.
2. Parts are declared with `part="base"` (and others) in the component's `render()`.
3. `::part()` styles cannot be inherited into nested Shadow DOM.
4. Prefer token overrides for systematic theming; use `::part()` for one-off structural changes.

```css
/* Style the root element of lui-button */
lui-button::part(base) {
  font-family: 'My Brand Font', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Style the input inside lui-input */
lui-input::part(input) {
  font-size: 0.875rem;
}

/* Style dialog panel */
lui-dialog::part(panel) {
  border: 2px solid var(--color-primary);
}
```

## Tailwind Class Passthrough

Rules:
1. Classes applied to `<lui-*>` elements are applied to `:host` (the custom element itself).
2. Use Tailwind utilities for layout, spacing, and width from outside the component.
3. Classes do NOT penetrate Shadow DOM — they affect the host element only.

```html
<!-- These classes apply to the lui-button host element -->
<lui-button class="w-full shadow-lg mt-4">Full Width</lui-button>

<!-- Apply flex/grid layout to host from parent -->
<div class="flex gap-2">
  <lui-input class="flex-1"></lui-input>
  <lui-button>Search</lui-button>
</div>
```

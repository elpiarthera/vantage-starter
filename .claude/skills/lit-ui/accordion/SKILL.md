---
name: lit-ui-accordion
description: >-
  How to use <lui-accordion> and <lui-accordion-item> — props, slots, events, CSS tokens, examples.
---

# Accordion

## Usage

```html
<lui-accordion default-value="item-1">
  <lui-accordion-item value="item-1">
    <span slot="header">What is Lit UI?</span>
    Lit UI is a collection of accessible web components built with Lit.
  </lui-accordion-item>
  <lui-accordion-item value="item-2">
    <span slot="header">How do I install it?</span>
    Install via npm: npm install @lit-ui/accordion
  </lui-accordion-item>
  <lui-accordion-item value="item-3">
    <span slot="header">Is it accessible?</span>
    Yes, all components follow WAI-ARIA patterns with full keyboard support.
  </lui-accordion-item>
</lui-accordion>
```

```html
<!-- Multiple panels open simultaneously -->
<lui-accordion multiple>
  <lui-accordion-item value="item-1">
    <span slot="header">Section One</span>
    Content for section one.
  </lui-accordion-item>
  <lui-accordion-item value="item-2">
    <span slot="header">Section Two</span>
    Content for section two.
  </lui-accordion-item>
</lui-accordion>
```

```html
<!-- Collapsible (allow closing the active panel) -->
<lui-accordion collapsible default-value="item-1">
  <lui-accordion-item value="item-1">
    <span slot="header">Collapsible Panel</span>
    Click the header again to collapse.
  </lui-accordion-item>
</lui-accordion>
```

```html
<!-- Lazy rendering -->
<lui-accordion>
  <lui-accordion-item value="item-1" lazy>
    <span slot="header">Lazy Panel</span>
    This content is not rendered until the panel is first expanded.
  </lui-accordion-item>
</lui-accordion>
```

## Props — `lui-accordion`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Comma-separated list of expanded item values (controlled mode). |
| default-value | `string` | `""` | Initial expanded items for uncontrolled mode. |
| multiple | `boolean` | `false` | Allow multiple panels open simultaneously. |
| collapsible | `boolean` | `false` | Allow all panels to close in single-expand mode. |
| disabled | `boolean` | `false` | Disable all child items. |

## Props — `lui-accordion-item`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Unique identifier for this item within the accordion group. |
| expanded | `boolean` | `false` | Whether this item is expanded (set by parent). |
| disabled | `boolean` | `false` | Whether this item is disabled. |
| heading-level | `number` | `3` | ARIA heading level for the header element. |
| lazy | `boolean` | `false` | Defer panel content rendering until first expand. |

## Slots — `lui-accordion`

| Slot | Description |
|------|-------------|
| (default) | Child `lui-accordion-item` elements. |

## Slots — `lui-accordion-item`

| Slot | Description |
|------|-------------|
| header | Content for the accordion header button. |
| (default) | Panel content revealed when expanded. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ui-change` | `{ value: string, expandedItems: string[] }` | Fired on the accordion when expanded state changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-accordion-border` | `var(--color-border, var(--ui-color-border))` | Border color between items and around the container. |
| `--ui-accordion-border-width` | `1px` | Border width. |
| `--ui-accordion-radius` | `0.375rem` | Container border radius. |
| `--ui-accordion-gap` | `0` | Gap between accordion items. |
| `--ui-accordion-header-padding` | `1rem` | Header button padding. |
| `--ui-accordion-header-font-weight` | `500` | Header font weight. |
| `--ui-accordion-header-font-size` | `1rem` | Header font size. |
| `--ui-accordion-header-text` | `var(--color-foreground, var(--ui-color-foreground))` | Header text color. |
| `--ui-accordion-header-bg` | `transparent` | Header background color. |
| `--ui-accordion-header-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Header background on hover. |
| `--ui-accordion-panel-padding` | `0 1rem 1rem` | Panel content padding. |
| `--ui-accordion-panel-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Panel text color. |
| `--ui-accordion-transition` | `200ms` | Animation duration for expand/collapse. |
| `--ui-accordion-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color. |

## Behavior Notes

- **State management**: `lui-accordion` manages expanded state centrally. `lui-accordion-item` never self-toggles — it fires `ui-accordion-toggle` (internal) and the parent updates `expanded` on each item.
- **Controlled mode**: Set `value` (comma-separated item values) to control expanded state externally. React to `ui-change` event to update.
- **Uncontrolled mode**: Use `default-value` for initial state. Omit `value` entirely — once `value` is set it takes precedence over `default-value`.
- **Single-expand (default)**: Opening one panel auto-closes others. Clicking the active header is a no-op unless `collapsible` is set.
- **Collapsible**: With `collapsible` attribute on the container, clicking the active header closes all panels (value becomes `""`).
- **Multi-expand**: `multiple` attribute allows any number of panels open simultaneously. `value` is a comma-separated string (e.g. `"item-1,item-3"`).
- **Lazy rendering**: `lazy` attribute on an item defers default slot mounting until first expand. Once expanded once, content is preserved on collapse (not destroyed).
- **CSS Grid animation**: Panel uses `grid-template-rows: 0fr → 1fr` transition via `--ui-accordion-transition`. No JS height calculation needed.
- **Reduced motion**: `prefers-reduced-motion: reduce` sets both panel wrapper and chevron transition-duration to `0ms`.
- **Keyboard navigation**: ArrowDown/ArrowUp move focus between enabled items (wrapping). Home/End jump to first/last. Enter/Space toggle via native button click. Roving tabindex managed by parent.
- **data-state attribute**: Each `lui-accordion-item` exposes `data-state="open"` or `data-state="closed"` for CSS targeting or test queries.
- **Heading level**: `heading-level` on `lui-accordion-item` sets the `aria-level` on the wrapping `role="heading"` div. Default is 3. Match your page's document outline.
- **Disabled propagation**: `disabled` on `lui-accordion` sets `disabled` on all child items. Individual items can also be disabled independently.

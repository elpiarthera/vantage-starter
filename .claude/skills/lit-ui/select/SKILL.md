---
name: lit-ui-select
description: >-
  How to use <lui-select>, <lui-option>, <lui-option-group> — props, slots, events, CSS tokens, examples.
---

# Select

## Usage

```html
<lui-select label="Country" placeholder="Select a country">
  <lui-option value="us">United States</lui-option>
  <lui-option value="ca">Canada</lui-option>
  <lui-option value="uk">United Kingdom</lui-option>
  <lui-option value="au">Australia</lui-option>
</lui-select>
```

```html
<!-- Option groups -->
<lui-select label="Notification Preference" placeholder="Choose notification type">
  <lui-option-group label="Immediate">
    <lui-option value="push">Push notification</lui-option>
    <lui-option value="sms">SMS</lui-option>
  </lui-option-group>
  <lui-option-group label="Delayed">
    <lui-option value="email">Email</lui-option>
    <lui-option value="digest">Daily digest</lui-option>
  </lui-option-group>
</lui-select>
```

```html
<!-- Multi-select -->
<lui-select label="Skills" multiple placeholder="Select skills">
  <lui-option value="js">JavaScript</lui-option>
  <lui-option value="ts">TypeScript</lui-option>
  <lui-option value="py">Python</lui-option>
</lui-select>
```

```html
<!-- Searchable -->
<lui-select label="Country" searchable placeholder="Search countries...">
  <lui-option value="us">United States</lui-option>
  <lui-option value="ca">Canada</lui-option>
  <lui-option value="uk">United Kingdom</lui-option>
</lui-select>
```

```html
<!-- Custom option content -->
<lui-select label="Contact Method" placeholder="Select contact method">
  <lui-option value="email">
    <svg slot="start" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6L12 13 2 6"/>
    </svg>
    Email
    <span slot="description">Receive updates via email</span>
  </lui-option>
</lui-select>
```

## Props — `lui-select`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant affecting padding and font size. |
| name | `string` | `""` | Form submission name. |
| value | `string \| string[]` | `""` | Current selected value. Returns string[] in multi-select mode. |
| placeholder | `string` | `"Select an option"` | Placeholder text displayed when no option is selected. |
| label | `string` | `""` | Label text above the select. |
| options | `SelectOption[] \| Promise<SelectOption[]>` | `[]` | Array of options or Promise that resolves to options. Shows loading skeleton when Promise is pending. |
| required | `boolean` | `false` | Whether the select is required for form submission. |
| disabled | `boolean` | `false` | Whether the select is disabled. |
| clearable | `boolean` | `false` | Show clear button when a value is selected. |
| multiple | `boolean` | `false` | Enable multi-select mode. Selected items display as tags. |
| maxSelections | `number` | `undefined` | Maximum number of selections allowed in multi-select mode. |
| showSelectAll | `boolean` | `false` | Show "Select all" / "Clear all" button in multi-select dropdown. |
| searchable | `boolean` | `false` | Transform trigger into text input for filtering options. |
| creatable | `boolean` | `false` | Allow creating new options when searchable and no match exists. |
| noResultsMessage | `string` | `"No results found"` | Message shown when filter produces no matches. |
| customFilter | `(option, query) => boolean` | `undefined` | Custom filter function to override default contains matching. |
| debounceDelay | `number` | `300` | Debounce delay in milliseconds for async search. |
| minSearchLength | `number` | `0` | Minimum characters before triggering async search. |
| asyncSearch | `(query: string, signal: AbortSignal) => Promise<SelectOption[]>` | `undefined` | Async function called when user types. Receives query and AbortSignal for cancellation. |
| loadMore | `() => Promise<SelectOption[]>` | `undefined` | Callback for infinite scroll pagination. Called when scrolling near bottom. |

## Props — `lui-option`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | The value submitted when this option is selected. |
| label | `string` | `""` | Display label (falls back to text content, then value). |
| disabled | `boolean` | `false` | Whether this option is disabled. |

## Props — `lui-option-group`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | `""` | Label text displayed as the group header. |

## Slots — `lui-select`

| Slot | Description |
|------|-------------|
| default | Options (`lui-option` or `lui-option-group` elements). |

## Slots — `lui-option`

| Slot | Description |
|------|-------------|
| default | Option label text. |
| start | Content before the label (e.g., icon). |
| end | Content after the label. |
| description | Descriptive text below the label. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ value: string \| string[] }` | Fired when the selected value changes. |
| `clear` | `{}` | Fired when the selection is cleared via the clear button or keyboard (Delete/Backspace). |
| `create` | `{ value: string }` | Fired in creatable mode when user creates a new option. Contains the typed text. |

## Behavior Notes

- **Multi-select tags**: When `multiple` is enabled, selected options appear as removable pill tags inside the trigger. Overflow tags collapse to a "+N more" indicator when the trigger width is exceeded.
- **Dropdown stays open**: In `multiple` mode, the dropdown remains open after each selection, allowing users to select multiple items without reopening.
- **Combobox / Searchable**: Adding `searchable` transforms the trigger into a text input. Options filter in real-time using case-insensitive substring matching. Match text is highlighted in bold.
- **Creatable mode**: `creatable` requires `searchable`. When no exact match exists, a "Create 'xyz'" option appears. Selecting it fires the `create` event with the typed value; the component does NOT automatically add the option — the consumer is responsible for adding it.
- **Async options**: `options` accepts a Promise. While pending, a loading skeleton displays. If the Promise rejects, an error state with a retry button appears.
- **Async search**: `asyncSearch` enables server-side filtering. Each call receives the current query and an AbortSignal; previous requests are automatically cancelled. Use `debounceDelay` (default 300ms) and `minSearchLength` (default 0) to control when the function is called.
- **Focus management**: DOM focus stays on the trigger button/input. The highlighted option is tracked via `aria-activedescendant`, following the W3C APG combobox pattern. This provides a smooth screen reader experience without moving focus into the dropdown.
- **Form participation**: The component uses ElementInternals (`formAssociated = true`) for native form submission and validation. The `required` attribute causes a validation error message on blur when no option is selected. `name` sets the form field name for submission.

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-select-radius` | `0.375rem` | Border radius of the trigger and dropdown. |
| `--ui-select-border-width` | `1px` | Border width of the trigger. |
| `--ui-select-transition` | `150ms` | Transition duration for border color changes. |
| `--ui-select-dropdown-shadow` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Box shadow for the dropdown. |
| `--ui-select-dropdown-max-height` | `15rem` | Maximum height of the dropdown before scroll. |
| `--ui-select-font-size-sm` | `0.875rem` | Font size for the sm size variant. |
| `--ui-select-font-size-md` | `1rem` | Font size for the md size variant. |
| `--ui-select-font-size-lg` | `1.125rem` | Font size for the lg size variant. |
| `--ui-select-padding-x-md` | `1rem` | Horizontal padding for the md size variant. |
| `--ui-select-padding-y-md` | `0.5rem` | Vertical padding for the md size variant. |
| `--ui-select-bg` | `var(--color-background, white)` | Trigger background color. |
| `--ui-select-text` | `var(--color-foreground, var(--ui-color-foreground))` | Trigger text color. |
| `--ui-select-border` | `var(--color-border, var(--ui-color-border))` | Trigger border color. |
| `--ui-select-placeholder` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Placeholder text color. |
| `--ui-select-border-focus` | `var(--color-ring, var(--ui-color-ring))` | Trigger border color on focus. |
| `--ui-select-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring outline color. |
| `--ui-select-bg-disabled` | `var(--color-muted, var(--ui-color-muted))` | Trigger background when disabled. |
| `--ui-select-text-disabled` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Trigger text color when disabled. |
| `--ui-select-border-error` | `var(--color-destructive, var(--ui-color-destructive))` | Trigger border color in error/validation state. |
| `--ui-select-dropdown-bg` | `var(--color-card, var(--ui-color-card))` | Dropdown background color. |
| `--ui-select-dropdown-border` | `var(--color-border, var(--ui-color-border))` | Dropdown border color. |
| `--ui-select-option-bg-hover` | `var(--color-accent, var(--ui-color-accent))` | Option background on hover. |
| `--ui-select-option-text` | `var(--color-foreground, var(--ui-color-foreground))` | Option text color. |
| `--ui-select-option-check` | `var(--color-primary, var(--ui-color-primary))` | Checkmark icon color on selected option. |
| `--ui-select-tag-bg` | `var(--color-secondary, var(--ui-color-secondary))` | Tag/chip background in multi-select mode. |
| `--ui-select-tag-text` | `var(--color-secondary-foreground, var(--ui-color-secondary-foreground))` | Tag/chip text color in multi-select mode. |
| `--ui-select-checkbox-bg-checked` | `var(--color-primary, var(--ui-color-primary))` | Checkbox background when checked in multi-select. |

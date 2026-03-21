---
name: lit-ui-authoring
description: >-
  Guide for creating new lit-ui components. Use when building custom components with
  TailwindElement, ElementInternals form participation, SSR guards, Lit decorators,
  Shadow DOM parts, and event dispatch patterns.
---

# Component Authoring

## Base Class: TailwindElement

Rules:
1. Always extend `TailwindElement` from `@lit-ui/core`, never `LitElement` directly.
2. `TailwindElement` handles Tailwind CSS injection into Shadow DOM via constructable stylesheets.
3. It also handles SSR dual-mode styling (inline `<style>` for server, constructable for client).
4. Register your component with `@customElement('lui-my-component')`.

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TailwindElement } from '@lit-ui/core';

@customElement('lui-my-component')
export class MyComponent extends TailwindElement {
  @property({ type: String })
  label = '';

  render() {
    return html`
      <div part="base" class="flex items-center gap-2 p-4 rounded-md">
        <span class="text-sm font-medium">${this.label}</span>
        <slot></slot>
      </div>
    `;
  }
}
```

## Decorators

Rules:
1. Use `@property()` for public API — values that reflect to HTML attributes.
2. Use `@state()` for internal reactive state — not exposed as attributes.
3. Reflected attributes use kebab-case; property names use camelCase.
4. For boolean attributes, use `type: Boolean` to get the correct attribute behavior.

```typescript
@property({ type: String, reflect: true }) variant = 'primary';
@property({ type: Boolean, reflect: true }) disabled = false;
@property({ type: Number }) count = 0;
@property({ attribute: 'custom-attr' }) myProp = '';  // explicit attribute name

@state() private _isOpen = false;
@state() private _internalValue = '';
```

## Form Participation with ElementInternals

Rules:
1. Add `static formAssociated = true` to opt into form participation.
2. Call `this.internals = this.attachInternals()` in the constructor.
3. Call `this.internals.setFormValue(value)` whenever the value changes.
4. Implement `formResetCallback()` to handle form reset.
5. Wrap `attachInternals()` in an `isServer` guard — it is not available during SSR.

```typescript
import { TailwindElement } from '@lit-ui/core';
import { isServer } from 'lit';

@customElement('lui-my-input')
export class MyInput extends TailwindElement {
  static formAssociated = true;

  private internals: ElementInternals | null = null;

  @property({ type: String, reflect: true }) name = '';
  @property({ type: String }) value = '';

  constructor() {
    super();
    if (!isServer) {
      this.internals = this.attachInternals();
    }
  }

  private _handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this.internals?.setFormValue(this.value);
    this.dispatchCustomEvent('change', { value: this.value });
  }

  formResetCallback() {
    this.value = '';
    this.internals?.setFormValue('');
  }

  render() {
    return html`
      <input
        part="input"
        class="w-full px-3 py-2 border rounded-md"
        .value=${this.value}
        @change=${this._handleChange}
      />
    `;
  }
}
```

## SSR Guards

Rules:
1. Import `isServer` from `lit` (not from `@lit-ui/core`).
2. Guard anything browser-only: `ElementInternals`, `ResizeObserver`, `IntersectionObserver`, `window`, `document`, `localStorage`, `matchMedia`.
3. Never call `this.attachInternals()` without an `isServer` guard.
4. Lit's `connectedCallback` and `disconnectedCallback` run during SSR — guard browser APIs there too.

```typescript
import { isServer } from 'lit';

// In constructor or connectedCallback:
if (!isServer) {
  this._resizeObserver = new ResizeObserver(this._handleResize);
  this._resizeObserver.observe(this);
}

// Cleanup in disconnectedCallback:
disconnectedCallback() {
  super.disconnectedCallback();
  if (!isServer) {
    this._resizeObserver?.disconnect();
  }
}
```

## Shadow DOM Parts

Rules:
1. Always add `part="base"` to the root element so consumers can style it externally.
2. Add additional parts to interior elements that need external styling: `part="input"`, `part="trigger"`, `part="panel"`, etc.
3. Parts are accessed externally via `lui-my-component::part(base) { }`.

```typescript
render() {
  return html`
    <div part="base" class="relative">
      <button part="trigger" class="flex items-center gap-2">
        ${this.label}
      </button>
      <div part="panel" class="absolute top-full mt-1">
        <slot></slot>
      </div>
    </div>
  `;
}
```

## Event Dispatch

Rules:
1. Use `dispatchCustomEvent(this, 'change', detail)` from `@lit-ui/core`.
2. Event names use the `ui-` prefix (dispatched as `ui-change`, `ui-input`, etc.).
3. Always pass a detail object, not a primitive.
4. `dispatchCustomEvent` sets `bubbles: true` and `composed: true` automatically.

```typescript
import { dispatchCustomEvent } from '@lit-ui/core';

// In event handler:
dispatchCustomEvent(this, 'change', { value: this.value });
dispatchCustomEvent(this, 'open', { source: 'keyboard' });
```

## JSX Type Support

Rules:
1. Create a `jsx.d.ts` file alongside your component for React/JSX type inference.
2. This enables prop autocomplete and type checking when used in TSX files.

```typescript
// jsx.d.ts
import type { MyComponent } from './my-component.js';

type MyComponentProps = {
  label?: string;
  disabled?: boolean;
  'onui-change'?: (e: CustomEvent<{ value: string }>) => void;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lui-my-component': MyComponentProps;
    }
  }
}
```

## CSS in Shadow DOM

Rules:
1. Use Tailwind utility classes directly in `render()` — `TailwindElement` injects the stylesheet.
2. Do NOT write `static styles = css\`...\`` alongside Tailwind — pick one approach.
3. For one-off custom properties, use inline `style` attribute or `:host` in a `static styles` block.
4. Component-level CSS tokens are accessed via `var(--ui-component-token)` inside the template.

```typescript
render() {
  // Tailwind classes work directly — no extra setup needed
  return html`
    <div
      part="base"
      class="flex items-center rounded-md border border-[var(--ui-input-border)] px-3 py-2"
    >
      <slot></slot>
    </div>
  `;
}
```

## File Structure

Rules:
1. Main export: `<component-name>.ts` — defines and registers the custom element.
2. Types: `types.ts` — shared TypeScript types/enums used by the component.
3. JSX types: `jsx.d.ts` — React/JSX intrinsic element declarations.
4. Index: `index.ts` — re-exports for package consumers.

```
packages/my-component/
  src/
    my-component.ts   # component class + @customElement registration
    types.ts          # exported types
    jsx.d.ts          # JSX intrinsic element declarations
    index.ts          # re-exports
  package.json
  tsconfig.json
```

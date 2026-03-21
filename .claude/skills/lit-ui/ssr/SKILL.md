---
name: lit-ui-ssr
description: >-
  Server-side rendering guide for lit-ui. Use for renderToString, hydration import order,
  isServer guards, and SSR-compatible component patterns. Package: @lit-ui/ssr.
---

# SSR (Server-Side Rendering)

## Package

```bash
npm install @lit-ui/ssr
```

## Rendering on the Server

Rules:
1. Import `renderToString` and `html` from `@lit-ui/ssr`.
2. Await `renderToString()` — it is always async.
3. The rendered string includes declarative Shadow DOM (`<template shadowrootmode="open">`).
4. Inline styles are included in the SSR output; they are upgraded to constructable on client.

```typescript
import { renderToString, html } from '@lit-ui/ssr';
import '@lit-ui/button';
import '@lit-ui/input';

const markup = await renderToString(html`
  <div>
    <lui-input name="email" type="email" placeholder="Email"></lui-input>
    <lui-button variant="primary" type="submit">Sign In</lui-button>
  </div>
`);

// markup is a string of HTML with declarative Shadow DOM
// Inject it into your server-rendered page:
res.send(`<!DOCTYPE html><html><body>${markup}</body></html>`);
```

## Hydration

Rules:
1. The hydration import MUST be the very first import in your client entry point.
2. Import component definitions AFTER the hydration import.
3. Lit uses declarative Shadow DOM + hydration to attach interactivity without re-rendering.
4. Do NOT call `renderToString` on the client — it is server-only.

```typescript
// client-entry.ts — order matters!
import '@lit-ui/ssr/hydration';  // MUST be first

// Then import components (order among these doesn't matter)
import '@lit-ui/button';
import '@lit-ui/input';
import '@lit-ui/dialog';

// Your app code follows
import { initApp } from './app.js';
initApp();
```

## isServer Guard

Rules:
1. Use `isServer` from `lit` (not from `@lit-ui/core`) to guard browser-only APIs.
2. Guard: `ElementInternals` (`attachInternals`), `ResizeObserver`, `IntersectionObserver`, `MutationObserver`, `window`, `document`, `localStorage`, `sessionStorage`, `matchMedia`, `requestAnimationFrame`.
3. Do NOT guard Lit lifecycle methods themselves — `connectedCallback`, `render`, `updated` all run on server.
4. `isServer` is a boolean constant — evaluate it directly, do not call it as a function.

```typescript
import { isServer } from 'lit';

class MyComponent extends TailwindElement {
  constructor() {
    super();
    if (!isServer) {
      // ElementInternals is not available during SSR
      this.internals = this.attachInternals();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (!isServer) {
      // ResizeObserver is browser-only
      this._ro = new ResizeObserver(this._handleResize);
      this._ro.observe(this);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (!isServer) {
      this._ro?.disconnect();
    }
  }
}
```

## SSR-Compatible Styling

Rules:
1. `TailwindElement` handles dual-mode styling automatically — no extra config needed.
2. During SSR: Tailwind styles are inlined as `<style>` tags inside Shadow DOM.
3. During client hydration: `<style>` tags are replaced with constructable stylesheets.
4. Do NOT use `document.adoptedStyleSheets` directly — `TailwindElement` manages this.
5. CSS custom properties work identically in SSR and client.

## Framework Integration with SSR

### Next.js

```typescript
// app/page.tsx
import { renderToString, html } from '@lit-ui/ssr';

export default async function Page() {
  // Server-render the component
  const componentHtml = await renderToString(html`
    <lui-button variant="primary">Click me</lui-button>
  `);

  return (
    <div dangerouslySetInnerHTML={{ __html: componentHtml }} />
  );
}
```

```typescript
// app/layout.tsx client entry
// Add to your client-side script:
// import '@lit-ui/ssr/hydration'; // Must be first on client
```

### Vite SSR

```typescript
// server.ts
import { renderToString, html } from '@lit-ui/ssr';

// In your SSR handler:
const body = await renderToString(html`
  <lui-input name="search"></lui-input>
`);
```

```typescript
// entry-client.ts — order is critical
import '@lit-ui/ssr/hydration'; // First!
import '@lit-ui/input';
// ... rest of app
```

## Declarative Shadow DOM

Rules:
1. Lit uses the Declarative Shadow DOM spec (`<template shadowrootmode="open">`).
2. Modern browsers support this natively — no polyfill needed for Chrome 111+, Firefox 123+, Safari 16.4+.
3. For older browser support, add the polyfill BEFORE hydration: `import 'declarative-shadow-dom-polyfill'`.
4. The polyfill must come before `@lit-ui/ssr/hydration`.

```typescript
// entry-client.ts with polyfill for older browsers
import 'declarative-shadow-dom-polyfill'; // if needed for older browsers
import '@lit-ui/ssr/hydration';           // must still be before component imports
import '@lit-ui/button';
```

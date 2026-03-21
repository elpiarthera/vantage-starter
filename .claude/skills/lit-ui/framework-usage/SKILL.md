---
name: lit-ui-framework-usage
description: >-
  Integration guide for lit-ui components in React, Vue, Svelte, Angular, and vanilla HTML.
  Covers import patterns, event binding, property setting, and framework-specific gotchas.
---

# Framework Integration

## General Rules

Rules:
1. lit-ui components are standard Custom Elements — no wrappers or adapters needed.
2. Import the component side-effect to register it: `import '@lit-ui/button'` or the copied source file.
3. Object/array properties MUST be set via JavaScript reference (`.prop` binding or DOM ref) — not HTML attributes.
4. All custom events bubble and are composed (cross Shadow DOM boundary).

## Vanilla HTML

Rules:
1. Add a `<script type="module">` tag importing the component.
2. Use HTML attributes for string/boolean/number values.
3. For object/array props, use a `<script>` to set via JS.

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@lit-ui/button';
    import '@lit-ui/input';
    import '@lit-ui/data-table';

    // Set object/array props via JS
    const table = document.querySelector('lui-data-table');
    table.columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' }
    ];
    table.data = [{ name: 'Alice', email: 'alice@example.com' }];

    // Listen to custom events
    document.querySelector('lui-input').addEventListener('ui-change', (e) => {
      console.log('New value:', e.detail.value);
    });
  </script>
</head>
<body>
  <lui-input name="search" placeholder="Search..."></lui-input>
  <lui-button variant="primary">Search</lui-button>
  <lui-data-table></lui-data-table>
</body>
</html>
```

## React

Rules:
1. Import the component as a side-effect at the top of the file (or in your entry point).
2. Use `class` (not `className`) for HTML attribute-based classes on custom elements in JSX.
3. String, boolean, and number props work as JSX attributes normally.
4. For object/array props, use a `ref` and set them imperatively in `useEffect`.
5. Listen to custom events with `addEventListener` in `useEffect`, or via the `onUiChange` prop if JSX types are provided.

```tsx
import { useEffect, useRef } from 'react';
import '@lit-ui/button';
import '@lit-ui/input';
import '@lit-ui/data-table';

function MyForm() {
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current) {
      // Object/array props must be set via JS
      tableRef.current.columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' }
      ];
      tableRef.current.data = myData;
    }
  }, [myData]);

  useEffect(() => {
    const input = document.querySelector('lui-input');
    const handler = (e) => console.log(e.detail.value);
    input?.addEventListener('ui-change', handler);
    return () => input?.removeEventListener('ui-change', handler);
  }, []);

  return (
    <div>
      <lui-input name="email" type="email" placeholder="Email" />
      <lui-button variant="primary" type="submit">Submit</lui-button>
      <lui-data-table ref={tableRef} selectable />
    </div>
  );
}
```

TypeScript gotcha — declare custom elements for JSX:
```typescript
// In a .d.ts file or jsx.d.ts alongside the component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lui-button': { variant?: string; disabled?: boolean; [key: string]: any };
      'lui-input': { name?: string; type?: string; placeholder?: string; [key: string]: any };
    }
  }
}
```

## Vue

Rules:
1. Import the component as a side-effect in `<script setup>` or `main.ts`.
2. Use `v-bind` (`:prop`) for reactive string/boolean/number values.
3. For object/array props, use `:columns.prop="myColumns"` — the `.prop` modifier forces property (not attribute) binding.
4. Listen to custom events with `@ui-change="handler"`.
5. In Vue 3, custom elements work natively. No plugin needed.

```vue
<script setup>
import '@lit-ui/input';
import '@lit-ui/select';
import '@lit-ui/data-table';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' }
];
const data = [{ name: 'Alice', status: 'active' }];

function onSearch(e) {
  console.log('Search:', e.detail.value);
}
</script>

<template>
  <lui-input
    name="search"
    placeholder="Search..."
    @ui-change="onSearch"
  />

  <!-- .prop modifier for object/array properties -->
  <lui-data-table
    :columns.prop="columns"
    :data.prop="data"
    selectable
  />
</template>
```

Suppress Vue unknown element warnings in `vite.config.ts`:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('lui-')
        }
      }
    })
  ]
});
```

## Svelte

Rules:
1. Import the component as a side-effect in `<script>`.
2. Use `on:ui-change={handler}` for custom event listeners.
3. For object/array props, bind via the DOM ref: `bind:this={el}` then set in `onMount`.
4. Boolean attributes work as in HTML: `<lui-button disabled>`.

```svelte
<script>
  import { onMount } from 'svelte';
  import '@lit-ui/input';
  import '@lit-ui/button';
  import '@lit-ui/data-table';

  let tableEl;
  let searchValue = '';

  const columns = [{ key: 'name', label: 'Name' }];
  const data = [{ name: 'Alice' }];

  onMount(() => {
    // Set object/array props after mount
    tableEl.columns = columns;
    tableEl.data = data;
  });

  function handleSearch(e) {
    searchValue = e.detail.value;
  }
</script>

<lui-input
  name="search"
  placeholder="Search..."
  on:ui-change={handleSearch}
/>

<lui-button variant="primary">Search</lui-button>

<lui-data-table bind:this={tableEl} selectable />
```

## Angular

Rules:
1. Add `CUSTOM_ELEMENTS_SCHEMA` to your module or component `schemas` to suppress unknown element errors.
2. Import component side-effects in `main.ts` or in the component file.
3. Use `[attr.prop]="value"` for attribute binding, `[prop]="value"` for property binding.
4. For object/array props, use `[columns]="myColumns"` (property binding, not attribute).
5. Listen to custom events with `(ui-change)="handler($event)"`.

```typescript
// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
```

```typescript
// my-component.component.ts
import '@lit-ui/input';
import '@lit-ui/button';
import '@lit-ui/data-table';

@Component({
  template: `
    <lui-input
      name="search"
      [attr.placeholder]="'Search...'"
      (ui-change)="onSearch($event)"
    ></lui-input>

    <lui-button variant="primary">Search</lui-button>

    <!-- Property binding for objects/arrays -->
    <lui-data-table
      [columns]="columns"
      [data]="tableData"
      selectable
    ></lui-data-table>
  `
})
export class MyComponent {
  columns = [{ key: 'name', label: 'Name' }];
  tableData = [{ name: 'Alice' }];

  onSearch(e: CustomEvent) {
    console.log(e.detail.value);
  }
}
```

## Setting Object/Array Properties: Universal Pattern

Rules:
1. HTML attributes only support strings. Objects and arrays become `"[object Object]"` if set as attributes.
2. Always set complex props via JavaScript property assignment on the element reference.
3. This applies to ALL frameworks for ALL object/array properties.

```javascript
// Always do this for objects/arrays:
const el = document.querySelector('lui-data-table');
el.columns = [{ key: 'name', label: 'Name' }];

// Never do this (broken):
// <lui-data-table columns="[{key: 'name'}]">  // WRONG — attribute is a string
```

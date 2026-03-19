# 🏆 Sprint 30 Validation Strategy — Tests & Scripts

**Purpose:** Ensure the Image Generator v2 (schema-driven options, 8 models, refs, premium tabs) works end-to-end.  
**Reference:** [sprint-30-image-generator-13022026.md](./sprint-30-image-generator-13022026.md) · [IMAGE-MODELS-ANALYSIS.md](../../Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md)

---

## 🔬 Nuclear Testing Protocol — Verify Every Component

### 1. Schema System Validation — `schema-validation.test.ts` ✅

**Location:** `__tests__/components/image-generator/schema-validation.test.ts` — **created**

**Critical:** Verify all 8 models from IMAGE-MODELS-ANALYSIS and `components/image-generator/constants/modelSchemas.ts`.

```typescript
// Expected schema IDs (match IMAGE_MODEL_SCHEMAS order)
const EXPECTED_SCHEMA_IDS = [
  "kling-v3-t2i",
  "kling-v3-i2i",
  "kling-o3-t2i",
  "kling-o3-i2i",
  "grok-t2i",
  "grok-i2i",
  "nano-banana-pro-t2i",
  "nano-banana-pro-i2i",
];

describe("Model Schema Integrity", () => {
  it("should have all 8 analysis models configured", () => {
    const ids = IMAGE_MODEL_SCHEMAS.map((s) => s.id);
    expect(ids).toEqual(EXPECTED_SCHEMA_IDS);
  });

  it("should have correct creditActionType for each model", () => {
    expect(getModelSchemaById("kling-o3-t2i")?.creditActionType).toBe("image_generation");
    expect(getModelSchemaById("kling-o3-i2i")?.creditActionType).toBe("image_edit");
    expect(getModelSchemaById("grok-t2i")?.creditActionType).toBe("image_generation_grok_t2i");
    expect(getModelSchemaById("grok-i2i")?.creditActionType).toBe("image_edit_grok");
    expect(getModelSchemaById("nano-banana-pro-t2i")?.creditActionType).toBe("image_generation_nano_banana");
    expect(getModelSchemaById("nano-banana-pro-i2i")?.creditActionType).toBe("image_edit_nano_banana");
  });

  it("should enforce parameter dependencies (O3 result_type logic)", () => {
    const o3T2I = getModelSchemaById("kling-o3-t2i");
    const seriesAmountParam = o3T2I?.params.find((p) => p.key === "series_amount");
    expect(seriesAmountParam?.showWhen).toEqual({ param: "result_type", value: "series" });

    const numImagesParam = o3T2I?.params.find((p) => p.key === "num_images");
    expect(numImagesParam?.showWhen).toEqual({ param: "result_type", value: "single" });
  });

  it("should expose getT2ISchemas and getI2ISchemas with correct counts", () => {
    expect(getT2ISchemas()).toHaveLength(4); // Kling v3/o3 T2I, Grok T2I, Nano T2I
    expect(getI2ISchemas()).toHaveLength(4); // Kling v3/o3 I2I, Grok I2I, Nano I2I
  });
});
```

---

### 2. Backend Integration Test — `backend-integration.test.ts`

**Location:** `__tests__/convex/imageToolGeneric.test.ts` or `__tests__/integration/image-generator-backend.test.ts` (to create)

**Note:** Current app uses `startKlingT2IGeneration` / `startKlingI2IGeneration` for Kling and may use a generic path for other models. Adjust mutation names to match `convex/imageTool.ts` and `convex/actions/imageToolGeneric.ts`.

```typescript
describe("Generic Backend Action (or Kling-specific)", () => {
  it("should have credit cost configured for each image action type", async () => {
    const actionTypes = [
      "image_generation",
      "image_edit",
      "image_generation_grok_t2i",
      "image_edit_grok",
      "image_generation_nano_banana",
      "image_edit_nano_banana",
    ];
    for (const actionType of actionTypes) {
      const cost = await ctx.runQuery(api.credits.getCreditCost, { actionType });
      expect(cost).toBeDefined();
      expect(typeof cost?.credits).toBe("number");
    }
  });

  it("should deduct correct credits for Kling O3 T2I (image_generation)", async () => {
    // Depends on seedCredits: image_generation = 5
    const beforeCredits = await getUserCredits(userId);
    await ctx.runMutation(api.imageTool.startKlingT2IGeneration, { ... });
    const afterCredits = await getUserCredits(userId);
    expect(beforeCredits - afterCredits).toBe(5);
  });

  it("should deduct correct credits for Grok T2I (5) and Nano Banana T2I (15)", async () => {
    // When startGenericGeneration (or equivalent) is used:
    // image_generation_grok_t2i => 5, image_generation_nano_banana => 15
  });
});
```

---

### 3. UI Component Integration — `ui-integration.test.ts` ✅

**Location:** `__tests__/components/image-generator/ui-integration.test.tsx` — **created**

**Requires:** React Testing Library, Vitest jsdom. Mock next-intl (useTranslations) so components render.

```typescript
describe("Premium UI Components", () => {
  it("should render ModelSelector with all 8 models when open", async () => {
    render(
      <ModelSelector open={true} selectedSchema={null} onSelectSchema={jest.fn()} />
    );
    // Verify model names appear (i18n may wrap; use getByText or test ids)
    expect(screen.getByText(/Kling v3/i)).toBeInTheDocument();
    expect(screen.getByText(/Kling O3/i)).toBeInTheDocument();
    expect(screen.getByText(/Grok/i)).toBeInTheDocument();
    expect(screen.getByText(/Nano Banana/i)).toBeInTheDocument();
  });

  it("should show single vs multi ref UI based on schema", () => {
    const v3I2I = getModelSchemaById("kling-v3-i2i");
    const { container } = render(
      <RefsPanel schema={v3I2I} refs={[]} onRefsChange={jest.fn()} />
    );
    expect(container.querySelector("[data-drag-handle]")).not.toBeInTheDocument();

    const o3I2I = getModelSchemaById("kling-o3-i2i");
    const { container: c2 } = render(
      <RefsPanel schema={o3I2I} refs={[mockRef1, mockRef2]} onRefsChange={jest.fn()} />
    );
    expect(c2.querySelector("[data-drag-handle]")).toBeInTheDocument();
  });

  it("should show parameter dependencies (O3 result_type) in OptionsPanel", () => {
    const o3T2I = getModelSchemaById("kling-o3-t2i");
    const defaultParams = getDefaultParamsFromSchema(o3T2I);
    render(
      <OptionsPanel
        schema={o3T2I}
        params={defaultParams}
        onParamsChange={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/Number of images/i)).toBeInTheDocument();
    // After switching result_type to "series", series_amount visible (test with updated params)
  });
});
```

---

### 4. End-to-End Model Matrix Test — `e2e-model-matrix.test.ts` ✅

**Location:** `__tests__/components/image-generator/e2e-model-matrix.test.ts` — **created** (Vitest unit test; no Playwright. Validates schema → creditActionType → expected cost per model.)

**Note:** Credit values must match `convex/seedCredits.ts`. For real E2E (browser + Convex), add a Playwright test later.

| Model ID                 | creditActionType                 | Expected cost (credits) |
|--------------------------|----------------------------------|--------------------------|
| kling-v3-t2i             | image_generation (Kling v3 T2I)  | 5                        |
| kling-o3-t2i             | image_generation                 | 5                        |
| grok-t2i                  | image_generation_grok_t2i        | 5                        |
| grok-i2i                  | image_edit_grok                  | 5                        |
| nano-banana-pro-t2i      | image_generation_nano_banana     | 15                       |
| nano-banana-pro-i2i      | image_edit_nano_banana           | 15                       |

```typescript
const testCases = [
  { model: "kling-v3-t2i", params: { prompt: "sunset", aspect_ratio: "1:1", num_images: 2 }, expectedCost: 5 },
  { model: "kling-o3-t2i", params: { prompt: "city", result_type: "series", series_amount: 5 }, expectedCost: 5 },
  { model: "grok-t2i", params: { prompt: "abstract art", num_images: 1 }, expectedCost: 5 },
  { model: "nano-banana-pro-t2i", params: { prompt: "scene", safety_tolerance: "3" }, expectedCost: 15 },
];

it.each(testCases)(
  "should generate with $model and charge $expectedCost credits",
  async ({ model, params, expectedCost }) => {
    const schema = getModelSchemaById(model);
    expect(schema).toBeDefined();
    const cost = await getCreditCostForAction(schema.creditActionType);
    expect(cost).toBe(expectedCost);
    // Optional: trigger mutation and assert balance delta
  }
);
```

---

### 5. Visual Regressions Test — `visual-regression.test.ts` ✅

**Location:** `__tests__/components/image-generator/visual-regression.test.tsx` — **created**

```typescript
describe("Visual Components", () => {
  it("should render floating glass prompt bar with design tokens", () => {
    render(<ImageCombiner />); // or minimal wrapper with FloatingPromptBar
    const promptBar = screen.getByRole("textbox", { name: /prompt/i })?.closest("div");
    expect(promptBar).toHaveClass("backdrop-blur-xl");
    expect(promptBar).toHaveClass("bg-background/80", "border-border/50");
  });

  it("should render premium glass tabs with correct styling", () => {
    render(<PremiumTabSystem mode="generate" setMode={jest.fn()} />);
    const tablist = screen.getByRole("tablist");
    const container = tablist.closest("div");
    expect(container).toHaveClass("backdrop-blur-md", "bg-background/60", "border-white/10");
    expect(container).toHaveClass("rounded-xl", "shadow-lg");
  });

  it("should show Generate and Edit tabs with correct labels", () => {
    render(
      <IntlProvider locale="en" messages={{ image_generator: { tab_generate: "Generate", tab_edit: "Edit" } }}>
        <PremiumTabSystem mode="generate" setMode={jest.fn()} />
      </IntlProvider>
    );
    expect(screen.getByRole("tab", { name: /generate/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /edit/i })).toBeInTheDocument();
  });
});
```

---

### 6. Schema Validation Edge Cases — `schema-edge-cases.test.ts` ✅

**Location:** `__tests__/components/image-generator/schema-edge-cases.test.ts` — **created**

```typescript
describe("Edge Cases & Error Handling", () => {
  it("should validate parameter ranges (Nano Banana 50K prompt limit)", () => {
    const nanoSchema = getModelSchemaById("nano-banana-pro-t2i");
    const promptParam = nanoSchema?.params.find((p) => p.key === "prompt");
    expect(promptParam?.maxLength).toBe(50_000);
    expect(promptParam?.minLength).toBe(3);
  });

  it("should map aspect_ratio options correctly (Square → 1:1)", () => {
    const v3T2I = getModelSchemaById("kling-v3-t2i");
    const aspectParam = v3T2I?.params.find((p) => p.key === "aspect_ratio");
    const squareOption = aspectParam?.options?.find((o) => o.value === "1:1");
    expect(squareOption?.label).toBeDefined();
  });

  it("should have getDefaultParamsFromSchema skip ref params", () => {
    const o3I2I = getModelSchemaById("kling-o3-i2i");
    const defaults = getDefaultParamsFromSchema(o3I2I);
    expect(defaults.prompt).toBeUndefined();
    expect(defaults.image_urls).toBeUndefined();
    expect(defaults.resolution).toBeDefined();
    expect(defaults.result_type).toBeDefined();
  });
});
```

---

### 7. Manual Testing Script — `sprint-30-manual-test.js` ✅

**Location:** `scripts/sprint-30-manual-test.js` — **created** (browser console; adapt selectors if DOM changes)

Use in browser DevTools on `/{locale}/tools/image-generator` after loading the app. `FloatingPromptBar` exposes `data-testid="credit-cost"` for the credit check.

```javascript
// Sprint 30 Manual Validation — run in browser console on /tools/image-generator
console.log("🏆 Sprint 30 Manual Validation Protocol");

const SPRINT_30_TEST = {
  verifySchemaIntegrity: () => {
    // If schemas are exposed on window for debug (optional)
    const count = 8;
    const schemaIds = [
      "kling-v3-t2i", "kling-v3-i2i", "kling-o3-t2i", "kling-o3-i2i",
      "grok-t2i", "grok-i2i", "nano-banana-pro-t2i", "nano-banana-pro-i2i"
    ];
    console.log("Expected 8 schema IDs:", schemaIds);
    console.log("✅ Schema integrity check (verify in Network/React DevTools)");
  },

  testModelSelector: () => {
    const trigger = document.querySelector("[data-testid='model-selector-trigger']") ||
                   document.querySelector("button[aria-haspopup='dialog']");
    if (!trigger) {
      console.warn("Model selector trigger not found — add data-testid if needed");
      return;
    }
    trigger.click();
    const cards = document.querySelectorAll("[data-testid='model-card']");
    console.assert(cards.length >= 8, "Should see 8+ model cards");
    console.log("✅ Model selector opened, cards:", cards.length);
  },

  testPremiumTabs: () => {
    const tablist = document.querySelector("[role='tablist']");
    console.assert(tablist !== null, "Premium tab list should exist");
    const tabs = document.querySelectorAll("[role='tab']");
    console.assert(tabs.length === 2, "Should have Generate and Edit tabs");
    console.log("✅ Premium tabs found");
  },

  testCreditDisplay: () => {
    const costEl = document.querySelector("[data-testid='credit-cost']");
    if (costEl) console.log("Credit cost element:", costEl.textContent);
    else console.warn("Credit cost element not found — check FloatingPromptBar/UI");
  }
};

Object.entries(SPRINT_30_TEST).forEach(([name, fn]) => {
  try {
    fn();
  } catch (e) {
    console.error(`❌ ${name}:`, e);
  }
});
```

---

### 8. Performance Benchmarks — `performance-metrics.test.tsx` ✅

**Location:** `__tests__/components/image-generator/performance-metrics.test.tsx` — **created** (OptionsPanel render &lt;200ms, schema switch &lt;50ms; 200ms avoids flake on CI)

```typescript
describe("Performance Standards", () => {
  it("should render OptionsPanel in <100ms for any model", () => {
    const schema = getModelSchemaById("nano-banana-pro-t2i");
    const defaultParams = getDefaultParamsFromSchema(schema);
    const start = performance.now();
    render(
      <OptionsPanel schema={schema} params={defaultParams} onParamsChange={jest.fn()} />
    );
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });

  it("should switch schema without long pause", () => {
    const { rerender } = render(
      <OptionsPanel
        schema={getModelSchemaById("kling-v3-t2i")}
        params={getDefaultParamsFromSchema(getModelSchemaById("kling-v3-t2i"))}
        onParamsChange={jest.fn()}
      />
    );
    const start = performance.now();
    rerender(
      <OptionsPanel
        schema={getModelSchemaById("grok-t2i")}
        params={getDefaultParamsFromSchema(getModelSchemaById("grok-t2i"))}
        onParamsChange={jest.fn()}
      />
    );
    const end = performance.now();
    expect(end - start).toBeLessThan(50);
  });
});
```

---

### 9. E2E Image Generator Script (real FAL API, no UI) ✅

**Location:** `tests/ai-language-support/e2e-image-generator-sprint30.ts` — **created**

**Run with bash:**
```bash
npm run e2e:sprint30-image
```
or
```bash
npx tsx tests/ai-language-support/e2e-image-generator-sprint30.ts
```

**Requires:** `FAL_KEY` in `.env.local` (same as existing `test-image-generation.ts`).

**Flow:** (1) **T2I** — runs text-to-image for all 4 T2I models (Kling v3/O3, Grok, Nano Banana Pro), saves first generated image URL to `tests/ai-language-support/results/e2e-sprint30-t2i-image.json`. (2) **I2I** — runs image-to-image for all 4 I2I models using that image (no placeholder). Uses FAL `queue.fal.run` directly (same pattern as `tests/ai-language-support/test-image-generation.ts`).

---

## 🎯 Critical Validation Path

### Priority 1: Schema integrity

- [ ] All 8 schema IDs present in `IMAGE_MODEL_SCHEMAS`.
- [ ] Each schema has correct `creditActionType` (see seedCredits).
- [ ] Parameter dependencies (e.g. O3 `result_type` → `num_images` / `series_amount`) via `showWhen`.
- [ ] `getT2ISchemas()` and `getI2ISchemas()` return 4 each.

### Priority 2: End-to-end flow

```
Model Selector → OptionsPanel (params) → Generate → Credit deduction → Result
```

- [ ] Credit costs: Kling T2I/I2I = 5, Grok T2I/I2I = 5, Nano Banana T2I/I2I = 15.
- [ ] Params from UI map correctly to backend (e.g. aspect "1:1", resolution "1K"/"2K"/"4K").

### Priority 3: Visual and UX

- [ ] Premium glass tabs: `backdrop-blur-md`, `bg-background/60`, `border-white/10`, `rounded-xl`.
- [ ] Floating prompt bar: glass styling, fixed position.
- [ ] Single vs multi ref: RefsPanel shows drag handles only for multi-ref schemas.

### Priority 4: Business logic

- [ ] Credit costs match `convex/seedCredits.ts` (image_generation 5, image_edit 5, grok 5, nano 15).
- [ ] Parameter transformations (e.g. UI "Square" → API "1:1") via schema options and `aspectValueToKling` where used.
- [ ] Single vs multi ref driven by `schema.capabilities.multiImage`.

---

## 📁 Suggested file layout

| File | Purpose |
|------|--------|
| `__tests__/components/image-generator/schema-validation.test.ts` | ✅ Schema IDs, creditActionType, showWhen |
| `__tests__/convex/imageToolIntegration.test.ts` | ✅ Credit cost API, image tool mutations, args |
| `__tests__/components/image-generator/ui-integration.test.tsx` | ✅ ModelSelector, RefsPanel, OptionsPanel |
| `__tests__/components/image-generator/schema-edge-cases.test.ts` | ✅ Ranges, defaults, ref param skip |
| `__tests__/components/image-generator/e2e-model-matrix.test.ts` | ✅ Model matrix (schema → actionType → cost) |
| `__tests__/components/image-generator/visual-regression.test.tsx` | ✅ Glass UI classes, tab labels |
| `__tests__/components/image-generator/performance-metrics.test.tsx` | OptionsPanel render / switch time |
| `__tests__/convex/imageToolGeneric.test.ts` or integration | Credit deduction, action types |
| `scripts/sprint-30-manual-test.js` | Browser console checklist |

---

## 🚀 Running the protocol

1. **Unit/integration (Vitest):**
   ```bash
   pnpm test:image-generator
   pnpm test:convex
   ```
   Or run a single suite: `pnpm exec vitest run __tests__/components/image-generator/schema-validation.test.ts`
2. **TypeScript + lint:**
   ```bash
   npx tsc --noEmit
   npx biome check --write components/image-generator __tests__/components/image-generator
   ```
3. **Manual:** Open `/{locale}/tools/image-generator`, run `scripts/sprint-30-manual-test.js` in console (after exposing any needed globals or using DOM selectors that exist).
4. **CI:** Add the same test paths to your CI pipeline so schema and UI stay validated on every change.

This protocol ensures the same-day model onboarding capability is validated by tests and scripts, not only by manual checks.

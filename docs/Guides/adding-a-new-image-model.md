# Adding a New Image Model (Zero-Code Onboarding)

This guide describes how to add a new FAL image model to the image generator. The UI and backend are **schema-driven**: you document the model in the analysis doc first, then add one schema + one credit cost in the seed, run the seed, and add English i18n keys. No hardcoded model lists in app code.

**Order of work:** (1) Update the analysis doc → (2) Add schema + credit cost in seed → (3) Deploy Convex and run seed → (4) Add i18n in `messages/en.json` only.

---

## What the dev must provide to update the analysis doc

To update [IMAGE-MODELS-ANALYSIS.md](../Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md) (and then implement the model), the **dev** must bring:

- **Model identity**: FAL model ID (e.g. `fal-ai/nano-banana-2`), type (T2I or I2I), and links: Playground, API docs, OpenAPI (e.g. `https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-2`).
- **API spec**: Input parameters (names, types, required/optional, defaults, constraints), output schema (e.g. `images` array, optional `description` / `revised_prompt`). Best source: FAL OpenAPI schema or the model’s API doc.
- **Pricing**: USD per image (base), and any modifiers (e.g. 4K = 2×, 0.5K = 0.75×, enable_web_search +$0.015). From FAL pricing page or model card.

With that, the analysis doc can be updated (Step 1) and the seed schema (Step 2) can be filled in to match.

---

## Step 1: Update IMAGE-MODELS-ANALYSIS.md (do this first)

Use the API spec and pricing from the dev (or from FAL docs) to update the analysis doc. That doc is the single source of truth for parameters and control mapping; the seed schema in Step 2 must match it.

1. **Models to Analyze** — Add a row: model ID, type (T2I/I2I), status "✅ Documented".
2. **Provider pricing** — Add a row: model ID, type, USD per image (base), modifiers (resolution multipliers, web_search, etc.).
3. **Per-model section** — Add a full section (e.g. "Model N: fal-ai/… — Text-to-Image") with:
   - Description (one short paragraph).
   - Pricing table.
   - Capabilities (negative prompt, resolution, aspect auto, safety_tolerance, etc.).
   - Input parameters table (from OpenAPI: name, type, required, default, constraints).
   - Schema → control mapping (each param → control type and options/constraints for the dynamic UI).
   - Backend mapping (endpoint, type, parameter mapping, response path).
   - Output schema and use cases.

Copy the structure from an existing model section in the same doc; it serves as the template for the seed in Step 2.

---

## Step 2: Add schema and credit cost in seedImageModels.ts

### 2.1 Option arrays (if the model adds new values)

If the model introduces a new option value (e.g. resolution `"0.5K"`), add a shared constant in `seedImageModels.ts` and an i18n key **in `messages/en.json` only** (other locales are handled by the project’s translation script):

```ts
// Example: Nano Banana 2 has 0.5K resolution
const RESOLUTION_0_5K_1K_2K_4K = [
  { value: "0.5K", label: "schema_option_0_5k" },
  ...RESOLUTION_1K_2K_4K,
];
```

In `messages/en.json` add: `"schema_option_0_5k": "0.5K"`. Do **not** edit other locale files; use the translation script for them.
Run pnpm translate

### 2.2 Add one entry to IMAGE_MODEL_SCHEMAS

Append an object aligned with the analysis doc (Step 1):

- **schemaId** — App-facing id, e.g. `"nano-banana-2-t2i"`.
- **name** — Display name, e.g. `"Nano Banana 2 — Text-to-Image"`.
- **nameTranslationKey** — i18n key for the model name, e.g. `"image_generator.models.nano_banana_2_t2i"` (you will add this in Step 4 in `messages/en.json` only).
- **modelId** — FAL endpoint path, e.g. `"fal-ai/nano-banana-2"` (used as `https://queue.fal.run/{modelId}`).
- **type** — `"t2i"` or `"i2i"`.
- **creditActionType** — Must exist in `creditCosts` (add in 2.3), e.g. `"image_generation_nano_banana_2"`.
- **capabilities** — e.g. `{ maxResolution: "4K", aspectAuto: true }`.
- **badges** — Optional, e.g. `["NEW"]`.
- **params** — Array of param definitions: `key`, `control` (text, segmented, icon-select, number, select, toggle), `label`, `options` (for select/segmented/icon-select), `default`, `min`/`max` or `minLength`/`maxLength`, `advanced`, `refType` (for refs). Match the analysis doc’s schema → control mapping.
- **allowedParams** — List of param keys sent to FAL (filters request body).
- **maxPromptLength** — Truncation limit for prompt (from API spec).
- **sortOrder** — Order in the model list (e.g. 9 for the 9th model).

Parameter names and values must match the FAL OpenAPI for that endpoint.

### 2.3 Add one entry to ALL_CREDIT_COSTS

Add an object with:

- **actionType** — Same string as the schema’s `creditActionType`.
- **displayName**, **description**, **category** — For dashboard/admin.
- **credits** — Number of credits to deduct per generation (align with pricing; change here or later in Convex dashboard).
- **isActive** — `true`.

Credits are read at runtime from `creditCosts`; no cost logic in app code.

---

## Step 3: Deploy Convex, then run the seed

**Important:** `npx convex run seed/seedImageModels:seedAll` runs the **deployed** seed code on Convex. If your local `seedImageModels.ts` has the new model but you haven’t deployed, Convex still has the old version and the seed will report "0 new models".

1. Deploy so the new seed code is on Convex: `npx convex dev` (or `npx convex deploy` for production).
2. Then run the seed:

```bash
npx convex run seed/seedImageModels:seedAll
```

This inserts or updates rows in `imageModelSchemas` and `creditCosts`. The image generator will show the new model in the model selector and use it for generation.

---

## Step 4: i18n in messages/en.json only

**Only edit `messages/en.json`.** Other locales are translated via the project’s translation script; do not touch `de.json`, `es.json`, `fr.json`, `it.json`, `pt.json`, `ru.json` by hand.

1. **Model display name** — Each schema has **nameTranslationKey** (e.g. `image_generator.models.nano_banana_2_t2i`). Add that key under `image_generator.models` in `messages/en.json` (e.g. `"nano_banana_2_t2i": "Nano Banana 2 — Text-to-Image"`). The model selector uses it; if missing, the UI falls back to the schema `name`. Mirror the structure of existing models (`kling_v3_t2i`, `nano_banana_t2i`, etc.).
2. **New option labels** — If you added a new option in 2.1 (e.g. `schema_option_0_5k`), add that key in `messages/en.json` (e.g. `"schema_option_0_5k": "0.5K"`). Other locales: use the translation script.

---

## Optional follow-ups

- **Cost breakdown (USD)** — If you track usage and call `calculateAICost()` with a `model` value, add a branch in `lib/ai/costCalculation.ts` for the new model (or its modelId) so the displayed cost is correct.
- **E2E / unit tests** — If tests use a fixed list of schema IDs or mock schemas (e.g. `__tests__/components/image-generator/schema-validation.test.ts`, `e2e-model-matrix.test.ts`, `tests/ai-language-support/e2e-image-generator-sprint30.ts`), add the new schemaId and, if applicable, credit cost to the mocks and test cases.

---

## Summary

| Order | What | Where |
|-------|------|--------|
| 1 | Document model (params, pricing, control mapping) | `docs/Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md` |
| 2 | Model schema + credit cost | `convex/seed/seedImageModels.ts` → `IMAGE_MODEL_SCHEMAS`, `ALL_CREDIT_COSTS` |
| 3 | Deploy Convex, then run seed | `npx convex dev` (or deploy), then `npx convex run seed/seedImageModels:seedAll` |
| 4 | English i18n (model name + new option labels) | `messages/en.json` only; other locales via translation script |
| Optional | USD cost, tests | `lib/ai/costCalculation.ts`, test mocks |

No changes are required in `convex/imageTool.ts`, `convex/actions/imageToolGeneric.ts`, or the image generator UI components — they all read from Convex and the schema.

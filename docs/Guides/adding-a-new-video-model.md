# Adding a New Video Model (Zero-Code Onboarding)

This guide describes how to add a new FAL video model to the storyboard generator. The UI and backend are **schema-driven**: you document the model in the analysis doc first, then add one schema + one or more credit cost entries in the seed, run the seed, and add English i18n keys. No hardcoded model lists in app code.

**Order of work:** (1) Update the analysis doc → (2) Add schema + credit costs in seed → (3) Deploy Convex and run seed → (4) Add i18n in `messages/en.json` only.

---

## What the dev must provide to update the analysis doc

To update [VIDEO-MODELS-ANALYSIS.md](../Analysis/video-generator/VIDEO-MODELS-ANALYSIS.md) (and then implement the model), the **dev** must bring:

- **Model identity**: FAL model ID (e.g. `fal-ai/kling-video/v3/pro/image-to-video`), type (`i2v`, `r2v`, or `v2v`), and links: Playground, API docs, OpenAPI.
- **API spec**: Input parameters (names, types, required/optional, defaults, constraints), output schema (e.g. `video.url`). Best source: FAL OpenAPI schema or the model's API doc.
- **Pricing**: USD per 5-second clip (base), and any tier modifiers (audio off, audio on, voice control). From FAL pricing page or model card.
- **Capabilities**: Which flags apply (`requiresStartImage`, `requiresVideoInput`, `supportsEndImage`, `supportsStyleImages`, `supportsElements`, `supportsDuration`, `audioGeneration`, `keepAudio`, `voiceIds`, `multiShot`, `negativePrompt`, `cfgScale`) and the supported aspect ratios.

With that, the analysis doc can be updated (Step 1) and the seed schema (Step 2) can be filled in to match.

---

## Step 1: Update VIDEO-MODELS-ANALYSIS.md (do this first)

Use the API spec and pricing from the dev (or from FAL docs) to update the analysis doc. That doc is the single source of truth for parameters and control mapping; the seed schema in Step 2 must match it.

1. **Models to Analyze** — Add a row: model ID, type (I2V/R2V/V2V), status "✅ Documented".
2. **Provider pricing** — Add a row: model ID, type, USD per 5s (base), tier modifiers.
3. **Per-model section** — Add a full section with:
   - Description (one short paragraph).
   - Pricing table (per tier: no audio, audio, voice control).
   - `startImageParam` and `videoInputParam` mapping (e.g. v3 Pro uses `start_image_url`, O3 Pro I2V uses `image_url`).
   - `requiredParams` list (drives generate button gating — zero-code per `useCanGenerateScene`).
   - `capabilities` flags table.
   - `params[]` array — each entry maps to a `DynamicField` control (`textarea`, `select`, `slider`, `toggle`, `number`, `image`, `aspectratio`) with `scope: "global"` or `scope: "scene"`.
   - `allowedParams` list (whitelist for FAL API call).
   - Backend mapping (endpoint, param injection via `startImageParam`/`videoInputParam` fields).

Copy the structure from an existing model section in the same doc; it serves as the template for the seed in Step 2.

---

## Step 2: Add schema and credit costs in seedVideoModels.ts

### 2.1 Option arrays (if the model adds new values)

If the model introduces a new aspect ratio or duration option, add the option to the relevant shared constant in `seedVideoModels.ts` and an i18n key **in `messages/en.json` only** (other locales are handled by the project's translation script):

```ts
// Example: new aspect ratio "4:3"
const ASPECT_RATIOS_WITH_4_3 = [
  ...STANDARD_ASPECT_RATIOS,
  { value: "4:3", label: "video_generator.aspect_ratio_4_3" },
];
```

In `messages/en.json` add: `"aspect_ratio_4_3": "4:3"` under the `video_generator` namespace. Do **not** edit other locale files; use the translation script for them.

### 2.2 Add one entry to VIDEO_MODEL_SCHEMAS

Append an object aligned with the analysis doc (Step 1):

- **schemaId** — App-facing id, e.g. `"kling-v3-pro-i2v"`.
- **name** — Display name, e.g. `"Kling v3 Pro Image-to-Video"`.
- **nameTranslationKey** — i18n key for the model name, e.g. `"video_models.kling_v3_pro"` (you will add this in Step 4 in `messages/en.json` only).
- **modelId** — FAL endpoint path, e.g. `"fal-ai/kling-video/v3/pro/image-to-video"` (used as `https://queue.fal.run/{modelId}`).
- **type** — `"i2v"`, `"r2v"`, or `"v2v"`. This is metadata only — used for the `VideoModelCard` badge and `VideoModelSelector` group header. **Never used for branching in `SceneInputArea` or the backend action.**
- **startImageParam** — FAL param name for the start image, e.g. `"start_image_url"` (v3 Pro) or `"image_url"` (O3 Pro I2V). Omit for V2V.
- **videoInputParam** — FAL param name for the input video, e.g. `"video_url"`. Omit for I2V/R2V.
- **requiredParams** — Array of required param keys. The `useCanGenerateScene` hook evaluates this; R2V has `[]` (generate button always enabled). Example: `["start_image_url"]` for I2V, `["video_url", "prompt"]` for V2V.
- **creditBaseDuration** — Always `5` (5-second baseline for all Kling models).
- **supportsDurationScaling** — `true` for I2V/R2V (cost scales with selected duration); `false` for V2V Edit (flat cost per tier).
- **creditTiers** — Array of tier objects with `tier`, `actionType`, and `labelKey`. Each `actionType` must exist in `ALL_CREDIT_COSTS` (Step 2.3). The `labelKey` must point to an existing i18n key in `video_generator` (e.g. `"video_generator.tier_no_audio"`).
- **capabilities** — Object of boolean flags that `SceneInputArea` and `FloatingVideoSettingsPanel` read to decide what to render. **No UI component may branch on `schema.type` — use these flags exclusively.**
- **badges** — Optional display badges (e.g. `["PRO", "AUDIO"]`).
- **params** — Array of param definitions: `key`, `control`, `label` (i18n key), `hint` (i18n key), `placeholder` (i18n key), `required`, `options`, `default`, `min`/`max`, `maxLength`, `rows`, `advanced`, `scope` (`"global"` or `"scene"`), `showWhen`. Match the analysis doc's control mapping. Prompt params must set `placeholder` and `hint` to the per-model i18n key (e.g. `placeholder: "video_generator.prompt_placeholder_r2v"`) — the UI reads these from the schema, never by type branching.
- **allowedParams** — Whitelist of param keys sent to the FAL API. Any key not in this list is filtered out before the request.
- **maxPromptLength** — Truncation limit for prompt (from API spec).
- **sortOrder** — Display order in the model selector (e.g. `6` for the 6th model).

### 2.3 Add one or more entries to ALL_CREDIT_COSTS

For each credit tier the new model uses, add an object with:

- **actionType** — Same string as used in `creditTiers[].actionType`.
- **displayName**, **description**, **category** — For dashboard/admin display.
- **credits** — Number of credits to deduct per 5-second baseline generation (align with pricing; `Math.ceil(credits × requestedDuration / 5)` is applied at runtime for I2V/R2V).
- **isActive** — `true`.

Credits are read at runtime from `creditCosts`; no cost logic in app code.

---

## Step 3: Deploy Convex, then run the seed

**Important:** `npx convex run seed/seedVideoModels:seedAll` runs the **deployed** seed code on Convex. If your local `seedVideoModels.ts` has the new model but you haven't deployed, Convex still has the old version and the seed will report "0 new models".

1. Deploy so the new seed code is on Convex: `npx convex dev --once`.
2. Then run the seed:

```bash
npx convex run seed/seedVideoModels:seedAll
```

This inserts or updates rows in `videoModelSchemas` and `creditCosts`. The storyboard generator will show the new model in `VideoModelSelector` and use it for generation.

Verify via Convex MCP or dashboard:
- `videoModelSchemas` has the expected number of records (e.g. 6 after adding the 6th model)
- `creditCosts` has the new action type entries (no duplicates)

---

## Step 4: i18n in messages/en.json only

**Only edit `messages/en.json`.** Other locales are translated via the project's translation script; do not touch `de.json`, `es.json`, `fr.json`, `it.json`, `pt.json`, `ru.json` by hand.

1. **Model display name** — Each schema has `nameTranslationKey` (e.g. `video_models.kling_v3_pro`). Add that key under `video_models` in `messages/en.json` (e.g. `"kling_v3_pro": "Kling v3 Pro"`). The `VideoModelCard` and `VideoModelSelector` use it; if missing, the UI falls back to the schema `name` field.
2. **Model description** — Add the `_desc` key alongside the name key (e.g. `"kling_v3_pro_desc": "Cinematic quality with native audio, voice control, and character consistency"`).
3. **New option labels** — If the model adds new `params[]` entries with new i18n label/hint/placeholder keys, add those keys in `messages/en.json` under the `video_generator` namespace.
4. **Run translation**: `pnpm translate` — generates all 6 other locale files.
5. **Verify**: `pnpm i18n:verify` — confirms all 7 locales are synchronized.

---

## Optional follow-ups

- **E2E / unit tests** — If tests use a fixed list of schema IDs or mock schemas, add the new `schemaId` and credit costs to the mocks and test cases.
- **`VideoModelCard` capability chips** — New capability flags used in `schema.capabilities` automatically render as chips if they are mapped in the chip config (e.g. `video_models.chip_audio`). If a brand-new capability flag is introduced, add a chip entry to the chip config in `VideoModelCard.tsx` and a corresponding i18n key under `video_models`.

---

## Summary

| Order | What | Where |
|-------|------|--------|
| 1 | Document model (params, pricing, control mapping, capabilities flags) | `docs/Analysis/video-generator/VIDEO-MODELS-ANALYSIS.md` |
| 2 | Add schema entry + credit cost(s) to seed | `convex/seed/seedVideoModels.ts` → `VIDEO_MODEL_SCHEMAS`, `ALL_CREDIT_COSTS` |
| 3 | Deploy Convex, run seed | `npx convex dev --once`, then `npx convex run seed/seedVideoModels:seedAll` |
| 4 | English i18n (model name + any new option labels) | `messages/en.json` only; other locales via `pnpm translate` |

No changes are required in `convex/videoTool.ts`, `convex/actions/videoToolGeneric.ts`, or the storyboard-generator UI components — they all read from Convex and the schema.

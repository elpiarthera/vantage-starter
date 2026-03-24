# 🎬 Open Higgsfield AI vs MyShortReel — Comparison & Improvement Report

**Date**: February 15, 2026  
**Context**: Sprint 30c (Canvas-First UI Rebuild) + UI-UX-REDESIGN-PROPOSAL v3.1  
**Reference**: [Open-Higgsfield-AI](https://github.com/Anil-matcha/Open-Higgsfield-AI) · [Medium Article](https://medium.com/@anilmatcha/building-open-higgsfield-ai-an-open-source-ai-cinema-studio-83c1e0a2a5f1)  
**Status**: 📋 ANALYSIS REPORT

---

## 📊 Executive Summary

Open Higgsfield AI is an open-source AI cinema studio (1.6k ★, MIT license) built with **Vanilla JS + Vite + Tailwind CSS v4**, using the [Muapi.ai](https://muapi.ai) API as a universal model gateway. It features two distinct studios: an **Image Studio** (multi-model switcher) and a **Cinema Studio** (cinematography-focused with virtual camera controls).

**Bottom line**: Our Sprint 30c "Floating Studio" architecture is **already more advanced** than Open Higgsfield in most areas (React/Next.js, schema-driven, i18n, mobile-first, Convex backend). However, Open Higgsfield introduces **3 concepts worth stealing** and exposes **2 gaps** in our current roadmap.

---

## 🔍 Architecture Comparison

| Dimension | MyShortReel (Sprint 30c) | Open Higgsfield AI |
| :--- | :--- | :--- |
| **Framework** | Next.js + React + TypeScript | Vanilla JS (no framework) |
| **Styling** | Tailwind + shadcn/ui + semantic tokens | Tailwind v4 + hardcoded colors |
| **State** | React state + Convex backend | DOM mutation + localStorage |
| **Models** | 8 models (schema-driven `modelSchemas.ts`) | 20+ models (JSON dump `models_dump.json`) |
| **API Layer** | fal.ai direct + Convex functions | Muapi.ai universal adapter (submit + poll) |
| **i18n** | 8 languages, ICU plurals, 140+ keys | ❌ English only |
| **Mobile** | Mobile-first, 320px+, `useDevice()`, drawers | Basic responsive, no mobile-first strategy |
| **Accessibility** | ARIA labels, keyboard nav, shadcn Tabs | ❌ Minimal |
| **History** | Convex-persisted, cross-device | localStorage only (50 item cap) |
| **Auth** | Clerk + Convex | API key in localStorage |

### Verdict: MyShortReel is architecturally superior

Our schema-driven, typed, i18n-ready, mobile-first approach is significantly ahead of Higgsfield's Vanilla JS DOM manipulation. Their `models_dump.json` approach is fragile compared to our typed `ModelSchema` system.

---

## ✅ What We Already Do Better

### 1. Canvas-First Floating UI (Sprint 30c ✅)
Both projects converge on the same vision: **full-screen canvas + floating controls**. Our Sprint 30c implementation with glassmorphism, z-index stacking, `AdaptiveModal` (Drawer on mobile), and shadcn/ui is more mature than Higgsfield's hardcoded `bg-[#1a1a1a]` panels.

### 2. Schema-Driven Dynamic Fields (Sprint 30 Phase 1 ✅)
Our `DynamicField` + `VisualSelect` + `OptionsPanel` with typed `ParamSchema` is cleaner than Higgsfield's approach of manually showing/hiding quality buttons per model.

### 3. Model Discovery Modal (Sprint 30 Phase 2 ✅)
Our `ModelSelector` → `ModelGrid` → `ModelCard` with badges, credits, capabilities is comparable to Higgsfield's model dropdown but with richer metadata.

### 4. Smart Refs / Edit Mode (Sprint 30c Task 4 ✅)
Our `RefsPanel` with drag-and-drop, `@Image` references, and floating overlay is more advanced than anything in Higgsfield (which has no I2I mode).

### 5. i18n + Accessibility
Higgsfield has zero i18n or accessibility support. Our 8-language, ICU plural, ARIA-labeled, keyboard-navigable system is a clear advantage.

---

## 🔥 3 Concepts Worth Adopting

### Concept 1: "Cinema Studio" Mode — Prompt Engineering Abstraction 🎯🎯🎯

**What they do**: Instead of making users write "shot on a full-frame cinema camera using a compact anamorphic lens at 35mm, aperture f/1.4, cinematic lighting", they provide **visual pickers** for Camera, Lens, Focal Length, and Aperture. A **translation layer** (`buildNanoBananaPrompt()`) silently injects optimized tokens into the prompt.

```js
// Their approach — user picks visuals, system builds prompt
export function buildNanoBananaPrompt(basePrompt, camera, lens, focalLength, aperture) {
    const parts = [
        basePrompt,
        `shot on a ${CAMERA_MAP[camera]}`,
        `using a ${LENS_MAP[lens]} at ${focalLength}mm`,
        `aperture ${aperture}`,
        "cinematic lighting, natural color science, high dynamic range"
    ];
    return parts.join(", ");
}
```

**Their UI**: Scrollable "wheel picker" columns with images for each camera/lens — resembles iOS date pickers but for cinematography gear. Visually stunning with blur masks, snap scrolling, and glow effects.

**Why it matters for us**: 
- Our target audience (video creators, ad makers) thinks in **cinematic terms**, not prompt engineering.
- This shifts the mental model from "Writing" to "Directing" — a powerful UX insight.
- This is **complementary** to our existing `OptionsPanel`, not a replacement.

**Recommendation**: **HIGH PRIORITY** — Add a "Cinema" preset mode or a "Cinematography Controls" collapsible section in our `FloatingOptionsPanel` for supported models (especially Nano Banana Pro, which already supports this). Could be a Sprint 31 feature.

**Implementation sketch**:
- Add `CinemaPresets` component with visual camera/lens/aperture pickers.
- Add `buildCinemaPrompt()` utility to `lib/prompt-utils.ts`.
- Wire into `FloatingPromptBar` — user's base prompt gets enhanced transparently.
- Gate behind supported models via `ModelSchema.capabilities.cinemaMode: boolean`.

---

### Concept 2: "Comparative Workflow" — Multi-Model Side-by-Side 🎯🎯

**What they do**: Users can run the **same prompt on multiple models** to compare outputs. Higgsfield doesn't have a formal comparison UI, but their easy model switching + persistent history enables this workflow naturally.

**Why it matters for us**:
- Creators often want to see "which model nails this shot" before committing credits.
- A/B testing prompts across models is a power-user need we don't address.

**Recommendation**: **MEDIUM PRIORITY** — Consider a "Compare" mode in a future sprint:
- User selects 2-4 models → generates the same prompt on each → results shown in a grid.
- Leverages our existing `ModelSchema` system and `OutputSection`.
- Could be a premium/pro feature.

---

### Concept 3: Universal Model Adapter + Auto-Schema from API 🎯

**What they do**: Their `models_dump.json` is auto-generated from the Muapi API response. Each model's inputs (prompt, aspect_ratio, resolution, width/height, num_images, etc.) are defined by the API itself. The UI dynamically adapts — resolution picker shows/hides based on whether the model exposes a `resolution` input.

**Why it matters for us**:
- Our `modelSchemas.ts` is **manually maintained** (8 models). Adding a model requires editing TypeScript.
- Their approach scales to 20+ models with zero schema code changes.
- The Muapi API auto-describes available inputs per model (enum values, min/max, defaults).

**Recommendation**: **LOW PRIORITY (Future)** — Our typed `ModelSchema` approach is better for quality/safety but harder to scale. Consider:
- A `fetchModelCapabilities()` API call that returns available params.
- Auto-generating `modelSchemas.ts` entries from API metadata (like their `models_dump.json`).
- Keeping our typed overlay for curated models while auto-importing new ones.

---

## ⚠️ 2 Gaps Exposed

### Gap 1: No "Quick Preset" System

Both our redesign proposal (v3.1, Section 0.5) and Higgsfield's Cinema Studio have preset concepts:
- **Our proposal**: "Fast", "Quality", "Batch" preset buttons (designed but **not implemented in Sprint 30c**).
- **Higgsfield**: Camera/Lens combinations that effectively act as "look" presets.

**Status**: Our Sprint 30c task list doesn't include preset implementation. This was in the Phase 0 plan but was dropped during the sprint scope.

**Recommendation**: Add "Quick Presets" to Sprint 31 backlog. Simple implementation:
```tsx
const PRESETS = {
  fast: { resolution: "1k", model: "flux-schnell" },
  quality: { resolution: "4k", model: "nano-banana-pro" },
  cinematic: { resolution: "2k", model: "nano-banana-pro", promptSuffix: "cinematic lighting, shallow depth of field" },
};
```

### Gap 2: No Generation History Thumbnails on Canvas

Higgsfield's Cinema Studio shows a **persistent history sidebar** with thumbnails on the canvas view. When a result is shown, past generations are visible as small clickable thumbnails on the right edge.

Our Sprint 30c moved history access to an `AdaptiveModal` triggered by a button — functional but less discoverable. The history is "hidden behind a click" rather than glanceable.

**Recommendation**: **LOW PRIORITY** — Consider a mini thumbnail strip (3-5 recent items) near the canvas, expanding to full history on click. This keeps the canvas-first feel while making history more accessible.

---

## 🚫 What NOT to Copy

### 1. Vanilla JS / No Framework
Their entire codebase is DOM manipulation (`document.createElement`, `innerHTML`). This is technically impressive but unmaintainable at scale. Our React + TypeScript approach is correct.

### 2. Hardcoded Styles
They use `bg-[#1a1a1a]`, `bg-[#d9ff00]`, `border-white/10` everywhere. No design tokens, no theme system. Our semantic token approach (`bg-background/60`, `text-foreground`, `border-border/50`) is far superior.

### 3. localStorage-Only Persistence
50-item history cap, no cross-device sync, no user accounts. Our Convex backend is the right choice.

### 4. No Mobile Strategy
Their responsive approach is an afterthought (`md:` breakpoints sprinkled in). Our mobile-first, 320px base, `useDevice()`, `AdaptiveModal` system is leagues ahead.

### 5. No i18n, No Accessibility
Zero ARIA labels, zero keyboard navigation, English-only. Not acceptable for a production app.

### 6. Single API Provider Lock-in (Muapi)
They're locked to Muapi.ai as their sole API gateway. Our multi-provider architecture (fal.ai, Grok, etc.) via Convex is more flexible.

---

## 📐 Feature Matrix

| Feature | MyShortReel (Sprint 30c) | Open Higgsfield |
| :--- | :--- | :--- |
| Canvas-first layout | ✅ Full floating studio | ✅ Full-screen canvas |
| Floating prompt bar | ✅ Glass, auto-expand | ✅ Glass, auto-expand |
| Model discovery | ✅ Modal + Grid + Cards | ✅ Dropdown + Search |
| # Models | 8 (curated, typed) | 20+ (auto-imported) |
| Schema-driven UI | ✅ Typed `ParamSchema` | ⚠️ JSON dump, untyped |
| Visual selectors | ✅ `VisualSelect` icons | ⚠️ Basic aspect ratio only |
| Cinema camera controls | ❌ Not yet | ✅ Camera/Lens/Focal/Aperture |
| Prompt engineering abstraction | ❌ Not yet | ✅ `buildNanoBananaPrompt()` |
| Quick presets | ❌ Designed, not built | ⚠️ Implicit via camera settings |
| Edit mode (I2I) | ✅ Smart Refs + floating | ❌ No I2I support |
| Generation history | ✅ Convex-persisted | ⚠️ localStorage (50 items) |
| History on canvas | ❌ Behind modal | ✅ Persistent sidebar |
| Multi-model comparison | ❌ Not yet | ⚠️ Manual switching |
| i18n | ✅ 8 languages, ICU | ❌ English only |
| Accessibility | ✅ ARIA, keyboard, shadcn | ❌ None |
| Mobile-first | ✅ 320px+, drawers, touch | ❌ Basic responsive |
| Design system | ✅ Semantic tokens, shadcn | ❌ Hardcoded colors |
| Video generation | ❌ Not yet (in roadmap) | ✅ T2V, I2V via Muapi |
| AI personas/characters | ❌ Not in scope | 🔮 Planned (LoRA training) |

---

## 🎯 Actionable Recommendations (Priority-Sorted)

| # | Recommendation | Priority | Sprint | Effort | Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Cinema Controls** — Add camera/lens/aperture visual pickers as optional "Cinema Mode" in `FloatingOptionsPanel` | 🔴 HIGH | 31 | 6-8h | Major differentiator for video creators |
| 2 | **Prompt Enhancement Layer** — `buildCinemaPrompt()` utility that transparently enriches user prompts with cinema tokens | 🔴 HIGH | 31 | 2-3h | Massive quality improvement for zero user effort |
| 3 | **Quick Presets** — Implement "Fast / Quality / Cinematic" one-click presets (already designed in proposal v3.1) | 🟡 MEDIUM | 31 | 2h | Reduces friction for 80% of use cases |
| 4 | **Compare Mode** — Side-by-side multi-model comparison view | 🟡 MEDIUM | 32+ | 8-12h | Power-user retention feature |
| 5 | **Canvas History Strip** — Mini thumbnail strip of recent generations visible on canvas | 🟢 LOW | 32+ | 3h | Discoverability improvement |
| 6 | **Auto-Schema Import** — Script to generate `modelSchemas.ts` from API metadata | 🟢 LOW | 32+ | 4-6h | Scaling to 20+ models faster |

---

## 🏁 Conclusion

**Sprint 30c is on the right track.** Our "Floating Studio" architecture already matches or exceeds Open Higgsfield's canvas-first approach, with significantly better engineering foundations (TypeScript, i18n, accessibility, mobile-first, Convex backend).

The single most valuable takeaway from Open Higgsfield is the **"Director, not Writer" paradigm** — abstracting prompt engineering behind cinematic visual controls. This is a natural extension of our existing `VisualSelect` and `OptionsPanel` system and should be the centerpiece of Sprint 31.

**Do not be distracted by their model count (20+).** Our 8 curated, fully-typed, i18n-ready models with rich schema metadata are more valuable than 20 loosely-defined models with no quality guarantees.

---

**Document Version**: 1.0  
**Author**: Analysis Agent  
**Last Updated**: February 15, 2026

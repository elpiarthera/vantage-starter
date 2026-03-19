# Pricing Model Change: Use-Case-Based Packages

**Date**: 2026-02-25  
**Request**: Demand is to move from a single subscription/credit model to **use-case-based packages** with different limits and prices.  
**Ref**: Stakeholder message (two-stage launch Mar 9 / Mar 20, Acquisition → Growth → Core → Expansion).

---

## 1. What Is Implemented Today (Credit System)

| Area | Current behaviour |
|------|-------------------|
| **Credits** | Single balance per user (`userCredits.balance`). Deduct by `actionType` only (`creditCosts` table). No use-case/occasion in logic. |
| **Subscriptions** | 3 tiers (Starter / Pro / Enterprise). Tier gives initial + monthly credits. Stored as `subscriptionTier` on user. No link to use case. |
| **One-time purchases** | 4 credit packs: webhook grants 25 / 55 / 115 / 300 (`convex/http.ts`). UI shows 25, 50+5, 100+15, 250+50 — same totals but **inconsistent base/bonus** (billing risk if copy is wrong). |
| **Use case / occasion** | Stored on **project** as `projects.occasion` (e.g. wedding, birthday, anniversary, business, custom). Used in UI and prompts only — **not** in billing or limits. |
| **Scenes** | No **creation** max enforced. `SceneManager.tsx` has `canDeleteScene = false` when at 3 scenes (MVP hint). Story defines scenes; backend does not gate by occasion. |
| **Regeneration** | **Limit exists in UI only**: `useVideoRegeneration.ts` uses `maxRegenerations = 5` (hardcoded). No use-case-based or backend enforcement; backend `videoRegeneration` action does not check a cap. |
| **Polar** | 3 subscription products + 4 one-time products. Webhooks add credits by product ID. No use-case-based products. |

So: **pay → get credits → use anywhere**. No per–use-case limits or per–use-case pricing.

---

## 2. Requested model (Summary)

- **Two-stage launch**: Mar 9 = wedding + engagement only (others “coming soon”); Mar 20 = all use cases.
- **Pricing by use-case package** (conceptually):
  - **Expansion** (wedding, engagement): €99, no limits (scenes, regenerations).
  - **Core** (anniversaries, family, etc.): convert to paying; limits TBD.
  - **Growth** (birthday, graduation): 2 scenes, 1 regeneration; acquisition price.
  - **Acquisition** (“Unleash your creativity”): 1 scene, 0 regeneration; low entry price.
- **Logic**: e.g. if use case = wedding or engagement → no limits, €99; if birthday or graduation → 2 scenes, 1 regen; if creativity → 1 scene, 0 regen.

---

## 3. Strategy: why use-case packaging is not realistic

### MVP vs roadmap

- **MVP (MyReelDream)** is **only the guided flow** (`app/[locale]/guided/`): one linear journey (step-0 → step-6) where the user picks an **occasion** (wedding, birthday, etc.) at the start. Billing today is simple: credits, no occasion-based limits.
- **Roadmap** is to **extend quickly** with more core features and **mini-apps**. Work has already started under `app/[locale]/tools/`: Image Generator, Voice Generator, Prompt Generator, Storyboard Generator, plus a tools wall and more planned (see `docs/Analysis/COMPREHENSIVE-MINI-APP-SUMMARY.md`). These are **multiple entry points** (standalone tools, not always tied to a “project” or “occasion”).

### Why the requested model does not fit

The requested pricing model is **occasion-centric**: limits and prices depend on **use case** (wedding, engagement, birthday, graduation, “Unleash your creativity”). That model is aligned with **one product**: the guided flow, where `project.occasion` is set once and drives the whole experience.

- **Guided flow only**: One place to enforce “max scenes / max regens per occasion” and one place to show “coming soon” or package choice. Complexity is already high but contained.
- **With tools and mini-apps**: Every new tool (image, voice, prompt, storyboard, cinematography studio, scene generator, etc.) either:
  - has **no natural “occasion”** (e.g. image generator used for anything), so it must be forced into a bucket like “Unleash your creativity” with arbitrary limits, or
  - must **read occasion from context** (e.g. “current project”) that may not exist when the user opens the tool standalone, or
  - introduce **new “use cases”** that then need new packages, Polar products, and limit rules.

So the **package matrix** (occasion → maxScenes, maxRegenerations, price, product ID) and all **limit checks** would have to be defined and enforced in **every flow** that consumes credits or uses scenes/regenerations: guided flow, image tool, voice tool, prompt generator, storyboard, scene generator, future mini-apps. Each new feature becomes a **new surface** for “User Package vs Project Occasion vs Current Usage” logic, and every new tool or use case **multiplies** the number of products, webhooks, and edge cases (e.g. “user in guided flow with wedding project opens Image Tool — which package applies?”).

### Resulting complexity

- **Build**: Every feature that touches creation, generation, or regeneration must resolve package limits by context (project occasion, tool type, or fallback). That is a **cross-cutting concern** in many modules (projects, scenes, videoRegeneration, and each tool’s backend/UI).
- **Maintain**: Adding a new mini-app or a new use case forces updates to package config, Polar products, webhooks, and all enforcement points. One mis‑wired limit or wrong product ID can block users or charge incorrectly.
- **Realism**: The requested model is **not realistic** for a product that is moving from “MVP = guided flow only” to “MVP + many tools/mini-apps” in a short time. It would tie the whole platform to a single flow’s taxonomy (occasion) and make fast iteration on new features and tools much harder.

### Alternative: mini-app-specific pricing (Scene Generator, 1 output)

The **“1 scene, 0 regeneration”** acquisition tier (“Unleash your creativity”) can be implemented **without** the full use-case matrix by selling **access to a single mini-app** with a fixed limit.

**Idea**: One Polar product, e.g. **“Scene Generator — 1 video”** (one-time, low price). Purchase grants the user **one run** of the Scene Generator tool (one 8s video output). No occasion, no project required; no “User Package vs Occasion” logic.

**Reference**: `docs/Analysis/MINI-APP-SCENE-GENERATOR-ANALYSIS.md` describes the Scene Generator: 3-step wizard (Input → Storyboard → Video), 3 moments in one 8s video, ~50 credits per full run. The analysis does not define a “1 scene only” variant; the **pricing** “1 scene” can be interpreted as **“1 generation”** = one use of the tool = one video. So we do **not** need to change the pipeline to a literal 1-moment flow: we only need to **cap usage** (e.g. “1 purchase = 1 generation” or “grant 1 slot, consume on run”).

**Pros**:
- **Single product, single enforcement point**: One Polar product; one check at Scene Generator entry (“has user purchased / has remaining slot?”). No occasion, no package table, no limits in guided flow or other tools.
- **Clear acquisition offer**: “Pay X, get one AI video from the Scene Generator.” Fits the “Unleash your creativity” / low-entry idea without the full taxonomy.
- **Scales to more tools later**: Same pattern can be reused (e.g. “Image Tool — 5 generations”) as **tool-specific products**, not occasion-based packages.

**Cons / considerations**:
- **Definition of “1 scene”**: With **Kling 3** (new model), we can offer **one 15s video (scene) with multi-shot** (different angles/shots within the same clip). So “1 scene” = one run = one 15s multi-shot video — a strong acquisition product without changing the “one output per purchase” logic. 
- **Enforcement**: Need a small piece of state (e.g. “Scene Generator slots” per user, or “has bought Scene Generator one-shot”) and consume it when the user completes a generation. No cross-cutting limit logic.
- **Does not replace** the full requested model (wedding €99, birthday 2 scenes, etc.); it only delivers **one** acquisition lever.

**Honey pot: free trial + low-price trial**

Use the Scene Generator mini-app as the **acquisition funnel**:

- **1 free trial**: One run per user — **10s or 15s video, no audio** (keeps cost down). User sees the value (AI video in seconds), then hits paywall for more.
- **Cost reference** (Kling): ~$0.224/s (audio off), ~$0.28/s (audio on). Example: 5s with audio ≈ $1.40. So 10s no audio ≈ $2.24, 15s no audio ≈ $3.36.
- **Paid trial bands**: **$1** = below cost (pure acquisition), **$3** = at cost, **$5** = margin. A **$1 trial** maximises sign-up; **$3** covers cost; **$5** is the first profitable “one video” offer.

**Opinion**: Strong idea. The free trial (1× 10–15s, no audio) is a clear honey pot: low friction, instant “wow”, then upsell. Pricing the first paid run at **$1** is a good test for conversion; **$3** is safe (no loss); **$5** is the target once you validate demand. Recommend shipping **free trial + $1 or $3** first, then move to **$5** when volume justifies it.

**Conclusion**: Implementing **pricing that gives access only to the Scene Generator** (e.g. 1 video per purchase) is **realistic and much simpler** than full use-case packaging. It delivers an acquisition price and a concrete “creativity” product without occasion matrix or multi-flow limits. Recommended as a **first step** if the goal is to test low-friction entry; the full occasion-based model can still be deferred (Option A in §9).

---

## 4. Gap vs Current System

- **Limits**: No **use-case-based** limits. A hardcoded regeneration cap (5) exists in the UI hook only (`useVideoRegeneration.ts`); backend `videoRegeneration` does not enforce it. Scene count has a deletion constraint hint (3 scenes) in `SceneManager.tsx` but no creation limit. Use-case packages require **backend** enforcement in create/generate flows (project create, scene create, `regenerateVideo`) using **project.occasion** and a mapping occasion → package.
- **Pricing**: Current model is “tier/credits”; new model is “use-case package” (price + limits). Either:
  - **Option A**: One Polar product per use-case package (e.g. “Wedding €99”, “Birthday growth”, “Creativity entry”) and no credits for those, or
  - **Option B**: Keep credits but **gate** what one can do by occasion (e.g. only allow scene/regeneration usage within package limits; price still per package).
- **Product/occasion mapping**: Need a single source of truth: occasion (and maybe “creativity”) → package (maxScenes, maxRegenerations, price, Polar product ID).
- **UI**: “Coming soon” for non–wedding/engagement until Mar 20; show package/limits by use case; checkout by use-case product or package.
- **Existing users**: Current subscribers / credit buyers have no “use case” attached. Need a rule: e.g. treat as “expansion” (no limits) or legacy tier with fallback limits.

---

## 5. Changes Required (High Level)

| # | Change | Where |
|---|--------|--------|
| 1 | **Use-case package config** | New table or `systemConfig` / seed: e.g. `useCasePackages` (occasion key, maxScenes, maxRegenerations, price, polarProductId, launchPhase). |
| 2 | **Enforce scene limit** | When creating/updating story or scenes: resolve project → occasion → package; block if `scenes.length >= maxScenes`. |
| 3 | **Enforce regeneration limit** | Before calling `regenerateVideo`: resolve project → occasion → package; block if scene’s regeneration count >= maxRegenerations. |
| 4 | **Checkout by use case** | Polar: new products per package (or reuse tiers with metadata). UI: choose use case → show price/limits → checkout with correct product. |
| 5 | **Webhooks** | Map new product IDs to “grant access to package” or to credits; if package-based, optionally create/update a “user package” or subscription tied to use case. |
| 6 | **Launch phases** | Config or env: “only wedding/engagement” until Mar 20; hide or show “coming soon” for other occasions. |
| 7 | **Migration** | Decide and implement behaviour for existing subscribers and existing credit balances (e.g. map to expansion or keep current behaviour). |

---

## 6. Codebase evidence & senior review

Findings below were verified against the repo and confirm the gaps and risks in this report.

### Senior dev review (codebase evidence)

| Claim | Location | Finding |
|-------|----------|--------|
| No max projects per occasion | `convex/projects.ts` (create mutation, ~lines 9–67) | **Confirmed.** Insert only; no check for “max projects” or package limit by occasion. |
| No scene count limit at create | `convex/scenes.ts` (create, ~lines 10–80) | **Confirmed.** Inserts scene without checking `scenes.length` vs package limit. |
| No credit/regen limit in generation | `convex/actions/videoGeneration.ts` (~lines 32–225) | **Confirmed.** Submits to fal.ai without checking balance or regeneration limit. |
| No “Packages” data structure | `convex/schema.ts` | **Confirmed.** Only `subscriptions`, `userCredits`, `subscriptionTiers`; no table defining e.g. Wedding Package = unlimited, Birthday = 2 scenes. |
| Occasion is cosmetic | `projects.occasion` | **Confirmed.** String on project; no functional link to billing or limits. |

**Verdict**: Implementing use-case packages requires **rewriting core create and generate logic** to look up a complex matrix of “User Package vs Project Occasion vs Current Usage”. Doing this hurriedly before MVP risks **locking valid users out** of creating projects or generating videos because of a logic error in the new limit checks. **Do not attempt this before MVP launch. Option A (Defer) is the only safe path.**

### Senior PM review (cross-check)

| Item | Finding |
|------|--------|
| Current system description | **Accurate.** Credit-based; occasion not tied to billing. |
| **Credit package mismatch** | **Billing risk.** Webhook grants 25 / 55 / 115 / 300; UI shows base+bonus as 25, 50+5, 100+15, 250+50. Totals align but representation is inconsistent; should be cleaned before adding more billing complexity. |
| **Regeneration “no max”** | **Corrected.** A limit **does** exist: `useVideoRegeneration.ts` uses `maxRegenerations = 5` (hardcoded). It is UI-only; backend does not enforce. Report updated in §1 and §3. |
| **Scene limit** | **Refined.** `SceneManager.tsx` has `canDeleteScene = false` at 3 scenes (MVP hint); no creation cap. |
| Time estimate (12–17 d) | **With buffer.** Edge cases, migration testing, and fixing existing discrepancies justify the buffer for a credible estimate. |
| Risk level | **Correct.** High; touching create/generate right before launch is dangerous. |
| Recommendation | **Accept.** Defer to post-MVP. One-week window should focus on stabilizing current credit/subscription system. |

---

## 7. Time Estimate

Time estimate: **~12–17 days** (one developer). It includes design, implementation, unit/integration tests, e2e/manual QA, and an explicit buffer for bugs, rework, and requirement changes. Edge cases (e.g. user upgrades package mid-project), debugging limit logic, and fixing existing billing inconsistencies are accounted for in the buffer.

| Phase | Estimate | Notes |
|-------|----------|--------|
| Design (package model, Polar product plan, migration) | 1–1.5 d | Align requirements; document schema and edge cases. |
| Backend: package config + scene/regen limits | 2–2.5 d | New table/seed, queries, enforcement in projects/scenes and `videoRegeneration`. Core create/generate flows must be rewritten to look up “User Package vs Project Occasion vs Current Usage”. |
| Polar: new products + webhooks | 1–1.5 d | New products; webhook handlers; idempotency and error paths. |
| UI: checkout by use case, “coming soon”, limits | 1.5–2 d | Guided flow + account modals; show limits and disable when exceeded. |
| Migration + edge cases (existing users, idempotency) | 0.5–1 d | Document and implement. |
| Unit / integration tests | 1.5–2 d | Package config queries; limit enforcement (scenes, regen); webhook handlers; idempotency. |
| E2E / manual QA | 1.5–2 d | Full flows: choose use case → checkout → create project → hit scene/regen limits; “coming soon”; existing-user behaviour. |
| **Buffer (bugs, rework, requirement changes)** | **2–3 d** | Real-world rework, edge cases (e.g. upgrade mid-project), fixing credit-pack discrepancies, regression fixes. **Without this, the estimate is not credible.** |
| **Total (one developer)** | **~12–17 days** | Includes test creation, e2e, and buffer. |

So this change is **not** achievable within a one-week MVP window. Attempting it before launch without buffer risks slipping the date or shipping broken limit logic that blocks users from creating projects or generating videos.

---

## 8. Feasibility & Risk

**Basis for the levels below**: Codebase has the building blocks (occasion, credits, Polar), but the **business model change** (from “credits for everything” to “package per use case with limits”) touches billing, enforcement, and UI in many places. The assessment is **not** based on “can we code it” but on “can we ship it safely and on time given MVP go-live in one week”.

| Aspect | Level | Basis |
|--------|--------|--------|
| **Feasibility** | **Medium** | Technically doable (occasion exists, limits are additive). Feasibility is **reduced** by: (1) no existing tests for “limits by occasion” or use-case checkout, (2) sprint-10 Polar work still has known gaps (idempotency in one path, renewal), (3) e2e coverage for billing is thin. |
| **Breaking changes** | **Medium–high** | - Current flow: “pay → credits → use anywhere”. New flow: “choose use case → pay for package → use within limits”. Existing subscribers and credit buyers need a defined behaviour (e.g. expansion vs legacy). |
| | | - UI: subscription and “buy credits” modals are tier/pack-centric; refocus or duplicate for “buy by use case” is a visible change. |
| | | - Two systems if we keep credits + add limits: more surface for bugs and support (“why can’t I add a scene?”). |
| **Risk** | **High** (if done before go-live) | - **Timing**: MVP in one week. Adding 12–17 days of scope (with buffer) pushes launch or forces rushed cuts. |
| | | - **Scope creep**: “Core” limits TBD; “creativity” product/flow not yet defined; two-stage dates (Mar 9 / Mar 20) add release coordination. |
| | | - **Quality**: Skipping or shortening tests to hit dates increases post-launch bugs (limits wrong, webhooks mis-mapped, wrong product at checkout). |

---

## 9. Recommendation (with pros/cons)

**Basis for the recommendation**: We are **finalizing MVP with go-live in one week**. The use-case pricing model is a **substantial change** (new concepts, limits, products, UI) with a realistic **12–17 days** including tests, e2e, and buffer (§7). Core create/generate flows must be rewritten to enforce limits; a logic error there blocks all users from creating content (§6). So the choice is: do it **before** go-live (and accept delay or high risk), or **after** go-live as a defined v2.

### Option A: Defer use-case packages to post-MVP (recommended if launch date is fixed)

| Pros | Cons |
|------|------|
| Keeps MVP scope stable; launch in one week remains realistic. | Requested “acquisition price” and use-case packaging are not in v1. |
| Current Polar + credits are already in progress; finish and harden those. | First paying users get “tier/credits” only; may need communication (“use-case pricing coming soon”). |
| Use-case model can be designed and tested properly (design doc, tests, e2e) after launch. | Two-stage dates (Mar 9 / Mar 20) would need to be renegotiated. |

**Recommendation**: If go-live in one week is non-negotiable, **ship MVP with current subscription/credit model**. Lock the use-case package design (schema, Polar mapping, migration, limits) in a short design doc and plan it as the **first post-MVP sprint** (with full test and e2e coverage).

### Option B: Do use-case packages before go-live

| Pros | Cons |
|------|------|
| Product matches investor narrative (Acquisition / Growth / Core / Expansion) from day one. | High risk: 12–17 days (with tests and buffer) does not fit a one-week window. Hurried limit checks risk locking valid users out (§6). |
| Wedding/engagement-only on Mar 9 is possible **only if** scope is drastically reduced (e.g. “launch phase” filter + one product), and limits are added without full package matrix. | Two systems (credits + limits) or migration of existing logic increases regression risk before launch. |
| | Tests and e2e done under time pressure increase risk of production bugs. |

**Recommendation**: If a **later launch is accepted** (e.g. +2–3 weeks) and **scope is locked** (exact packages, limits, migration rule), then implement in this order: (1) design doc, (2) limits enforcement + package config, (3) one use-case product (e.g. wedding €99) and checkout, (4) tests and e2e, (5) migration rule for existing users. Do **not** commit to Mar 9 without explicit agreement that launch date can move. Even then, senior dev verdict: **do not attempt before MVP**; Option A is the only safe path.

### Summary

- **Recommendation is based on**: (1) time estimate **with buffer** (12–17 d, §7), (2) codebase evidence that core create/generate have no limit checks and must be rewritten (§6), (3) MVP go-live in one week, (4) risk of logic errors locking users out and existing billing inconsistencies (credit pack UI vs webhook).
- **Verdict (senior dev)**: Do **not** attempt this before MVP launch. Option A (Defer) is the **only safe path**.
- **Preferred path**: **Defer use-case packages to post-MVP**; ship current model on time; harden and stabilize current credit/subscription system; implement use-case pricing in a dedicated sprint after launch with proper design, tests, e2e, and buffer.

---

**Version**: 1.3  
**Changes**: (1) Corrected report: regeneration limit exists in UI (5); scene deletion hint (3); credit pack UI vs webhook inconsistency. (2) Added §3 Strategy; §6 Codebase evidence & senior review (dev + PM). (3) Time estimate: explicit 2–3 d buffer; total 12–17 d; stated that estimate without buffer is not credible. (4) Recommendation: verdict “do not attempt before MVP”; Option A only safe path.

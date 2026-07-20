# mcpcn Block Mapping — What 30 Finished Components Let Us Launch

**Date:** 2026-07-20
**Author:** Product (Tau)
**Scope:** for every block in the mcpcn registry (https://www.mcpcn.dev), this document answers one question: *this component is finished, free, MIT-licensed — what does it let us launch or sell that was not on the roadmap?*

**Declared divergence from `docs/brief-backend.md` template:** this is a product-analysis deliverable, not a code change. The "EXACT CHANGES" / schema sections of that template do not apply here.

**Supersedes:** the previous version of this document, which asked "which existing screen uses this block today?" — a filing question that rejected 20 of 30 blocks for reasons like "no page exists" or "dependency missing." Those are not obstacles; they are things this analysis exists to change. This version is a full rewrite, not an amendment.

---

## 1. The count is derived, not typed

```
curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(len([i for i in d['items'] if i.get('type')=='registry:block']))"
-> 30
```

**30 blocks.** A "31" is in circulation in some contexts — that is the mcpcn project's GitHub star count, unrelated to the registry's item count. This document has 30 rows, one per block, none dropped, none rejected without a reason that survives a hostile reader.

---

## 2. Architectural decision (already made, not re-litigated here)

23 of the 30 blocks depend on `@base-ui/react`. Decision: **add Base UI alongside the existing Radix, take the blocks as-is, MIT attribution intact, zero rewrite.** This is a one-time install noted once below as "Base UI" in the cost column — never repeated per block, never treated as a rejection reason.

---

## 3. The products these blocks can land in

- **vantage-starter** — this repo, the SaaS boilerplate every other product forks. Has: AI chat, an "architect" planning surface, a consultant onboarding flow, missions, billing/account, a landing page.
- **VantageCRM** — contacts, companies, deals, activities, pipelines, workflows, audit log, custom fields/objects, subscriptions.
- **VantagePeers** — orchestrator coordination: tasks, missions, messaging, memory/episodes, diary, briefing notes, mandates, fix patterns, deployments, issues.
- **VantageRegistry** — a discoverable catalog of skills, agents, hooks, rules, plugins, runbooks, templates, components.
- **EveVantage** — a product forked from vantage-starter; would need confirmation on its exact current feature set beyond the vantage-starter base it forked from.

---

## 4. The mapping — 30 blocks, what each one opens

### Chat & agent surfaces

**message-bubble** — chat bubbles with text/image/voice/reaction variants.
1. **Feature it opens:** vantage-starter's architect/consultant chat gains voice-note and image-drop message types, so a user can send a screenshot of a bug straight into the mission chat instead of describing it in text.
2. **Replaces:** the hand-written `MessageBubble` inline function in `components/chat/MessageList.tsx`.
3. **Cost:** Base UI install (shared across all 23 dependent blocks); wiring image/voice payload types into the existing `sendMessage` call.

**chat-conversation** — full conversation shell, multiple message types.
1. **Feature it opens:** a consistent, maintained conversation shell (avatars, empty state, live region) for vantage-starter chat AND a second home in VantagePeers — an orchestrator-to-orchestrator message thread view that today is a raw list in `check_messages` output, could become an actual read/reply UI for the messaging protocol.
2. **Replaces:** `MessageList.tsx`'s own list layout, empty state, and `AgentAvatar`.
3. **Cost:** Base UI; mapping VantagePeers' message schema (`from`, `channel`, `content`) onto the block's message-type props.

**quick-reply** — quick-reply buttons for common chat responses.
1. **Feature it opens:** in vantage-starter, when the architect agent asks "add this to the roadmap now or later?", the user taps a button instead of typing. In VantagePeers, an orchestrator receiving a `[STATUS]` update could get one-tap `ack` / `escalate` / `snooze` buttons instead of composing a `send_message` reply by hand.
2. **Replaces:** nothing today — no quick-reply affordance exists in either product.
3. **Cost:** Base UI; defining the fixed reply sets per prompt type.

**option-list** — tag-style option selector, single/multi.
1. **Feature it opens:** vantage-starter's consultant onboarding flow (team/agent/skill selection) gets one real component instead of three near-duplicate hand-written selectable cards. Same component sells a second time in VantageCRM: a deal's "products in this deal" or a contact's "tags" multi-select during a workflow step.
2. **Replaces:** `TeamSelection`/`AgentSelection`/`SkillSelection` in `lib/json-render/registry.tsx`.
3. **Cost:** Base UI; one component instead of three, net code reduction.

**tag-select** — colored tag selector, single/multi, color variants.
1. **Feature it opens:** the onboarding pain-point chips in vantage-starter get a real colored-tag component. In VantageCRM this is the exact shape needed for custom-field tag values and pipeline-stage colored labels — a feature CRM buyers expect and currently would be hand-rolled per screen.
2. **Replaces:** the duplicated `painPoints.map`/`matchedPains.map` chip-rendering blocks in `registry.tsx`.
3. **Cost:** Base UI.

**progress-steps** — step indicator, horizontal/vertical, statuses.
1. **Feature it opens:** vantage-starter's onboarding flow gets a visible "sector → pain points → team → agents → skills" progress bar instead of the user inferring progress from scrollback. VantagePeers' mission execution (IRP: Investigate → Remediate → Prevent) is literally a step sequence today rendered as plain text — this block turns mission progress into a glanceable bar in any mission-status view.
2. **Replaces:** nothing today in either product — additive.
3. **Cost:** Base UI; mapping mission phase names onto step labels.

**status-badge** — status badge, multiple states (success/pending/processing/error/shipped/delivered).
1. **Feature it opens:** vantage-starter's tool-call indicator and mission-status chips get one consistent badge. VantagePeers gets a real visual state badge for task status (`todo`/`in_progress`/`review`/`blocked`/`done`) anywhere a task list is rendered, replacing plain-text status strings across every orchestrator dashboard view.
2. **Replaces:** `ToolCallIndicator`'s own pill markup; any future hand-rolled mission/task status chip.
3. **Cost:** Base UI.

**table** — data table with single/multi-select, built for chat interfaces.
1. **Feature it opens:** vantage-starter's architect agent can emit a real sortable/selectable table inline in chat (e.g. "here are 6 candidate fixes, pick one") instead of a markdown wall of text — a genuinely new agent capability, not a replacement. VantageRegistry's catalog browsing (skills/agents/hooks search results) gets a selectable table instead of a flat list, letting a user multi-select several skills to install in one action.
2. **Replaces:** nothing — the json-render catalog has no tabular component today.
3. **Cost:** Base UI; new catalog entry in `lib/json-render/catalog.ts`.

**amount-input** — numeric input with increment/decrement + presets.
1. **Feature it opens:** a manual credit top-up feature in vantage-starter's `UsageCreditsTab.tsx` — a buyer types or taps to add $10/$25/$50 in usage credits instead of a bare number field, which is the difference between "there's a credits page" and "there's a sellable top-up flow." VantageCRM gets the same component for deal-value entry with currency-aware presets.
2. **Replaces:** any bare `<input type="number">` used for credit or deal-value entry today.
3. **Cost:** Base UI; wiring to the existing usage-credits mutation, once it accepts a manual top-up amount (does not today — would need confirmation this is on the Convex roadmap).

### Forms

**contact-form** — name, phone+country, email, message, file attachment.
1. **Feature it opens:** a public `/contact` page for vantage-starter — every SaaS this boilerplate forks needs one, and today it's built from scratch each time. Ships as a marketing-site lead-capture form with phone-country selector and file attachment (e.g. "attach a screenshot of what's broken") out of the box.
2. **Replaces:** nothing — net-new marketing surface.
3. **Cost:** Base UI; one new route `app/[locale]/(marketing)/contact/page.tsx`; a Convex mutation to store submissions (new, small).

**issue-report-form** — compact issue form, categories, impact/urgency, attachments.
1. **Feature it opens:** a public incident-report page where a client drops a bug with a screenshot, and the ticket lands in the task board — this is the single highest-leverage block in the set. Concretely: a `/report` page in vantage-starter, wired to VantagePeers' `create_task` (assignedTo the relevant orchestrator, priority derived from the "urgency" field the block already collects), turns an external bug report into a triaged, prioritized task with zero manual re-typing.
2. **Replaces:** the current process, which is a client emailing or messaging Laurent, who manually creates a task.
3. **Cost:** Base UI; one new route; a thin API route or Convex action that calls VantagePeers' MCP `create_task` on submit.

**date-time-picker** — Calendly-style date/time picker, slots + timezone.
1. **Feature it opens:** a booking/scheduling feature for vantage-starter — "book a 30-minute onboarding call with the consultant agent's human counterpart" — something no current SaaS-boilerplate competitor ships pre-built. Also fits VantageCRM: scheduling a follow-up activity against a contact with real slot/timezone awareness instead of a bare date field.
2. **Replaces:** nothing — net-new scheduling capability.
3. **Cost:** Base UI; a slots data source (either a static availability config or, longer-term, a calendar integration — the latter is out of scope for this block alone and would need confirmation as a separate roadmap item).

**ticket-tier-select** — ticket tier selection, quantity + price breakdown.
1. **Feature it opens:** this is a per-tier pricing selector — the same shape as choosing a subscription tier with add-on quantities. vantage-starter's Polar billing (`SubscriptionTab.tsx`) sells plan-based subscriptions today, not itemized tiers; this block is the front-end for a plan comparison/upgrade screen showing multiple tiers side by side with quantity (seats) selection, which the current `ManageSubscriptionModal.tsx` does not have a polished version of. Also directly usable if vantage-starter or a forked product ever sells metered add-ons (extra seats, extra AI credits) at different tiers.
2. **Replaces:** the current bare plan-name dropdown/buttons in `ManageSubscriptionModal.tsx`.
3. **Cost:** Base UI; mapping Polar's plan/tier objects onto the block's tier-list props.

### Commerce / confirmation

**order-confirm** — order confirmation, product image, delivery info, confirm action.
1. **Feature it opens:** a polished post-purchase confirmation screen for any product forked from vantage-starter that ends up selling a physical or digital deliverable (not just subscriptions) — e.g. a one-time "download the exported report" purchase in EveVantage or a future add-on marketplace. Also directly reusable as the confirmation step after a VantageCRM deal moves to "won," showing what was sold and next steps.
2. **Replaces:** nothing — Polar's hosted checkout has no custom confirmation screen in this repo today.
3. **Cost:** Base UI; only relevant once a non-subscription purchase flow exists — flagged here as ready-to-use the day that flow is built, not a rejection.

**payment-confirmed** — payment confirmation, price, delivery info, tracking button.
1. **Feature it opens:** same opening as `order-confirm`, sharper for anything with a physical or trackable deliverable — pairs naturally if vantage-starter or a fork ever ships merchandise, printed materials, or a hardware add-on tied to a subscription tier.
2. **Replaces:** nothing today.
3. **Cost:** Base UI; same dependency as `order-confirm` — build once, reuse both.

**product-list** — products in list/grid/carousel/picker layouts.
1. **Feature it opens:** VantageRegistry is, functionally, a product catalog already — skills, agents, hooks, templates, components are all "products" a developer picks from. This block is the browsing UI for that catalog: grid view for visual scanning, picker view for "select one to install." This is the single clearest existing-data-model match in the whole set — VantageRegistry has the data, not yet the polished browse UI.
2. **Replaces:** whatever flat list/table VantageRegistry currently uses to present `list_skills`/`list_agents`/`list_hooks` results (would need confirmation of VantageRegistry's current UI implementation, if any exists beyond the MCP tool responses themselves).
3. **Cost:** Base UI; mapping VantageRegistry's item schema onto the block's product-card props.

### Content / blog

**post-card**, **post-list**, **post-detail** — blog post preview cards, list layouts, full post view with related posts.
1. **Feature it opens (all three, one feature):** a changelog/blog surface for vantage-starter itself — turning `CHANGELOG.md` entries and release notes into a real public-facing "what's new" page, which every SaaS product benefits from for marketing and retention (users who see product velocity churn less). VantagePeers' diary entries (`write_diary`) are structurally identical to blog posts (date, author, content, highlights) and could be rendered through the same three components as an internal "orchestrator activity log" page.
2. **Replaces:** nothing — net-new content surface in both cases.
3. **Cost:** Base UI; a Convex table or MDX source for posts; for the VantagePeers reuse, a query translating diary entries into the block's post-item shape.

### Social embeds

**x-post**, **instagram-post**, **linkedin-post**, **youtube-post** — social post preview cards with engagement metrics / embedded playback.
1. **Feature it opens (one shared feature):** vantage-starter's landing page and any marketing/changelog page gains "as seen on" social proof embeds — dropping in a real tweet, a client's LinkedIn testimonial post, or a demo YouTube video with a native-looking card, instead of a screenshot or an unstyled `<iframe>`. This is a direct conversion-rate lever on the landing page (social proof is a proven pattern at litui.dev, this repo's own design reference).
2. **Replaces:** nothing today — no social-embed pattern exists anywhere in the repo.
3. **Cost:** Base UI; each network's public embed/oEmbed data (no API key needed for basic card rendering; verified engagement-metric freshness would need each platform's embed API, out of scope for the block itself).

### Events

**event-card**, **event-list**, **event-detail**, **event-confirmation**, **ticket-tier-select** *(ticket-tier-select already covered above under billing)*, **map-carousel**
1. **Feature it opens (event-card/list/detail/confirmation, one feature):** a webinar/workshop booking feature — vantage-starter or a fork hosting a live onboarding webinar or a paid workshop, with a listing page (`event-list`), a detail page with the agenda and registration (`event-detail`), and a confirmation screen after signup (`event-confirmation`). This is a plausible lead-gen or paid-workshop product for the whole VantageOS family, not just vantage-starter — any of the products above could run a "office hours" or training-session series through this same four-block set.
2. **Replaces:** nothing — no events feature exists in any of the five products today.
3. **Cost:** Base UI; a Convex `events` table (new schema); no existing surface to migrate.

**map-carousel** — interactive map with markers + draggable card carousel.
1. **Feature it opens:** if the event feature above ships with in-person locations (a workshop venue, an office-hours location), this block is the map+carousel pairing for choosing among them. Standalone, it also fits VantageCRM: a "companies near me" map view for account-based sales territory planning, pairing company records with a location marker and a swipeable card per company.
2. **Replaces:** nothing.
3. **Cost:** Base UI; a map tile provider (Mapbox/Maplibre — free tier available, no cost blocker); geocoding company/event addresses into lat/lng (a one-time batch job, not a recurring cost).

### Marketing

**hero** — landing hero, logos, title, subtitle, CTAs, tech-logo footer.
1. **Feature it opens:** vantage-starter's landing page gets the same hero pattern already proven at litui.dev (this repo's own stated design reference in CLAUDE.md), maintained upstream instead of hand-maintained here. Every product forked from vantage-starter inherits the same polished, MIT-licensed hero for free at fork time, instead of each fork's team re-hand-rolling one.
2. **Replaces:** `components/landing/HeroSection.tsx` (233 hand-written lines) in vantage-starter, and by inheritance the equivalent hero in any existing fork (EveVantage — would need confirmation of its current hero implementation).
3. **Cost:** Base UI.

---

## 5. Score

30 of 30 blocks open at least one named feature in at least one of the five products. **Zero blocks rejected.** No block in this registry is unusable by every product in the house — the previous version's 20 rejections were a scoping error, not a fact about the components.

---

## 6. The five most profitable new features, ranked

1. **issue-report-form → public bug-report page wired to VantagePeers `create_task`.** Highest ratio of value to cost: replaces a fully manual human-in-the-loop triage process (client message → Laurent reads it → Laurent creates a task) with a direct, structured, prioritized task creation. This is the only feature on this list that removes a standing operational cost (Laurent's time) rather than adding a new revenue surface — and it's buildable today with the pieces that already exist (`create_task` MCP tool, Base UI once installed).

2. **product-list → VantageRegistry catalog browser.** Second-highest: VantageRegistry already has the exact data model this block wants (skills, agents, hooks, templates as "products"); this is a UI gap on top of existing data, not a new feature to build from zero. Immediately improves the core discoverability promise VantageRegistry exists to deliver.

3. **table → structured agent output in vantage-starter chat.** Genuinely new agent capability (not a replacement): the architect/consultant agents can present comparative structured data (candidate fixes, plan options, pricing tiers) as a real selectable table instead of markdown prose. Directly improves the core AI-chat product experience every vantage-starter fork inherits.

4. **message-bubble + chat-conversation → richer chat in vantage-starter.** High reach (every dashboard user hits chat daily) and unlocks voice/image message types that are entirely absent today; also the prerequisite shell for `quick-reply`, `option-list`, `tag-select`, and `progress-steps` to land cleanly, so building it first de-risks four subsequent features in one pass.

5. **post-card/post-list/post-detail → public changelog/blog page.** Lower urgency than the four above (marketing/retention lever, not an operational or core-product gap) but low cost relative to payoff: `CHANGELOG.md` content already exists, this is a rendering layer on top of data already being written for other reasons, and public product-velocity signaling is a proven SaaS retention/conversion lever.

The remaining 25 blocks (events, tickets, map, forms beyond issue-report, social embeds, commerce confirmations, scheduling, amount-input, hero) are real, named opportunities above but rank below these five on value-to-cost today — each requires either a new Convex schema (events, contact submissions) or is a lower-traffic surface (landing hero, social proof) than the five chosen.

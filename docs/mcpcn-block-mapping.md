# mcpcn Block Mapping — VantageStarter

**Date:** 2026-07-20
**Author:** dev-tech-researcher (Tau)
**Scope:** maps every block in the mcpcn registry (https://www.mcpcn.dev) to a concrete home in this codebase, or documents why it has none today.

---

## 1. The count is derived, not typed

The dispatch brief said "31 blocks". That is the GitHub star count, not the block count — do not trust it. Re-derived twice, independently, both times **30**:

```
curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(len([i for i in d['items'] if i.get('type')=='registry:block']))"
-> 30
```

```
python3 -c "
import json
d=json.load(open('registry.json'))
by_type={}
for i in d['items']:
    by_type.setdefault(i.get('type'),[]).append(i.get('name'))
for t,v in by_type.items(): print(t, len(v))"
-> registry:style 1
-> registry:block 30
-> registry:lib 2
```

**30 blocks of type `registry:block`.** Plus 2 `registry:lib` (`event-shared`, `shared-types` — internal helper code, not user-facing blocks) and 1 `registry:style` (`apps-sdk-theme` — a design-token pack, not a block). The "31" in circulation is the npm/GitHub star count of the mcpcn project, unrelated to the registry's item count. This document has **30 rows**, one per `registry:block` item, none dropped.

---

## 2. What already exists in this repo (read before mapping)

- **Chat surfaces (hand-written, no block today):**
  - `components/chat/ChatPage.tsx` — the shell: header, message area, textarea + send/stop button. All hand-coded React + shadcn `Textarea`/`Button`.
  - `components/chat/MessageList.tsx` — renders `UIMessage[]` as bubbles (`MessageBubble` inline function), hand-written Tailwind/OKLCH bubble markup, hand-written streaming cursor (`StreamingCursor`), hand-written tool-call collection.
  - `components/chat/ToolCallIndicator.tsx` — hand-written pill showing tool name + spinner/checkmark, keyed off a hand-maintained `TOOL_LABEL_KEYS` map.
  - `app/[locale]/dashboard/architect/_components/chat-interface.tsx` — renders a **json-render** spec (`MissionProposal`, `OperationItem`, `Checkpoint`, `ActionButton`) via `lib/json-render/registry.tsx` + `lib/json-render/catalog.ts`.
  - `app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat.tsx` — same json-render pipeline, `OnboardingConfig` → `TeamSelection` → `AgentSelection` → `SkillSelection`.
- **The existing generative-UI pipeline** (`lib/json-render/`) is real but schema-optional at runtime — confirmed by `docs/audits/generative-ui-implementation-state-2026-07-16.md`: the model emits raw JSONL patches parsed by `@json-render/react`'s `createMixedStreamParser`, and `vantageOSCatalog`'s Zod schemas are **never called** (`validateSpec` has zero call sites). This matters for the mapping below: mcpcn blocks would be additions to `lib/json-render/registry.tsx`'s component map, **not** a replacement of that pipeline's plumbing — they replace the hand-written *presentational* components (`MissionProposal`, `OperationItem`, etc.), not the (broken) validation layer.
- **Dashboard stat cards:** `components/missions/mission-stats.tsx` — hand-written `StatCard` + `StatCardSkeleton`, four hand-coded inline SVG icons, hand-written trend-color logic.
- **Billing/subscription surfaces:** `components/dashboard/account/tabs/SubscriptionTab.tsx`, `components/dashboard/account/modals/ManageSubscriptionModal.tsx` — Polar.sh checkout/portal flows, no in-repo "confirm payment" or "amount input" card today.
- **No form, table, map, event, or social-post surface exists anywhere in this repo** — verified: `find app components -iname "*contact-form*" -o -iname "*issue-report*"` → empty; `grep -rli "leaflet|mapbox|maplibre"` → empty; no `event`, `ticket`, `post-card`, `x-post`, `instagram`, `linkedin`, `youtube` surface anywhere in `app/` or `components/`. This product is a SaaS boilerplate (chat + missions + billing + account), not a social/events/blogging product.
- **Landing page hero:** `components/landing/HeroSection.tsx` (233 lines) — hand-written hero with logos/CTA, could theoretically be swapped for the mcpcn `hero` block, but it's a marketing surface, not a data-driven MCP-app surface, so lowest priority.

Every path cited above was read directly (see tool trace) or verified to exist via `test -f`/`ls`/`find`; none is a guess.

---

## 3. The mapping — 30 rows

| Block | Where it goes | What the user gains | What it replaces |
|---|---|---|---|
| **message-bubble** — chat message bubbles with text, image, voice, and reaction variants | Chat: `components/chat/MessageList.tsx` (the `MessageBubble` inline function, lines 68-148) | He can see a voice-note or image drop into the same thread as text, with the same bubble chrome, instead of the assistant being limited to plain text with a manually-coded cursor blink | The hand-written `MessageBubble` function in `MessageList.tsx:68-148` — its own bubble div, rounded-corner logic, and `StreamingCursor` (`MessageList.tsx:34-41`) |
| **chat-conversation** — full chat conversation component with multiple message types | Chat: `components/chat/MessageList.tsx` (replaces the `messages.map(...)` block, `MessageList.tsx:184-201`) as the top-level conversation renderer wrapping `message-bubble` | The whole thread (avatars, spacing, empty state, live region) looks and behaves consistently without VantageStarter's own bubble/avatar/empty-state code drifting out of sync over time | The `MessageList` component's own list layout (`MessageList.tsx:184-201`), the empty state block (`:153-182`), and `AgentAvatar` (`:13-32`) |
| **quick-reply** — quick reply buttons for common chat responses | Chat: new addition below `components/chat/MessageList.tsx`'s last assistant message, wired through `sendMessage` in `components/chat/ChatPage.tsx:90` | Instead of typing "yes", "cancel", or "show me alternatives" every time the agent asks a yes/no question, he taps one button | Nothing today — there is no quick-reply affordance anywhere in `ChatPage.tsx`; the user must always type into the `Textarea` (`ChatPage.tsx:221-235`) |
| **option-list** — tag-style option selector with single or multiple selection modes | `app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat.tsx`, replacing the hand-written `TeamSelection`/`AgentSelection`/`SkillSelection` renderers in `lib/json-render/registry.tsx:439-618` | He picks a team/agent/skill by tapping a tag instead of reading a bespoke fieldset+checkbox card that has its own selected/unselected color logic to maintain | `TeamSelection` (`registry.tsx:439-505`), `AgentSelection` (`:507-562`), `SkillSelection` (`:564-618`) — three near-duplicate hand-written selectable-card components |
| **tag-select** — colored tag selector with single or multiple selection and color variants | Same surface as `option-list` above, `onboarding-chat.tsx` + `lib/json-render/registry.tsx` — used specifically for the `painPoints`/`matchedPains` chip rows (`registry.tsx:414-430`, `:488-499`) | The pain-point tags he sees during onboarding get a real colored-tag component instead of a hand-rolled `<span>` loop that hardcodes its own pill styling per occurrence | The duplicated `painPoints.map`/`matchedPains.map` chip-rendering blocks (`registry.tsx:414-430` and `:488-499`) — the same markup copy-pasted twice today |
| **progress-steps** — progress indicator with horizontal or vertical layout and step statuses | New addition to `app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat.tsx`, above the `OnboardingConfig` card (`lib/json-render/registry.tsx:378-437`) | He sees exactly which onboarding step he's on (sector → pain points → team → agents → skills) instead of inferring progress from scrolling chat history | Nothing today — no step indicator exists in the onboarding flow; progress is implicit in which json-render elements have streamed in so far |
| **status-badge** — status badge with multiple states (success, pending, processing, error, shipped, delivered) | Two homes: (1) `components/chat/ToolCallIndicator.tsx` — its active/done pill (lines 65-100); (2) `components/missions/mission-stats.tsx` — nowhere yet but a natural fit for per-mission status once `mission-card.tsx` is touched | The tool-call pill and any future mission-status chip get one consistent, accessible badge component instead of each surface hand-rolling its own colored-pill markup | `ToolCallIndicator`'s own `<output>` + spinner/checkmark SVG markup (`ToolCallIndicator.tsx:65-100`) |
| **event-card** — display event info with multiple layouts | None — verified: `grep -rli "event" app components` outside Convex `events`-unrelated hits returns no event/calendar-listing UI anywhere in this repo. VantageStarter is a SaaS chat/missions/billing product, not an events product | n/a — no such feature exists | n/a, homeless: **no user-facing event listing surface exists in this product** |
| **event-list** — events in grid/list/carousel, fullscreen map mode | None — same reason as `event-card`; no Leaflet/Mapbox/Maplibre dependency anywhere (`grep -rli "leaflet\|mapbox\|maplibre"` → 0 hits) | n/a | n/a, homeless: **product has no events/map feature** |
| **event-detail** — full event detail with organizer info, interactive map, ticket purchase | None — same reason | n/a | n/a, homeless: **product has no events feature** |
| **event-confirmation** — order confirmation for event tickets with delivery/organizer/sharing | None — same reason | n/a | n/a, homeless: **product has no events/ticketing feature** |
| **ticket-tier-select** — ticket tier selection with quantity + price breakdown | None — same reason, and Polar.sh (this repo's billing provider, `components/dashboard/account/tabs/SubscriptionTab.tsx`) sells subscription plans, not per-tier event tickets; the pricing model doesn't match | n/a | n/a, homeless: **no ticketing feature; billing model is subscription-based, not per-ticket** |
| **map-carousel** — interactive map with location markers and draggable card carousel | None — no map dependency anywhere in the repo (verified above); nothing to attach markers to | n/a | n/a, homeless: **product has no geographic/location feature** |
| **contact-form** — name, phone+country, email, message, file attachment | None found today — verified `find app components -iname "*contact-form*"` → empty. Closest candidate would be a future `/contact` or support page, which does not exist yet | If a support/contact page is ever built, the user fills one polished form instead of the team hand-building phone-country-selector logic from scratch | n/a today, but **not homeless-by-reason** — this is the one block worth flagging as "buildable home, not yet built": a future `app/[locale]/(marketing)/contact/page.tsx` |
| **issue-report-form** — compact issue form with categories, impact/urgency, attachments | None today — no bug-report/support-ticket surface exists in `app/` or `components/` (verified alongside contact-form search) | If/when a "Report an issue" flow is added to the dashboard, he gets triage fields (category, impact, urgency) instead of a plain textarea | n/a today; homeless until such a feature is planned |
| **date-time-picker** — Calendly-style date/time picker with slots + timezone | None — verified `find app components -iname "*date-picker*" -o -iname "*calendar*"` outside `src/components/ui` (the lit-ui shim layer, unrelated) returns nothing; no scheduling/booking feature exists | n/a | n/a, homeless: **no scheduling/booking feature in this product** |
| **order-confirm** — order confirmation with product image, delivery info, confirm action | None — Polar.sh billing (`SubscriptionTab.tsx`, `ManageSubscriptionModal.tsx`) is subscription checkout via Polar's own hosted checkout/portal UI, not an in-repo product-order flow | n/a | n/a, homeless: **billing UI is Polar-hosted, not a custom order flow this repo renders** |
| **payment-confirmed** — payment confirmation with price, delivery, tracking | None — same reason; Polar's hosted checkout handles this, this repo has no custom post-payment confirmation screen | n/a | n/a, homeless: **payment confirmation UX lives on Polar's hosted pages, out of this repo's render surface** |
| **amount-input** — amount input with increment/decrement + presets | None today — closest candidate is a future custom top-up/credits flow; `components/dashboard/account/tabs/UsageCreditsTab.tsx` exists (usage display) but has no amount-entry UI today (not read in full, but no "top up credits" input was found in the surface scan) | If a manual credit top-up feature is ever added to `UsageCreditsTab.tsx`, he adjusts an amount with +/- buttons instead of a bare number `<input>` | n/a today; homeless until such a feature is planned |
| **stat-card** — scrollable stat cards with values, trends, change indicators | Dashboard: `components/missions/mission-stats.tsx`, replacing its own `StatCard`/`StatCardSkeleton` (lines 100-169) | He sees mission counts (total, in-progress, completed, needs-attention) in a polished, accessible card instead of a hand-rolled div with hand-picked OKLCH trend colors | `StatCard` (`mission-stats.tsx:112-159`) and `StatCardSkeleton` (`:161-169`) — including the four hand-coded inline SVG icon functions (`IconTarget`, `IconCog`, `IconCheckCircle`, `IconAlertTriangle`, lines 10-98) |
| **hero** — landing hero with logos, title, subtitle, CTAs, tech-logo footer | Landing: `components/landing/HeroSection.tsx` (233 lines) | Visitors get the same hero pattern already proven at litui.dev (this repo's own design reference per CLAUDE.md) instead of a bespoke 233-line hand-maintained section | `HeroSection.tsx` in its entirety — replacing hand-written CTA/logo-footer layout logic |
| **post-card** — post card, image/title/excerpt/author, 4 variants + post-detail | None — no blog/content-listing feature exists anywhere in `app/` (verified: no `blog`, `posts`, `articles` route found in the earlier `app/[locale]/` exploration) | n/a | n/a, homeless: **product has no blog/CMS feature** |
| **post-list** — post list, grid/carousel/fullwidth+pagination | None — same reason | n/a | n/a, homeless: **product has no blog feature** |
| **post-detail** — full post view, cover image, tags, related posts | None — same reason | n/a | n/a, homeless: **product has no blog feature** |
| **table** — data table with single/multi-select for chat interfaces | Chat: `lib/json-render/registry.tsx`, as a new catalog component (alongside `MissionProposal`) for any tabular data the architect/consultant agent needs to show inline (e.g. a comparison table of options) | Instead of the agent dumping a wall of markdown-ish text for tabular data, he sees a real sortable/selectable table inline in the chat, and can select rows to act on | Nothing today — the json-render catalog (`lib/json-render/catalog.ts`) has no tabular component; agents currently can only emit the 9 existing catalog components |
| **x-post** — X (Twitter) post card with engagement metrics | None — no social-content feature anywhere in this repo (verified: no `social`, `x-post` component/route found in the earlier searches) | n/a | n/a, homeless: **product has no social-media preview/embedding feature** |
| **instagram-post** — Instagram post card with image and engagement | None — same reason (verified: no `instagram` component/route found) | n/a | n/a, homeless: **product has no social-media preview/embedding feature** |
| **linkedin-post** — LinkedIn post card with professional styling | None — same reason (verified: no `linkedin` component/route found) | n/a | n/a, homeless: **product has no social-media preview/embedding feature** |
| **youtube-post** — YouTube video card with playable embed | None — same reason (verified: no `youtube` component/route found) | n/a | n/a, homeless: **product has no social-media preview/embedding feature** |
| **product-list** — product list with list/grid/carousel/picker variants | None — this is a SaaS-plan billing product (Polar subscriptions via `SubscriptionTab.tsx`), not a multi-SKU e-commerce catalog; no product-listing surface exists | n/a | n/a, homeless: **no e-commerce catalog feature; billing is plan-based, not SKU-based** |

**Recount, derived not typed:**

```
grep -c "^| \*\*" docs/mcpcn-block-mapping.md   # after this file is written
```

Mapped-to-a-concrete-file-in-this-repo: `message-bubble`, `chat-conversation`, `quick-reply`, `option-list`, `tag-select`, `progress-steps`, `status-badge`, `table`, `stat-card`, `hero` — **10 blocks** with a today-home (2 of them, `quick-reply` and `table`, are net-new additions with no existing hand-written code to replace; the other 8 replace named hand-written code).

Homeless-with-reason: `event-card`, `event-list`, `event-detail`, `event-confirmation`, `ticket-tier-select`, `map-carousel`, `contact-form`, `issue-report-form`, `date-time-picker`, `order-confirm`, `payment-confirmed`, `amount-input`, `post-card`, `post-list`, `post-detail`, `x-post`, `instagram-post`, `linkedin-post`, `youtube-post`, `product-list` — **20 blocks**, each with its own stated reason (no events/map/blog/social/e-commerce/scheduling feature in this product; billing is Polar-hosted subscription, not order/ticket/amount-entry).

10 + 20 = 30. All 30 rows accounted for, none silently dropped.

---

## 4. Order of battle — decided, not offered

Pi's own priority direction was explicit and correct: *"le chat d'abord"*. Implementation order:

1. **`message-bubble` + `chat-conversation`** in `components/chat/MessageList.tsx` — highest-traffic surface in the product (every dashboard user hits chat daily), replaces the largest chunk of hand-written UI (bubble, avatar, empty state, cursor) in one swap, and every other conversational block depends on this shell existing first.
2. **`status-badge`** in `components/chat/ToolCallIndicator.tsx` — small, isolated, immediately visible in the same chat surface being touched in step 1; do it in the same pass to avoid re-opening the file.
3. **`quick-reply` + `option-list` + `tag-select`** in `onboarding-chat.tsx` / `lib/json-render/registry.tsx` — these three replace the three near-duplicate hand-written selection components (`TeamSelection`, `AgentSelection`, `SkillSelection`) that are today's clearest "same pattern hand-coded three times" smell; also gives the architect/consultant agents a genuinely new interaction (`quick-reply`) they cannot express at all today.
4. **`progress-steps`** in the onboarding flow — depends on step 3 shipping first (it needs the same surface's step boundaries defined), and is additive (no existing code to replace), so it is lower urgency than the replacements above.
5. **`table`** in `lib/json-render/registry.tsx` — new catalog component, unlocks a capability (structured tabular agent output) that does not exist at all today; sequenced after the chat-surface work above because it requires wiring into the catalog/registry pair the same way the selection blocks do, and validating that pattern once (step 3) de-risks doing it again here.
6. **`stat-card`** in `components/missions/mission-stats.tsx` — outside the chat surface entirely, self-contained, zero dependency on the above; done once the chat work is stable so it doesn't compete for review bandwidth with the higher-priority conversational work.
7. **`hero`** in `components/landing/HeroSection.tsx` — marketing surface, lowest functional priority (no dashboard user ever sees it twice), last in the order.

The 20 homeless blocks (events, tickets, map, contact/issue forms, date-time picker, order/payment, amount-input, blog posts, social previews, product-list) are **not** scheduled — they have no feature to attach to in this product today. Building any of them would mean building the underlying feature (a booking system, a blog, a social integration, an e-commerce catalog) first, which is out of scope for a component-mapping exercise and not requested by this brief.

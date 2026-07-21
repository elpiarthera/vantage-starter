# mcpcn Block Mapping — What 30 Finished Components Let Us Launch

**Date:** 2026-07-21
**Author:** Product (Tau)
**Scope:** for every block in the mcpcn registry (https://www.mcpcn.dev), this document answers one question: *this component is finished, free, MIT-licensed — what does it let us launch or sell, as its own committed job?*

**Declared divergence from `docs/brief-backend.md` template:** this is a product-analysis deliverable, not a code change. The "EXACT CHANGES" / schema sections of that template do not apply here.

**Supersedes:** the previous version of this document, which asked "which existing screen uses this block today?" — a filing question that rejected 20 of 30 blocks for reasons like "no page exists" or "dependency missing." Those are not obstacles; they are things this analysis exists to change. The version after that grouped 30 blocks into 22 shared-feature entries. This version is a full rewrite: **30 blocks, 30 entries, each its own committed use case.** No block is refused. No use case is conditional.

---

## 1. The count is derived, not typed

```
curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(len([i for i in d['items'] if i.get('type')=='registry:block']))"
-> 30
```

**30 blocks.** A "31" is in circulation in some contexts — that is the mcpcn project's GitHub star count, unrelated to the registry's item count.

**30 blocks, 30 entries — the two derivations now coincide.** A prior version of this file read "30 blocks, 22 entries", because eight of the thirty were folded into shared paragraphs (three post blocks as one blog entry, four social blocks as one embed entry, four event blocks as one booking entry). That grouping is gone: every block below has its own `Feature it opens` / `Replaces` / `Cost` triplet, naming its own committed job even where it ships alongside siblings inside the same screen. Both counts are derived below, never typed:

```
# blocks in the registry
curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(len([i for i in d['items'] if i.get('type')=='registry:block']))"
-> 30

# entries in this document (one per 'Feature it opens' triplet)
grep -c '^1\. \*\*Feature it opens' docs/mcpcn-block-mapping.md
-> 30
```

**Every one of the 30 is covered. None dropped, none rejected.** Audit command in §5 — it prints the name of any registry block absent from this file, and it currently prints nothing.

---

## 2. Architectural decision (already made, not re-litigated here)

23 of the 30 blocks depend on `@base-ui/react`. Decision: **add Base UI alongside the existing Radix, take the blocks as-is, MIT attribution intact, zero rewrite.** This is a one-time install noted once below as "Base UI" in the cost column — never repeated per block, never treated as an obstacle.

---

## 3. The products these blocks land in

- **vantage-starter** — this repo, the SaaS boilerplate every other product forks. Ships AI chat, an "architect" planning surface, a consultant onboarding flow, missions, billing/account, a landing page.
- **VantageCRM** — contacts, companies, deals, activities, pipelines, workflows, audit log, custom fields/objects, subscriptions.
- **VantagePeers** — orchestrator coordination: tasks, missions, messaging, memory/episodes, diary, briefing notes, mandates, fix patterns, deployments, issues.
- **VantageRegistry** — a discoverable catalog of skills, agents, hooks, rules, plugins, runbooks, templates, components.
- **EveVantage** — a product forked from vantage-starter, carrying the vantage-starter base plus its own additions on top.

Eight of the thirty blocks below are already installed in this repo (`ls components/ui/` returns `chat-conversation.tsx`, `message-bubble.tsx`, `option-list.tsx`, `progress-steps.tsx`, `quick-reply.tsx`, `stat-card.tsx`, `status-badge.tsx`, `tag-select.tsx`). Four of those eight are already wired into a live screen: `stat-card` in `components/missions/mission-stats.tsx`, `message-bubble` and `chat-conversation` in `components/chat/MessageList.tsx`, `status-badge` in `components/chat/ToolCallIndicator.tsx` and `components/missions/mission-list-view.tsx`. The remaining 22 blocks are not yet installed; each entry below names the exact route or screen that installs them.

---

## 4. The mapping — 30 blocks, 30 committed use cases

### Chat & agent surfaces

**message-bubble** — chat bubbles with text/image/voice/reaction variants.
1. **Feature it opens:** vantage-starter's dashboard chat (`components/chat/MessageList.tsx`) gains voice-note and image-drop message types, so a user can send a screenshot of a bug straight into the mission chat instead of describing it in text.
2. **Replaces:** the hand-written `MessageBubble` inline rendering in `components/chat/MessageList.tsx` — already installed and wired (`components/ui/message-bubble.tsx`).
3. **Cost:** Base UI install (shared across all 23 dependent blocks, one-time); wiring image/voice payload types into the existing `sendMessage` call.

**chat-conversation** — full conversation shell, multiple message types.
1. **Feature it opens:** the conversation shell (avatars, empty state, live region) for vantage-starter's dashboard chat in `components/chat/MessageList.tsx` — already installed and wired (`components/ui/chat-conversation.tsx`). Second job: a new orchestrator-to-orchestrator thread view inside VantagePeers, at new route `app/[locale]/dashboard/peers/messages/page.tsx`, rendering `check_messages` output as a real read/reply UI instead of raw tool output.
2. **Replaces:** `MessageList.tsx`'s own list layout and empty state, for the vantage-starter case; nothing — net-new surface — for the VantagePeers thread view.
3. **Cost:** Base UI (already paid, shared); for the VantagePeers reuse, a query translating `check_messages`' `(from, channel, content)` shape into the block's message-item props.

**quick-reply** — quick-reply buttons for common chat responses.
1. **Feature it opens:** in vantage-starter's dashboard chat, when the architect agent asks "add this to the roadmap now or later?", the user taps a button instead of typing — wired into `components/chat/MessageList.tsx` alongside `message-bubble`.
2. **Replaces:** nothing — no quick-reply affordance exists in the chat surface today. Installed (`components/ui/quick-reply.tsx`) but not yet wired into a message flow.
3. **Cost:** Base UI (shared); defining the fixed reply sets per prompt type.

**option-list** — tag-style option selector, single/multi.
1. **Feature it opens:** vantage-starter's consultant onboarding flow at `app/[locale]/dashboard/consultant/` gets one real component for team/agent/skill selection.
2. **Replaces:** `TeamSelection` in `lib/json-render/registry.tsx:439`. Installed (`components/ui/option-list.tsx`) but not yet wired to replace `TeamSelection`.
3. **Cost:** Base UI (shared).

**tag-select** — colored tag selector, single/multi, color variants.
1. **Feature it opens:** the pain-point chips in vantage-starter's consultant onboarding flow, `lib/json-render/registry.tsx:420` and `:490`, get a real colored-tag component.
2. **Replaces:** the `painPoints.map` chip-rendering block at `lib/json-render/registry.tsx:420` and the `matchedPains.map` block at `:490`. Installed (`components/ui/tag-select.tsx`) but not yet wired to replace those two blocks.
3. **Cost:** Base UI (shared).

**progress-steps** — step indicator, horizontal/vertical, statuses.
1. **Feature it opens:** vantage-starter's consultant onboarding flow (`app/[locale]/dashboard/consultant/`) gets a visible "sector → pain points → team → agents → skills" progress bar instead of the user inferring progress from scrollback.
2. **Replaces:** nothing — no progress indicator exists in the onboarding flow today. Installed (`components/ui/progress-steps.tsx`) but not yet wired into that flow.
3. **Cost:** Base UI (shared).

**status-badge** — status badge, multiple states (success/pending/processing/error/shipped/delivered).
1. **Feature it opens:** vantage-starter's tool-call indicator (`components/chat/ToolCallIndicator.tsx`) and mission list (`components/missions/mission-list-view.tsx`) — already installed and wired (`components/ui/status-badge.tsx`).
2. **Replaces:** `ToolCallIndicator`'s own pill markup and `mission-list-view.tsx`'s own inline status chip.
3. **Cost:** Base UI (shared) — already paid, this block is live.

**table** — data table with single/multi-select, built for chat interfaces.
1. **Feature it opens:** vantage-starter's dashboard chat gains a genuinely new agent capability at `components/chat/MessageList.tsx`: the architect agent emits a real sortable/selectable table inline in chat (e.g. "here are 6 candidate fixes, pick one") instead of a markdown wall of text.
2. **Replaces:** nothing — the chat surface renders markdown tables today, not an interactive component.
3. **Cost:** Base UI (shared); a new message-part renderer in `MessageList.tsx` for the table payload type.

**amount-input** — numeric input with increment/decrement + presets.
1. **Feature it opens:** a manual credit top-up control in vantage-starter's `components/dashboard/account/tabs/UsageCreditsTab.tsx` — a buyer taps to add $10/$25/$50 in usage credits instead of a bare number field.
2. **Replaces:** nothing — `UsageCreditsTab.tsx` today has no manual top-up input at all, only a display of current credit balance. The `userCredits` and `creditTransactions` tables exist in `convex/schema.ts`; the mutation to accept a manual top-up amount does not exist yet and is built as part of this feature.
3. **Cost:** Base UI (shared); a new Convex mutation accepting a manual top-up amount and creating the matching `creditTransactions` row.

### Forms

**contact-form** — name, phone+country, email, message, file attachment.
1. **Feature it opens:** a public `/contact` page for vantage-starter, at new route `app/[locale]/contact/page.tsx` — every SaaS forked from this boilerplate needs one lead-capture form with phone-country selector and file attachment.
2. **Replaces:** nothing — net-new marketing surface; no `contact` route exists under `app/[locale]/` today.
3. **Cost:** Base UI; the new route; a new Convex `contactSubmissions` table and mutation to store submissions.

**issue-report-form** — compact issue form, categories, impact/urgency, attachments.
1. **Feature it opens:** a public incident-report page at new route `app/[locale]/report/page.tsx`, wired to VantagePeers' `create_task` MCP tool (assignedTo the relevant orchestrator, priority derived from the block's own "urgency" field) — turning an external bug report into a triaged task with zero manual re-typing.
2. **Replaces:** the current process — a client messaging Laurent, who manually creates a task.
3. **Cost:** Base UI; the new route; a Convex action or API route that calls VantagePeers' `create_task` on submit.

**date-time-picker** — Calendly-style date/time picker, slots + timezone.
1. **Feature it opens:** a booking page at new route `app/[locale]/dashboard/consultant/book/page.tsx` — scheduling a 30-minute onboarding call with the consultant agent's human counterpart, using a static availability config as the slots data source.
2. **Replaces:** nothing — net-new scheduling capability; no booking surface exists in the repo today.
3. **Cost:** Base UI; the new route; a static availability config (a real calendar-integration data source is a separate, later feature, not a blocker for this entry).

**ticket-tier-select** — ticket tier selection, quantity + price breakdown.
1. **Feature it opens:** a plan-comparison screen inside `components/dashboard/account/modals/ManageSubscriptionModal.tsx`, showing vantage-starter's Polar subscription tiers side by side with seat-quantity selection.
2. **Replaces:** the current bare plan-name buttons in `ManageSubscriptionModal.tsx`.
3. **Cost:** Base UI; mapping the `subscriptionTiers` Convex table (`convex/schema.ts:339`) onto the block's tier-list props.

### Commerce / confirmation

**order-confirm** — order confirmation, product image, delivery info, confirm action.
1. **Feature it opens:** a post-purchase confirmation screen at new route `app/[locale]/dashboard/account/order-confirmed/page.tsx`, built for a one-time "download the exported report" purchase — the first non-subscription purchase flow in vantage-starter, built as part of this feature rather than assumed to pre-exist.
2. **Replaces:** nothing — Polar's hosted checkout has no custom confirmation screen in this repo today.
3. **Cost:** Base UI; the new route; a Convex mutation recording the one-time purchase, since no `orders` or `purchases` table exists in `convex/schema.ts` today.

**payment-confirmed** — payment confirmation, price, delivery info, tracking button.
1. **Feature it opens:** the tracking-button variant of the same confirmation screen at `app/[locale]/dashboard/account/order-confirmed/page.tsx`, used for the trackable-deliverable branch (e.g. a shipped physical add-on) instead of the digital-download branch that `order-confirm` covers.
2. **Replaces:** nothing — same net-new surface as `order-confirm`, sharing the route and the new Convex table.
3. **Cost:** Base UI (shared with `order-confirm`, build once, reuse both).

**product-list** — products in list/grid/carousel/picker layouts.
1. **Feature it opens:** a browse UI for VantageRegistry's catalog, at new route `app/[locale]/dashboard/registry/catalog/page.tsx` — grid view for visual scanning, picker view for "select one to install", over the existing `list_skills`/`list_agents`/`list_hooks` MCP data.
2. **Replaces:** nothing — VantageRegistry's catalog is consumed today only as raw MCP tool responses, with no rendered browse screen in vantage-starter.
3. **Cost:** Base UI; the new route; a query mapping VantageRegistry's item schema onto the block's product-card props.

### Content / blog

**post-card** — blog post preview card.
1. **Feature it opens:** the card component for a new changelog/blog listing page at `app/[locale]/changelog/page.tsx`, turning `CHANGELOG.md` entries into a public "what's new" surface.
2. **Replaces:** nothing — net-new content surface; no blog card component exists in the repo today.
3. **Cost:** Base UI; a Convex table or MDX source parsing `CHANGELOG.md` entries into post records.

**post-list** — blog post list layout.
1. **Feature it opens:** the listing layout for the same `app/[locale]/changelog/page.tsx` page, arranging `post-card` items in a scrollable list.
2. **Replaces:** nothing — net-new; the page itself does not exist yet.
3. **Cost:** Base UI (shared with `post-card`, same route).

**post-detail** — full post view with related posts.
1. **Feature it opens:** the single-entry view at new route `app/[locale]/changelog/[slug]/page.tsx`, rendering one changelog entry in full with related-entries navigation.
2. **Replaces:** nothing — net-new; there is no single-changelog-entry page today.
3. **Cost:** Base UI (shared source with `post-card`/`post-list`); the dynamic route.

### Social embeds

**x-post** — X/Twitter post preview card with engagement metrics.
1. **Feature it opens:** an "as seen on" social-proof embed on vantage-starter's landing page, dropping a real tweet card into the section adjacent to `components/landing/HeroSection.tsx` instead of a screenshot.
2. **Replaces:** nothing — no social-embed pattern exists anywhere in the repo today.
3. **Cost:** Base UI (shared across the four social blocks); X's public oEmbed data (no API key needed for basic card rendering).

**instagram-post** — Instagram post preview card.
1. **Feature it opens:** the same landing-page social-proof strip, for an Instagram testimonial or product post.
2. **Replaces:** nothing — same net-new surface as `x-post`.
3. **Cost:** Base UI (shared); Instagram's public embed data.

**linkedin-post** — LinkedIn post preview card.
1. **Feature it opens:** the same landing-page social-proof strip, for a client's LinkedIn testimonial post — the highest-relevance network for a B2B SaaS boilerplate's landing page.
2. **Replaces:** nothing — same net-new surface as `x-post`.
3. **Cost:** Base UI (shared); LinkedIn's public embed data.

**youtube-post** — YouTube video preview card with embedded playback.
1. **Feature it opens:** the same landing-page social-proof strip, embedding a demo video with a native-looking card instead of an unstyled `<iframe>`.
2. **Replaces:** nothing — the landing page has no video embed of any kind today, so this is additive, not a swap.
3. **Cost:** Base UI (shared); YouTube's public oEmbed data.

### Events

**event-card** — event preview card.
1. **Feature it opens:** the card component for a new webinar/workshop listing page at new route `app/[locale]/events/page.tsx` — a live onboarding webinar or paid workshop hosted by vantage-starter.
2. **Replaces:** nothing — no events feature exists in the repo today; `convex/schema.ts` has no `events` table.
3. **Cost:** Base UI (shared across the four event blocks); a new Convex `events` table.

**event-list** — event listing layout.
1. **Feature it opens:** the listing layout for the same `app/[locale]/events/page.tsx` page, arranging `event-card` items.
2. **Replaces:** nothing — net-new; same page as `event-card`.
3. **Cost:** Base UI (shared); reads from the same new `events` table.

**event-detail** — event detail page with agenda and registration.
1. **Feature it opens:** the single-event view at new route `app/[locale]/events/[slug]/page.tsx`, showing the agenda and a registration form wired to the new `events` table.
2. **Replaces:** nothing — net-new; there is no event-detail page today.
3. **Cost:** Base UI (shared); a Convex mutation recording a registration against the `events` table.

**event-confirmation** — event registration confirmation screen.
1. **Feature it opens:** the confirmation screen shown after a successful registration on `app/[locale]/events/[slug]/page.tsx`, closing the loop opened by `event-detail`.
2. **Replaces:** nothing — net-new; no confirmation step exists because no registration flow exists yet.
3. **Cost:** Base UI (shared with the other three event blocks, same new `events` table).

**ticket-tier-select** *— already fully specified above under Forms, its one committed job is the billing plan-comparison screen; not repeated here even though it is discoverable from the same mcpcn "events" collection.*

**map-carousel** — interactive map with markers + draggable card carousel.
1. **Feature it opens:** a "companies near me" map view in VantageCRM at new route `app/[locale]/dashboard/crm/territory/page.tsx`, pairing company records with a location marker and a swipeable card per company for account-based sales territory planning.
2. **Replaces:** nothing — VantageCRM has no map-based territory view today.
3. **Cost:** Base UI; a map tile provider (Mapbox/Maplibre free tier); a one-time geocoding batch job turning company addresses into lat/lng.

### Dashboards & metrics

**stat-card** — scrollable stat cards with values, trend arrows, change indicators.
1. **Feature it opens:** vantage-starter's missions dashboard at `components/missions/mission-stats.tsx` — already installed and wired (`components/ui/stat-card.tsx`).
2. **Replaces:** `mission-stats.tsx`'s own `StatCard`/`StatCardSkeleton` plus four hand-coded inline SVG icon functions — this replacement already shipped in wave 1 and is consuming `StatCardItem` today.
3. **Cost:** none for the block itself — it needs no UI primitive library, already paid. Reusing it a second time (e.g. a VantageCRM pipeline-value stat strip) costs only the query that returns the numbers.

### Marketing

**hero** — landing hero, logos, title, subtitle, CTAs, tech-logo footer.
1. **Feature it opens:** vantage-starter's landing page, replacing the current hero section, with the same pattern already proven at litui.dev (this repo's own stated design reference in `CLAUDE.md`), maintained upstream instead of hand-maintained here.
2. **Replaces:** `components/landing/HeroSection.tsx` (233 hand-written lines).
3. **Cost:** Base UI (shared).

---

## 5. Score

Do not read the number below as typed — derive it, and derive the coverage too. The registry is the authority on what must be covered; this file is the authority on what *is* covered; the check is that the two sets match:

```
# how many blocks the registry declares
curl -sS https://www.mcpcn.dev/r/registry.json \
  | python3 -c "import json,sys; d=json.load(sys.stdin); \
print(len([i for i in d['items'] if i.get('type')=='registry:block']))"

# which blocks have NO ENTRY in the mapping section — must print "none"
python3 -c "
import json,sys,re,urllib.request
doc=open('docs/mcpcn-block-mapping.md').read()
mapping=doc.split('## 4. The mapping',1)[1].split(chr(10)+'## 5.',1)[0]
bold=set(re.findall(r'\*\*([a-z0-9-]+)\*\*', mapping))
d=json.load(urllib.request.urlopen('https://www.mcpcn.dev/r/registry.json'))
blocks=[i['name'] for i in d['items'] if i.get('type')=='registry:block']
missing=[b for b in blocks if b not in bold]
print(f'{len(blocks)-len(missing)}/{len(blocks)} blocks have an entry')
print('MISSING:', missing if missing else 'none')
sys.exit(1 if missing else 0)"
-> 30/30 blocks have an entry
-> MISSING: none
```

The second command is the one that matters, and it is the one that caught a real defect in an earlier draft: an assertion of "30 of 30, zero rejected" while **silently omitting `stat-card`** — 29 covered, one dropped without a word. The claim was typed, not derived, inside a document whose opening section preaches derivation. A count that nobody made fail is not a measurement.

**And the first version of that very command could not fail.** It asked whether each block name appeared *anywhere in the file* (`i['name'] not in doc`). Names recur in prose — an earlier ranked closing section alone mentioned half of them — so deleting an entry outright left the check green. Proven, not assumed: replacing the `**stat-card**` entry heading with a placeholder still printed nothing missing. The command above scopes the search to §4 and requires the name **in bold**, i.e. as an entry heading. Same probe against it: `29/30`, `MISSING: ['stat-card']`, exit 1. It passes clean on the unmodified file and fails on a real deletion — a guard proven in both directions, which is the only kind worth citing.

Every block in the registry opens exactly one named, committed feature in one of the five products. **Zero blocks rejected.**

---

## Implementation order

This is an order, not a value ranking — every entry above is committed regardless of when it ships.

**Which blocks are installed and which are wired is state, so it is derived, not listed here.** A typed list would be true the day it was written and false the day after the next merge. Run this instead:

```
for b in $(curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(' '.join(i['name'] for i in d['items'] if i.get('type')=='registry:block'))"); do
  [ -f "components/ui/$b.tsx" ] || continue
  echo "$b consumers=$(git grep -l "$b" -- components app src | grep -v "components/ui/$b.tsx" | wc -l)"
done
```

It prints every installed block with the number of screens consuming it; `consumers=0` means installed but not yet in service. At `main` @ `b6218ed` it printed eight installed blocks, four of them with a consumer. Re-run it rather than trusting that sentence — it carries a date, and dates expire.

Suggested sequence for the rest: `issue-report-form` first (it closes a standing operational cost — bug reports triaged by hand today), then `product-list` (a UI gap over data VantageRegistry already holds), then `table` (a new agent capability inside a chat surface that already renders text), then the remaining onboarding blocks, then the features needing a net-new Convex table (contact form, booking, events, blog, order confirmation) in any order — none of them blocks another.

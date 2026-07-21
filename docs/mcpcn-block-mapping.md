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

23 of the 30 blocks depend on `@base-ui/react`. **That dependency is already installed and it is the only primitives library in this repository** — derived, not assumed:

```
python3 -c "import json; p=json.load(open('package.json'));
print('base-ui:', p['dependencies'].get('@base-ui/react'));
print('radix keys:', [k for k in list(p['dependencies'])+list(p['devDependencies']) if 'radix' in k])"
-> base-ui: 1.6.0
-> radix keys: []
```

An earlier version of this section read *"add Base UI **alongside the existing Radix** … a one-time install"*. That was true when it was written and is false now: Radix was migrated to Base UI and **removed** — every wave is recorded in `docs/migration-base-ui.md`, and the only surviving `@radix-ui` strings in the repository are two test docstrings explaining what a component was ported *from*, plus the changelog history. The sentence is corrected here rather than left standing, because a stale state claim inside a document whose §1 preaches derivation is the exact defect this file exists to avoid.

**Consequence for every cost line below:** the Base UI install is not a future expense to weigh against a block. It is paid. Where an entry names "Base UI" in its cost, read it as *the primitive layer this block builds on, already present* — never as an obstacle, and never as a reason to defer.

---

## 3. The products these blocks land in

- **vantage-starter** — this repo, the SaaS boilerplate every other product forks. Ships AI chat, an "architect" planning surface, a consultant onboarding flow, missions, billing/account, a landing page.
- **VantageCRM** — contacts, companies, deals, activities, pipelines, workflows, audit log, custom fields/objects, subscriptions.
- **VantagePeers** — orchestrator coordination: tasks, missions, messaging, memory/episodes, diary, briefing notes, mandates, fix patterns, deployments, issues.
- **VantageRegistry** — a discoverable catalog of skills, agents, hooks, rules, plugins, runbooks, templates, components.
- **EveVantage** — a product forked from vantage-starter, carrying the vantage-starter base plus its own additions on top.

**Which blocks are installed, and which are wired into a live screen, is STATE — so it is derived on demand, never written here.** A sentence naming them is true the day it is typed and false after the next merge: an earlier draft of this paragraph said "four are wired" and was already wrong, because two more had been wired in the meantime. Run this instead:

```
for b in $(curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(' '.join(i['name'] for i in d['items'] if i.get('type')=='registry:block'))"); do
  [ -f "components/ui/$b.tsx" ] || continue
  echo "$b consumers=$(git grep -l "$b" -- components app src | grep -v "components/ui/$b.tsx" | wc -l)"
done
```

Every installed block is listed with the number of screens consuming it. `consumers=0` means installed but not yet in service; a block absent from the output is not installed yet. Each entry below names the exact route or screen that puts its block to work.

---

## 4. The mapping — 30 blocks, 30 committed use cases

### Chat & agent surfaces

**message-bubble** — chat bubbles with text/image/voice/reaction variants.
1. **Feature it opens:** *partially delivered.* Text messages in vantage-starter's dashboard chat (`components/chat/MessageList.tsx:142-147`) render through the ported `MessageBubble`/`MessageBubbleContent` — done, evidence: `MessageList.tsx` imports and calls them for `textContent`, confirmed via `grep`. **Not built:** the block's `ImageMessageBubble` and `VoiceMessageBubble` exports (`components/ui/message-bubble.tsx:230`, `:516`) exist in the component file but are never imported by `MessageList.tsx` (confirmed via `grep` — zero matches for `ImageMessageBubble`/`VoiceMessageBubble` outside `components/ui/message-bubble.tsx` and `components/ui/chat-conversation.tsx`), so a user still cannot send a screenshot or voice note into the mission chat. Remaining work is planned in Batch 2.
2. **Replaces:** the hand-written `MessageBubble` inline rendering in `components/chat/MessageList.tsx` — done, for the text case only. For image/voice: nothing today — no drop-to-attach or record-voice affordance exists in the chat composer, confirmed via `grep` on the composer file for `voice`/`image-drop` (zero matches).
3. **Cost:** Base UI (already installed, see §2) — paid for the text case. Remaining: a new message-part type for image/voice payloads, wiring `ImageMessageBubble`/`VoiceMessageBubble` into `MessageList.tsx`'s render switch, and a composer affordance (attach button / hold-to-record) that produces that payload.

**chat-conversation** — full conversation shell, multiple message types.
1. **Feature it opens:** *partially delivered.* The conversation shell (list container, list layout) for vantage-starter's dashboard chat in `components/chat/MessageList.tsx:209-226` — done, evidence: `MessageList.tsx` imports and renders `ChatConversation`/`ChatConversationMessages`, confirmed via `grep`. Its empty state is deliberately kept hand-written instead (declared divergence at `MessageList.tsx:167-170` — upstream's empty-state look was rejected, not omitted by accident). **Not built:** the second job, an orchestrator-to-orchestrator thread view inside VantagePeers, at new route `app/[locale]/dashboard/peers/messages/page.tsx` — route confirmed absent via `find app -path "*peers/messages*"` (zero results), rendering `check_messages` output as a real read/reply UI instead of raw tool output. Remaining work is planned in Batch 3.
2. **Replaces:** `MessageList.tsx`'s own list-container/list-layout markup — done; its empty-state markup — deliberately not replaced (see divergence above). For the VantagePeers thread view: nothing — net-new surface, no route exists today.
3. **Cost:** Base UI (already paid, shared) — paid for the vantage-starter shell. Remaining, for the VantagePeers reuse: the new route, and a query translating `check_messages`' `(from, channel, content)` shape into the block's message-item props.

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
1. **Feature it opens:** *partially delivered.* vantage-starter's tool-call indicator — done, evidence: `components/chat/ToolCallIndicator.tsx:5-8,71-78` imports and renders `StatusBadge`/`StatusBadgeIcon`/`StatusBadgeLabel`, confirmed via `grep`. **Not built:** the mission list (`components/missions/mission-list-view.tsx`) still renders its own hand-written status chip — `mission-list-view.tsx:17` ("Inline status badge styles replacing cva + missionStatusBadge from lib/status-variants") and `:183-189` (a `<span>` styled from a local `STATUS_BADGE_CLASSES` map), confirmed via `grep` for `StatusBadge` in that file: zero matches. Remaining work is planned in Batch 1.
2. **Replaces:** `ToolCallIndicator`'s own pill markup — done. `mission-list-view.tsx`'s inline `STATUS_BADGE_CLASSES` span — not yet replaced.
3. **Cost:** Base UI (shared) — already paid for the tool-call-indicator case. Remaining: swap `mission-list-view.tsx`'s `STATUS_BADGE_CLASSES` span for `StatusBadge`, mapping the existing mission `status` values onto the block's state prop.

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
1. **Feature it opens:** done — evidence: `components/missions/mission-stats.tsx:6,47,75,120,127,149` imports and renders `StatCardItem` from `components/ui/stat-card.tsx`, confirmed via `grep`. Zero remaining work.
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

## Implementation plan

This is a sequence, not a value ranking — every entry in §4 is committed regardless of when it ships. Base UI is already installed (§2); no batch below waits on it.

### The plan can drift from §4 exactly like §5 drifted once — so it gets the same kind of guard

§5 audits that §4 covers all 30 registry blocks. It does not audit that the **plan below** covers what §4 committed to build — a block can have a full §4 entry and still be silently absent from every batch, or half-covered by an entry whose claim of "already wired" turns out to name only part of the feature. That exact defect shipped once in this document (`status-badge`, `message-bubble`, `chat-conversation`, `ticket-tier-select` — see Batch 5). The guard below is scoped to the plan, not §4.

**What counts as a plan entry, stated in one sentence so the next reader writes the same matcher:** a block counts as accounted for only if its name (or, for a shared bullet, one of the `/`-separated names in the bullet's bold head, with any trailing `(...)` parenthetical stripped) is the bold head of a line starting with `- **` inside this Implementation Plan section, or its §4 entry states, in those literal words, that it carries **zero remaining work** — a bare mention of the name anywhere else in the prose, including this guard's own explanatory paragraph above, does not count.

```
python3 -c "
import json,re,urllib.request
doc=open('docs/mcpcn-block-mapping.md').read()
mapping=doc.split('## 4. The mapping',1)[1].split(chr(10)+'## 5.',1)[0]
plan=doc.split('## Implementation plan',1)[1]
d=json.load(urllib.request.urlopen('https://www.mcpcn.dev/r/registry.json'))
blocks=[i['name'] for i in d['items'] if i.get('type')=='registry:block']
entries = re.split(r'(?=^\*\*[a-z0-9-]+\*\* —)', mapping, flags=re.M)
entry_by_name = {}
for e in entries:
    m = re.match(r'^\*\*([a-z0-9-]+)\*\* —', e)
    if m: entry_by_name[m.group(1)] = e
# membership = bold head of a '- **...**' batch bullet line, not a free-text mention
bullet_heads = re.findall(r'^- \*\*([^*]+)\*\*', plan, re.M)
names_in_plan = set()
for h in bullet_heads:
    h = re.sub(r'\s*\([^)]*\)', '', h).strip()   # drop trailing parenthetical
    for part in h.split(' / '):                    # shared bullets name several blocks
        names_in_plan.add(part.strip())
missing=[]
for b in blocks:
    is_done = b in entry_by_name and 'zero remaining work' in entry_by_name[b].lower()
    if not is_done and b not in names_in_plan: missing.append(b)
print(f'{len(blocks)-len(missing)}/{len(blocks)} blocks accounted for in the plan')
print('MISSING:', missing if missing else 'none')
import sys; sys.exit(1 if missing else 0)"
-> 30/30 blocks accounted for in the plan
-> MISSING: none
```

**Proven bipolar on three adversarial deletions, not one convenient one.** `message-bubble` and `chat-conversation` were picked precisely because both names also recur in this guard's own explanatory paragraph above — a free-text `\b<name>\b` search over the whole plan section (the defect this guard replaces) would stay green on both deletions, since the name still appears in that paragraph. The bullet-head-only matcher does not:

- Deleting the `message-bubble` Batch 5 bullet, asserting the deletion landed (`grep -c` on the exact bullet text -> `0`), running the guard: `29/30 blocks accounted for in the plan`, `MISSING: ['message-bubble']`, exit 1. Restoring (`diff` against the pre-mutation file -> empty) and re-running: `30/30`, `MISSING: none`, exit 0.
- Deleting the `chat-conversation` Batch 5 bullet, same sequence: probe-landed check `0`, guard -> `29/30`, `MISSING: ['chat-conversation']`, exit 1. Restored, `diff` empty, guard -> `30/30`, `MISSING: none`, exit 0.
- Deleting the `ticket-tier-select` Batch 5 bullet, same sequence: probe-landed check `0`, guard -> `29/30`, `MISSING: ['ticket-tier-select']`, exit 1. Restored, `diff` empty, guard -> `30/30`, `MISSING: none`, exit 0.

Same standard §5 holds itself to: a guard nobody made fail is not a measurement, and this one has failed three times, on purpose, on the two names it was most likely to falsely pass, and been proven to recover each time.

**Run §3's derivation command before starting any batch.** It is the authority on what is installed and what is already in service; nothing in this plan restates that state in prose, because prose expires and the command does not. **A batch never re-wires a block the command already reports with `consumers >= 1`** — if a block named below has since been wired, drop it from its batch and move on. That has already happened once to this document, which is why the rule is written down rather than assumed.

**One PR per batch. One batch in the gate at a time.** A batch does not open until the prior batch has merged, so each PR is reviewable against a stable base and a broken batch never blocks the ones behind it in the queue — that queue position is the only ordering claim made here.

### Batch 1 — put the remaining installed-but-unwired blocks into service

Scope is whatever §3's command reports as `consumers=0`, not the list below: at the time of writing that is `option-list` and `quick-reply`. `tag-select` and `progress-steps` were also in this batch and have since been wired (missions status filter and consultant onboarding step indicator respectively) — their entries stay here because the batch is defined by the derivation, and a wired block simply drops out of it. Re-run the command; do not re-wire what it already counts.

Real dependency: the onboarding-side entries target the same live route and the same file, `lib/json-render/registry.tsx`; shipping them as one PR means one review of one file's diff instead of several PRs colliding on the same lines.

- **option-list** — host: `app/[locale]/dashboard/consultant/onboard/page.tsx` (route exists, confirmed via `find`). Replaces: `TeamSelection` at `lib/json-render/registry.tsx:439` (confirmed via `grep`). Convex: none — reads the same team/agent/skill data `TeamSelection` already receives as props. TDD assertion: rendering the onboarding step with a `team` json-render node produces an `option-list` element whose `onSelect` fires the same handler `TeamSelection` used to call.
- **tag-select** — same route. Replaces: the `painPoints.map` chip block at `lib/json-render/registry.tsx:420` and the `matchedPains.map` block at `:490` (both confirmed via `grep`). Convex: none. TDD assertion: selecting a pain-point tag toggles its selected state and the onward payload sent to the consultant agent still carries the same pain-point id shape as the old `.map` block did.
- **progress-steps** — same route. Replaces: nothing (confirmed — no progress indicator exists in `registry.tsx` today). Convex: none. TDD assertion: the step index passed to `progress-steps` advances by exactly one each time the onboarding flow's `currentStep` state changes, verified against the five known steps (sector, pain points, team, agents, skills).
- **quick-reply** — host: `components/chat/MessageList.tsx` (the file that already renders `message-bubble` and `chat-conversation`, confirmed via `grep`). Replaces: nothing (confirmed — no quick-reply affordance exists in that file today). Convex: none — reuses the existing `sendMessage` mutation call already wired in `MessageList.tsx`. TDD assertion: tapping a `quick-reply` option calls `sendMessage` with that option's literal text, identical to what typing and hitting Enter would send.

### Batch 2 — one new Convex mutation, reused by two chat/account surfaces

Real dependency: both blocks in this batch add a first write-path (a mutation that did not exist before) to a table that already exists — grouping them means the "add a mutation to an existing table" review pattern is established once and reused, not because one imports the other.

- **amount-input** — host: `components/dashboard/account/tabs/UsageCreditsTab.tsx` (confirmed via `find`). Replaces: nothing — the tab today only displays balance (confirmed via `grep` on the file, no top-up control present). Convex: `userCredits` (balance, confirmed present at `convex/schema.ts:271`) and `creditTransactions` (audit log, confirmed present at `convex/schema.ts:290`) — new mutation `creditTransactions.recordManualTopUp` that inserts a `creditTransactions` row and increments the matching `userCredits` row; no new table. TDD assertion: calling the new mutation with a preset amount ($10/$25/$50) increments the caller's `userCredits.balance` by exactly that amount and inserts exactly one `creditTransactions` row carrying it.
- **table** — host: `components/chat/MessageList.tsx`. Replaces: nothing — the chat surface renders markdown tables today, not an interactive component (confirmed by reading the file's message-part rendering switch). Convex: none — a new message-part renderer only, no schema change. TDD assertion: a chat message whose `parts` array contains a `table` part renders the `table` block with the same row/column data as the markdown fallback it replaces, and a row-select event fires a callback carrying that row's id.

### Batch 3 — VantageRegistry and VantageCRM browse screens over existing data

Real dependency: none between the two entries — they land in different products. They are grouped because both are "build a browse screen over data an MCP tool already returns, zero new Convex tables" and reuse the same query-mapping pattern; each still ships as its own PR against a stable batch-2 base.

- **product-list** — host: new route `app/[locale]/dashboard/registry/catalog/page.tsx` (confirmed missing via `find`, to be created). Replaces: nothing — VantageRegistry's catalog is consumed today only as raw MCP tool output, with no rendered browse screen in this repo (confirmed — route absent). Convex: none — a query mapping `list_skills`/`list_agents`/`list_hooks` MCP responses onto the block's product-card props, no new table. TDD assertion: given a fixed MCP response fixture, the page renders one product-card per returned item, and the picker variant's `onSelect` fires with that item's registry id.
- **map-carousel** — host: new route `app/[locale]/dashboard/crm/territory/page.tsx` (confirmed missing via `find`, to be created). Replaces: nothing — VantageCRM has no map-based territory view today (confirmed — route absent). Convex: a one-time geocoding batch job turning existing company addresses into lat/lng, stored on the existing companies record (exact field TBD by `dev-convex-expert` at brief time — this is the one named unknown in this plan: whether VantageCRM's `companies` table already carries an address field usable for geocoding has not been verified from this repo, since VantageCRM is a separate product/repo not present here). TDD assertion: given a fixture of geocoded companies, the map renders one marker per company and dragging the carousel to a card highlights that company's marker.

### Batch 4 — the five net-new marketing/commerce surfaces, each its own new Convex table

Real dependency: none of the five blocks in this batch depend on each other or on batches 1-3. They are grouped last because each needs a brand-new Convex table (none of which exist yet, confirmed via `grep -nE "defineTable" convex/schema.ts`), the highest-cost category in this plan, and because none of them unblocks anything else — grouping late, same-cost work together keeps the queue's early PRs small and independently mergeable. Each still ships as its own PR; "same batch" here means "same queue position," not "same PR."

- **contact-form** — host: new route `app/[locale]/contact/page.tsx` (confirmed missing via `find`, to be created). Replaces: nothing (confirmed — no `contact` route exists under `app/[locale]/`). Convex: new `contactSubmissions` table (name, email, phone+country, message, attachment ref) and a mutation to insert one row per submission. TDD assertion: submitting the form with valid fields inserts exactly one `contactSubmissions` row carrying the submitted values, and an invalid email is rejected before the mutation runs.
- **issue-report-form** — host: new route `app/[locale]/report/page.tsx` (confirmed missing via `find`, to be created). Replaces: the current process — a client messaging Laurent, who manually creates a task (this is a process replaced, not a file). Convex: none — a Convex action or API route that calls VantagePeers' `create_task` MCP tool on submit, assignedTo the relevant orchestrator, priority derived from the block's own urgency field; no new table in this repo's `convex/schema.ts` since the task itself is stored by VantagePeers, not here. TDD assertion: submitting the form calls `create_task` exactly once with a priority value that matches the block's urgency field via the declared mapping (e.g. "critical" -> "urgent"), and the resulting task's `assignedTo` matches the category selected in the form.
- **date-time-picker** — host: new route `app/[locale]/dashboard/consultant/book/page.tsx` (confirmed missing via `find`, to be created). Replaces: nothing (confirmed — no booking surface exists in the repo today). Convex: none for this entry — slots are sourced from a static availability config file, not a table (a real calendar-integration data source is a separate, later feature, out of scope for this batch). TDD assertion: selecting a slot from the static config and confirming produces a booking payload carrying the selected start time and timezone, matching the config entry that was clicked.
- **event-card / event-list / event-detail / event-confirmation** — host: new routes `app/[locale]/events/page.tsx` (list + card) and `app/[locale]/events/[slug]/page.tsx` (detail + confirmation), both confirmed missing via `find`, to be created. Replaces: nothing (confirmed — no `events` table in `convex/schema.ts`, no events route exists). Convex: new `events` table (title, description, agenda, slug, date, capacity) and a `eventRegistrations` table (eventId, userId, registeredAt) with a mutation recording a registration. These four blocks ship as one PR, not four, because they render one linear user flow (browse -> pick -> register -> confirm) over the same two new tables — splitting them would mean an unreviewable intermediate state (a list page with no detail page to link to). TDD assertion: registering for an event from `event-detail` inserts exactly one `eventRegistrations` row, and `event-confirmation` renders only when that insert has succeeded.
- **post-card / post-list / post-detail** — host: new routes `app/[locale]/changelog/page.tsx` (list + card) and `app/[locale]/changelog/[slug]/page.tsx` (detail), both confirmed missing via `find`, to be created. Replaces: nothing (confirmed — no blog/changelog route exists). Convex: none — an MDX/parsing source that turns `CHANGELOG.md` entries into post records at build or request time, no new table, since the content already exists as version-controlled text rather than user-submitted data. These three blocks ship as one PR for the same reason as the events group: list and detail are one flow, not three independent features. TDD assertion: parsing a fixture `CHANGELOG.md` with N entries produces N post records, and visiting `[slug]` for a known entry renders that entry's title and body verbatim.
- **order-confirm / payment-confirmed** — host: new route `app/[locale]/dashboard/account/order-confirmed/page.tsx` (confirmed missing via `find`, to be created), one route with two branches: `order-confirm` for the digital-download purchase, `payment-confirmed` for the trackable-deliverable purchase. Replaces: nothing (confirmed — Polar's hosted checkout has no custom confirmation screen in this repo today). Convex: new `purchases` table (userId, productKey, kind: "digital" | "trackable", trackingRef, purchasedAt) and a mutation recording the one-time purchase on Polar webhook receipt. Two blocks, one PR, because they are two branches of the same confirmation route reading the same new table, not two features. TDD assertion: a webhook fixture for a digital purchase inserts one `purchases` row with `kind: "digital"` and renders `order-confirm`; a fixture for a trackable purchase inserts `kind: "trackable"` and renders `payment-confirmed` with its tracking button.
- **x-post / instagram-post / linkedin-post / youtube-post** — host: the landing page, in the section adjacent to `components/landing/HeroSection.tsx` (confirmed present via `find`). Replaces: nothing (confirmed — no social-embed pattern exists anywhere in the repo). Convex: none — each renders from its network's own public oEmbed data, fetched client- or build-side; no table. These four ship as one PR because they share one new landing-page section and one embed-fetching pattern, reused four times, not four unrelated integrations. TDD assertion: given a fixture oEmbed response for each network, the corresponding card renders that network's author, text, and engagement-metric fields.
- **hero** — host: `components/landing/HeroSection.tsx` (confirmed present via `find`, 233 hand-written lines per `wc -l`). Replaces: `HeroSection.tsx` in full. Convex: none. TDD assertion: the landing page still renders the same title, subtitle, and CTA hrefs it does today, sourced from the same copy constants, after `hero` replaces the hand-written markup.

### Batch 5 — finish the blocks a prior draft marked done while a real gap remained

Real dependency: none of these four bullets depend on each other. They are grouped because they share one failure mode this document itself exists to prevent — a block whose §4 entry read "already installed and wired" while part, or all, of its §4-committed feature was still missing — and putting them in one late batch keeps that repair visible as its own reviewable unit rather than folded silently into batches 1-4.

- **status-badge** — host: `components/missions/mission-list-view.tsx` (confirmed present via `find`). Replaces: the file's own `STATUS_BADGE_CLASSES`-driven `<span>` at `mission-list-view.tsx:183-189` (confirmed via `grep` — no `StatusBadge` import in that file today; `ToolCallIndicator.tsx` is the only current consumer). Convex: none — reads the same `status` field the inline span already reads. TDD assertion: rendering a mission row with each known `status` value produces a `StatusBadge` carrying the same visual state the old `STATUS_BADGE_CLASSES` map assigned it, and `mission-list-view.tsx` no longer imports `STATUS_BADGE_CLASSES`.
- **ticket-tier-select** — host: `components/dashboard/account/modals/ManageSubscriptionModal.tsx` (confirmed present via `find`; confirmed via `grep` — the modal currently builds a `plans` array rendered as plain cards/buttons, no `ticket-tier-select` import). Replaces: the modal's own plan-card/button markup for the three DB-backed tiers. Convex: none — reads the existing `subscriptionTiers` table (`convex/schema.ts:339`, confirmed present via `grep`), no new table or mutation. TDD assertion: given a fixture of three `subscriptionTiers` rows, the block renders one tier row per fixture entry with the fixture's price and seat-quantity control, and selecting a tier calls the same `onSelectPlan` handler the old card markup called.
- **message-bubble (image/voice completion)** — host: `components/chat/MessageList.tsx`, extending the message-part switch already handling `textContent` (line 140-150, confirmed via `grep`). Replaces: nothing new — additive to the existing text-only render path. Convex: none for the block itself; wiring depends on whatever storage the composer's attach/record affordance already uses for message attachments (none exists yet — the composer file was checked via `grep` for `voice`/`image-drop` with zero matches, so the attachment upload path is also net-new and out of this bullet's TDD scope; it is a prerequisite, not assumed solved here). TDD assertion: a message whose `parts` array contains an `image` or `voice` part renders `ImageMessageBubble`/`VoiceMessageBubble` respectively instead of falling through to the plain-text `MessageBubble`.
- **chat-conversation (VantagePeers thread view)** — host: new route `app/[locale]/dashboard/peers/messages/page.tsx` (confirmed missing via `find`, to be created). Replaces: nothing — VantagePeers messages are consumed today only as raw `check_messages` MCP tool output, with no rendered thread screen (same "browse screen over data an MCP tool already returns, zero new Convex tables" pattern as Batch 3's `product-list`). Convex: none — a query translating `check_messages`' `(from, channel, content)` shape into the block's message-item props, no new table. TDD assertion: given a fixed `check_messages` response fixture, the page renders one `ChatConversation` message item per returned entry, and a reply action calls `send_message` with the composed content and the correct `channel`.

### One open item, named rather than invented

`map-carousel`'s geocoding step assumes VantageCRM's `companies` record already carries a usable address field. That table lives in the VantageCRM repo, not this one, so it was not read for this plan. Confirm the field at brief time before Batch 3 starts; do not assume the shape.

**`message-bubble`'s image/voice completion carries one more named unknown**, same standard as the one above: the message-attachment upload path (where a dropped image or recorded voice clip is stored) does not exist anywhere in this repo yet (confirmed via `grep` on the composer file — zero matches for an upload/attachment mutation). Batch 5's bullet scopes only the render side; the upload path is a prerequisite to brief separately, not assumed solved here.

Sequence recap: Batch 1 (four unwired blocks, existing screens) -> Batch 2 (one new mutation, two chat/account surfaces) -> Batch 3 (two browse screens over existing MCP data) -> Batch 4 (five net-new-table marketing/commerce features, one PR per bullet group) -> Batch 5 (four blocks a prior draft marked done or omitted while real §4-committed work remained). One PR per batch entry; one PR in the gate at a time.

# Blocks Inventory — What Exists, Where It Lives, How to Check It By Eye

**Audience:** a developer picking up this boilerplate, and Laurent, who verifies every row below with his own eyes — no automated screenshot, no rendering service, none introduced here or ever.

**Source of committed purpose:** `docs/mcpcn-block-mapping.md` §4. This document does not re-argue what each block is *for* — it names the file, derives who consumes it today, and tells you the exact click path to see it. Read §4 there for the "why this feature" analysis; read here for "is it live, and how do I look at it."

**Governing rule:** `.claude/rules/derive-never-type.md` — no count in this file is typed. Every number below is produced by the command printed next to it, and the file that command reads is `docs/mcpcn-block-mapping.md`, itself the mirror this document reflects.

---

## 1. The 30, derived

```bash
curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(len([i for i in d['items'] if i.get('type')=='registry:block']))"
```
```
-> 30
```

All 30 are covered below — proven by the same audit command `docs/mcpcn-block-mapping.md` §5 already carries (it prints the name of any registry block with no `**name**` entry heading in that file's §4; it currently prints `none`). This document's row order and row count follow that file's §4 one-for-one; do not recount by hand here.

---

## 2. Consumer counts, derived by command

**This is the command §3 of `docs/mcpcn-block-mapping.md` corrected** — it counts the `@/components/ui/$b` **import path**, never the bare block name. The bare-name form is the defect already fixed once in that file (`table` matched the legal pages, `DataTable`, and the word "acceptable", reporting `consumers=43` for a block one file actually imports). Reusing the fixed form here, not the fixed count, because the count is STATE and expires at the next merge:

```bash
for b in $(curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(' '.join(i['name'] for i in d['items'] if i.get('type')=='registry:block'))"); do
  [ -f "components/ui/$b.tsx" ] || { echo "$b NOT_INSTALLED"; continue; }
  echo "$b installed consumers=$(git grep -l "components/ui/$b" -- components app src | grep -v "components/ui/$b.tsx" | wc -l)"
done
```

Output at the time this document was written (re-run the command above — this block is a pasted sample, not a claim):

```
message-bubble installed consumers=1
chat-conversation installed consumers=1
quick-reply installed consumers=1
option-list installed consumers=1
tag-select installed consumers=1
progress-steps installed consumers=1
status-badge installed consumers=1
table installed consumers=1
amount-input installed consumers=1
contact-form NOT_INSTALLED
issue-report-form NOT_INSTALLED
date-time-picker NOT_INSTALLED
ticket-tier-select NOT_INSTALLED
order-confirm NOT_INSTALLED
payment-confirmed NOT_INSTALLED
product-list NOT_INSTALLED
post-card NOT_INSTALLED
post-list NOT_INSTALLED
post-detail NOT_INSTALLED
x-post NOT_INSTALLED
instagram-post NOT_INSTALLED
linkedin-post NOT_INSTALLED
youtube-post NOT_INSTALLED
event-card NOT_INSTALLED
event-list NOT_INSTALLED
event-detail NOT_INSTALLED
event-confirmation NOT_INSTALLED
map-carousel NOT_INSTALLED
stat-card installed consumers=1
hero NOT_INSTALLED
```

10 installed (all with `consumers=1`, i.e. in service — none sitting at `consumers=0` on this branch), 20 not yet installed. That "10" and "20" are themselves derived, not typed:

```bash
for b in $(curl -sS https://www.mcpcn.dev/r/registry.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(' '.join(i['name'] for i in d['items'] if i.get('type')=='registry:block'))"); do
  [ -f "components/ui/$b.tsx" ] && echo installed || echo missing
done | sort | uniq -c
```
```
-> 10 installed
-> 20 missing
```

---

## 3. The mapping — one row per registry block, in `docs/mcpcn-block-mapping.md` §4 order

Column 2 ("What it does") is the one-sentence, non-technical summary already committed in that file's §4 — quoted, not reinvented. Column 3 is the `git grep` output above. Column 5 is the part unique to this document: the exact URL, click path, and gesture Laurent uses.

### Chat & agent surfaces

**message-bubble** — `components/ui/message-bubble.tsx`
- What it does: shows a chat message as a styled bubble instead of plain text.
- Consumer: `components/chat/MessageList.tsx` (import `@/components/ui/message-bubble`), consumers=1 (§2).
- State: in service — text messages only (image/voice variants exist in the file but are not imported anywhere, per §4's Batch 5 note).
- See it: `/dashboard/chat` -> open any conversation (or start one) -> send a text message -> it renders inside a rounded bubble, your message right-aligned, the agent's reply left-aligned.

**chat-conversation** — `components/ui/chat-conversation.tsx`
- What it does: the scrolling container that holds a whole conversation's messages.
- Consumer: `components/chat/MessageList.tsx` (import `@/components/ui/chat-conversation`), consumers=1.
- State: in service, for the dashboard chat shell. The second job in §4 (a VantagePeers thread view) has no route yet.
- See it: `/dashboard/chat` -> open any conversation -> the whole message list scrolls as one column inside this shell; the empty state (no messages yet) is deliberately hand-written, not this block (declared divergence, §4).

**quick-reply** — `components/ui/quick-reply.tsx`
- What it does: tap a button instead of typing, for a short list of expected replies.
- Consumer: `components/chat/MessageList.tsx` (import `@/components/ui/quick-reply`), consumers=1.
- State: in service.
- See it: `/dashboard/chat` -> open a conversation -> when the agent's last message can carry quick replies, a row of pill buttons appears under it -> tap one and it sends that exact label as your next message.

**option-list** — `components/ui/option-list.tsx`
- What it does: a checkbox-style list for choosing one or several options from a set (team, agent, skill).
- Consumer: `app/[locale]/dashboard/consultant/onboard/page.tsx` (import `@/components/ui/option-list`), consumers=1.
- State: in service.
- See it: `/dashboard/consultant/onboard` -> advance to the "team" step of the onboarding flow -> a list of selectable rows appears -> click a row and it highlights as selected.

**tag-select** — `components/ui/tag-select.tsx`
- What it does: colored tags you tap to select, for things like pain points or mission filters.
- Consumer: `components/missions/mission-filters.tsx` (import `@/components/ui/tag-select`), consumers=1.
- State: in service (missions filter — the consultant-onboarding pain-point use named in §4 is a separate, still-open job on that same block).
- See it: `/dashboard/missions` -> open the filter panel above the mission list -> the status/tag filters render as colored tags -> tap one and the mission list narrows to that tag.

**progress-steps** — `components/ui/progress-steps.tsx`
- What it does: a step indicator showing where you are in a multi-step flow.
- Consumer: `app/[locale]/dashboard/consultant/onboard/page.tsx` (import `@/components/ui/progress-steps`), consumers=1.
- State: in service.
- See it: `/dashboard/consultant/onboard` -> the top of the page shows a horizontal row of five steps (sector, pain points, team, agents, skills) -> the current step is visually distinct from the completed and upcoming ones -> advancing the flow moves the indicator by exactly one step.

**status-badge** — `components/ui/status-badge.tsx`
- What it does: a small colored pill showing a state (success, pending, error, etc.).
- Consumer: `components/chat/ToolCallIndicator.tsx` (import `@/components/ui/status-badge`), consumers=1.
- State: in service for the tool-call indicator only. The mission list (`components/missions/mission-list-view.tsx`) still renders its own hand-written `STATUS_BADGE_CLASSES` span (confirmed via `grep` — zero `StatusBadge` import there), so that surface is a separate, still-open job on this same block (§4 Batch 5).
- See it: `/dashboard/chat` -> open a conversation where the agent calls a tool (e.g. it searches or reads a file) -> a small pill appears next to the tool call showing its status (running/done/error).

**table** — `components/ui/table.tsx`
- What it does: an interactive, sortable, row-selectable table rendered inline in a chat message.
- Consumer: `components/chat/MessageList.tsx` (import `@/components/ui/table`), consumers=1.
- State: in service.
- See it: `/dashboard/chat` -> open a conversation where the agent's reply carries a `table` message part (e.g. "here are the candidate fixes, pick one") -> the table renders as real rows, not a markdown wall of text -> click a row to select it.

**amount-input** — `components/ui/amount-input.tsx`
- What it does: a numeric field with +/- buttons and quick preset amounts, for topping up credit balance.
- Consumer: `components/dashboard/account/tabs/UsageCreditsTab.tsx` (import `@/components/ui/amount-input`), consumers=1.
- State: in service.
- See it: `/dashboard/account?tab=usage` -> the Credit Balance card shows a row of preset amounts (e.g. $10/$25/$50) plus increment/decrement controls -> tap a preset and the displayed balance updates.

### Forms

**contact-form** — not present in `components/ui/`.
- What it does: name/phone/email/message/attachment lead-capture form for a public site.
- Consumers: none — not installed (§2).
- State: not yet built.
- See it: not yet visible.

**issue-report-form** — not present in `components/ui/`.
- What it does: a compact bug/incident report form with category, impact, urgency, attachments.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**date-time-picker** — not present in `components/ui/`.
- What it does: a Calendly-style slot picker for booking a call.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**ticket-tier-select** — not present in `components/ui/`.
- What it does: side-by-side plan comparison with seat quantity and price.
- Consumers: none — not installed.
- State: not yet built (`components/dashboard/account/modals/ManageSubscriptionModal.tsx` today renders its own plain plan cards, confirmed via `grep` — zero `ticket-tier-select` import anywhere in the repo, §2).
- See it: not yet visible.

### Commerce / confirmation

**order-confirm** — not present in `components/ui/`.
- What it does: post-purchase confirmation screen for a digital download.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**payment-confirmed** — not present in `components/ui/`.
- What it does: post-purchase confirmation screen with a tracking button, for a trackable deliverable.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**product-list** — not present in `components/ui/`.
- What it does: browse products/items in list, grid, carousel, or picker layout.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

### Content / blog

**post-card** — not present in `components/ui/`.
- What it does: a preview card for one blog/changelog post.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**post-list** — not present in `components/ui/`.
- What it does: the layout that arranges multiple post cards into a list.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**post-detail** — not present in `components/ui/`.
- What it does: the full single-post view with related posts.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

### Social embeds

**x-post** — not present in `components/ui/`.
- What it does: an embedded X/Twitter post card with engagement metrics.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**instagram-post** — not present in `components/ui/`.
- What it does: an embedded Instagram post preview card.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**linkedin-post** — not present in `components/ui/`.
- What it does: an embedded LinkedIn post preview card.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**youtube-post** — not present in `components/ui/`.
- What it does: an embedded YouTube video card with playback.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

### Events

**event-card** — not present in `components/ui/`.
- What it does: a preview card for one event/webinar listing.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**event-list** — not present in `components/ui/`.
- What it does: the layout arranging multiple event cards.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**event-detail** — not present in `components/ui/`.
- What it does: the single-event page with agenda and registration.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**event-confirmation** — not present in `components/ui/`.
- What it does: the confirmation screen shown after registering for an event.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

**map-carousel** — not present in `components/ui/`.
- What it does: an interactive map with markers paired to a swipeable card carousel.
- Consumers: none — not installed.
- State: not yet built.
- See it: not yet visible.

### Dashboards & metrics

**stat-card** — `components/ui/stat-card.tsx`
- What it does: scrollable stat cards showing values, trend arrows, and change indicators.
- Consumer: `components/missions/mission-stats.tsx` (import `@/components/ui/stat-card`), consumers=1.
- State: in service.
- See it: `/dashboard/missions` -> the row of stat cards at the top of the page (open missions, completed, blocked, etc.) -> each card shows a number with a trend arrow next to it.

### Marketing

**hero** — not present in `components/ui/`.
- What it does: the landing page's top section — logos, title, subtitle, call-to-action buttons.
- Consumers: none — not installed.
- State: not yet built (`components/landing/HeroSection.tsx` is still the hand-written 233-line version, per §4).
- See it: not yet visible.

---

## 4. The guard — reddens on a removed row, and on a false "in service" claim

Two independent checks, both scoped to **this file**, both proven bipolar below.

### Guard A — every registry block has a row (mirrors `mcpcn-block-mapping.md` §5, scoped here)

```bash
python3 -c "
import json,re,urllib.request
doc=open('docs/blocks-inventory.md').read()
mapping=doc.split('## 3. The mapping',1)[1].split(chr(10)+'## 4.',1)[0]
bold=set(re.findall(r'\*\*([a-z0-9-]+)\*\*', mapping))
d=json.load(urllib.request.urlopen('https://www.mcpcn.dev/r/registry.json'))
blocks=[i['name'] for i in d['items'] if i.get('type')=='registry:block']
missing=[b for b in blocks if b not in bold]
print(f'{len(blocks)-len(missing)}/{len(blocks)} blocks have a row')
print('MISSING:', missing if missing else 'none')
import sys; sys.exit(1 if missing else 0)"
```

### Guard B — no row claims "in service" without a consumer

Fails closed: a row it cannot read a consumer count from is never waved through. It is reported by name, in its own bucket, and it fails the run — same as a row caught with `consumers=0`. The earlier version of this guard had a silent `continue` for exactly that unparseable case; that hole is why it went green on `order-confirm` claiming "State: in service" over "Consumers: none — not installed" with no `consumers=N` token anywhere in the row. Fixed below.

```bash
python3 -c "
import re
doc=open('docs/blocks-inventory.md').read()
mapping=doc.split('## 3. The mapping',1)[1].split(chr(10)+'## 4.',1)[0]
entries=re.split(r'(?=^\*\*[a-z0-9-]+\*\* —)', mapping, flags=re.M)
bad_zero=[]
bad_unparsed=[]
for e in entries:
    m=re.match(r'^\*\*([a-z0-9-]+)\*\*', e)
    if not m: continue
    name=m.group(1)
    if 'State: in service' not in e: continue
    cm=re.search(r'consumers=(\d+)', e)
    if cm is None:
        bad_unparsed.append(name)
    elif cm.group(1) == '0':
        bad_zero.append(name)
print('BAD (in-service with consumers=0):', bad_zero if bad_zero else 'none')
print('UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row):', bad_unparsed if bad_unparsed else 'none')
import sys; sys.exit(1 if (bad_zero or bad_unparsed) else 0)"
```

### Proof, both directions, both guards

**Guard A — landing assertion, redden, restore.**

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak
grep -c '^\*\*stat-card\*\* —' docs/blocks-inventory.md          # before: 1
python3 - <<'EOF'
p="docs/blocks-inventory.md"
s=open(p).read()
s=s.replace("""**stat-card** — `components/ui/stat-card.tsx`
- What it does: scrollable stat cards showing values, trend arrows, and change indicators.
- Consumer: `components/missions/mission-stats.tsx` (import `@/components/ui/stat-card`), consumers=1.
- State: in service.
- See it: `/dashboard/missions` -> the row of stat cards at the top of the page (open missions, completed, blocked, etc.) -> each card shows a number with a trend arrow next to it.

""", "")
open(p,"w").write(s)
EOF
grep -c '^\*\*stat-card\*\* —' docs/blocks-inventory.md          # landed: 0
```
```
-> before: 1
-> landed: 0
```

Run Guard A:

```
-> 29/30 blocks have a row
-> MISSING: ['stat-card']
-> exit 1
```

Restore and prove:

```bash
cp /tmp/blocks-inventory.bak docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak docs/blocks-inventory.md          # empty
```
```
-> (empty diff)
```

Re-run Guard A clean:

```
-> 30/30 blocks have a row
-> MISSING: none
-> exit 0
```

**Guard B — landing assertion, redden, restore, on three rows named by an outside reviewer, not chosen by the guard's own author.** The prior bipolar proof only exercised `hero` mutated to carry `consumers=0` — a shape the matcher already knew how to catch. It never exercised the shape that actually broke the guard: a row whose consumer sentence has no `consumers=N` token at all (`Consumers: none — not installed`). All three mutations below reproduce exactly that shape.

*Mutation 1 — `order-confirm`, in-service declared, consumer sentence left untouched:*

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak3
grep -c '^\*\*order-confirm\*\* —' docs/blocks-inventory.md
sed -i '/^\*\*order-confirm\*\* —/,/^- See it:/ s/- State: not yet built\./- State: in service./' docs/blocks-inventory.md
grep -A4 '^\*\*order-confirm\*\*' docs/blocks-inventory.md
grep -A4 '^\*\*order-confirm\*\*' docs/blocks-inventory.md | grep -c 'State: in service'   # mutation landed?
```
```
-> before: 1
-> **order-confirm** — not present in `components/ui/`.
-> - What it does: post-purchase confirmation screen for a digital download.
-> - Consumers: none — not installed.
-> - State: in service.
-> - See it: not yet visible.
-> landed: 1
```

Old (broken) guard on this mutation — the false green this task exists to close:

```
-> BAD (in-service with consumers=0): none
-> exit 0        # WRONG — silently waved the row through
```

Fixed guard on the same mutation:

```
-> BAD (in-service with consumers=0): none
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): ['order-confirm']
-> exit 1
```

Restore and prove:

```bash
cp /tmp/blocks-inventory.bak3 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak3 docs/blocks-inventory.md   # empty
```
```
-> (empty diff)
```

*Mutation 2 — `ticket-tier-select`, same shape:*

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak4
grep -c '^\*\*ticket-tier-select\*\* —' docs/blocks-inventory.md
sed -i '/^\*\*ticket-tier-select\*\* —/,/^- See it:/ s/- State: not yet built (`components\/dashboard\/account\/modals\/ManageSubscriptionModal.tsx` today renders its own plain plan cards, confirmed via `grep` — zero `ticket-tier-select` import anywhere in the repo, §2)\./- State: in service./' docs/blocks-inventory.md
grep -A4 '^\*\*ticket-tier-select\*\*' docs/blocks-inventory.md | grep -c 'State: in service'   # mutation landed?
```
```
-> before: 1
-> landed: 1
```

Fixed guard:

```
-> BAD (in-service with consumers=0): none
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): ['ticket-tier-select']
-> exit 1
```

Restore and prove:

```bash
cp /tmp/blocks-inventory.bak4 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak4 docs/blocks-inventory.md   # empty
```
```
-> (empty diff)
```

*Mutation 3 — `date-time-picker`, same shape:*

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak5
grep -c '^\*\*date-time-picker\*\* —' docs/blocks-inventory.md
sed -i '/^\*\*date-time-picker\*\* —/,/^- See it:/ s/- State: not yet built\./- State: in service./' docs/blocks-inventory.md
grep -A4 '^\*\*date-time-picker\*\*' docs/blocks-inventory.md | grep -c 'State: in service'   # mutation landed?
```
```
-> before: 1
-> landed: 1
```

Fixed guard:

```
-> BAD (in-service with consumers=0): none
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): ['date-time-picker']
-> exit 1
```

Restore and prove:

```bash
cp /tmp/blocks-inventory.bak5 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak5 docs/blocks-inventory.md   # empty
```
```
-> (empty diff)
```

**Guard A reviewed for the same class of hole.** Guard A has no `continue`/silent-pass branch: for every registry block name it is a binary test (`b not in bold`), so there is no third path that defaults to "checked, presumably fine" the way Guard B's old `continue` did. No fix required there; re-verified clean below.

Run Guard A on the intact, restored document:

```
-> 30/30 blocks have a row
-> MISSING: none
-> exit 0
```

Run the fixed Guard B on the intact, restored document:

```
-> BAD (in-service with consumers=0): none
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): none
-> exit 0
```

Both guards pass clean on the intact document, redden by name on every injected defect (including the three foreign-material mutations above, none of which were shapes Guard B's original author selected), and every mutation is restored with an empty diff.

---

## Reference

- Committed purpose per block, and the derivation history that fixed the counting command: `docs/mcpcn-block-mapping.md` §3, §4, §5.
- Governing rule: `.claude/rules/derive-never-type.md`.
- Component source: `components/ui/`.

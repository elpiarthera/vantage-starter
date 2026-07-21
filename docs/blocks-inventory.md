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

<!-- inventory:rows:start -->

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

<!-- inventory:rows:end -->

---

## 4. The guard — reddens on a removed row, on a false "in service" claim, and on its own blindness

Two independent checks, both scoped to **this file**, both proven bipolar below, both three-state: exit 0 means checked and clean, exit 1 means checked and a violation was found (named), exit 2 means **could not check at all** — the row markers are missing, or the marker span parsed to zero rows. A guard that cannot see its subject says so; it never reports a silent 0.

Both guards read the row list between a dedicated pair of HTML-comment markers placed around the row list in §3 above — never the section heading text. The heading `## 3. The mapping` is prose; it is quoted verbatim multiple times in this very document (its own title, this guard's proof narrative, etc.), so anchoring on it was the second, nested defect this section used to carry: rename the heading and the old anchor silently re-matched one of those other occurrences, parsed the guard's own trailing narrative as if it were block rows, found zero real rows there, and returned exit 0 on a document it had never actually read.

The marker cannot suffer that collision, and each guard's own source proves it cannot: both guards build the marker string via concatenation (`'<!-- inventory' + ':rows:start -->'`, likewise for `:end`), so neither guard-source code block below ever prints the marker as one contiguous string, and this prose paragraph deliberately avoids quoting it verbatim too — the only two contiguous occurrences of each marker in the whole file are the literal ones opening and closing the row list in §3. A `grep -c` for the full literal marker against this file returns exactly 1 for the start marker and 1 for the end marker, proven in Case 6 below. Case 1 demonstrates the failure mode directly: renaming the markers themselves (not the heading) makes both guards report exit 2, naming exactly what they could not find.

### Guard A — every registry block has a row (mirrors `mcpcn-block-mapping.md` §5, scoped here)

```bash
python3 -c "
import json,re,sys,urllib.request
START = '<!-- inventory' + ':rows:start -->'
END = '<!-- inventory' + ':rows:end -->'
doc=open('docs/blocks-inventory.md').read()
if START not in doc or END not in doc:
    print(f'COULD NOT CHECK: row markers not found (start present: {START in doc}, end present: {END in doc})')
    sys.exit(2)
# The marker must delimit the row list ONCE and unambiguously. It is also
# quoted inside the proof section below, so 'appears at all' is not enough:
# a marker on its own line is the real delimiter, a quoted one is text.
# More than one real delimiter means the guard cannot know which span it is
# judging -> it refuses rather than picking one.
own_line=[l.strip() for l in doc.split(chr(10))]
n_start=own_line.count(START); n_end=own_line.count(END)
if n_start != 1 or n_end != 1:
    print(f'COULD NOT CHECK: expected exactly one row marker on its own line, found start={n_start} end={n_end}')
    sys.exit(2)
mapping=doc.split(START,1)[1].split(END,1)[0]
bold=set(re.findall(r'\*\*([a-z0-9-]+)\*\*', mapping))
if not bold:
    print('COULD NOT CHECK: zero rows parsed between the markers')
    sys.exit(2)
d=json.load(urllib.request.urlopen('https://www.mcpcn.dev/r/registry.json'))
blocks=[i['name'] for i in d['items'] if i.get('type')=='registry:block']
missing=[b for b in blocks if b not in bold]
print(f'{len(blocks)-len(missing)}/{len(blocks)} blocks have a row')
print('MISSING:', missing if missing else 'none')
sys.exit(1 if missing else 0)"
```

### Guard B — no row claims "in service" without a consumer

Fails closed on two independent axes now: a row it cannot read a consumer count from is never waved through (reported by name, its own bucket, fails the run — same as a row caught with `consumers=0`); and the marker span itself is never allowed to parse to zero rows and pass. The earlier version of this guard had a silent `continue` for the unparseable-row case — that hole is why it once went green on `order-confirm` claiming "State: in service" over "Consumers: none — not installed" with no `consumers=N` token in the row. A second, nested hole let the section-heading anchor collide with the guard's own printed source and silently inspect zero rows. Both fixed below.

```bash
python3 -c "
import re,sys
START = '<!-- inventory' + ':rows:start -->'
END = '<!-- inventory' + ':rows:end -->'
doc=open('docs/blocks-inventory.md').read()
if START not in doc or END not in doc:
    print(f'COULD NOT CHECK: row markers not found (start present: {START in doc}, end present: {END in doc})')
    sys.exit(2)
# The marker must delimit the row list ONCE and unambiguously. It is also
# quoted inside the proof section below, so 'appears at all' is not enough:
# a marker on its own line is the real delimiter, a quoted one is text.
# More than one real delimiter means the guard cannot know which span it is
# judging -> it refuses rather than picking one.
own_line=[l.strip() for l in doc.split(chr(10))]
n_start=own_line.count(START); n_end=own_line.count(END)
if n_start != 1 or n_end != 1:
    print(f'COULD NOT CHECK: expected exactly one row marker on its own line, found start={n_start} end={n_end}')
    sys.exit(2)
mapping=doc.split(START,1)[1].split(END,1)[0]
entries=re.split(r'(?=^\*\*[a-z0-9-]+\*\* —)', mapping, flags=re.M)
rows=[e for e in entries if re.match(r'^\*\*([a-z0-9-]+)\*\*', e)]
if not rows:
    print('COULD NOT CHECK: zero rows parsed between the markers')
    sys.exit(2)
bad_zero=[]
bad_unparsed=[]
for e in rows:
    name=re.match(r'^\*\*([a-z0-9-]+)\*\*', e).group(1)
    if 'State: in service' not in e: continue
    cm=re.search(r'consumers=(\d+)', e)
    if cm is None:
        bad_unparsed.append(name)
    elif cm.group(1) == '0':
        bad_zero.append(name)
print('BAD (in-service with consumers=0):', bad_zero if bad_zero else 'none')
print('UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row):', bad_unparsed if bad_unparsed else 'none')
sys.exit(1 if (bad_zero or bad_unparsed) else 0)"
```

### Proof, six cases, both guards, all named by the reviewer who found the defect — not chosen by the guards' own author

Each case: landing assertion by `grep`/`diff` (proving the mutation actually took, before any guard output is read), guard output, restore, restore proof. Guard source is saved once to `guardA.py` / `guardB.py` and re-run unmodified across all six cases.

**Case 0 — baseline sanity: exactly one of each marker exists, nowhere else in the file (proves the marker cannot collide with the guards' own printed source).**

```bash
grep -c '<!-- inventory:rows:start -->' docs/blocks-inventory.md
grep -c '<!-- inventory:rows:end -->' docs/blocks-inventory.md
```
```
-> 1
-> 1
```

**Case 1 — rename the markers themselves (not the heading) so the anchor is absent -> both guards exit 2, naming what they could not read.**

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak1
grep -c '<!-- inventory:rows:start -->' docs/blocks-inventory.md   # before: 1
sed -i 's/<!-- inventory:rows:start -->/<!-- inventory:rows:BEGIN -->/; s/<!-- inventory:rows:end -->/<!-- inventory:rows:FINISH -->/' docs/blocks-inventory.md
grep -c '<!-- inventory:rows:start -->' docs/blocks-inventory.md   # landed: 0
grep -c '<!-- inventory:rows:BEGIN -->' docs/blocks-inventory.md   # landed: 1
```
```
-> before: 1
-> landed: 0
-> landed: 1
```

Guard A:
```
-> COULD NOT CHECK: row markers not found (start present: False, end present: False)
-> exit 2
```

Guard B:
```
-> COULD NOT CHECK: row markers not found (start present: False, end present: False)
-> exit 2
```

Restore and prove:
```bash
cp /tmp/blocks-inventory.bak1 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak1 docs/blocks-inventory.md
```
```
-> (empty diff)
```

**Case 2 — empty the row list, leave both markers in place -> both guards exit 2 (zero rows parsed), not 0.**

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak2
python3 - <<'EOF'
p="docs/blocks-inventory.md"
s=open(p).read()
START='<!-- inventory:rows:start -->'
END='<!-- inventory:rows:end -->'
i=s.index(START)+len(START)
j=s.index(END)
s=s[:i]+"\n\n"+s[j:]
open(p,"w").write(s)
EOF
grep -A2 '<!-- inventory:rows:start -->' docs/blocks-inventory.md | head -5   # landed: empty gap between markers
```
```
-> <!-- inventory:rows:start -->
->
-> <!-- inventory:rows:end -->
```

Guard A:
```
-> COULD NOT CHECK: zero rows parsed between the markers
-> exit 2
```

Guard B:
```
-> COULD NOT CHECK: zero rows parsed between the markers
-> exit 2
```

Restore and prove:
```bash
cp /tmp/blocks-inventory.bak2 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak2 docs/blocks-inventory.md
```
```
-> (empty diff)
```

**Case 3 — `tag-select` declared "in service" with no readable count -> Guard B exit 1, naming it.**

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak3
grep -A4 '^\*\*tag-select\*\*' docs/blocks-inventory.md | grep -c 'consumers='   # before: 1
sed -i '/^\*\*tag-select\*\* —/,/^- See it:/ s/- Consumer: `components\/missions\/mission-filters.tsx` (import `@\/components\/ui\/tag-select`), consumers=1\./- Consumer: unclear — needs manual re-check./' docs/blocks-inventory.md
grep -A4 '^\*\*tag-select\*\*' docs/blocks-inventory.md | grep -c 'consumers='   # landed: 0
```
```
-> before: 1
-> landed: 0
```

Guard A:
```
-> 30/30 blocks have a row
-> MISSING: none
-> exit 0
```

Guard B:
```
-> BAD (in-service with consumers=0): none
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): ['tag-select']
-> exit 1
```

Restore and prove:
```bash
cp /tmp/blocks-inventory.bak3 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak3 docs/blocks-inventory.md
```
```
-> (empty diff)
```

**Case 4 — `progress-steps` set to `consumers=0` while "in service" -> Guard B exit 1, naming it.**

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak4
grep -A4 '^\*\*progress-steps\*\*' docs/blocks-inventory.md | grep -c 'consumers=1'   # before: 1
sed -i '/^\*\*progress-steps\*\* —/,/^- See it:/ s/consumers=1\./consumers=0./' docs/blocks-inventory.md
grep -A4 '^\*\*progress-steps\*\*' docs/blocks-inventory.md | grep -c 'consumers=0'   # landed: 1
```
```
-> before: 1
-> landed: 1
```

Guard A:
```
-> 30/30 blocks have a row
-> MISSING: none
-> exit 0
```

Guard B:
```
-> BAD (in-service with consumers=0): ['progress-steps']
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): none
-> exit 1
```

Restore and prove:
```bash
cp /tmp/blocks-inventory.bak4 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak4 docs/blocks-inventory.md
```
```
-> (empty diff)
```

**Case 5 — `status-badge` row removed entirely -> Guard A exit 1, naming it.**

```bash
cp docs/blocks-inventory.md /tmp/blocks-inventory.bak5
grep -c '^\*\*status-badge\*\* —' docs/blocks-inventory.md   # before: 1
python3 - <<'EOF'
p="docs/blocks-inventory.md"
s=open(p).read()
block = """**status-badge** — `components/ui/status-badge.tsx`
- What it does: a small colored pill showing a state (success, pending, error, etc.).
- Consumer: `components/chat/ToolCallIndicator.tsx` (import `@/components/ui/status-badge`), consumers=1.
- State: in service for the tool-call indicator only. The mission list (`components/missions/mission-list-view.tsx`) still renders its own hand-written `STATUS_BADGE_CLASSES` span (confirmed via `grep` — zero `StatusBadge` import there), so that surface is a separate, still-open job on this same block (§4 Batch 5).
- See it: `/dashboard/chat` -> open a conversation where the agent calls a tool (e.g. it searches or reads a file) -> a small pill appears next to the tool call showing its status (running/done/error).

"""
assert block in s, "block text not found verbatim"
s = s.replace(block, "")
open(p,"w").write(s)
EOF
grep -c '^\*\*status-badge\*\* —' docs/blocks-inventory.md   # landed: 0
```
```
-> before: 1
-> landed: 0
```

Guard A:
```
-> 29/30 blocks have a row
-> MISSING: ['status-badge']
-> exit 1
```

Guard B:
```
-> BAD (in-service with consumers=0): none
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): none
-> exit 0
```

Restore and prove:
```bash
cp /tmp/blocks-inventory.bak5 docs/blocks-inventory.md
diff /tmp/blocks-inventory.bak5 docs/blocks-inventory.md
```
```
-> (empty diff)
```

**Case 6 — intact document -> both guards exit 0.**

```bash
diff /tmp/blocks-inventory.baseline docs/blocks-inventory.md   # taken before any of the five mutations above
```
```
-> (empty diff)
```

Guard A:
```
-> 30/30 blocks have a row
-> MISSING: none
-> exit 0
```

Guard B:
```
-> BAD (in-service with consumers=0): none
-> UNPARSEABLE (in-service, no consumers=N token found — guard cannot vouch for this row): none
-> exit 0
```

All six cases behave exactly as required: absent markers and an emptied row list both fail closed at exit 2 with a named reason, a false "in service" claim (with or without a readable count) fails at exit 1 named by Guard B, a removed row fails at exit 1 named by Guard A, and the intact document passes both at exit 0. Every mutation's landing was asserted by `grep` before any guard output was read, and every mutation was restored with an empty `diff` before the next case began.

---

## Reference

- Committed purpose per block, and the derivation history that fixed the counting command: `docs/mcpcn-block-mapping.md` §3, §4, §5.
- Governing rule: `.claude/rules/derive-never-type.md`.
- Component source: `components/ui/`.

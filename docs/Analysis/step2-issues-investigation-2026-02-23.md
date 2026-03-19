# Step 2 Issues Investigation Report
**Date:** February 23, 2026  
**Project ID:** `k57f7z0hnrd2v7c64p2hezq1n18046cg`  
**Environment:** Development  
**Investigator:** AI Assistant

---

## Executive Summary

Investigation of three critical issues in the Guided Story Creation Flow (Step 1 & Step 2):

1. **"Broken Answer" after Story Refinement** - AI returned malformed JSON instead of markdown
2. **Duplicate Responses on "Start Over"** - UI shows 2 assistant messages instead of 1
3. **"Regenerate Story" Not Working** - Step 1 returns cached story instead of regenerating

---

## Issue 1: Broken Answer - Malformed JSON Response

### What Happened
When the user refined the story in Step 2, the AI returned a **raw JSON structure** instead of formatted markdown narrative. The response was incomplete and cut off mid-sentence.

### Evidence from Convex Data
From `chatMessages` table, message ID `jh72tw2g941hsk6khzn0cz00kx81qpyc` (created at `1771852024066`):

```json
{
  "content": "**Laurent & Laurence Template**\n\n{\n  \"title\": \"Under the Eiffel Light — Laurent & Laurence\",\n  \"narration\": \"On a balmy July 14th beneath the Eiffel Tower, Laurent caught sight of Laurence and everything shifted. A single hello became a globe-spanning conversation: cobbled streets in Lisbon, dawns on faraway beaches, laughter in tiny train stations. Together they learned each other's maps and stubbornness and small kindnesses. Today they stand where it began, hands intertwined, inviting you to witness the promise they've written across continents. Celebrate with them as two travelers become a home, and love finds its constant place.\",\n  \"emotionalArc\": \"Hook: a magical first sight under the Eiffel Tower; Core: intimate montage of shared travels and growing bond; Conclusion: return to the original promise—public celebration and settled joy under the same lights.\",\n  \"scenes\": [\n    {\n      \"number\": 1,\n      \"description\": \"Night at the Eiffel Tower on July 14th: shimmering lights, soft fireworks bokeh, a close-up of Laurent spotting Laurence across the crowd—her smile framed\n\n**Emotional Arc:** A wedding story for wedding\n\n\n\n**Music Suggestion:** Emotional background music\n\n---\n*This story was generated based on your inputs in Step 1. Feel free to refine it by chatting with me!*",
  "role": "assistant",
  "step": 2
}
```

### Root Cause Analysis

**The AI used the WRONG PROMPT for conversational refinement:**

The `/api/chat` route (Step 2) uses **`AI_DIRECTOR_PROMPT`** which is configured for **conversational markdown output**, but the AI model sometimes returns JSON structure when asked to "generate a completely fresh story concept."

**File:** `/app/api/chat/route.ts`  
**Line 79-86:** Uses `AI_DIRECTOR_PROMPT.content` which expects markdown formatting

**File:** `/lib/ai/prompts/chat/ai-director.prompt.ts`  
**Expected Output Format:** Markdown with scene descriptions, NOT JSON

### Why This Matters

1. **`parseAndUpdateRefinedStory` mutation expects markdown**, not JSON
2. The regex pattern in `convex/projects.ts` (line 859) is:
   ```javascript
   const sceneRegex = /\*\*Scene (\d+):\*\* ([^*]+?)(?=\*\*Scene|(?:\s+\*\*\s*Music|$))/g;
   ```
   This will **FAIL** to extract scenes from JSON format, resulting in **empty `scenes` array**.

### Current State in Convex

For project `k57f7z0hnrd2v7c64p2hezq1n18046cg`:

```json
{
  "generatedStory": {
    "emotionalArc": "A wedding story for wedding",
    "generatedAt": 1771852890459,
    "musicSuggestion": "Emotional background music",
    "narration": "{\n  \"title\": \"Laurent & Laurence: Under the Eiffel Lights\",\n  \"narration\": \"On a sparkling July 14th beneath the Eiffel Tower, Laurent and Laurence's laughter collided and a quiet spark became a promise. They set off hand in hand—markets in Marrakech, sunrise on distant shores, late-night maps and shared passports—discovering the world and one another. Today they come home to the place that started it all, under the same lights that watched them begin. Join us as we celebrate their journey, their vows, and the lifetime of small adventures still waiting around the corner.\",\n  \"emotionalArc\": \"Begins with a magical, fateful meeting; moves into the intimate, adventurous heart of their shared life; concludes with a homecoming wedding that honors that origin and looks forward with joy.\",\n  \"scenes\": [\n    {\n      \"number\": 1,\n      \"description\": \"Twinkling night under the Eiffel Tower on July 14th: close-up of their hands brushing, a shared laugh, and the Tower's lights framing their first spark.\",\n      \"mood\": \"enchanted, hopeful\"\n    },\n    {\n      \"number\": 2,\n      \"description\": \"A warm montage: bustling Marrakech stalls, sunrise over a beach",
    "scenes": [],
    "title": "Laurent & Laurence Template"
  }
}
```

**Critical:** `scenes` array is **EMPTY** because the narration field contains malformed JSON that was never properly parsed.

---

## Issue 2: Duplicate Responses on "Start Over"

### What Happened
When the user clicked "Start Over with a New Idea" in Step 2, the UI displayed **TWO assistant messages**:
1. First message: "Feel free to ask for more adjustments!" (from previous conversation)
2. Second message: A completely new story about a birthday invitation

### Evidence from Screenshots
- **Screenshot 1:** Shows the broken JSON response
- **Screenshot 2:** Shows the duplicate messages after "Start Over"

### Root Cause Analysis

**Location:** `/app/[locale]/guided/step-2/page.tsx`  
**Function:** `startOverWithNewIdea()` (lines 373-417)

**The Issue:**
The "Start Over" function sends a NEW user message to `/api/chat`, but:
1. **It does NOT clear existing chat messages in the UI**
2. **It does NOT reset the `messages` state before making the API call**
3. **The previous assistant message remains visible**

**Code Evidence (lines 389-403):**
```javascript
const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        messages: [
            {
                role: "user",
                content: "Generate a completely fresh story concept with a different creative approach. Use a different tone, structure, or storytelling angle than before.",
            },
        ],
        projectId,
        projectName: project?.name,
    }),
});
```

**The Problem:**
- The `messages` array sent to the API contains ONLY the new user message
- BUT the UI state (`messages` from `useChat`) is NOT cleared
- So when the NEW assistant response streams in, it APPENDS to the existing messages
- Result: User sees BOTH the old conversation AND the new response

### Expected vs Actual Behavior

| Expected | Actual |
|----------|--------|
| UI shows only the new story | UI shows old message + new story |
| `messages` state is cleared | `messages` state retains old data |
| Clean slate for new conversation | Confusing duplicate content |

---

## Issue 3: "Regenerate Story" Not Working in Step 1

### What Happened
When the user returns to Step 1 and clicks "Regenerate Story" button, the system returns the **cached story** instead of generating a fresh one.

### Root Cause Analysis

**Location:** `/app/api/step1/generate-story/route.ts`  
**Lines 54-71:** Cache check logic

```typescript
const existingProject = await fetchQuery(api.projects.get, {
    projectId: projectId as Id<"projects">,
});

if (existingProject?.generatedStory) {
    // Story already exists - return it without charging credits
    console.log("[Generate Story] Returning existing story (no credits charged)");
    return new Response(
        JSON.stringify({
            story: existingProject.generatedStory,
            fromCache: true,
            creditsUsed: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
    );
}
```

**The Problem:**
- Line 58: `if (existingProject?.generatedStory)` **ALWAYS returns cached story** if one exists
- There is **NO `force` or `regenerate` parameter** to bypass the cache
- The "Regenerate Story" button in the UI likely does NOT pass any flag to indicate regeneration is desired

### Why This Was Implemented
This cache check was likely added to:
1. **Prevent duplicate credit charges** for the same story generation
2. **Optimize performance** by returning existing stories quickly
3. **Avoid accidental regenerations**

### But It Breaks User Intent
When a user explicitly clicks "Regenerate Story", they WANT a new story, even if it costs credits again.

---

## Cross-Cutting Issues

### Prompt System Confusion

**Two Different Prompts for Story Generation:**

1. **`STORY_GENERATION_PROMPT`** (Step 1: `/lib/ai/prompts/step1/story-generation.prompt.ts`)
   - Used in: `/app/api/step1/generate-story/route.ts`
   - Output Format: **Structured JSON**
   - Purpose: Initial story creation with scenes array

2. **`AI_DIRECTOR_PROMPT`** (Step 2: `/lib/ai/prompts/chat/ai-director.prompt.ts`)
   - Used in: `/app/api/chat/route.ts`
   - Output Format: **Conversational Markdown**
   - Purpose: Refinement and iteration on existing story

**The Conflict:**
When "Start Over with a New Idea" is triggered in Step 2, it uses `AI_DIRECTOR_PROMPT` (conversational), but the user's intent is to generate a **completely new story** (which should use `STORY_GENERATION_PROMPT` for structured JSON).

### Model Consistency
- Both prompts now correctly use **`gpt-5-mini`** (updated in recent changes)
- Pricing is configured as: **$0.00025/1K input, $0.002/1K output**

---

## Recommendations

### Priority 1: Fix Broken JSON Response

**Option A: Improve `parseAndUpdateRefinedStory` Robustness**
- Add JSON parsing logic in addition to markdown regex
- Detect format and parse accordingly
- Handle incomplete/truncated responses gracefully

**Option B: Enforce Markdown Output in AI_DIRECTOR_PROMPT**
- Update the prompt to EXPLICITLY forbid JSON output
- Add few-shot examples showing expected markdown format
- Consider using structured output constraints if the model supports it

### Priority 2: Fix "Start Over" Duplicate Messages

**Solution: Clear Chat State Before New Conversation**

In `/app/[locale]/guided/step-2/page.tsx`, function `startOverWithNewIdea()`:

1. **Clear the `messages` state before making the API call**
2. **Option:** Delete existing chat messages for this project from Convex
3. **Or:** Add a `reset` flag to the useChat hook to clear UI state

### Priority 3: Add `force` Parameter for Regeneration

**Solution: Bypass Cache When User Explicitly Requests Regeneration**

In `/app/api/step1/generate-story/route.ts`:

1. Accept a new query parameter: `?force=true`
2. Modify line 58 logic:
   ```typescript
   if (existingProject?.generatedStory && !forceRegenerate) {
       // return cached story
   }
   ```
3. Update the frontend "Regenerate Story" button to pass `force=true`

---

## Data Integrity Status

### Project State: `k57f7z0hnrd2v7c64p2hezq1n18046cg`

| Field | Status | Notes |
|-------|--------|-------|
| `generatedStory.title` | ✅ Valid | "Laurent & Laurence Template" |
| `generatedStory.narration` | ⚠️ Malformed | Contains raw JSON instead of clean text |
| `generatedStory.scenes` | ❌ EMPTY | `[]` - Critical issue for Step 3 |
| `generatedStory.emotionalArc` | ⚠️ Generic | "A wedding story for wedding" (low quality) |
| `generatedStory.musicSuggestion` | ⚠️ Generic | "Emotional background music" |
| `approvedMessageId` | ✅ Valid | Points to message `jh7f34eqvzse1tbd1d7tg4cw1d81ar9d` |

### Chat Messages Summary

| Message ID | Role | Step | Issue |
|------------|------|------|-------|
| `jh72tw2g941hsk6khzn0cz00kx81qpyc` | assistant | 2 | ❌ Broken JSON response |
| `jh7f34eqvzse1tbd1d7tg4cw1d81ar9d` | assistant | 2 | ✅ Valid markdown (this was previously approved) |

---

## Impact Assessment

### User Experience Impact: HIGH
- Step 3 will show empty/incorrect scene descriptions
- Confusion from duplicate messages
- Inability to regenerate stories when desired

### Data Integrity Impact: MEDIUM
- `generatedStory` object is in inconsistent state
- Empty `scenes` array blocks video generation pipeline
- Manual data cleanup may be required

### Credit System Impact: LOW
- Cache mechanism prevents unnecessary charges (good)
- But blocks intentional regenerations (bad)

---

## Testing Checklist

Before considering this issue resolved, verify:

- [ ] Step 2 refinement produces valid markdown (not JSON)
- [ ] `parseAndUpdateRefinedStory` successfully extracts scenes from markdown
- [ ] "Start Over" clears previous messages and shows only new conversation
- [ ] Step 1 "Regenerate Story" bypasses cache and generates new story
- [ ] Both prompts consistently use `gpt-5-mini` model
- [ ] No credits are deducted when returning cached stories
- [ ] Credits ARE deducted when forcing regeneration

---

## Additional Observations

### Comparison with Working Project

**Working Project:** `k57a2cc99b27dexcmgdzbfbrhn805x9g`

```json
{
  "generatedStory": {
    "title": "Laurent & Laurence: Love Under the Lights",
    "narration": "Under the glittering Eiffel Tower on a magical July 14th...",
    "scenes": [
      {
        "description": "Laurent and Laurence meeting under the illuminated Eiffel Tower at night.",
        "mood": "Magical and romantic",
        "number": 1
      },
      // 2 more scenes...
    ],
    "emotionalArc": "From a magical beginning, through a journey of love, to a heartfelt celebration",
    "musicSuggestion": "Romantic and uplifting instrumental"
  }
}
```

**Key Differences:**
- ✅ `scenes` array is populated with 3 valid scenes
- ✅ `narration` is clean text (not JSON)
- ✅ High-quality, specific `emotionalArc` and `musicSuggestion`

---

## Conclusion

The investigation reveals **three interconnected issues** stemming from:

1. **Prompt ambiguity** - AI_DIRECTOR_PROMPT sometimes returns JSON instead of markdown
2. **Missing state management** - UI doesn't clear chat history on "Start Over"
3. **Over-aggressive caching** - No way to force story regeneration

All three issues are **fixable** without major architectural changes, but require careful coordination between frontend state management, API route logic, and AI prompt engineering.

**Estimated Fix Complexity:** Medium  
**Estimated Time to Resolve:** 4-6 hours (including testing)

---

**End of Report**

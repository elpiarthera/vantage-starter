# 🎙️ Sprint 18: Fix Narration Generation Flow

**Date**: December 23, 2025  
**Status**: ✅ **COMPLETED**  
**Priority**: P0 - Critical for Production  
**Estimated Time**: 4-5 hours  
**Actual Time**: ~2 hours  
**Dependencies**: Sprint 7 (Audio Generation) ✅

---

## 🐛 Problem Summary

The narration generation flow is broken in multiple ways:

| Issue | Description | Impact |
|-------|-------------|--------|
| **Markdown in Output** | AI generates narration with `**bold**`, headers, meta-comments | TTS speaks "asterisk asterisk" literally |
| **Hardcoded Template** | Initial narration uses markdown template, not clean text | User sees formatted text, not speakable text |
| **No Direct Editing** | User can only chat with AI, not directly edit text | Frustrating UX, no control |
| **Hidden Cleaning** | `cleanNarrationScript()` runs silently in Step 4 | User doesn't see what will be spoken |
| **Context Not Used** | AI doesn't leverage full project context | Generic, non-impactful narration |

---

## 🎯 Goals

1. **Clean Output**: AI generates plain text narration (no markdown, no meta-comments)
2. **Rich Context**: Use ALL project data to generate impactful, personalized narration
3. **User Control**: Allow direct editing of narration text
4. **Transparency**: Show exactly what will be sent to TTS
5. **Validation**: User confirms final text before TTS generation

---

## 📊 Available Project Context

The narration generator should leverage ALL of this data:

### From Step 1 (Project Setup)
```typescript
project.occasion          // "Wedding", "Birthday", etc.
project.theme             // "Romantic Elegance", "Joyful Celebration", etc.
project.language          // "English", "French", etc.
project.eventDetails: {
  eventTitle: string      // "Sarah & Michael's Wedding"
  date: string            // "June 15, 2024"
  time: string            // "4:00 PM"
  location: string        // "Sunset Gardens, 123 Rose Avenue"
  hostName: string        // "The Smith Family"
  emotionalStory: string  // User's personal story/context
  guestOfHonor: string    // Person being celebrated
  rsvpDeadline: string    // RSVP by date
  rsvpContact: string     // Contact info
  dressCode: string       // "Black Tie", "Casual", etc.
  specialInstructions: string
}
```

### From Step 2 (Story Generation)
```typescript
project.generatedStory: {
  narration: string       // Full narrative text
  emotionalArc: string    // "joyful journey", "heartfelt tribute", etc.
  scenes: Array<{
    title: string
    description: string
    visualElements: string[]
    mood: string
    duration: number
  }>
}
```

### From Step 3 (Scene Creation)
```typescript
scenes[]: {
  sceneNumber: number
  title: string
  description: string     // Detailed scene description
  duration: number        // Scene duration in seconds
  visualStyle: string     // "Cinematic", "Documentary", etc.
  prompt: string          // Image generation prompt
}
```

---

## 🛠️ Implementation Tasks

---

### Task 18.1: Update Narration Prompt for Clean Output (P0)

**File**: `lib/ai/prompts/audio/narration-script.prompt.ts`

**Objective**: Rewrite prompt to:
1. Explicitly forbid markdown formatting
2. Explicitly forbid meta-comments
3. Use ALL available project context
4. Generate plain spoken text only

**Current Prompt Issues**:
```typescript
// Current (weak instruction)
`Do NOT add any disclaimers. Return ONLY the narration content.`
```

**New Prompt Structure**:

```typescript
export interface NarrationScriptContext {
  // Event Details (Step 1)
  occasion: string;
  theme: string;
  language: string;
  languageCode?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  hostName?: string;
  guestOfHonor?: string;
  emotionalStory?: string;
  dressCode?: string;
  rsvpDeadline?: string;
  
  // Story Context (Step 2)
  storyNarration?: string;
  emotionalArc?: string;
  
  // Scenes (Step 3)
  scenes: Array<{
    number: number;
    title: string;
    description: string;
    mood?: string;
    duration: number;
  }>;
  
  totalDuration: number;
  userMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export const NARRATION_SCRIPT_PROMPT = {
  buildPrompt(context: NarrationScriptContext): string {
    const langCode = context.languageCode || "en";
    const coefficient = LANGUAGE_COEFFICIENTS[langCode] || 1.0;
    const targetWords = getTargetWordCount(langCode, context.totalDuration);

    // Build rich context section
    const eventContext = [
      context.eventTitle && `Event: ${context.eventTitle}`,
      context.eventDate && `Date: ${context.eventDate}`,
      context.eventTime && `Time: ${context.eventTime}`,
      context.eventLocation && `Location: ${context.eventLocation}`,
      context.hostName && `Hosted by: ${context.hostName}`,
      context.guestOfHonor && `Celebrating: ${context.guestOfHonor}`,
      context.dressCode && `Dress code: ${context.dressCode}`,
      context.rsvpDeadline && `RSVP by: ${context.rsvpDeadline}`,
    ].filter(Boolean).join("\n");

    const sceneDescriptions = context.scenes
      .map((s) => `Scene ${s.number} (${s.duration}s): ${s.description}`)
      .join("\n");

    return `You are writing a voiceover narration for a video invitation.

**OUTPUT FORMAT RULES (CRITICAL)**:
- Write ONLY the spoken words - no formatting, no headers, no quotes
- Do NOT use markdown (no asterisks, no bold, no italic)
- Do NOT use section headers like "Opening" or "Scene 1:"
- Do NOT include timing markers in the output like "(10 seconds)"
- Do NOT add any explanation, commentary, or meta-text
- Do NOT wrap text in quotation marks
- Use natural sentence flow with appropriate pauses (use <#0.5#> for pauses)

**LANGUAGE**: Write in ${context.language}
**OCCASION**: ${context.occasion}
**THEME**: ${context.theme}
**TOTAL DURATION**: ${context.totalDuration} seconds
**TARGET WORD COUNT**: ~${targetWords} words (adjusted for ${context.language})

**EVENT DETAILS**:
${eventContext || "Not provided - create generic welcoming text"}

**EMOTIONAL CONTEXT**:
${context.emotionalStory || "Create a warm, welcoming tone"}

**STORY ARC**:
${context.emotionalArc || "Build from welcome to celebration to call-to-action"}

**SCENES TO NARRATE**:
${sceneDescriptions}

**EXAMPLE OF CORRECT OUTPUT**:
Welcome to Sarah and Michael's wedding celebration! <#0.5#> Join us for a magical evening filled with love, laughter, and unforgettable memories. <#0.5#> Your presence would make our special day even more beautiful. <#0.3#> Saturday, June fifteenth, two thousand twenty-four, at four PM. <#0.5#> Sunset Gardens, one twenty-three Rose Avenue, Romantic City. <#0.5#> We can't wait to celebrate with you! <#0.3#> Please RSVP by May first. <#0.5#> Let's create beautiful memories together on our wedding day.

**EXAMPLE OF WRONG OUTPUT** (do NOT do this):
**Narration Script:** Here's your personalized wedding invitation narration.
**Opening Welcome** (10 seconds)
"Welcome to Sarah and Michael's Wedding Celebration!"
This warm, conversational script creates an intimate connection...

Now write the narration. Output ONLY the spoken words:`;
  },
};
```

**Estimated Time**: 45 minutes

---

### Task 18.2: Fix Initial Narration in Step 3b (P0)

**File**: `app/[locale]/guided/step-3b/page.tsx`

**Objective**: Replace hardcoded markdown template with AI-generated clean narration

**Current Code (lines 116-177)** - BROKEN:
```typescript
// This builds markdown-formatted text
initialContent = `**Narration Script:** Here's your personalized ${occasion} narration...
${sceneScripts || story.narration}
...
```

**New Approach**:
1. Call the same `/api/step3b/chat` endpoint to generate initial narration
2. Use the story's narration as the base, cleaned of any formatting
3. Pass full project context to the AI

**Implementation**:

```typescript
// In useEffect for initialization
useEffect(() => {
  if (projectId && convexMessages.length === 0 && project !== undefined && !isInitializing.current) {
    isInitializing.current = true;
    
    // Check if we already have an approved narration script
    if (project?.approvedNarrationScript) {
      // Load existing approved narration (already clean)
      addAssistantMessage(project.approvedNarrationScript);
      return;
    }
    
    // Generate fresh narration using AI with full context
    generateInitialNarration();
  }
}, [projectId, convexMessages.length, project]);

const generateInitialNarration = async () => {
  if (!projectId || !project) return;
  
  setStatus("streaming");
  
  try {
    // Build scene context from Convex scenes
    const sceneContext = Array.isArray(scenes)
      ? scenes.map((s) => ({
          number: s.sceneNumber,
          title: s.title,
          description: s.description,
          duration: s.duration,
          mood: s.visualStyle,
        }))
      : [];

    // Call AI with full project context
    const response = await fetch("/api/step3b/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: "Generate the initial narration script for this video invitation."
        }],
        projectContext: {
          occasion: project.occasion,
          theme: project.theme,
          language: project.language,
          eventTitle: project.eventDetails?.eventTitle,
          eventDate: project.eventDetails?.date,
          eventTime: project.eventDetails?.time,
          eventLocation: project.eventDetails?.location,
          hostName: project.eventDetails?.hostName,
          guestOfHonor: project.eventDetails?.guestOfHonor,
          emotionalStory: project.eventDetails?.emotionalStory,
          dressCode: project.eventDetails?.dressCode,
          rsvpDeadline: project.eventDetails?.rsvpDeadline,
          storyNarration: project.generatedStory?.narration,
          emotionalArc: project.generatedStory?.emotionalArc,
        },
        sceneContext,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to generate initial narration");
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      fullText += decoder.decode(value || new Uint8Array(), { stream: !done });
    }

    await addAssistantMessage(fullText);
  } catch (error) {
    console.error("[Step 3b] Failed to generate initial narration:", error);
    // Fallback to a simple clean message
    await addAssistantMessage(
      `Welcome to ${project.eventDetails?.eventTitle || "our special celebration"}! ` +
      `We're so excited to share this moment with you. ` +
      `Please join us for an unforgettable experience.`
    );
  } finally {
    setStatus("idle");
  }
};
```

**Estimated Time**: 45 minutes

---

### Task 18.3: Add Editable Narration Textarea (P1)

**File**: `app/[locale]/guided/step-3b/page.tsx`

**Objective**: Allow user to directly edit the narration text

**New UI Flow**:
1. AI generates narration → displayed in card
2. User can click "Edit" to switch to textarea mode
3. User edits text directly
4. User clicks "Save" to confirm
5. User clicks "Approve" to save and continue

**Implementation**:

```typescript
// Add new state
const [isEditing, setIsEditing] = useState(false);
const [editedContent, setEditedContent] = useState("");

// Edit handler
const startEditing = () => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "assistant") {
    setEditedContent(lastMessage.content);
    setIsEditing(true);
  }
};

// Save edited content
const saveEdit = async () => {
  if (!editedContent.trim()) return;
  
  // Update the last assistant message with edited content
  // This requires a new mutation in Convex to update message content
  await updateLastMessage(editedContent);
  setIsEditing(false);
};

// In the JSX, add edit button and conditional textarea
{messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
  <div className="mt-4">
    {isEditing ? (
      <div className="space-y-3">
        <Textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="min-h-[200px] bg-[#223649] border-[#314d68] text-white"
          placeholder="Edit your narration script..."
        />
        <div className="flex gap-2">
          <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
            Save Changes
          </Button>
          <Button 
            onClick={() => setIsEditing(false)} 
            variant="outline"
            className="border-[#314d68] text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    ) : (
      <Button
        onClick={startEditing}
        variant="outline"
        className="border-[#314d68] text-white hover:bg-[#223649]"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Narration
      </Button>
    )}
  </div>
)}
```

**Estimated Time**: 45 minutes

---

### Task 18.4: Update API Route with Full Context (P0)

**File**: `app/api/step3b/chat/route.ts`

**Objective**: Pass all project context to the prompt builder

**Current Code** - Missing context:
```typescript
const systemPrompt = NARRATION_SCRIPT_PROMPT.buildPrompt({
  occasion: projectContext?.occasion || "",
  theme: projectContext?.theme || "",
  emotionalStory: projectContext?.emotionalStory || "",
  language: projectContext?.language || "English",
  scenes: sceneContext || [],
  totalDuration: ...,
});
```

**Updated Code**:
```typescript
const systemPrompt = NARRATION_SCRIPT_PROMPT.buildPrompt({
  // Event basics
  occasion: projectContext?.occasion || "",
  theme: projectContext?.theme || "",
  language: projectContext?.language || "English",
  languageCode: projectContext?.languageCode,
  
  // Event details (from Step 1)
  eventTitle: projectContext?.eventTitle,
  eventDate: projectContext?.eventDate,
  eventTime: projectContext?.eventTime,
  eventLocation: projectContext?.eventLocation,
  hostName: projectContext?.hostName,
  guestOfHonor: projectContext?.guestOfHonor,
  emotionalStory: projectContext?.emotionalStory,
  dressCode: projectContext?.dressCode,
  rsvpDeadline: projectContext?.rsvpDeadline,
  
  // Story context (from Step 2)
  storyNarration: projectContext?.storyNarration,
  emotionalArc: projectContext?.emotionalArc,
  
  // Scenes (from Step 3)
  scenes: sceneContext || [],
  totalDuration: sceneContext?.reduce(
    (sum: number, scene: { duration?: number }) => sum + (scene.duration || 0),
    0,
  ) || 30,
  
  // Chat context
  userMessage: messages[messages.length - 1]?.content,
  conversationHistory: messages,
});
```

**Estimated Time**: 20 minutes

---

### Task 18.5: Show Script Preview in Step 4 (P1)

**File**: `app/[locale]/guided/step-4/page.tsx`

**Objective**: Display the narration text that will be sent to TTS

**Implementation**:

```typescript
// Add preview state
const [showNarrationPreview, setShowNarrationPreview] = useState(false);

// Get cleaned script for preview
const cleanedNarration = useMemo(() => {
  if (!project?.approvedNarrationScript) return "";
  return cleanNarrationScript(project.approvedNarrationScript);
}, [project?.approvedNarrationScript]);

// Word count and duration estimate
const wordCount = cleanedNarration.split(/\s+/).filter(Boolean).length;
const estimatedDuration = Math.round(wordCount / 2.5); // ~2.5 words/second

// Add preview card before narrator panel
<Card style={{ backgroundColor: "#182634", borderColor: "#314d68" }}>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-white">Narration Script</CardTitle>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowNarrationPreview(!showNarrationPreview)}
      className="text-gray-300"
    >
      {showNarrationPreview ? "Hide" : "Show"} Script
    </Button>
  </CardHeader>
  {showNarrationPreview && (
    <CardContent>
      <div className="bg-[#223649] p-4 rounded-lg">
        <p className="text-white whitespace-pre-wrap">{cleanedNarration}</p>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>{wordCount} words</span>
        <span>~{estimatedDuration}s estimated duration</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 border-[#314d68] text-white"
        onClick={() => router.push(`/guided/step-3b?projectId=${projectId}`)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit in Step 3b
      </Button>
    </CardContent>
  )}
</Card>
```

**Estimated Time**: 30 minutes

---

### Task 18.6: Improve `cleanNarrationScript` Function (P1)

**File**: `app/[locale]/guided/step-4/page.tsx`

**Objective**: Make cleaning more robust and predictable

**Current Issues**:
- Quote extraction assumes narration is quoted
- Doesn't handle all markdown patterns
- Doesn't preserve MiniMax pause markers

**Improved Function**:

```typescript
/**
 * Clean narration script for TTS
 * Removes ALL formatting, keeping only spoken text and pause markers
 */
function cleanNarrationScript(rawScript: string): string {
  if (!rawScript) return "";

  let cleaned = rawScript;

  // Step 1: Remove markdown formatting
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1"); // Bold
  cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1"); // Italic
  cleaned = cleaned.replace(/~~([^~]+)~~/g, "$1"); // Strikethrough
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1"); // Inline code
  cleaned = cleaned.replace(/^#+\s+/gm, ""); // Headers

  // Step 2: Remove section headers with timing
  cleaned = cleaned.replace(/^[A-Za-z\s]+\s*\(\d+\s*seconds?\)\s*:?\s*$/gim, "");
  cleaned = cleaned.replace(/^\*\*[A-Za-z\s]+\*\*\s*\(\d+\s*seconds?\)\s*$/gim, "");
  cleaned = cleaned.replace(/^Scene\s+\d+\s*[:—-]\s*/gim, "");

  // Step 3: Remove meta-text patterns
  const metaPatterns = [
    /^Narration Script:?\s*/gim,
    /^Here's your personalized.*narration\.?\s*/gim,
    /^This (?:warm|script|narration)[^.]*\.\s*/gim,
    /^---+\s*$/gm,
    /^\*[^*]+\*$/gm, // Italic-only lines (usually instructions)
  ];
  for (const pattern of metaPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Step 4: Extract quoted content if the entire text is quoted sections
  const hasOnlyQuotedContent = /^[\s\S]*"[^"]+"/m.test(cleaned) && 
                               !/[a-zA-Z]{10,}/m.test(cleaned.replace(/"[^"]*"/g, ""));
  if (hasOnlyQuotedContent) {
    const quotedParts = cleaned.match(/"([^"]+)"/g);
    if (quotedParts && quotedParts.length > 0) {
      cleaned = quotedParts.map((q) => q.replace(/"/g, "")).join(" ");
    }
  }

  // Step 5: Preserve MiniMax pause markers <#X.X#>
  // (already preserved - no action needed)

  // Step 6: Clean up whitespace
  cleaned = cleaned.replace(/\n{3,}/g, " "); // Multiple newlines to space
  cleaned = cleaned.replace(/\n/g, " "); // Newlines to space
  cleaned = cleaned.replace(/\s{2,}/g, " "); // Multiple spaces to single
  cleaned = cleaned.trim();

  return cleaned;
}
```

**Estimated Time**: 30 minutes

---

### Task 18.7: Add i18n Keys (P1)

**File**: `messages/en.json` (and run translations)

**New Keys for Step 3b**:
```json
{
  "guided_step3b": {
    "edit_narration": "Edit Narration",
    "save_changes": "Save Changes",
    "cancel_edit": "Cancel",
    "generating_narration": "Generating your personalized narration...",
    "narration_preview": "Narration Preview",
    "word_count": "{count} words",
    "estimated_duration": "~{seconds}s estimated duration",
    "edit_script_hint": "Click to edit the narration directly"
  }
}
```

**New Keys for Step 4**:
```json
{
  "guided_step4": {
    "narration_script": "Narration Script",
    "show_script": "Show Script",
    "hide_script": "Hide Script",
    "edit_in_step3b": "Edit in Step 3b",
    "script_will_be_spoken": "This text will be spoken by the narrator"
  }
}
```

**Estimated Time**: 20 minutes

---

### Task 18.8: Add Convex Mutation for Message Update (P1)

**File**: `convex/chatMessages.ts`

**Objective**: Allow updating message content (for editing)

```typescript
export const updateMessageContent = mutation({
  args: {
    messageId: v.id("chatMessages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Only allow editing own messages
    if (message.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
```

**Estimated Time**: 15 minutes

---

## 📋 QA Checklist

### TypeScript & Biome
- [ ] `npx tsc --noEmit` passes
- [ ] `npx biome check .` passes

### Functional Testing
- [ ] New project → Step 3b → AI generates clean narration (no markdown)
- [ ] Narration includes event details (date, location, etc.)
- [ ] User can send chat messages to refine
- [ ] User can click "Edit" and modify text directly
- [ ] Approved narration is saved without markdown
- [ ] Step 4 shows script preview
- [ ] Step 4 word count is accurate
- [ ] TTS generation uses clean text
- [ ] Generated audio sounds natural (no "asterisk asterisk")

### Edge Cases
- [ ] Missing event details → AI generates generic but warm text
- [ ] Very long narration → Word count warning shown
- [ ] Empty scenes → Fallback to story narration
- [ ] Non-English language → Correct language coefficient applied

---

## 📁 Files to Modify

| File | Action | Priority |
|------|--------|----------|
| `lib/ai/prompts/audio/narration-script.prompt.ts` | Rewrite prompt with full context | 🔴 P0 |
| `app/api/step3b/chat/route.ts` | Pass full project context | 🔴 P0 |
| `app/[locale]/guided/step-3b/page.tsx` | AI-generate initial, add edit mode | 🔴 P0 |
| `app/[locale]/guided/step-4/page.tsx` | Add script preview, improve cleaning | 🟡 P1 |
| `convex/chatMessages.ts` | Add update mutation | 🟡 P1 |
| `messages/en.json` | Add new i18n keys | 🟡 P1 |

---

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Task 18.1: Update Prompt | 45 min |
| Task 18.2: Fix Step 3b Initial | 45 min |
| Task 18.3: Add Edit Mode | 45 min |
| Task 18.4: Update API Route | 20 min |
| Task 18.5: Script Preview in Step 4 | 30 min |
| Task 18.6: Improve Cleaning Function | 30 min |
| Task 18.7: Add i18n Keys | 20 min |
| Task 18.8: Convex Mutation | 15 min |
| **Testing & QA** | 30 min |
| **TOTAL** | **~4.5 hours** |

---

## 🎯 Success Criteria

1. **Clean Output**: AI-generated narration contains ZERO markdown formatting
2. **Rich Context**: Narration mentions event name, date, location, and emotional story
3. **User Control**: User can directly edit any part of the narration
4. **Transparency**: User sees exactly what will be spoken before TTS
5. **Quality Audio**: Generated narration sounds natural and professional

---

## 🔗 Related Documents

- Sprint 7 (Audio Generation): `docs/MVP/Todo/sprint-7-implementation.md`
- AI Models Overview: `docs/Understanding/ai-models-overview.md`
- MiniMax Speech 2.6 HD API: `https://fal.ai/models/fal-ai/minimax/speech-2.6-hd/api`

---

**Last Updated**: December 23, 2025  
**Status**: ✅ **COMPLETED** - All tasks implemented and deployed

---

*This sprint fixes the critical narration generation flow to ensure users get clean, personalized, impactful narrations that sound natural when converted to speech.*


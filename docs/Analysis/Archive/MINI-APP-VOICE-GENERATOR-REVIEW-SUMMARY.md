# Voice Generator Analysis Document - Review Summary

**Date**: February 18, 2026  
**Document Reviewed**: `MINI-APP-VOICE-GENERATOR-ANALYSIS.md` (v2.0)  
**Reviewers**: AI Assistant, design-master agent, i18n-master agent  
**Status**: ✅ **ARCHITECTURE ALIGNED** with corrections required

---

## 🎯 Executive Summary

The Voice Generator Analysis document has been **completely rewritten (v2.0)** to align with the modular dynamic schema architecture from Sprint 30d.5 (Image Generator). The document now correctly follows the Convex-first, zero-code model onboarding pattern.

**Overall Assessment**: **85% APPROVED** with specific corrections required before implementation.

### Key Achievements ✅
- Architecture properly aligned with Sprint 30d.5 patterns
- Convex-based dynamic schemas (voiceModelSchemas, voiceToolHistory)
- Generic action pattern (mirrors imageToolGeneric.ts)
- Credit system uses Convex (not hardcoded)
- Zero-code model onboarding capability
- Mobile-first design (88px touch targets)
- Component reusability strategy is excellent

### Critical Issues ❌
1. Design System: Hardcoded pattern remnant (lines 1023-1049 need deletion)
2. Design System: Missing `leading-relaxed` on body text
3. i18n: ~150 translation keys missing (60% of user-facing strings)

---

## 🚨 Critical Architectural Validation

### ✅ CONFIRMED: Modular Architecture Compliance

The document correctly implements:

| Aspect | Status | Details |
|--------|--------|---------|
| **Convex Tables** | ✅ Correct | `voiceModelSchemas` + `voiceToolHistory` mirror image generator |
| **Dynamic UI** | ✅ Correct | Uses `useConvexVoiceSchemas()` hook, reuses `DynamicField` |
| **Backend Pattern** | ✅ Correct | Generic action reads config from Convex |
| **Credit System** | ✅ Correct | Uses `creditActionType` from schema |
| **Zero-Code Onboarding** | ✅ Correct | Add model = Add Convex row |

### ❌ REMOVED: Hardcoded Anti-Patterns

The document correctly **removed** all hardcoded patterns from v1.0:
- ❌ Hardcoded model endpoints dictionary
- ❌ Hardcoded credit costs in hooks
- ❌ Static voice configuration

**Exception**: Lines 1023-1049 contain a **duplicate section** with old hardcoded pattern that must be deleted.

---

## 🎨 Design System Review (design-master agent)

### Overall Score: **85% APPROVED**

### ✅ APPROVED Items

1. **Component Reusability** (Excellent)
   - DynamicField reuse from image generator ✅
   - ModelSelector pattern consistency ✅
   - VoiceLibrary follows GenerationHistory pattern ✅
   - Architecture mirrors `components/image-generator/index.tsx` ✅

2. **Mobile-First Touch Targets** (Perfect)
   - 88px record button (exceeds 44px minimum) ✅
   - 44px minimum for all interactive elements ✅
   - Mobile recording interface properly sized ✅

3. **Architecture Alignment** (Excellent)
   - useConvexVoiceSchemas follows proven pattern ✅
   - Generic action pattern correct ✅
   - Frontend hooks properly structured ✅

### ⚠️ WARNINGS - Need Explicit Examples

1. **Missing Design Token References**
   - Need explicit semantic color token usage examples
   - Glass panel/inner field examples needed
   - Waveform visualization colors not specified

2. **Typography Specifications**
   - Audio player controls need typography scale
   - Voice library card text needs specifications
   - Body text needs explicit `leading-relaxed` usage

3. **Responsive Grid Pattern**
   - Voice library grid breakpoints not defined
   - Should specify: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

4. **Badge Design**
   - HD/FAST/PRO badges mentioned but design not specified
   - Need variant mapping: HD→secondary, FAST→default, PRO→outline

### ❌ VIOLATIONS - Must Fix

**CRITICAL #1: Hardcoded Credit Cost Pattern (Lines 1023-1049)**

**Issue**: Duplicate section contains old hardcoded pattern that contradicts new architecture:

```typescript
// ❌ WRONG - This contradicts Convex architecture
export function useVoiceCreditCost(voiceModel: string, textLength: number, duration: number) {
  const modelCosts = {
    'minimax-hd': 10,        // Hardcoded
    'minimax-turbo': 8,      
  };
}
```

**Action Required**: **DELETE lines 1023-1049 entirely**

**Correct Pattern** (already shown in architecture section):
```typescript
// ✅ CORRECT - Dynamic from Convex
const creditCost = useCreditCost(selectedSchema.creditActionType);
```

---

**CRITICAL #2: Missing Line Height on Body Text**

**Issue**: Examples need `leading-relaxed` for readability

**Before**:
```tsx
<p className="text-sm text-muted-foreground">
  Voice duration: 2m 34s
</p>
```

**After**:
```tsx
<p className="text-sm text-muted-foreground leading-relaxed">
  Voice duration: 2m 34s
</p>
```

**Action Required**: Update all body text examples in:
- VoiceSettingsPanel (line 807-826)
- VoiceLibrary (line 839-848)
- Recording interface descriptions

---

### 📋 Required Additions

**ADDITION #1: Design Token Section** (Add before Phase 3, line 742)

```markdown
### Design System Implementation

**Color Tokens**:
- Container: `glass-panel` (uses bg-card, border-border)
- Inner fields: `glass-inner-field` (uses bg-secondary)
- Text: `text-foreground` (primary), `text-muted-foreground` (secondary)
- Waveform: `bg-primary` (active), `bg-muted` (silent)

**Typography**:
- Voice titles: `text-base font-medium leading-relaxed`
- Voice metadata: `text-sm text-muted-foreground leading-relaxed`
- Settings labels: `text-sm font-medium`
- Captions: `text-xs text-muted-foreground`

**Layout**:
- Voice library grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Card padding: `p-4` on mobile, `p-6` on desktop
- Section spacing: `space-y-6`

**Badges**:
- HD: `<Badge variant="secondary">HD</Badge>`
- FAST: `<Badge variant="default">FAST</Badge>`
- PRO: `<Badge variant="outline">PRO</Badge>`
```

**ADDITION #2: Glass Panel Recording Interface Example** (Add to Task 4.1, line 930)

```tsx
<div className="glass-panel">
  <div className="space-y-6">
    <div className="glass-inner-field">
      <Textarea 
        className="bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground leading-relaxed"
        placeholder="Enter your script..."
      />
    </div>
    
    <div className="flex items-center justify-center h-16 gap-0.5">
      {waveformData.map((amplitude, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full transition-smooth"
          style={{ height: `${amplitude * 100}%` }}
        />
      ))}
    </div>
    
    <Button className="h-[88px] w-[88px] rounded-full">
      <Mic className="h-8 w-8" />
    </Button>
  </div>
</div>
```

**ADDITION #3: Voice Library Card Design** (Add to Task 3.5, line 843)

```tsx
<Card className="group hover:border-primary/50 transition-smooth">
  <CardContent className="p-4">
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex-1">
        <h4 className="text-base font-medium line-clamp-1">
          {voice.voiceSettings.voiceId}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
          {formatDate(voice.createdAt)}
        </p>
      </div>
      <Badge variant="secondary">{voice.schemaId}</Badge>
    </div>
    
    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
      {voice.prompt}
    </p>
    
    <audio controls src={voice.audioUrl} className="w-full h-10 mb-4" />
    
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="flex-1 min-h-[44px]">
        Download
      </Button>
      <Button size="sm" className="flex-1 min-h-[44px]">
        Use in Project
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 🌍 i18n Review (i18n-master agent)

### Overall Assessment: **~60% Translation Coverage Missing**

### ✅ APPROVED Patterns

1. **Dynamic Schema Translation Keys**
   - `nameTranslationKey` in voiceModelSchemas ✅
   - `schema.params[].label` as translation keys ✅
   - Pattern matches imageModelSchemas ✅

2. **Namespace Convention**
   - `voice_generator.*` namespace ✅
   - Mirrors `image_generator.*` structure ✅

3. **Reuse of Existing Keys**
   - Can reuse `voices.*` keys (lines 1417-1425 in en.json) ✅

### ❌ CRITICAL GAPS - Missing Translations

**~150 translation keys need to be added** across these areas:

| Category | Keys Needed | Priority |
|----------|-------------|----------|
| **Recording Mode UI** | ~40 keys | 🔴 CRITICAL |
| **Voice Settings Panel** | ~15 keys | 🔴 CRITICAL |
| **Voice Library/History** | ~25 keys | 🔴 CRITICAL |
| **Error States** | ~10 keys | 🔴 CRITICAL |
| **Tooltips & Help Text** | ~15 keys | 🟡 HIGH |
| **Inspiration Wall** | ~10 keys | 🟡 HIGH |
| **Step-4 Integration** | ~8 keys | 🟡 HIGH |
| **Voice Model Names** | ~8 keys | 🟢 MEDIUM |
| **Mobile-Specific** | ~5 keys | 🟢 LOW |

### 📋 Required Translation Structure

```json
{
  "voice_generator": {
    // ─── Page & Navigation (8 keys) ───
    "page_title": "Voice Generator – AI Text-to-Speech",
    "tab_generate": "Generate Voice",
    "tab_record": "Record Voice",
    // ...
    
    // ─── Model Selection (6 keys) ───
    "model_selector_title": "Choose Voice Model",
    "search_models": "Search voice models...",
    // ...
    
    // ─── TTS Generation (10 keys) ───
    "prompt_label": "Text to Speech",
    "prompt_placeholder": "Enter text...",
    "generate_button": "Generate Voice",
    // ...
    
    // ─── Voice Settings (15 keys) ───
    "settings": {
      "speed_label": "Speed",
      "pitch_label": "Pitch",
      "emotion_label": "Emotion",
      "emotion_neutral": "Neutral",
      "emotion_happy": "Happy",
      // ...
    },
    
    // ─── Recording Mode (40 keys) ───
    "recording": {
      "click_to_record": "Click to Record",
      "recording_active": "Recording... {duration}s",
      "stop_recording": "Stop Recording",
      "permission_denied": "Microphone access denied...",
      "upload_audio": "Upload Audio File",
      "invalid_format": "Invalid audio format...",
      // ...
    },
    
    // ─── Voice Library (25 keys) ───
    "library": {
      "title": "Voice Library",
      "empty_title": "No voices yet",
      "filter_all": "All Voices",
      "use_in_project": "Use in Project",
      "download_audio": "Download Audio",
      "voice_duration": "{duration}s",
      // ...
    },
    
    // ─── Tooltips (15 keys) ───
    "tooltips": {
      "badge_hd": "High-definition audio quality",
      "credits_per_word": "{credits} credits per 100 words",
      "voice_preview": "Click to preview",
      // ...
    },
    
    // ─── Inspiration Wall (10 keys) ───
    "inspiration": {
      "empty_title": "Need inspiration?",
      "reuse_settings": "Re-use Settings",
      // ...
    },
    
    // ─── Error States (10 keys) ───
    "errors": {
      "generation_failed": "Voice generation failed...",
      "storage_full": "Storage quota exceeded...",
      "network_error": "Network error...",
      // ...
    },
    
    // ─── Success Messages (5 keys) ───
    "success": {
      "generated": "Voice generated successfully!",
      "recorded": "Voice recorded successfully!",
      // ...
    }
  },
  
  // ─── Voice Model Names (8 keys) ───
  "voice_models": {
    "minimax_hd": "MiniMax Speech HD",
    "minimax_hd_desc": "High-fidelity voice synthesis",
    // ...
  },
  
  // ─── Step-4 Integration (8 keys) ───
  "guided_step4": {
    "voice_mode_title": "Voice Mode",
    "mode_generate": "Generate with AI",
    "mode_record": "Record Your Voice",
    "replace_narration_title": "Replace Narration?",
    // ...
  }
}
```

### ⚠️ Recommendations

1. **Make `nameTranslationKey` Required**
   - Currently `v.optional(v.string())` in schema
   - Should be required for consistency
   - Prevents missing translations

2. **ICU Format Usage**
   ```json
   "voice_duration_seconds": "{seconds, plural, one {1 second} other {# seconds}}",
   "generation_cost": "{credits, plural, one {1 credit} other {# credits}}"
   ```

3. **Admin UI Translation Keys**
   ```json
   "admin": {
     "voice_models": {
       "title": "Voice Models",
       "add_model": "Add Voice Model",
       "field_schema_id": "Schema ID",
       // ...
     }
   }
   ```

4. **Before Implementation**
   - [ ] Create full `voice_generator` namespace in `messages/en.json`
   - [ ] Run `pnpm translate` to generate all 7 languages
   - [ ] Run `pnpm i18n:verify` to confirm sync
   - [ ] Update seed script to use translation keys

---

## 📋 Action Items Before Implementation

### 🔴 CRITICAL (Must Fix)

1. **DELETE lines 1023-1049** (hardcoded credit cost pattern)
2. **Add `leading-relaxed`** to all body text examples
3. **Create ~150 translation keys** in `messages/en.json`
4. **Add Design Token section** (explicit token usage)

### 🟡 HIGH PRIORITY (Should Add)

5. **Add glass panel examples** (recording interface, voice cards)
6. **Specify responsive grid breakpoints** (voice library)
7. **Add badge design specifications** (HD/FAST/PRO variants)
8. **Add ICU format examples** (duration, credits, counts)

### 🟢 MEDIUM PRIORITY (Nice to Have)

9. **Add waveform color specification** (bg-primary for active)
10. **Add mobile-specific translations** (tap/hold/swipe)
11. **Add admin UI translation keys** (voice model management)

---

## 🎯 Implementation Readiness

### Architecture: ✅ **100% READY**
- Convex tables designed correctly
- Generic action pattern correct
- Dynamic UI system properly planned
- Credit system architecture sound
- Zero-code onboarding validated

### Design System: ⚠️ **85% READY** (needs corrections)
- Component reusability excellent
- Mobile-first patterns correct
- Touch targets properly sized
- **BLOCKER**: Delete hardcoded credit pattern
- **BLOCKER**: Add line-height to body text
- **TODO**: Add explicit design token examples

### i18n: ⚠️ **40% READY** (major work needed)
- Dynamic schema pattern correct
- Namespace convention good
- **BLOCKER**: Add ~150 missing translation keys
- **TODO**: Run pnpm translate + i18n:verify
- **TODO**: Update seed script with translation keys

---

## ✅ Final Recommendation

**Status**: **APPROVED FOR IMPLEMENTATION** after applying corrections

**Estimated Time to Fix Issues**: **2-3 hours**
- Delete hardcoded pattern: 5 minutes
- Add design token section: 30 minutes
- Add glass panel examples: 30 minutes
- Fix line-height issues: 15 minutes
- Create 150 translation keys: 60-90 minutes
- Run translation pipeline: 15 minutes

**Total Implementation Time** (with fixes): **13 hours** + 3 hours fixes = **16 hours**

**Key Strengths**:
- ✅ Architecture is perfectly aligned with Sprint 30d.5
- ✅ Zero-code model onboarding capability validated
- ✅ Component reusability strategy is excellent
- ✅ Mobile-first approach is thorough
- ✅ Convex-first design eliminates technical debt

**Critical Path**:
1. Apply design system corrections (2h)
2. Create i18n keys (1h)
3. Begin Phase 1: Convex infrastructure (3.5h)
4. Continue with implementation phases (9.5h)

---

**Document Version**: Review Summary v1.0  
**Review Date**: February 18, 2026  
**Next Review**: After corrections applied  
**Approvers**: AI Assistant, design-master agent, i18n-master agent

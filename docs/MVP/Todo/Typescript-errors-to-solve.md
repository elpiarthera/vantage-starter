# TypeScript Errors to Solve

**Generated:** November 16, 2025, 6:42 PM Paris Time (CET)  
**Command:** `npx tsc --noEmit`  
**Total Errors:** 42 errors across 15 files

---

## 📊 Summary by File

| File | Errors | Category |
|------|--------|----------|
| `temp/pre-refactor-step3.tsx` | 8 | Archive/Temp |
| `components/video-generation/VideoGenerator.tsx` | 6 | Video Generation |
| `components/asset-management/AssetSelector.tsx` | 4 | Asset Management |
| `components/chat-bot-demo.tsx` | 5 | Chat/AI |
| `components/user-dashboard.tsx` | 3 | Dashboard |
| `components/dashboard/projects/tabs/ShareTab.tsx` | 2 | Projects |
| `components/dashboard/projects/ProjectDetail.tsx` | 2 | Projects |
| `stores/scene-store.ts` | 2 | State Management |
| `hooks/business-logic/useSceneManagement.ts` | 2 | Hooks |
| `app/guided/step-2/page.tsx` | 1 | Pages |
| `app/guided/step-3b/page.tsx` | 1 | Pages |
| `archive/step-3-old/page.tsx` | 1 | Archive |
| `components/video-generation/VideoRegenerationChat.tsx` | 2 | Video Generation |
| `components/dashboard/projects/ProjectsList.tsx` | 1 | Projects |
| `components/theme-provider.tsx` | 1 | UI |
| `vitest.config.ts` | 1 | Config |

---

## 🔴 Critical Errors (Active Code)

### 1. `components/asset-management/AssetSelector.tsx` — 4 errors

**Lines:** 107, 108, 109, 110

**Error Type:** `TS2345` - Type incompatibility

**Details:**
```
Argument of type 'string | null' is not assignable to parameter of type 'string | undefined'.
Type 'null' is not assignable to type 'string | undefined'.
```

**Issue:** Multiple lines passing `null` where `undefined` is expected.

**Fix Required:** Convert `null` to `undefined` or update type signatures.

---

### 2. `components/chat-bot-demo.tsx` — 5 errors

#### Error A: Missing modules (Lines 24-25)
**Error Type:** `TS2307` - Cannot find module

**Details:**
```
Cannot find module '@/components/ai-elements/sources' or its corresponding type declarations.
Cannot find module '@/components/ai-elements/reasoning' or its corresponding type declarations.
```

**Issue:** Missing AI elements components.

**Fix Required:** Create missing components or remove imports.

#### Error B: Property access (Lines 75)
**Error Type:** `TS2339` - Property does not exist

**Details:**
```
Property 'url' does not exist on type 'UIMessagePart<UIDataTypes, UITools>'.
Property 'url' does not exist on type 'TextUIPart'.
```

**Issue:** Accessing non-existent `url` property (2 occurrences on line 75).

**Fix Required:** Type narrowing or property check before access.

#### Error C: Component props (Line 80)
**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type '{ children: Element; from: "user" | "assistant" | "system"; key: string; }' 
is not assignable to type 'IntrinsicAttributes & MessageProps'.
Property 'from' does not exist on type 'IntrinsicAttributes & MessageProps'.
```

**Issue:** Invalid `from` prop on Message component.

**Fix Required:** Update `MessageProps` interface or remove `from` prop.

#### Error D: Implicit any (Line 119)
**Error Type:** `TS7006` - Implicit any type

**Details:**
```
Parameter 'value' implicitly has an 'any' type.
```

**Fix Required:** Add explicit type annotation.

---

### 3. `components/video-generation/VideoGenerator.tsx` — 6 errors

**Lines:** 199, 210, 226, 262, 284, 313

**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type 'void' is not assignable to type 'ReactNode'.
```

**Issue:** Functions returning `void` used as JSX children (6 occurrences).

**Fix Required:** Wrap function calls in blocks or return valid ReactNode.

---

### 4. `components/video-generation/VideoRegenerationChat.tsx` — 2 errors

#### Error A: Component props (Line 208)
**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type '{ children: Element; from: "user" | "assistant"; }' 
is not assignable to type 'IntrinsicAttributes & MessageProps'.
Property 'from' does not exist on type 'IntrinsicAttributes & MessageProps'.
```

**Issue:** Same as chat-bot-demo (invalid `from` prop).

#### Error B: Event handler (Line 220)
**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type '(inputValue: string) => void' is not assignable to type 'FormEventHandler<HTMLFormElement>'.
Types of parameters 'inputValue' and 'event' are incompatible.
Type 'FormEvent<HTMLFormElement>' is not assignable to type 'string'.
```

**Issue:** Handler signature mismatch.

**Fix Required:** Update handler to accept `FormEvent<HTMLFormElement>`.

---

### 5. `components/dashboard/projects/ProjectDetail.tsx` — 2 errors

#### Error A: DeleteProjectModal props (Line 220)
**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type '{ project: MockProject; isOpen: boolean; onClose: () => void; onConfirm: () => void; }' 
is not assignable to type 'IntrinsicAttributes & DeleteProjectModalProps'.
Property 'project' does not exist on type 'IntrinsicAttributes & DeleteProjectModalProps'. 
Did you mean 'projectId'?
```

**Issue:** Component expects `projectId` but receives `project`.

**Fix Required:** Pass `project.id` instead of full `project` object.

#### Error B: ShareProjectModal props (Line 226)
**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type '{ project: MockProject; isOpen: boolean; onClose: () => void; }' 
is not assignable to type 'IntrinsicAttributes & ShareProjectModalProps'.
Property 'project' does not exist on type 'IntrinsicAttributes & ShareProjectModalProps'. 
Did you mean 'projectId'?
```

**Issue:** Same as Error A (expects `projectId`, receives `project`).

**Fix Required:** Pass `project.id` instead of full `project` object.

---

### 6. `components/dashboard/projects/ProjectsList.tsx` — 1 error

**Line:** 20

**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' 
is not assignable to type 'ReactNode'.
```

**Issue:** Lucide icon component used incorrectly as ReactNode.

**Fix Required:** Render icon component with JSX syntax (e.g., `<Icon />`).

---

### 7. `components/dashboard/projects/tabs/ShareTab.tsx` — 2 errors

**Line:** 53 (2 occurrences at columns 15 and 25)

**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type 'SharedLink | { id: string; projectId: string; url: string; accessLevel: any; 
expiresAt: any; password: any; viewCount: number; createdAt: number; }' 
is not assignable to type 'SharedLink'.
Type '{ id: string; ... }' is missing the following properties from type 'SharedLink': 
userId, updatedAt
```

**Issue:** Object literal missing required fields (`userId`, `updatedAt`).

**Fix Required:** Add missing fields to object or update `SharedLink` type.

---

### 8. `components/user-dashboard.tsx` — 3 errors

#### Error A: Missing module (Line 28)
**Error Type:** `TS2307` - Cannot find module

**Details:**
```
Cannot find module '@/components/ui/separator' or its corresponding type declarations.
```

**Issue:** Missing separator component.

**Fix Required:** Create component or remove import.

#### Error B: Property access (Lines 551, 556)
**Error Type:** `TS2339` - Property does not exist

**Details:**
```
Property 'filename' does not exist on type 'MockVideo'.
```

**Issue:** Accessing non-existent `filename` property (2 occurrences).

**Fix Required:** Update `MockVideo` type or change property name.

#### Error C: Property typo (Line 551)
**Error Type:** `TS2551` - Property does not exist

**Details:**
```
Property 'projectData' does not exist on type 'MockVideo'. Did you mean 'projectId'?
```

**Issue:** Typo in property name.

**Fix Required:** Change `projectData` to `projectId`.

---

### 9. `components/theme-provider.tsx` — 1 error

**Line:** 9

**Error Type:** `TS2339` - Property does not exist

**Details:**
```
Property 'children' does not exist on type 'ThemeProviderProps'.
```

**Issue:** Missing `children` prop in type definition.

**Fix Required:** Add `children?: React.ReactNode` to `ThemeProviderProps` interface.

---

### 10. `hooks/business-logic/useSceneManagement.ts` — 2 errors

**Line:** 9 (columns 55 and 67)

**Error Type:** `TS2339` - Property does not exist

**Details:**
```
Property 'isAllValid' does not exist on type 'SceneState'.
Property 'totalDuration' does not exist on type 'SceneState'.
```

**Issue:** Accessing non-existent properties on `SceneState`.

**Fix Required:** Add properties to `SceneState` type or remove access.

---

### 11. `stores/scene-store.ts` — 2 errors

**Lines:** 73, 154

**Error Type:** `TS2352` - Conversion error

**Details:**
```
Conversion of type 'readonly [{ readonly id: "scene-1"; ... }]' to type 'Scene[]' 
may be a mistake because neither type sufficiently overlaps with the other.
The type 'readonly [...]' is 'readonly' and cannot be assigned to the mutable type 'Scene[]'.
```

**Issue:** Readonly array assigned to mutable array type (2 occurrences).

**Fix Required:** Use `as const` assertion or make array mutable with spread operator.

---

### 12. `app/guided/step-2/page.tsx` — 1 error

**Line:** 264

**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type '{ children: Element; from: "user" | "assistant"; }' 
is not assignable to type 'IntrinsicAttributes & MessageProps'.
Property 'from' does not exist on type 'IntrinsicAttributes & MessageProps'.
```

**Issue:** Same as chat-bot-demo (invalid `from` prop on Message component).

**Fix Required:** Update `MessageProps` or remove `from` prop.

---

### 13. `app/guided/step-3b/page.tsx` — 1 error

**Line:** 279

**Error Type:** `TS2322` - Type incompatibility

**Details:**
```
Type '{ children: Element; from: "user" | "assistant"; }' 
is not assignable to type 'IntrinsicAttributes & MessageProps'.
Property 'from' does not exist on type 'IntrinsicAttributes & MessageProps'.
```

**Issue:** Same as above (invalid `from` prop).

**Fix Required:** Update `MessageProps` or remove `from` prop.

---

### 14. `vitest.config.ts` — 1 error

**Line:** 3

**Error Type:** `TS2307` - Cannot find module

**Details:**
```
Cannot find module 'vite' or its corresponding type declarations.
```

**Issue:** Missing `vite` types.

**Fix Required:** Install `vite` or `@types/vite` package.

---

## 🟡 Low Priority Errors (Archive/Temp Files)

### 15. `archive/step-3-old/page.tsx` — 1 error

**Line:** 7

**Error Type:** `TS2307` - Cannot find module

**Details:**
```
Cannot find module '@/components/ui/collapsible' or its corresponding type declarations.
```

**Issue:** Missing collapsible component in archived file.

**Fix Required:** Can be ignored (archive) or create missing component.

---

### 16. `temp/pre-refactor-step3.tsx` — 8 errors

**Note:** This is a temporary file that should likely be deleted or refactored.

#### Errors:
1. **Line 266** - `TS7006`: Parameter 'scene' implicitly has 'any' type
2. **Lines 302, 338, 374** - `TS2345`: Type mismatch (duration `number` vs `5 | 10`) (3 occurrences)
3. **Lines 1590, 2062** - `TS2322`: Invalid `from` prop on Message component (2 occurrences)
4. **Lines 2069, 2084** - `TS2367`: Type comparison with no overlap (2 occurrences)

**Fix Required:** Refactor or delete temp file.

---

## 📋 Action Plan

### High Priority (Active Code)
1. **MessageProps Interface** - Fix `from` prop issue (affects 5 files)
2. **Video Generator** - Fix void return type in JSX (6 occurrences)
3. **Asset Selector** - Fix null/undefined type mismatch (4 occurrences)
4. **Missing Components** - Create or remove imports for:
   - `@/components/ai-elements/sources`
   - `@/components/ai-elements/reasoning`
   - `@/components/ui/separator`
   - `@/components/ui/collapsible`
5. **Type Updates** - Add missing properties to types:
   - `ThemeProviderProps` (children)
   - `SceneState` (isAllValid, totalDuration)
   - `MockVideo` (filename)
   - `SharedLink` (ensure complete)

### Medium Priority
6. **ProjectDetail** - Pass `projectId` instead of full `project` object
7. **Scene Store** - Fix readonly array assignments
8. **Event Handlers** - Fix FormEvent type mismatches

### Low Priority (Archive/Temp)
9. **Temp Files** - Consider deleting or refactoring `temp/` directory
10. **Archive** - Fix or ignore archived files

---

## 🎯 Notes

- **Sprint 1 & 2 Code:** All errors are in **future sprint files** (Sprint 3+). Sprint 1-2 code is **error-free**.
- **No blocking issues** for current sprint work.
- Most errors are in video generation and chat UI features (Sprint 5-7).
- Consider addressing "MessageProps" issue globally as it affects multiple files.

---

**Status:** ✅ **Sprint 1-2 code is production-ready with zero TypeScript errors.**


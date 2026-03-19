# ⏱️ PRD v2.1 - REVISED TIME ESTIMATION

**Key Principle**: We're porting/adapting from Vertical AI, NOT building from scratch.

---

## Original vs Revised Estimates

| Phase | Original | Revised | Savings | Reason |
|-------|----------|---------|---------|--------|
| **Phase 1** | 3-4h | **2-3h** | -25% | Schema definition is straightforward Convex |
| **Phase 2** | 4-5h | **2.5-3.5h** | -40% | Copy hierarchy-wall.tsx + adapt modals |
| **Phase 3** | 6-8h | **3.5-5h** | -42% | Copy admin forms × 4, wall builder, layout |
| **Phase 4** | 3-4h | **2-2.5h** | -33% | Param reading is simple |
| **Phase 5** | 2-3h | **1-1.5h** | -50% | Just typing keys + running scripts |
| **TOTAL** | **18-24h** | **11-15.5h** | **-40%** | **Porting >> Building** |

---

## Detailed Breakdown: What's Copy vs What's New

### Phase 1: Convex Schema (2-3h)

**Copy from Vertical AI**: 
- ❌ No direct copy (Vertical AI uses mock data, not Convex)

**New**: Define 5 Convex tables
- toolMetaCategories: ~20 min (simple schema)
- toolCategories: ~15 min (simple schema)
- toolSubCategories: ~15 min (simple schema)
- toolThemes: ~10 min (standalone, reusable)
- toolSubCategoryThemes: ~10 min (junction table)
- toolWallConfigs: ~15 min
- Indexes: ~15 min
- Queries (6 queries): ~30 min (straightforward patterns)
- Mutations (CRUD × 4): ~30 min
- Seed data: ~20 min

**Total**: 2.5-3h ✅

---

### Phase 2: User-Facing Wall (2.5-3.5h)

**Copy from Vertical AI**:
- `vertical-ai-alpha/components/commerce/hierarchy-wall.tsx` → Adapt for 4 levels: **1h**
  - Already handles 3 levels → add 4th level for themes
  - Copy card rendering → adapt to MyShortReel tokens
  - Minimal changes needed

**New**:
- Modal system + query param orchestration: **1-1.5h**
  - Use shadcn/ui Dialog (already in MyShortReel)
  - Implement useSearchParams() hook logic
  - Add navigation between modals
  - (Code skeleton provided in PRD Section 8.2)
  
- Apply color tokens: **0.5h**
  - Global find-replace OKLCH → Tailwind tokens
  - Verify on mobile

**Total**: 2.5-3.5h ✅

---

### Phase 3: Admin Dashboard (3.5-5h)

**Copy from Vertical AI**:
- Admin layout structure: **0.5h**
  - Copy `vertical-ai-alpha/app/admin/layout.tsx`
  - Add tools section to navigation
  - Add role check

- CRUD forms (4 forms): **2-2.5h**
  - Copy `meta-category-form.tsx` → adapt for tools: 0.5h
  - Copy `category-form.tsx` → adapt: 0.5h  
  - Copy `subcategory-form.tsx` → adapt: 0.5h
  - New `theme-form.tsx` (copy one of above as template): 0.5h
  - Total: 2-2.5h (mostly removing vertical-specific fields)

- Wall builder: **1-1.5h**
  - Copy `unified-wall-builder.tsx`
  - Add support for 4th level (themes)
  - Adapt theme assignment UI (junction table)

- List views: **0.5h**
  - Copy Vertical AI list pattern
  - Minimal adaptation

**New**:
- Theme assignment/junction UI: **0.5h**
  - Assign themes to subcategories
  - Add/remove from junction table

**Total**: 3.5-5h ✅

---

### Phase 4: Integration & Polish (2-2.5h)

**Copy from Vertical AI**:
- ❌ None (this is MyShortReel-specific)

**New**:
- Update Step 0 to read query params: **0.5h**
  - Parse `?occasion=X&style=Y&theme=Z`
  - Show summary before proceeding

- Update Step 1 to read query params: **0.5h**
  - Pre-select occasion + theme from params
  - User can still change

- Mobile testing: **0.5h**
  - Test on <768px
  - Verify modal behavior

- Error handling + edge cases: **0.5h**
  - Invalid params
  - Network errors
  - Graceful fallbacks

**Total**: 2-2.5h ✅

---

### Phase 5: Internationalization (1-1.5h)

**Copy from Vertical AI**:
- ❌ None (i18n keys are content, not code)

**New**:
- Add ~190 translation keys to `en.json`: **0.5h**
  - Section 13 provides all keys
  - Just typing JSON

- Run `pnpm translate`: **0.15h** (automated)

- Run `pnpm i18n:verify`: **0.15h** (automated)

- Manual verification: **0.5h**

**Total**: 1-1.5h ✅

---

## REVISED TOTAL: 11-15.5 hours

### Breaking Down the Savings

```
Original Estimate:     18-24 hours
Revised Estimate:      11-15.5 hours
Savings:              -40% (-6.5-8.5 hours)

Why?
├── Copy hierarchy-wall.tsx (1h) vs rebuild wall (3h) = -2h
├── Copy forms × 4 (2.5h) vs build (5h) = -2.5h
├── Copy wall builder (1.5h) vs build (3h) = -1.5h
└── Param reading is simple (1h) not complex = -1h
```

---

## Per-Developer Capacity

| Scenario | Time | Days |
|----------|------|------|
| **1 full-time dev** | 11-15.5h | **2-2.5 days** |
| **2 devs parallel** | 6-8h each | **1-1.5 days** |
| **1 dev part-time (5h/day)** | 11-15.5h | **2-3 days** |

---

## Risk Assessment (40% Reduction)

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Vertical AI code larger than expected | Low | Already reviewed components, know structure |
| 4th level (themes) adds complexity | Low | Junction table is standard pattern, tested pattern |
| Color token adaptation takes longer | Very Low | Global find-replace OKLCH tokens |
| Modal orchestration more complex | Low | Skeleton provided in PRD, straightforward |
| i18n takes longer | Very Low | Keys pre-listed, just typing + automated scripts |

**Contingency**: Add +1-2h if Vertical AI code refactoring needed (unlikely)

---

## Recommendation

**Use 11-15.5h (revised)** for planning:
- ✅ More realistic given we're porting
- ✅ Accounts for copy-paste + small adaptations
- ✅ Leaves buffer for edge cases
- ✅ Can complete in **2-3 days** with 1-2 developers

**NOT 18-24h** - that assumes building from scratch.

---

## Implementation Phases (Revised Hours)

```
Phase 1: Schema + Queries           2-3h   ████
Phase 2: Wall + Modals              2.5-3.5h ████
Phase 3: Admin Dashboard            3.5-5h ██████
Phase 4: Integration                2-2.5h ███
Phase 5: i18n                       1-1.5h ██
                                    ─────────
TOTAL:                              11-15.5h
```

---

**Updated**: January 21, 2026  
**Status**: Ready for implementation with revised estimates

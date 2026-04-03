# 🎬 Demo UI Extraction - Mini-App Pages Only

**Date**: January 21, 2026  
**Goal**: Extract & port main UI pages from 8 mini-apps into MyShortReel  
**Status**: ✅ **HIGHLY FEASIBLE**

> **Note**: Tool Selection Wall is a separate feature (see PRD). This document covers only the 8 mini-app UI ports.

---

## Simple Approach

✅ **Copy-paste main UI components. No mock data. No coming-soon overlays. Just the UI.**

- All source repos in same workspace = direct file copy
- Tech stack match = zero new dependencies (Next.js, React, TS, Tailwind, Radix UI)
- Side-by-side comparison while adjusting imports

**Total Effort**: 8-11 hours (mini-app UIs only)  
**Approach**: Copy files → comment out backend logic → adjust imports → done  
**Output**: 8 real UIs, non-functional

---

## 8 Mini-Apps - Main UI Extraction

| # | App | Source Repo | Copy | Comment Out + Imports | Total |
|---|-----|-------------|------|----------------------|-------|
| 1 | **Prompt Generator** | awesome-video-prompts | 15min | 30-45min | **45min-1h** |
| 2 | **Image Generator** | nano-banana-pro | 15min | 30-45min | **45min-1h** |
| 3 | **Image Editor** | easyedit | 20min | 45min-1h | **1-1.5h** |
| 4 | **Storyboard Generator** | Seq (storyboard module) | 20min | 30-45min | **50min-1h** |
| 5 | **Timeline Editor** | Seq (timeline module) | 30min | 1-1.5h | **1.5-2h** |
| 6 | **Compare Models** | v0-ai-image-generation-benchmark | 15min | 20-30min | **35-45min** |
| 7 | **Scene Generator** | ai-short-video-ad-creator | 20min | 45min-1h | **1-1.5h** |
| 8 | **Ad Assets Generator** | ad-assets-generator | 20min | 45min-1h | **1-1.5h** |
| | **TOTAL** | | **~2.5h** | **~6-8h** | **8-11h** |

---

## How It Works

1. **Copy files** from source repo (`app/page.tsx` + components)
2. **Paste into MyShortReel** at `/app/[locale]/tools/[app-name]/page.tsx`
3. **Comment out** API calls, mutations, generation logic
4. **Fix imports** (adjust paths, use MyShortReel components where needed)
5. **Done** - UI renders, non-functional

---

## Directory Structure

```
app/[locale]/tools/
├── page.tsx                    # Tool Selection Wall
├── prompt-generator/page.tsx
├── image-generator/page.tsx
├── image-editor/page.tsx
├── storyboard-generator/page.tsx
├── timeline-editor/page.tsx
├── compare-models/page.tsx
├── scene-generator/page.tsx
└── ad-assets-generator/page.tsx
```

---

## Per-App Notes

### 1. Prompt Generator (45min-1h)
**Source**: awesome-video-prompts  
**Copy**: `app/page.tsx` + carousel + category selector  
**Comment out**: AI enhancement, FAL.ai calls

### 2. Image Generator (45min-1h)
**Source**: nano-banana-pro  
**Copy**: Input panel + gallery layout  
**Comment out**: Gemini API calls

### 3. Image Editor (1-1.5h)
**Source**: easyedit  
**Copy**: Canvas + toolbar + effects panel  
**Comment out**: Canvas manipulation logic

### 4. Storyboard Generator (50min-1h)
**Source**: Seq (storyboard module)  
**Copy**: Step wizard UI + panel grid  
**Comment out**: AI generation, form handlers

### 5. Timeline Editor (1.5-2h) ⚠️ Most Complex
**Source**: Seq (timeline module)  
**Copy**: Timeline ruler, tracks, clips  
**Comment out**: Drag-drop, playback, FFmpeg

### 6. Compare Models (35-45min)
**Source**: v0-ai-image-generation-benchmark  
**Copy**: Table + model selector + image grid  
**Comment out**: Real API calls

### 7. Scene Generator (1-1.5h)
**Source**: ai-short-video-ad-creator  
**Copy**: 3-step wizard + style selector  
**Comment out**: Video generation

### 8. Ad Assets Generator (1-1.5h)
**Source**: ad-assets-generator  
**Copy**: Platform tabs + asset grid  
**Comment out**: Generation + download

---

## Priority Order

1. Tool Selection Wall (entry point)
2. Image Generator (quick win)
3. Prompt Generator (quick win)
4. Compare Models (simple)
5. Image Editor
6. Storyboard Generator
7. Scene Generator
8. Timeline Editor (most complex, do last)
9. Ad Assets Generator

---

## Summary

| Metric | Value |
|--------|-------|
| Total Apps | 8 mini-app UIs |
| Total Hours | **8-11h** |
| Dev Count | 1 dev |
| Timeline | **1-1.5 days** |
| Dependencies | Zero new packages |

> **Tool Selection Wall**: Built separately per PRD (11-15.5h with Convex backend, or 6-8h static)

---

**Last Updated**: January 21, 2026  
**Status**: Ready for implementation

# 🎬 MyShortReel

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Backend-Convex-ff6b6b?style=for-the-badge)](https://www.convex.dev/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Polar](https://img.shields.io/badge/Billing-Polar-0062FF?style=for-the-badge)](https://polar.sh/)

**MyShortReel** is an AI-powered video creation platform that transforms event invitations into professional cinematic experiences. Through a guided 8-step workflow, users become "directors" of their own 30-second invitation videos—combining AI-generated imagery, video synthesis, voice narration, and music into a polished final product.

---

## ✨ MVP — 8-Step Guided Director Workflow

The core product is the **guided workflow** (`app/[locale]/guided/`):

| Step | Name | Description |
|------|------|-------------|
| **1** | Emotional Foundation | Select occasion, theme, event details, and tell your emotional story |
| **2** | Story Crafting | Interactive AI chat to refine your narrative with the AI Director |
| **2b** | Visual Style | Choose from 18+ cinematic styles (Vintage, Y2K, Indie, Anime, etc.) |
| **3** | Scene Review | Review and customize auto-generated scenes |
| **3b** | Narration Script | Approve or refine the AI-generated narration script |
| **4** | Voice & Music | Select narrator voice (MiniMax) and generate AI music (Stable Audio) |
| **5** | Visual Design | Assign start/end frames per scene using AI generation or uploads |
| **6** | Review & Premiere | Final assembly with professional xfade transitions and audio ducking |

### 📊 Dashboard

- **Project Management** — Grid/list views with filtering and search
- **Asset Library** — Managed storage for images, videos, and audio
- **Credit System** — Per-user credits with full transaction history
- **Usage Analytics** — Real-time tracking of AI resource consumption
- **Templates** — System and user-created project templates
- **Account & Subscriptions** — Polar-powered billing with 3 tiers + credit packages

### 🌍 Internationalization

Full i18n support for **7 languages**:
- English (default)
- French, German, Spanish, Italian, Portuguese, Russian

All UI strings, AI prompts, and narration generation support multilingual output.

---

## 🧪 Post-MVP — Standalone AI Tools

Independent creative tools available at `app/[locale]/tools/`:

| Tool | Description |
|------|-------------|
| **Image Generator** | 9 AI models (Nano Banana Pro, Seedream v4, Kling, Grok, etc.) with schema-driven UI, T2I/I2I, save to project |
| **Voice Generator** | Multi-model TTS with voice recording, voice library, save to project |
| **Prompt Generator** | AI-powered prompt engineering assistant |
| **Storyboard Generator** | Canvas-first storyboard builder with 5 Kling Pro video models |

### 🛡️ Admin Panel

Content management at `app/[locale]/admin/`:
- Categories, subcategories, themes, meta-categories
- Refinement flows (guided question trees)
- Wall builder (drag-and-drop content curation)
- Ad management

---

## 🤖 AI Pipeline

MyShortReel orchestrates multiple AI services through [fal.ai](https://fal.ai):

| Task | Model | Provider |
|------|-------|----------|
| **Image Generation** | Nano Banana Pro (Gemini 3) | fal.ai |
| **Image Fallback** | Seedream v4 | fal.ai |
| **Image Tools** | Kling v3 T2I/I2I, Kling O3 I2I, Grok, Nano Banana 2, NB Pro Edit | fal.ai |
| **Video Synthesis** | Kling Video v2.5 Turbo Pro | fal.ai |
| **Video Tools** | Kling v3 Pro I2V, Kling O3 Pro I2V, R2V, V2V Edit, V2V Reference | fal.ai |
| **Voice Narration** | MiniMax Speech 2.6 HD | fal.ai |
| **Narration Fallback** | MiniMax Speech 2.6 Turbo | fal.ai |
| **Music Generation** | Stable Audio 2.5 | fal.ai |
| **Chat & Story** | GPT-4o | OpenAI |
| **Prompt Enhancement** | GPT-4o-mini | OpenAI |
| **Prompt Fallback** | Llama 3.1 8B Instruct | Together.ai |
| **Video Assembly** | Cloud FFmpeg (46 xfade transitions) | Rendi |
| **Audio Mixing** | Sidechain ducking + loudness normalization | Rendi |

> See [`docs/Understanding/ai-models-overview.md`](docs/Understanding/ai-models-overview.md) for full model details, pricing, and fallback strategy.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.2** — App Router with `[locale]` internationalized routing
- **React 19** — Concurrent features, Server/Client Components
- **Tailwind CSS 3.4** — Utility-first styling with CSS variables
- **Radix UI** — Accessible primitive components
- **Zustand** — Lightweight state management for scenes/video workflow
- **Framer Motion** — Animations and transitions
- **next-intl** — Full i18n routing and translations
- **Vercel AI SDK** — Streaming AI chat integration

### Backend
- **Convex 1.31** — Real-time database, serverless functions, file storage
- **Clerk 6.x** — Authentication, user management, organizations
- **Polar** — Subscription billing, credit packages, customer portal
- **Zod** — Runtime schema validation

### AI & Media Processing
- **fal.ai** — Unified gateway for Kling, Stable Audio, MiniMax, Gemini, Grok
- **OpenAI SDK** — GPT-4o for story generation and chat refinement
- **Rendi** — Cloud-based FFmpeg for video merging and audio mixing

### Development & Testing
- **TypeScript 5** — Full type safety across frontend and backend
- **Biome** — Fast linting and formatting
- **Vitest** — Unit testing for Convex functions
- **Jest** — Component and integration testing
- **Stagehand** — E2E browser testing

---

## 📁 Project Structure

```
MyShortReel-beta/
├── app/
│   ├── [locale]/
│   │   ├── guided/         # MVP: 8-step workflow (step-1 through step-6)
│   │   ├── dashboard/      # Dashboard (projects, account, templates)
│   │   ├── tools/          # Post-MVP: standalone AI tools
│   │   │   ├── image-generator/
│   │   │   ├── voice-generator/
│   │   │   ├── prompt-generator/
│   │   │   └── storyboard-generator/
│   │   ├── admin/          # Admin panel (categories, themes, walls, ads)
│   │   ├── watch/          # Public video player
│   │   ├── sign-in/
│   │   └── sign-up/
│   └── api/                # API routes (chat, step1, step3b, download-video)
├── components/
│   ├── adaptive/           # Responsive layout components
│   ├── admin/              # Admin panel UI
│   ├── ai-elements/        # Chat UI (conversation, messages, thread)
│   ├── asset-management/   # Asset selector for scenes
│   ├── credits/            # Credit modals and displays
│   ├── dashboard/          # Dashboard UI components
│   ├── image-generator/    # Image tool (9 models, schema-driven)
│   ├── prompt-generator/   # Prompt engineering tool
│   ├── refinement/         # Guided question flows
│   ├── scene-management/   # Frame assignment, scene editor
│   ├── storyboard-generator/ # Canvas-first storyboard UI (18 components)
│   ├── tools/              # Shared tool components (wall, model selectors)
│   ├── transitions/        # xfade transition picker
│   ├── ui/                 # shadcn/ui primitives
│   ├── video-generation/   # Video generator, regeneration chat
│   └── voice-generator/    # Voice tool (multi-model, recording, library)
├── convex/
│   ├── actions/            # AI integrations (14 action files)
│   ├── configs/            # Runtime configuration
│   ├── migrations/         # Schema migrations
│   ├── seed/               # Seed data (credits, models, transitions)
│   ├── schema.ts           # 36-table database schema (and growing)
│   └── *.ts                # Queries and mutations (35 entity files)
├── hooks/
│   ├── business-logic/     # Domain hooks (credits, scenes, video workflow)
│   └── responsive/         # Device detection hooks
├── lib/
│   ├── ai/                 # Prompt templates and cost calculation
│   ├── constants/          # App constants
│   ├── monitoring/         # Error tracking
│   ├── storyboard-generator/ # Storyboard logic
│   ├── tools/              # Wall configuration helpers
│   └── validation/         # Input validation
├── services/               # Service layer (AI chat, uploads, storage, video)
├── stores/                 # Zustand stores (scenes, video)
├── contexts/               # React contexts (breadcrumb, device)
├── providers/              # Convex client provider
├── messages/               # Translation JSON files (7 languages)
├── i18n/                   # next-intl configuration
├── scripts/                # Tooling (translate, verify-i18n, seed, test)
├── __tests__/              # Jest + Vitest test suites
├── tests/                  # AI language tests, E2E, voice recording
└── docs/
    ├── Guides/             # 24 implementation guides
    ├── Understanding/      # AI models overview, architecture docs
    └── Analysis/           # Feature analysis reports
```

---

## 🗄️ Database Schema (Convex)

36+ tables covering the complete data model:

| Table Group | Tables |
|-------------|--------|
| **Core** | `organizations`, `users`, `projects`, `scenes`, `assets`, `audioTracks`, `videos` |
| **AI Chat** | `chatMessages` |
| **Templates** | `templates` |
| **Billing** | `subscriptions`, `subscriptionTiers`, `creditBalances`, `userCredits`, `creditTransactions`, `creditCosts` |
| **Usage** | `usageTracking`, `activities`, `systemConfig` |
| **Sharing** | `sharedLinks` |
| **Transitions** | `transitionEffects` |
| **Tools (Post-MVP)** | `tools`, `toolCategories`, `toolSubCategories`, `toolThemes`, `toolSubCategoryThemes`, `toolWallConfigs` |
| **Image Tool** | `imageModelSchemas`, `imageToolHistory`, `imagePresets` |
| **Voice Tool** | `voiceModelSchemas`, `voiceToolHistory` |
| **Video Tool** | `videoModelSchemas` |
| **Admin** | `ads`, `refinementFlows`, `refinementQuestions`, `refinementSessions` |

---

## 🧪 Test Suite

**69+ test files** in `__tests__/` plus scripted AI & E2E tests:

| Category | Framework | Description |
|----------|-----------|-------------|
| **Convex Backend** | Vitest | Credits, subscriptions, Polar webhooks, security, edge cases, tools |
| **Components** | Jest | Dashboard, image generator, scene management, video generator |
| **Hooks** | Jest | useChatMessages, useFileUpload |
| **Integration** | Jest | Dashboard integration |
| **E2E** | Stagehand | Login, dashboard, guided flow (`tests/e2e/`) |
| **AI Language** | tsx scripts | Text, image, video, narration, music, voice, full pipeline (`tests/ai-language-support/`) |
| **Video Assembly** | Node scripts | xfade effects, 2-scene & full assembly (`tests/x-fade-effects-scripts/`, `tests/e2e/`) |

```bash
pnpm test                  # Jest (components, hooks)
pnpm test:convex           # Vitest (Convex functions)
pnpm test:image-generator  # Vitest (image generator suite)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **pnpm** (recommended)
- Accounts: [Clerk](https://clerk.com), [Convex](https://convex.dev), [fal.ai](https://fal.ai), [Polar](https://polar.sh)

### Installation

```bash
# Clone the repository
git clone https://github.com/jacquesdahan/MyShortReel-beta.git
cd MyShortReel-beta

# Install dependencies
pnpm install

# Set up environment variables (see below)
cp .env.example .env.local

# Start Convex backend
npx convex dev

# Start Next.js development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=...

# AI Services (fal.ai gateway)
FAL_KEY=...

# OpenAI (story generation, chat)
OPENAI_API_KEY=sk-...

# Together.ai (fallback)
TOGETHER_API_KEY=...

# Rendi (video assembly)
RENDI_API_KEY=...
```

---

## 📜 Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Lint with Next.js ESLint config

# Testing
pnpm test             # Run Jest tests
pnpm test:watch       # Jest watch mode
pnpm test:coverage    # Jest with coverage
pnpm test:convex      # Run Vitest for Convex functions
pnpm test:convex:watch
pnpm test:image-generator       # Image generator test suite
pnpm test:image-generator:watch

# E2E AI Language Tests
pnpm test:lang:text       # Test text generation
pnpm test:lang:image      # Test image generation
pnpm test:lang:video      # Test video generation
pnpm test:lang:narration  # Test narration generation
pnpm test:lang:music      # Test music generation
pnpm test:lang:pipeline   # Full pipeline test

# Localization
pnpm translate        # AI-powered translation sync
pnpm i18n:verify      # Verify translation completeness
```

---

## 📖 Documentation

24 guides in `docs/Guides/`:

| Guide | Topic |
|-------|-------|
| `adding-a-new-image-model.md` | Zero-code image model onboarding (4 steps) |
| `adding-a-new-video-model.md` | Zero-code video model onboarding (4 steps) |
| `api-integration-guide.md` | API integration patterns |
| `clerk-authentication-setup.md` | Clerk auth configuration |
| `component-library.md` | Component reference |
| `convex-database-schema.md` | Full schema documentation |
| `convex-setup.md` | Convex development setup |
| `data-flow-architecture.md` | Architecture & data flow |
| `deployment-guide.md` | Production deployment |
| `design-system.md` | Design tokens & system |
| `disaster-recovery-plan.md` | DR procedures |
| `environment-variables.md` | All env vars documented |
| `HOW-TO-SET-ADMIN.md` | Admin role setup |
| `integration-testing-plan.md` | Testing strategy |
| `nextjs-i18n-implementation-guide.md` | Next.js i18n patterns |
| `performance-optimization.md` | Performance best practices |
| `polar-subscription-setup-guide.md` | Polar billing integration |
| `rendi-ffmpeg-api-guide.md` | Video assembly with Rendi |
| `security-best-practices.md` | Security guidelines |
| `translation-implementation-strategy.md` | i18n strategy |
| `troubleshooting-guide.md` | Common issues & fixes |
| `updated clerk users in convex.md` | Clerk↔Convex user sync |
| `vercel-deployment-checklist.md` | Vercel deploy checklist |
| `video-storage-convex-vs-cloudflare-r2.md` | Storage architecture decision |

---

## 🗺️ Roadmap

- [x] **Core UI** — 8-step guided workflow
- [x] **Real-Time Backend** — Convex with multi-device sync
- [x] **AI Orchestration** — Kling, MiniMax, Stable Audio, Gemini, Grok
- [x] **Video Assembly** — 46 xfade transitions via Rendi
- [x] **Credit System** — Per-user credits with transaction history
- [x] **Internationalization** — 7 languages with AI-assisted translation
- [x] **Payments** — Polar integration for subscriptions + credit packages
- [x] **Image Generator Tool** — 9 schema-driven AI models
- [x] **Voice Generator Tool** — Multi-model TTS with recording
- [x] **Storyboard Generator** — Canvas-first with 5 video models
- [x] **Admin Panel** — Categories, themes, walls, refinement flows
- [ ] **Mobile** — Hybrid app deployment (iOS/Android)

---

## 📝 License

Proprietary. All rights reserved.

---

Built with ❤️ by the MyShortReel Team

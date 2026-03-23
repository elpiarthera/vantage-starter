# Changelog

All notable changes to VantageStarter are documented in this file.

## [Unreleased]

### Changed (Day 17 — v0.app design system)
- **Design tokens**: Adopted v0.app's complete OKLCH token set as dark-first defaults — background oklch(0.145), card oklch(0.205), border oklch(1 0 0 / 10%), radius 0.625rem
- **Preset**: Removed .dark block — root IS dark now (v0.app dark-first pattern)
- **Token consolidation**: ALL tokens moved to single preset file (base.css). Removed duplicate/conflicting definitions from globals.css `:root` and `.dark` blocks. Single source of truth.
- **CRITICAL FIX**: tailwind.config.ts was double-wrapping oklch — `oklch(var(--X))` when vars already contain `oklch(...)`. Changed ALL color defs to `var(--X)` directly. This was causing ALL semantic colors to be invalid CSS.
- **Dashboard**: Reverted hardcoded gray-* back to semantic tokens (bg-background, bg-card, border-border) which now resolve to v0 values
- **Typography**: Replaced Inter + Space Grotesk with Geist + Geist Mono (v0.app font stack)
- **Sidebar**: Added collapse/expand toggle button with double-chevron icon in footer (collapsible="icon" already supported)
- **Architect page**: Removed sessions sidebar — sessions list now inline in main content. Removed 4 nav layers → 1. Eliminated hardcoded blue-tinted bg `oklch(0.115 0.01 240)`
- **Sidebar v2**: Moved collapse toggle to header (panel icon), removed footer. Proper section separators.
- **Architect v2**: Sessions in card containers, CTA button styled (bg-primary), empty state vertically centered
- **Dashboard home cards**: Removed shadcn Card shell, replaced with native `div.bg-card.border.border-border.rounded-xl.p-6`
- **Sidebar v3**: Toggle moved to DashboardHeader (always visible), `collapsible="offcanvas"` — sidebar fully hides when collapsed, trigger remains accessible. DashboardHeader: lucide-react replaced with inline SVGs.
- **Dashboard cards**: Credit Balance, Architect CTA, Recent Sessions wrapped in `bg-card rounded-xl` card containers. Page spacing `p-6 md:p-8 space-y-6`.
- **MSR cleanup**: Deleted 10 `--ig-*` MyShortReel layout variables from globals.css
- **Missions page**: Added `rounded-xl` to card skeletons for visual consistency
- **Hooks**: Updated block-orchestrator-code-edits.py with subagent flag detection, enforce-brief-template.py with background enforcement
- **Hooks v2**: Added post-agent-qa.py (advisory QA reminder after agent completes). Simplified settings.json — removed crashing PreToolUse/PostToolUse hooks.
- **Infrastructure**: Added check-messages skill, brief templates (brief-ui.md, brief-backend.md), v0 reference screenshots
- **Sidebar v4**: Tokens match page bg (oklch 0.145 — seamless blend). Active item uses bg-accent fill instead of left-border. Removed .dark sidebar overrides.
- **Sidebar v5**: hover:bg-sidebar-accent on all items, active uses bg-sidebar-accent, rounded-md pill shape, section labels lighter (11px, 60% opacity)
- **Header v2**: Decluttered — LanguageSwitcher hidden on desktop, credits show number only (no badge), avatar only on desktop (no name/chevron). Height reduced to h-12/h-14.
- **Missions page**: Responsive card grid (1/2/3 cols), v0-style cards (bg-card, rounded-xl, hover border), centered empty state with styled CTA.
- **Sidebar v6**: Hover-to-open — `collapsible="icon"` (3rem icon strip when collapsed), `onMouseEnter`/`onMouseLeave` floats sidebar over content as overlay (v0.app behavior). Logo text hidden when collapsed.
- **Hooks**: Added enforce-peer-brief-format.py. Updated screenshots.
- **Sidebar v7**: Fixed bg seam — `--sidebar-background` changed from `oklch(0.205)` to `oklch(0.145)` matching `--background`. Seamless blend like v0.app.
- **Chat page**: Removed purple accents — header icon, live indicator, empty state all use neutral tokens (bg-muted, text-muted-foreground). Input area wrapped in bg-card rounded-xl.
- **Architect page**: Sessions in rounded-xl cards with hover states. "New session" button styled as CTA (bg-primary). Labels lightened. Removed lucide-react + shadcn ScrollArea.
- **Account page**: Tab active indicator uses border-foreground (not blue). Profile sections in rounded-xl cards. Inputs match v0 styling (bg-transparent, border-input). Replaced 6 lucide-react icons with inline SVGs.

### Fixed (Day 17 — app UI alignment)
- **AdaptiveNavigation**: Replaced 7 hardcoded hex colors (#223649, #314d68, #0d7ff2) with semantic tokens (bg-muted, bg-primary, text-muted-foreground)
- **DashboardHeader**: `text-red-600` → `text-destructive`, `bg-red-500` → `bg-destructive`
- **ErrorState**: `text-red-500/400` → `text-destructive`, `border-red-500/30` → `border-destructive/30`
- **ProfileTab**: `bg-red-600` → `bg-destructive`, warning banner classes already semantic
- **PurchaseCreditsModal**: `text-green-500` → `text-success`
- **DashboardHeader**: Replaced semantic tokens with explicit gray-*/dark: classes matching landing (border-border → border-gray-200/800, bg-background → bg-white/gray-950)
- **AccountTabs**: Active tab underline border-primary → border-gray-900/100, hover states → gray-50/800
- **ActivityFeed + QuickActions**: Card borders/backgrounds aligned to landing card pattern (gray-200/800, white/gray-900)

### Changed (copy-source pass)
- **FeaturesSection**: Copied litui.dev Features.tsx structure — uniform card grid, gray-*/dark: classes, hover gradient overlay, icon inversion, reveal animation
- **CTASection**: Copied litui.dev Cta.tsx — inline command block, native anchor CTAs, floating circles, reveal with staggered delays
- **LandingFooter**: Copied litui.dev Footer.tsx — link underline animation, social icon hover lift, gray-*/dark: classes
- **HeroSection**: Copied litui.dev Hero.tsx — exact badge, terminal chrome, CTA button styles

### Fixed
- **Blank page**: Added missing `animate-fade-in-up` keyframe to globals.css — hero elements had `opacity-0` but animation class was undefined, making all content invisible
- Stagger delays updated to match litui.dev timing (0.1s increments instead of 0.05s)
- Added missing `@keyframes float` — CTA decorative circles had no animation
- Added missing `.reveal-scale` + `.reveal-scale.revealed` — TechStack logos weren't animating
- **Visual alignment pass** (screenshot comparison vs litui.dev):
  - Removed gray gradient bands: FeaturesSection bg overlay + TechStack section fades
  - Hero cycling words brighter (`oklch(0.90)` up from `0.80`)
  - Pricing cards: `bg-card/border-border` → `bg-white dark:bg-gray-900 / border-gray-200 dark:border-gray-800`
- **Nav copy-source**: Replaced all OKLCH tokens with litui.dev's exact gray-*/dark: classes (13 substitutions)
- **Features**: Restored subtle `bg-gradient-to-b from-gray-50/50` overlay matching litui.dev
- **card-elevated**: Lighter resting shadow matching litui.dev (was too heavy)
- **grid-pattern**: Solid lines `oklch(0.95)` matching litui.dev (was semi-transparent `oklch(0.93/0.5)`)
- Fixed `hero-gradient` light mode: was dark overlay (`oklch(0.16)`), now light bloom (`oklch(0.92)`) matching litui.dev
- Added dark mode variant for `hero-gradient`
- FeaturesSection: added missing subtitle paragraph under h2 (litui.dev parity)
- **Page bg**: `bg-background` → `bg-white dark:bg-gray-950` matching litui.dev exactly
- **CSS fades**: `.bottom-fade`, `.section-fade-top/bottom` now use explicit oklch + `.dark` variants instead of `var(--background)`
- **ThemeToggle**: Replaced shadcn Button + lucide-react with litui.dev's exact plain button + inline SVG sun/moon
- **Gray palette**: Overrode Tailwind's blue-tinted default grays with pure achromatic `oklch(X 0 0)` values matching litui.dev — eliminates blue cast on all `gray-*` classes
- **FAQ accordion**: Added missing `value` prop to `<lui-accordion-item>` — clicks were non-functional without it
- **Pricing buttons**: Replaced `<ui-button>` with native `<a>` elements styled per litui.dev (rounded-xl, px-6 py-3, font-semibold)
- **Auth pages**: Clerk appearance ported to monochrome grayscale — all blue-tinted hex replaced with pure achromatic grays, rounded-2xl cards, white CTA button. Sign-in/sign-up pages use `bg-gray-950`
- Removed reference screenshots (litui-reference.png, vantage-starter-current.png) from repo

### Added
- **Onboarding**: `project-context.md` generated via interactive 7-phase setup (identity, design, stack, env)
- **Design system**: Monochrome grayscale preset (zero chroma OKLCH) adopting litui.dev's color system
- **Hero section**: Ported litui.dev Hero design — glassmorphic badge with ping dot, dual side blobs with pulse, responsive headline with `text-gradient`, `code-block` terminal with `terminal-glow`, removed tech logos strip
- **CSS utilities**: Added `.code-block`, `.terminal-glow`, `.text-gradient` classes to globals.css
- **Orchestrator v1**: 8 specialist agents, AGENTS.md, lit-ui skills, background enforcement hooks

### Changed
- Replaced Dark Electric Blue preset (hue 232) with pure monochrome grayscale across all tokens
- Stripped all hue/chroma from globals.css (secondary, input, sidebar, chart, grid pattern, hero gradient)
- Hero layout from full-viewport centered to litui.dev's padding-based approach (`pt-32 pb-20`)
- LandingNav: converted all `gray-*` + `dark:` classes to OKLCH token classes (text-foreground, bg-muted, etc.)
- Pricing: replaced non-existent `var(--accent-warm)` with grayscale tokens, fixed eyebrow typography
- **CTA section**: New `CTASection.tsx` — ported litui.dev Cta.tsx with reveal animations, floating blobs, terminal block, i18n keys (en/fr)

### Fixed
- Hero cycling words invisible — `.text-gradient` was overriding `-webkit-text-fill-color` on animated words
- FAQ questions empty — accordion items used `slot="trigger"` instead of `slot="header"`
- Hero CTA arrow icon wrapping to second line — added flex layout to icon-end slot span
- **CRITICAL**: Added `.focus-ring` class to globals.css — keyboard focus was invisible on all nav elements (WCAG 2.4.7)
- **i18n**: Replaced 7 hardcoded English strings with `t()` calls (Hero badge, copy buttons, Nav aria-label) + added en/fr keys
- `hover:bg-white/5` → `hover:bg-foreground/5` in HeroSection (non-OKLCH literal)
- `.text-gradient` now uses `var(--foreground)`/`var(--muted-foreground)` tokens instead of hardcoded OKLCH
- Section padding consistency: Pricing + FAQ now use `md:py-32`, CTA added `lg:px-12`
- Pricing cards `rounded-none` → `rounded-2xl` for consistency with other card styles
- **App UI OKLCH port**: Converted 5 dashboard/shared components from hardcoded hex/gray to OKLCH tokens:
  - `step-header.tsx`: 13 violations — all inline `style={{}}` removed, hex (#182634, #314d68, #0d7ff2) → bg-card, bg-muted, bg-primary
  - `ProfileTab.tsx`: hex + gray + red classes → bg-card, border-border, text-foreground, bg-destructive
  - `ErrorState.tsx`: hex → bg-card, border-border, text-muted-foreground
  - `EmptyState.tsx`: text-white → text-primary-foreground, gray-400 → text-muted-foreground
  - `TabNavigation.tsx`: slate-800/700 → bg-card/border-border, blue-600 → bg-primary
- **Hero visual alignment** (litui.dev parity):
  - Cycling words brighter — `oklch(0.80 0 0)` instead of faded muted-foreground
  - Badge glassmorphic — `bg-foreground/5 border-foreground/10` with backdrop-blur
  - Terminal chrome — dots grouped in `flex gap-1.5`, label with `ml-2 font-medium`, `p-5` padding
  - CTA buttons — native anchors with `bg-foreground text-background`, `px-7 py-3.5`, `font-bold`, `rounded-xl`
  - H1 spacing — `mb-8` for more breathing room

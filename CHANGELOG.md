# Changelog

All notable changes to VantageStarter are documented in this file.

## [Unreleased]

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

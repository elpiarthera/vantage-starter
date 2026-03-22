# Changelog

All notable changes to VantageStarter are documented in this file.

## [Unreleased]

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

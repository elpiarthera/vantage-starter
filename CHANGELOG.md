# Changelog

All notable changes to VantageStarter are documented in this file.

## [Unreleased]

### Fixed (2026-07-16 — disabled subscription tier still granted credits at the server enforcement point)

- **`convex/subscriptionTiers.ts:22-38`** (`getByPolarProductId`): the internal query only filtered by `polarProductId`, ignoring `isActive` — a disabled offer was correctly hidden from the public `listCreditPackages`/`listSubscriptionPlans` queries (UI-only guard) but the two grant paths that resolve a tier through this same lookup kept honoring it. Fixed at the choke point: the query now returns `null` for a disabled tier exactly as it already does for an unknown `polarProductId`, so every current and future caller inherits the guard. Decision recorded below.
- **`convex/credits.ts:811-822`** (`addMonthlyRenewalCreditsFixed`): this mutation queries `subscriptionTiers` directly via `ctx.db` (not through `getByPolarProductId`), so it needed its own guard — added an explicit `if (!tier.isActive)` check returning `{ success: false, reason: "tier_disabled" }`, following the file's existing `reason` literal idiom (`tier_not_found`, `tier_has_no_monthly_credits`).
- **Choke-point vs call-site decision**: `getByPolarProductId` has exactly two callers, both in `convex/http.ts` — `order.paid` (a grant path) and `subscription.updated` (tier bookkeeping only, not a grant). Filtering `isActive` at the choke point also affects the bookkeeping caller: a subscription pointing at a now-disabled product will no longer have its `tierKey` updated, logging `"Unknown productId — tier not found in DB"` instead. This is accepted as correct behavior — a disabled tier should not be newly assigned to any subscription either — and matches the security test in this repo that asserts `getByPolarProductId` returns `null` for `isActive: false` — a test that was already failing, i.e. this defect had a test naming it and the test sat red.
- **Tests**: `__tests__/convex/polar-security.test.ts` — 2 new tests added reproducing the full grant paths (`order.paid` via `getByPolarProductId` + `addPurchaseCredits`, and the renewal path via `addMonthlyRenewalCreditsFixed`), both proven RED before the fix (verbatim in PR), plus a test in the same file that was already red and is now green as a side effect. Full Convex suite: 178 passed of 188 counted — but that denominator is not the truth and is not cited as one: 5 suites never start at all (`voiceModels`, `actions/logAIUsage-userId`, `actions/videoPolling`, `actions/voiceProcessing`, `actions/voiceToolGeneric` — they import modules that no longer exist), so their cases are counted nowhere. A suite that never starts is not a pass. The 10 counted failures are outside this diff (absent Polar product env vars, an unrelated watch-page test); they are this repo's debt, not an inheritance.

### Fixed (2026-07-16 — le sélecteur de langue était caché sur desktop, task k171m3z330h6yce9jq86yvgkcs8amjhs)

- **`components/dashboard/DashboardHeader.tsx`**: le correctif tient en **une ligne**. Le sélecteur de langue n'était pas absent — il existait (`components/shared/LanguageSwitcher.tsx`, rendu l.310) mais était enveloppé dans `<div className="md:hidden">`, donc **invisible sur desktop**. La revue visuelle concluait « pas de switcher dans le header » ; l'artefact disait « switcher mobile-only ». Le brief initial partait de la première lecture et demandait de porter le `locale-switcher` de vantage-registry : le port a été construit, puis **jeté**, parce qu'il aurait livré deux sélecteurs côte à côte et remplacé le composant existant par un moins capable.
- **Pourquoi l'existant gagne** — il fait strictement plus que la référence qu'on voulait porter : il **persiste la préférence en base** (`useMutation(api.users.updateLanguagePreference)` quand l'utilisateur est connecté) là où la référence ne fait que router ; il importe déjà `usePathname`/`useRouter` depuis `@/i18n/routing`, donc il gère correctement `localePrefix: "as-needed"` (la locale par défaut n'a pas de préfixe : un port naïf faisant `pathname.split("/")` aurait pris `dashboard` pour une langue) ; et il porte `min-h-[44px]`, la cible tactile conforme. Reuse-first ne veut pas dire « porter le composant d'un autre repo », mais « réutiliser le meilleur qui existe » — ici il était déjà dans le dépôt.
- **`components/shared/LanguageSwitcher.tsx`** — deux défauts corrigés au passage : (1) `import { Globe } from "lucide-react"` → SVG inline, `CLAUDE.md` bannit lucide-react ; (2) les 7 locales étaient **tapées à la main** dans un tableau, faux dès qu'une langue est ajoutée à `routing.locales` — la liste est désormais **dérivée** (`routing.locales.map(...)`), `localeMeta` ne servant plus qu'à fournir un label/drapeau, une locale inconnue s'affichant via son code plutôt que d'être silencieusement absente.
- **Commentaires remis en accord avec le code**: `{/* Language Switcher — mobile only */}` et l'en-tête de bloc `{/* Right: Language Switcher (mobile only) + … */}` mentaient une fois le `md:hidden` retiré. Un commentaire faux est une dette : il survit au code qu'il décrit et trompe le prochain lecteur.
- **Tests**: 3/3 (`__tests__/components/shared/LanguageSwitcher.test.tsx`), écrits en RED avant le correctif. Le test **compte `routing.locales.length`** au lieu d'asserter « 7 » : un test qui fige le nombre à la main reproduit le défaut qu'il est censé garder.

### Added (2026-07-16 — audit du plugin 36 agents : le chiffre n'a jamais existé, task k174wtt4gnf0t4ynphqjw0nnqs8amyyd)

- **`docs/audits/plugin-36-agents-implementation-state-2026-07-16.md`**: audit read-only du claim FAQ *"A Claude Code plugin with 36 specialized agents"* (7 locales). Verdict **ABSENT**, et le chiffre n'est pas seulement faux aujourd'hui — **il n'a jamais été vrai**. Compte dérivé à chaque commit ayant touché `.claude/agents/` (`git ls-tree -r --name-only <sha> -- .claude/agents/ | grep -c '\.md$'`), jamais recopié :

  | commit | date | agents |
  |---|---|---|
  | `c306c40` / `f54eb9c` | 2026-03-19 | 7 |
  | `e928aee` | 2026-03-22 | 8 |
  | `82c1ac3` | 2026-03-26 | 24 |
  | `32ad46b` | 2026-04-03 | **25** ← maximum historique |
  | `c7072ea` | 2026-04-06 | **0** |

  Le maximum jamais atteint est **25**, jamais 36. `git ls-files .claude/agents/ | wc -l` → **0** : un développeur qui clone ce repo reçoit **zéro** agent. Aucun plugin produit n'existe (pas de `.claude-plugin/` à la racine ; les `plugin.json` trouvés appartiennent aux skills Clerk tierces sous `.agents/skills/`), et `npm view vantagestarter-agents` → **404**.
- **`CLAUDE.md:265` — la démonstration parfaite de la règle-mère**: la ligne annonce *"agents/ # 7 specialist agents"*. Ce 7 **était vrai** — le 2026-03-19. Puis l'artefact a bougé (7 → 8 → 24 → 25 → 0) et la ligne, elle, n'a pas bougé. *Une valeur tapée à la main est un mensonge en sursis : elle est vraie à l'instant où on l'écrit, et le monde bouge.* Le fichier qui énonce `derive-never-type` en est l'illustration.
- **Cause de la disparition, identifiée**: `c7072ea` (*"design configurator + Luma default + Tailwind v4 upgrade"*) a supprimé les 25 agents **en collatéral**, sans rapport avec son objet — 3 jours après le pic de 25. `git show --diff-filter=D --name-only c7072ea -- '.claude/agents/' | grep -c '\.md'` → 25.
- **Écart nommé par nommé**: la FAQ nomme 6 spécialités (frontend dev, Convex expert, Clerk expert, security auditor, SEO specialist, product manager). Les 6 sont absentes aujourd'hui ; 5 ont existé historiquement sous de vrais fichiers avant suppression ; **"product manager" n'a jamais existé** sous ce nom — seul un `product-launcher.md`, distinct, a existé.
- **Distinction tenue**: les 10 agents installés dans le workspace aujourd'hui sont de l'**outillage d'orchestrateur**, pas un **plugin produit livré**. Ils ne sont pas suivis par git et ne comptent pas pour la promesse client — l'audit ne confond jamais les deux.

### Added (2026-07-16 — audit Generative UI : la copie client vend une techno écartée, task k17ac7wkk8maer07re8edttw3x8an9rh)

- **`docs/audits/generative-ui-implementation-state-2026-07-16.md`**: audit read-only confrontant la FAQ au code. La FAQ vend *"out of the box with **tambo** orchestration"* (`messages/en.json:2654, 2669, 2675`, traduit en **7 langues**) — or `tambo` n'est ni importé, ni une dépendance : `grep -rni 'tambo' --include='*.ts' --include='*.tsx' app components lib hooks providers convex src scripts` → **0 hit**, `grep -c 'tambo' package.json` → **0**. Pire que l'absence : l'équipe l'avait **explicitement écarté**, `docs/GENERATIVE-UI-COMPARISON.md:14` (daté 2026-03-20) tranche *"json-render (rendering) + Vercel AI SDK v6 — **skip tambo** and OpenGenerativeUI entirely"*, et `docs/ORCHESTRATION-PLAN.md:33` le range sous *"Rejected alternatives"*. La copie client vend donc la décision inverse de la décision prise. Un document de plan a le droit de discuter tambo ; une FAQ n'a pas le droit de le vendre — la distinction est faite claim par claim dans le rapport.
- **`json-render` — PARTIEL, et l'écart porte sur la garantie elle-même**: le flux existe et fonctionne (`app/api/architect/chat/route.ts:214-218` → parsing JSONL → `Renderer` → commit Convex), mais il repose sur `streamText({ model, system, prompt })` en texte libre — **sans `tools`, sans `generateObject`/`streamObject`, sans schéma**. Les schémas Zod de `lib/json-render/catalog.ts` sont du code mort : `vantageOSCatalog` → **0 consommateur** hors sa propre définition, `validateSpec` → **0 hit** dans tout le code applicatif. La promesse « structured output » repose en réalité sur une convention de prompt que rien ne valide à l'exécution.
- **Limite déclarée, pas maquillée**: le comportement du modèle à l'exécution est **non prouvé** — aucune clé AI dans cet environnement. Le rapport dit ce qu'il faudrait pour le prouver (`pnpm dev` + clé réelle + aller-retour chat) plutôt que de conclure. Un « non prouvé » honnête vaut mieux qu'un « fonctionne » supposé.
- **Défaut bonus relevé**: `messages/en.json:2675` vend aussi *"shadcn/ui"* dans la même phrase, que `CLAUDE.md` bannit explicitement au profit de lit-ui. Hors périmètre de cet audit, signalé plutôt que tu.

### Fixed (2026-07-16 — T0bis, couleurs codées en dur, task k17bgg3cvy0sps55j543dvtkrn8amqgq)

- **`app/[locale]/sign-in/…/page.tsx`, `app/[locale]/sign-up/…/page.tsx`, `lib/monitoring/errorBoundary.tsx`, `components/adaptive/AdaptiveNavigation.tsx`**: 16 couleurs codées en dur remplacées par les tokens sémantiques. Le critère n'est pas une opinion, il est mesuré : `grep -c 'dark:'` → **0** sur ces fichiers, donc chacun ne livrait qu'une seule variante de thème et violait frontalement `vantage-design-system` §3 (*"Every new screen ships both a dark and a light variant. Neither is optional."*). Deux écrans plein écran (auth, error boundary) et la navigation adaptative étaient concernés.
- **Régression rattrapée à la relecture du diff — le trou était dans le brief**: `components/adaptive/AdaptiveNavigation.tsx:66` gardait `<h3 className="text-white">`. Tant que le composant était fixé en sombre (`bg-[#223649]`, `border-gray-600`), ce blanc fonctionnait ; une fois le conteneur rendu thème-sensible, il devenait **blanc sur fond clair — titre invisible en thème clair**. Le motif de vérification du brief n'incluait pas `text-white`, donc le sub-agent ne pouvait pas le voir et sa vérif passait au vert. C'est la migration partielle réintroduite par la correction elle-même, exactement le défaut qui avait cassé la sidebar en Tailwind v4 : un grep incomplet rend un vert parfait sur du code faux. Les `bg-green-500 text-white` (l.55, 129) sont conservés — blanc sur vert opaque, lisible dans les deux thèmes.
- **`components/landing/HeroSection.tsx`**: aucune classe modifiée, exception déclarée en commentaire sur place (maquette de terminal, sombre par nature dans les deux thèmes).

### Added (2026-07-16 — garde CI couleurs, task k17bgg3cvy0sps55j543dvtkrn8amqgq)

- **`.github/workflows/quality.yml`**: nouveau gate *"No literal hex colours in Tailwind brackets"*. Un hex littéral dans un bracket (`bg-[#0d7ff2]`) est une couleur qui **ne peut pas suivre le thème** — elle rend à l'identique en clair et en sombre, donc l'écran ne ships qu'une variante. Le périmètre est étroit **délibérément** : la classe est à zéro repo-wide aujourd'hui, donc le gate est **vert sur le commit qui l'introduit** et garde une régression au lieu d'annoncer une dette. Un gate rouge à l'arrivée se fait désactiver dans la semaine et ne protège rien. Trois issues, jamais deux (0 propre / 1 violation / 2 ne peut pas mesurer) : « je n'ai pas pu mesurer » ne doit jamais afficher le même écran que « c'est propre ».
- **Sonde de morsure par mutation sur matériau étranger** — une sonde écrite par l'auteur du matcher prouve seulement qu'il se comprend lui-même. Mutation injectée dans **trois fichiers non choisis et non corrigés** (`PricingSection.tsx`, `ModelSelector.tsx`, `LandingNav.tsx`), avec **assertion que chaque mutation a atterri** (`grep` sur l'injection — une sonde qui n'asserte pas sa propre injection n'est pas une sonde). Résultat : vert à l'arrivée → 3 mutations atterries → **garde rouge nommant les 3 sites** → restauration prouvée par `git diff` vide.
- **Famille `bg-gray-*` déclarée non gardée**: 71 occurrences légitimes subsistent (contrepartie `dark:` présente, rendu correct dans les deux thèmes). Les gater aujourd'hui rendrait le workflow rouge à l'arrivée. Déclarée ici plutôt que tue — une divergence déclarée est une décision, une divergence tue est une dette.

### Added (2026-07-16 — T0bis, inventaire des couleurs codées en dur, task k17bgg3cvy0sps55j543dvtkrn8amqgq)

- **`docs/audits/t0bis-hardcoded-colors.md`**: inventaire committé **avant** la correction, pour qu'il se relise indépendamment du diff qui le traite. Trois choses y sont établies plutôt qu'affirmées. (1) Le compte brut de 1632 littéraux couleur n'était pas faux, il n'était pas *qualifié* : **1392 d'entre eux SONT le système de tokens** (`styles/`, `lib/design-system/`, `lib/create/themes.ts`, `app/globals.css`), où un `oklch()` est la définition du token et non sa violation — agir sur le brut aurait « corrigé » le système lui-même. Restent 240 candidats réels. (2) Les 16 lignes BROKEN retenues sont vérifiées une à une sur l'artefact (`sed -n` sur chaque `file:line`) et partagent un critère mesuré, pas supposé : `grep -c 'dark:'` → **0** sur les trois fichiers concernés, donc ils ne livrent qu'une seule variante et violent frontalement `vantage-design-system` §3 (*"Every new screen ships both a dark and a light variant"*). (3) La norme est citée depuis `.claude/skills/` (versionnée localement), jamais depuis une URL raw d'un repo privé qu'aucun sub-agent ne peut lire — une norme non lisible produit un audit sans norme.
- **Faux positif écarté à la relecture**: `components/landing/HeroSection.tsx:20,22-24,26,30,41` classé BROKEN par l'audit automatique alors qu'il décrivait lui-même ces lignes comme *"terminal mockup fixed to dark colors"* — et classait le même motif NORM dans `components/create/picker.tsx`. C'est une maquette de terminal (barre de titre, pastilles macOS rouge/jaune/verte, bloc de code) : sombre dans les deux thèmes par nature, comme un bloc de code. Mapper `bg-gray-700` → `bg-muted` aurait rendu les pastilles dépendantes du thème et blanchi la maquette en thème clair — la « correction » cassait le design. Conservé, exception déclarée en commentaire sur place : une divergence déclarée est une décision, une divergence tue est une dette.
- **Fiabilité de l'audit automatique, consignée**: le sub-agent annonce « 11 BROKEN » quand sa propre table en porte davantage (total *tapé*, jamais compté — la maladie que cet audit combat), et revendique *"All counted hits were opened and read in context"* en 2 tool uses, arithmétiquement impossible pour ~40 fichiers. Ses **observations** sont exactes après vérification ; ses **totaux** et ses **auto-évaluations** ne le sont pas. On retient les unes, jamais les autres.
- **Trois dimensions déclarées non couvertes, pas omises**: T0bis se fonde sur quatre dimensions ; une seule dispose d'une norme versionnée localement. `grep -rniE 'arbitrary value|tailwind scale|gap.*margin|mobile-first' .claude/skills/` → **0 hit** — valeurs arbitraires, `gap` vs `margin` et ordre mobile-first n'ont aucune norme installée. Les auditer contre une règle restituée de mémoire produirait un inventaire invérifiable. Bloquées sur l'installation de la norme, escaladé à Pi (`jn77nrpvm8ndarpjahqnhgv78s8amx2f`), jamais reportées à « plus tard ».

### Fixed (2026-07-16 — dashboard crash + broken layout, task k174bc5tnxyv1b4m531kckwks18amxhq)

Four defects of a single family: a value the toolchain could have checked, never checked — each failing silently.

- **`package.json`**: declared `@ai-sdk/gateway@^3.0.66`, imported by `convex/http/agent.ts`, `convex/http/ai.ts`, `lib/ai/agents.ts` and `lib/ai/providers.ts` but never declared. `convex deploy` failed at bundling, so the backend had **never** been deployed: `npx convex function-spec` returned 3 functions belonging to an unrelated project (`diagnostic.js`, `notifications.js`), and `users:syncUser` did not exist — the dashboard threw a client-side exception on every load. Pinned to 3.x deliberately: `ai@6.0.116` bundles gateway 3.0.66, and 4.0.21 pulls `@ai-sdk/provider` v4 against the v3 the AI SDK expects. The Vercel build passed throughout, since Next.js does not compile Convex functions.
- **`convex/{chats,customFrameworks,customPersonas,customRoles}.ts`**: fixed 5× TS18047 blocking `convex dev --once`. `workspace` is a `let` narrowed by an existing guard, then read inside a `.withIndex()` closure, where TypeScript drops the narrowing — the callback could run after a reassignment. Bound the narrowed value to a `const` after each guard. No `!`, no `as`, no `any`.
- **`components/ui/sidebar.tsx`, `components/sidebar-user-nav.tsx`**: fixed 8 Tailwind v3 bare-CSS-variable brackets left behind by the v4 migration (`w-[--sidebar-width]` → `w-[var(--sidebar-width)]`). Under v4 these compile to the invalid `width: --sidebar-width` and are dropped — the sidebar spacer collapsed to zero, so every dashboard page rendered at x=0 under the fixed sidebar ("Mission Control" displayed as "trol"). Proof in the shipped CSS: `.w-\[--sidebar-width\]{width:--sidebar-width}` next to the working `.w-\[var\(--sidebar-width\)\]{width:var(--sidebar-width)}`. Repo-wide scan now returns zero bare-variable brackets.
- **`package.json`**: removed `|| true` from `prebuild`. It swallowed the exit code: `node scripts/build-litui.mjs` exited 1 while the prebuild step exited 0, so the lit-ui bundle silently failed to build on every deployment once `esbuild` left the dependency tree, and Vercel reported Ready. Declared `esbuild@0.28.1` as a devDependency (imported by `scripts/build-litui.mjs:19`, never declared). Bite-probe: prebuild exits 0 nominally, **1** with `esbuild` removed, 0 again once restored — the step now fails closed.

### Added (2026-07-16 — first quality gate, after Eta review of PR #7)
- **`.github/workflows/quality.yml`**: this repo had exactly one workflow (`e2e.yml`) and no lint, typecheck or build gate of any kind — which is how four defects shipped together and survived for weeks without turning anything red. Three gates, each proven green on the commit that introduces it: bare-CSS-variable brackets rejected repo-wide, `prebuild` must exit 0, and `prebuild` must leave the working tree clean. Four further gates (biome, `tsc`, codegen freshness, undeclared imports) are **declared at the bottom of the file with the reason they are blocked** rather than silently omitted — each is a tracked root-fix. A gate that is red on day one gets disabled within a week and protects nothing.
- **`.gitignore`**: untracked `public/lit-ui/bundle.js{,.map}`. Generated by `pnpm prebuild`, so tracking it made every build dirty the working tree — measured by Eta during review.

### Changed (2026-07-16 — prebuild no longer needs Convex credentials)
- **`package.json`**: dropped `npx convex codegen` from `prebuild`; moved to a standalone `codegen` script. Removing the `|| true` gag revealed that codegen had **also** been failing on every deployment: `401 Unauthorized: MissingAccessToken` fetching `api.convex.dev/.../team_and_project`. It is redundant work — `convex/_generated` is committed and in sync — and it requires an access token the build environment deliberately lacks, since a preview must never touch the shared dev backend. Verifying `_generated` freshness belongs in a credentialed CI job, declared as gate #3 in `quality.yml`.

### Documented (2026-07-16 — declared divergence)
- **`components/ui/sidebar.tsx`**: header comment recording that this file is shadcn/ui, which `CLAUDE.md` bans in favour of lit-ui. Divergence arbitrated and kept by Pi on Day 133 — the starter is the fleet's visual reference and a port would be churn; the component's fate is deferred to the Mosaic migration plan (Gamma audit `k173rtfwwh4t14fvbn0t5q2r6s8an17x`). Per `.claude/rules/derive-never-type.md`, a declared divergence is a decision; a silent one is debt.

### Fixed (2026-04-02 — E2E CI workflow)
- **`.github/workflows/e2e.yml`**: Rewired e2e workflow to run against Vercel preview deployments instead of a local server. Removed `pnpm build`, `pnpm start`, and `wait-on` steps that crashed in CI without Clerk keys. Workflow now triggers on `deployment_status` (Vercel webhook) in addition to `pull_request`. `PLAYWRIGHT_BASE_URL` resolves to `github.event.deployment_status.target_url` (Vercel preview URL) or falls back to the constructed branch preview URL. Removed Clerk/Convex secrets from env — not needed when testing the deployed app. Added `BB_CONTEXT_ID` secret reference. Reduced timeout from 15 to 10 minutes.

### Added (Phase 5 — Config Generation)
- **`lib/consultant/config-generator.ts`**: `generateConfig(spec: OnboardingConfigSpec): GeneratedConfig` — takes a validated OnboardingConfig spec from json-render, generates all `.claude/` file contents as strings (no disk I/O). Outputs: `CLAUDE.md` (project bible + agent routing table), `.claude/agents/<agentId>.md` per selected agent, `.claude/skills/SKILLS.md` manifest, `hooks/session-start.py`. Returns `GeneratedConfig` with `files[]`, `summary`, `teamCount`, `agentCount`, `skillCount`.
- **`lib/consultant/config-templates.ts`**: Four pure template functions — `agentTemplate`, `claudeMdTemplate`, `sessionStartTemplate`, `skillsManifestTemplate`. All parameterised, no side effects. Agent format mirrors existing `.claude/agents/dev-frontend.md` (frontmatter + PERSONA + ROLE + SKILLS + EXECUTION RULES + DEFINITION OF DONE).
- **`convex/seed/seedCreditCosts.ts`**: Idempotent `seedCreditCosts` internalMutation — seeds 6 credit action types: `chat_message` (1cr), `architect_chat` (2cr), `mission_create` (3cr), `competitor_analysis` (3cr), `brand_kit_extraction` (2cr), `consultant_onboard` (5cr). Run via `npx convex run seed/seedCreditCosts:seedCreditCosts`.

### Added (Phase 1 — Registry Integration)
- **`lib/registry/types.ts`**: TypeScript types for `RegistryTeam`, `RegistryAgent`, `RegistrySkill`, `RegistryHook`, `PainMapping`, `RegistryRecommendation`. Includes `PAIN_MAPPINGS` constant — 10 pain→team mappings covering prospecting, content marketing, SEO, client retention, social media, email campaigns, analytics, developer productivity, competitive intelligence, and internal operations.
- **`convex/schema.ts`**: Added 3 new tables — `registryTeams` (27), `registryAgents` (28), `registrySkills` (29) — with stable slug IDs, category indexes, and team-scoped indexes.
- **`convex/registry.ts`**: Five authenticated queries — `listTeams` (optional category filter), `getTeam`, `listAgentsByTeam`, `listSkillsByTeam`, `listSkills`, and `getRecommendationsForPains` (maps pain IDs through `PAIN_MAPPINGS`, loads teams+agents+skills, sorts by priority).
- **`convex/seed/seedRegistry.ts`**: Idempotent `seedRegistry` internalMutation — seeds 15 teams, 28 agents, 76 skills across marketing, sales, support, analytics, operations, and engineering. Run via `npx convex run seed/seedRegistry:seedRegistry`.
### Added (Day-19 migration — model selector UI)
- **components/chat/ModelSelector.tsx**: Dropdown model selector with provider badges, grouped by category (flagship/balanced/fast/reasoning/coding), outside-click close, OKLCH tokens
- **components/chat/ChatPage.tsx**: Wired model selector into chat header, passes `selectedModel` via `sendMessage` body option (AI SDK v6 per-request pattern)

### Added (Day 19 — dynamic AI model system via Vercel AI Gateway)
- **convex/schema.ts**: Added `aiModels` table with indexes (by_model_id, by_provider, by_category, by_enabled)
- **convex/aiModels.ts**: Full CRUD API (list, listAll, getByModelId, getDefault, create, update, toggle, setDefault, remove) + seed with 24 models across 6 providers (Anthropic, OpenAI, Google, xAI, DeepSeek, Mistral)
- **lib/ai/providers.ts**: Created `getModelFromGateway()` bridge — resolves model IDs to Vercel AI Gateway paths with fallback map
- **app/api/chat/route.ts**: Replaced hardcoded `openai("gpt-4o")` with dynamic gateway lookup via `api.aiModels.getByModelId` + `getModelFromGateway()`. Removed OPENAI_API_KEY dependency.
- **app/api/architect/chat/route.ts**: Same — defaults to `claude-sonnet-4-5` via gateway
- Adding a model is now table-based (insert a row in Convex), not code-based

### Fixed (Day 19 — credit system + action types)
- **convex/seed/seedCreditCosts.ts**: Created idempotent seed for 7 credit action types (chat_message, architect_message, image_generation, image_edit, video_generation, video_assembly, audio_narration)
- **app/api/chat/route.ts**: Renamed `step2_chat_message` → `chat_message`, `step2_conversation` → `chat_conversation`
- **convex/http/ai.ts, convex/http/agent.ts**: Normalized `CREDIT_COST_ACTION_TYPE` from `"chat"` → `"chat_message"`
- **app/api/architect/chat/route.ts**: Added missing credit deduction (actionType: `architect_message`) with refund on error

### Fixed (Day 19 — org access + project filter)
- **convex/chats.ts, projects.ts, customRoles.ts, customPersonas.ts, customFrameworks.ts**: Fixed workspace resolution to support org members — all list/get queries now check both `workspace.ownerId` AND `workspace.organizationId` for access, not just owner
- **app/[locale]/dashboard/chat/page.tsx**: Added project selector/filter dropdown (Task 2.4) — filters chats by project, responsive, OKLCH tokens, new chats inherit selected project

### Changed (Day 19 — cleanup + Phase 4)
- **app/[locale]/dashboard/chat/page.tsx**: Replaced makeFunctionReference bridge with proper `api.chats.*` generated imports
- **convex/messages.ts**: Added AI SDK v6 field mapping documentation on toolCallSchema (toolCalls already implemented in Phase 1)
- **Convex AI files**: Added Convex AI guidelines to AGENTS.md and CLAUDE.md (auto-generated by `npx convex dev`)

### Added (Day 19 — Phase 2: Chat List UI)
- **app/[locale]/dashboard/chat/page.tsx**: Rebuilt as chat list page — search, pinned sorting, skeleton loading, empty state, "New chat" button
- **app/[locale]/dashboard/chat/[chatId]/page.tsx**: New session shell page (Server Component, Next.js 15 async params)
- **components/chat/ChatPage.tsx**: Added optional `chatId` prop, passed to `useChat({ id: chatId })` for session isolation
- **convex/workspaces.ts**: Added `getDefault` query — returns user's default workspace ID
- **messages/en.json + fr.json**: Added `chat` i18n namespace (10 keys each)

### Added (Day 19 — vantage-studio migration Phase 1 + Phase 3)
- **hooks/block-orchestrator-code-edits.py**: Replaced broken symlink with actual hook script — enforces orchestrator delegation rules
- **Schema**: Added `chats` (table 26), `projects` (table 27), `messages` (table 28) tables to Convex schema
- **convex/chats.ts**: 8 functions (list, getById, listRecent, create, update, remove + 2 internal) — workspace-scoped chat sessions
- **convex/projects.ts**: 6 functions (list, get, create, update, archive, assignTask) — organizational folders for chats
- **convex/messages.ts**: 6 functions (list, getById, save, update, deleteAfterTimestamp + saveSystem internal) — chat messages with tool call support
- **convex/customRoles.ts**: 5 functions (list, get, create, update, remove) — 4-Pillars agent role CRUD
- **convex/customPersonas.ts**: 5 functions (list, get, create, update, remove) — 4-Pillars persona CRUD
- **convex/customFrameworks.ts**: 5 functions (list, get, create, update, remove) — 4-Pillars framework CRUD
- **convex/rateLimits.ts**: Added `createCustomRole`, `createCustomPersona`, `createCustomFramework` token bucket rate limits (10/min)
- All functions use `requireAuth`/`requireAuthWithWorkspace` from `convex/lib/auth.ts`
- All mutations have ownership checks (`createdBy !== user.clerkUserId` → "Forbidden")
- Phase 3 files enforce S1 (system entities readable by all) and S3 (system entities non-deletable by non-admins) guards
- All functions have typed `returns` validators; `v.any()` only where justified (AI SDK fields) with `// TODO Phase 5` comments

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

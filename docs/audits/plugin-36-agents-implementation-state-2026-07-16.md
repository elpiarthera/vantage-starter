# Audit — "Claude Code plugin with 36 specialized agents" (FAQ claim vs. livré)

**Date:** 2026-07-16
**Type:** READ-ONLY audit, aucun code applicatif modifié
**Branche:** `fix/t0bis-hardcoded-colors` (inchangée)

## Verdict

**ABSENT.** Aucun plugin n'existe. Le nombre "36" n'a jamais existé dans l'historique git de ce repo (maximum historique constaté : 25 agents). La claim FAQ décrit un produit qui n'a jamais été livré, ni packagé, ni publié.

---

## 1. Un plugin existe-t-il ?

```
find . -iname "plugin.json" -not -path "./node_modules/*"
-> ./.agents/skills/clerk-testing/.claude-plugin/plugin.json
-> ./.agents/skills/clerk-custom-ui/.claude-plugin/plugin.json
-> ./.agents/skills/clerk-webhooks/.claude-plugin/plugin.json
-> ./.agents/skills/clerk-setup/.claude-plugin/plugin.json
-> ./.agents/skills/clerk/.claude-plugin/plugin.json
-> ./.agents/skills/clerk-orgs/.claude-plugin/plugin.json
-> ./.agents/skills/clerk-nextjs-patterns/.claude-plugin/plugin.json
```

**État : ces 7 `plugin.json` appartiennent tous à `.agents/skills/clerk-*/` — ce sont les plugins officiels Clerk (skills documentaires tierce partie), PAS un plugin "VantageStarter 36 agents".** Aucun manifeste racine, aucune entrée `.claude-plugin/` à la racine du repo, aucune référence à un plugin nommé "vantagestarter" ou "36 agents" nulle part.

```
grep -rn "plugins" .claude/settings.json -> (aucun résultat)
```

**Preuve d'absence : aucun plugin produit livré au client n'existe dans ce repo.**

---

## 2. Le compte, dérivé

```
git ls-files .claude/agents/ | wc -l
-> 0
```

**0 fichier d'agent est suivi par git sur la branche courante.** Un développeur qui `git clone` ce repo aujourd'hui reçoit **0 agent**, pas 36.

Les 10 fichiers présents sur disque (`ls .claude/agents/` -> accessibility-audit.md, code-reviewer.md, convex-reviewer.md, dev-clerk-expert.md, dev-convex-expert.md, dev-frontend.md, dev-qa.md, dev-senior-dev.md, dev-sentinel.md, dev-tech-researcher.md) sont **non trackés par git** (confirmé par le count `git ls-files` = 0) : installés localement aujourd'hui par l'orchestrateur Pi comme outillage de workspace, **absents de tout commit**, donc jamais reçus par un cloneur du repo.

Écart : **36 promis vs. 0 livrés** (git-tracked) = 100% d'écart.

---

## 3. Les 6 spécialités nommées par la FAQ

Claim verbatim (`messages/en.json:2673`): *"frontend dev, Convex expert, Clerk expert, security auditor, SEO specialist, product manager, and more"*

| Spécialité | Fichier historique (avant suppression c7072ea) | État aujourd'hui (git-tracked) |
|---|---|---|
| frontend dev | `.claude/agents/dev-frontend.md` (existait, supprimé par 32ad46b/c7072ea) | ABSENT (0 fichier tracké) |
| Convex expert | `.claude/agents/dev-convex-expert.md` (existait) | ABSENT |
| Clerk expert | `.claude/agents/dev-clerk-expert.md` (existait) | ABSENT |
| security auditor | `.claude/agents/dev-sentinel.md` (existait) | ABSENT |
| SEO specialist | `.claude/agents/dev-seo.md` — confirmé via `git show 32ad46b^:.claude/agents/dev-seo.md` -> contenu SEO-specialized developer agent réel | ABSENT (0 fichier tracké aujourd'hui — supprimé) |
| product manager | **non prouvé sous ce nom exact.** Recherche `git log --all --diff-filter=A --name-only -- '.claude/agents/*.md' \| grep -i product` -> `.claude/agents/product-launcher.md` uniquement. Aucun agent nommé "product manager" ou "product-manager" n'a jamais existé dans l'historique. | ABSENT (jamais existé sous ce nom) |

Toutes les 6 spécialités nommées sont **ABSENTES** du repo cloné aujourd'hui (0 fichier tracké). 5 sur 6 ont existé historiquement sous un nom d'agent réel avant d'être supprimées collatéralement par le commit `c7072ea`. La 6e ("product manager") n'a **jamais existé** sous ce nom exact — seul un `product-launcher.md` proche mais distinct a existé.

---

## 4. Le plugin est-il publié ?

```
npm view vantagestarter-agents
-> npm error 404 Not Found - GET https://registry.npmjs.org/vantagestarter-agents
-> npm error 404 'vantagestarter-agents@*' is not in this registry.

npm search "vantage-starter"
-> aucun résultat pertinent (uniquement des paquets tiers sans rapport, ex: @tiptap/starter-kit)
```

**Preuve d'absence : aucun package npm publié pour ce plugin.** Aucune recherche VantageRegistry effectuée n'a été demandée dans le brief au-delà de npm — non prouvé pour une éventuelle entrée VantageRegistry (hors périmètre outillé disponible dans cette session ; nécessiterait `mcp__vantage-registry__list_skills`/`text_search` avec accès MCP non sollicité ici).

---

## 5. Les 25 supprimés — le repo a-t-il déjà approché 36 ?

```
git show --diff-filter=D --name-only c7072ea -- '.claude/agents/' | grep -c '\.md'
-> 25
```

Liste des 25 fichiers supprimés par `c7072ea` (« feat: design configurator + Luma default + Tailwind v4 upgrade ») :
accessibility-audit.md, bootstrap-agent.md, competitor-watcher.md, copywriter.md, data-analyst.md, dev-clerk-expert.md, dev-convex-expert.md, dev-e2e-tester.md, dev-frontend.md, dev-senior-dev.md, dev-sentinel.md, dev-seo.md, email-assistant.md, geo-ai-visibility.md, geo-content.md, geo-platform-analysis.md, geo-schema.md, geo-technical.md, meeting-summarizer.md, onboarding.md, product-launcher.md, proposal-generator.md, strategy-researcher.md, video-analyzer.md, video-transcriber.md.

**Maximum historique du nombre d'agents trackés dans `.claude/agents/`, dérivé commit par commit** (`git ls-tree -r <commit> --name-only -- '.claude/agents/' | grep -c '\.md$'` pour chaque commit ayant touché ce chemin) :

| Commit | Date | Nb agents (.md) |
|---|---|---|
| 32ad46b | 2026-04-03 | **25** (maximum jamais atteint) |
| 82c1ac3 | 2026-03-26 | 24 |
| e928aee | 2026-03-22 | 8 |
| f54eb9c | 2026-03-19 | 7 |
| c306c40 | 2026-03-19 | 7 |
| c7072ea | 2026-04-06 | 0 (suppression) |

**Le repo n'a JAMAIS approché 36 agents à aucun moment de son histoire git.** Le maximum absolu constaté est **25**, atteint le 2026-04-03, puis ramené à **0** trois jours plus tard par le commit `c7072ea`. Le nombre "36" cité dans la FAQ (6 langues) n'a jamais correspondu à un état réel du repo — ni avant, ni après la suppression collatérale.

---

## Tableau de synthèse

| claim (verbatim) | source:ligne | état | preuve |
|---|---|---|---|
| "A Claude Code plugin with 36 specialized agents" | `messages/en.json:2673` | **ABSENT** | `find . -iname "plugin.json"` -> uniquement 7 plugins Clerk tiers dans `.agents/skills/clerk-*`, aucun manifeste "vantagestarter" |
| "36 agents" (fr/de/es/it/pt/ru, ex: `messages/fr.json:2585`) | 6 fichiers i18n | **ABSENT** | max historique = 25 (`git ls-tree` sur 32ad46b), jamais 36 |
| "frontend dev, Convex expert, Clerk expert" | `messages/en.json:2673` | **ABSENT aujourd'hui, existait avant c7072ea** | `git ls-files .claude/agents/ \| wc -l` -> 0 ; `git show c7072ea --diff-filter=D` liste les 3 fichiers supprimés |
| "security auditor" | idem | **ABSENT aujourd'hui, existait (dev-sentinel.md)** | idem, supprimé par c7072ea |
| "SEO specialist" | idem | **ABSENT aujourd'hui, existait (dev-seo.md)** | `git show 32ad46b^:.claude/agents/dev-seo.md` -> contenu réel confirmé, supprimé ensuite |
| "product manager" | idem | **ABSENT — n'a jamais existé sous ce nom** | `git log --all --diff-filter=A --name-only -- '.claude/agents/*.md' \| grep -i product` -> uniquement `product-launcher.md`, nom distinct |
| "plugin" publié | implicite | **ABSENT** | `npm view vantagestarter-agents` -> 404 ; `npm search "vantage-starter"` -> aucun résultat pertinent |

## Non prouvé

- Présence/absence sur VantageRegistry (npm et github vérifiés uniquement ; MCP VantageRegistry non interrogé dans ce brief, hors périmètre outillé fourni).

## Écart global

**36 promis → 0 livrés (git-tracked, clonable).** Maximum jamais atteint dans l'histoire du repo : 25 (2026-04-03), ramené à 0 le 2026-04-06 (commit c7072ea, suppression collatérale non liée à l'intention du commit). Les 10 fichiers présents sur disque aujourd'hui sont un outillage de workspace non commité, non livrable, sans rapport avec la claim marketing.

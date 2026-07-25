# Objectif = prêt à forker — état exact du socle vantage-starter

> Produit par Tau (τ), seul en charge du socle, le **2026-07-25**, dépôt à `fd5cd8b` (main).
> Chaque chiffre porte la commande qui le dérive. Aucun état reconstruit de mémoire.
> Mission gouvernante : `vantage-starter-production-ready-v1` (`k57anh3qyce5wcxgvm3nv6d7wh8arza5`).
> vantage-starter est le tronc dont **toutes** les apps sont forkées ; doc-forge est le 1er fork, EveVantage le 2e. « Prêt à forker » débloque toute la suite.

---

## 1. État actuel, chiffré et dérivé

| Fait | Valeur | Commande |
|---|---|---|
| Dépôt actif, dernier commit main | `fd5cd8b` (#99 fusionné) | `git log --oneline origin/main -1` |
| Demandes de fusion ouvertes | **0** | `gh pr list --state open` |
| Livrables Day 140 vérifiés, poussés, **non encore fusionnés** | **8** (routematcher a atterri via #99) | `for b in …; do git diff --quiet origin/main...origin/tau/$b \|\| echo unmerged; done` + preuve par PR fusionnée pour le squash |
| Tâches ouvertes (todo+in_progress+review), projet vantage-starter | **48** | `list_tasks project=vantage-starter status=open` |
| Dont en relecture | **2** (`k17dymcr` suite Convex users, `k173az47` 404 clic mission) | idem, `status=review` |
| Tâches bloquées | **5** | `list_tasks project=vantage-starter status=blocked` |
| L'app se construit | `pnpm build` → exit **0** (mesuré sur chaque tête Day 140) | `pnpm build` |
| Modèle d'environnement pour un forkeur | `.env.example` **présent**, 5480 o | `ls -la .env.example` |

**Réserve de mesure, à dire franchement (broadcast Pi, Day 142) :** l'intégration continue est **désactivée** sur le compte `elpiarthera` — `gh api repos/elpiarthera/vantage-starter/actions/permissions --jq .enabled` → `false`. Les portails de qualité (`quality.yml` : tsc, biome, jest, `pnpm build`, gardes) existent comme **scripts exécutables** (`pnpm exec …`) mais leur câblage CI **ne s'exécute pas ici**. C'est la doctrine *vérification ≠ activation* : le portillon réel du socle est le verdict du relecteur sur mesures locales + mutations. Un fork poussé vers `vantageos-agency` (où l'intégration tourne) réactive les gardes tel quel.

---

## 2. Reste-à-faire — BLOQUANTS pour ouvrir le dépôt

Un bloquant = ce sans quoi un fork casse, ou l'ouverture est impossible. Chaque ligne porte son taskId et sa route de sortie.

1. **[T7] Déploiement en un clic** — `k170626sccmp2jqbhg80q737a58asrx2` (urgent).
   Preuve : `grep -c "vercel.com/new/clone" README.md` → **0** — aucun bouton « Deploy » dans le README. `vercel.json` est présent, mais un forkeur n'a pas de chemin « clone → déploie » documenté.
   Route : ajouter le bouton Deploy + prouver qu'un clone propre se lève, variables depuis `.env.example`. **C'est la dernière porte nommée** (voir §3).

2. **[T4] Le socle consomme la couche d'identité partagée** — `k17feynmn923dt3yhcp70x1rsn8b2dqp` (haut).
   Preuve : `grep -c cloud-identity package.json` → **0** ; `ls convex/lib/auth.ts` → **présent** (copie locale toujours en place). `@vantageos/cloud-identity 0.3.0` a été **publié aujourd'hui** par Sigma (PR #8, prouvé au registre) — je suis donc **débloqué**.
   Route : consommer 0.3.0, supprimer la copie locale `convex/lib/auth.ts`, faire monter la règle d'appartenance maison (comptes sans organisation) dans le paquet — jamais en variante locale. Débloque Hestia. Voir §4.

> **Correction Day 143 (décision Laurent via Pi) :** les six pages légales sont **parquées jusqu'au SIRET** — la société n'est pas encore immatriculée, leur contenu légal en dépend. `k177ra86x2a0g1sfvxx10dv9xh8awfpd` passe en `blocked`, raison « en attente SIRET / immatriculation ». Ce n'est **plus** un bloqueur d'ouverture. Le défaut technique (six pages derrière un compte + deux routes mortes) reste tracé, à revoir à l'immatriculation.

**Débit du portillon (non un défaut de code, mais un reste-à-faire réel) :** **8** livrables Day 140 vérifiés attendent le portillon désormais libre — achat, preuves sociales, faux 404 événements, rôle opérateur crédits, garde composant-appelé-comme-fonction, suite Convex users, règle post-merge-cleanup, hero (bloqué). (Preuve dérivée par `git diff --quiet origin/main...<branche>` ; `debt-routematcher-mocks` ressortait à tort « non fusionné » — squash de #99, SHA neuf — corrigé par preuve de PR fusionnée, exactement le piège que `.claude/rules/post-merge-cleanup.md` §squash nomme.) Elles passent une par une, une PR au portillon.

---

## 3. La dernière porte : déploiement en un clic — [T7]

`k170626sccmp2jqbhg80q737a58asrx2`, statut **todo**. `vercel.json` présent, `.env.example` présent (5480 o), l'app construit à 0. Ce qui manque : le **chemin forkeur** — bouton « Deploy to Vercel » + vérification qu'un clone neuf se lève sans intervention manuelle au-delà des clés. C'est le seul bloquant purement « ouverture » : sans lui, forker le dépôt ne produit pas une app qui tourne en un geste.

---

## 4. La couche d'identité partagée — [T4]

`k17feynmn923dt3yhcp70x1rsn8b2dqp`, statut **todo**. État réel dérivé : **branchée = NON** (`grep -c cloud-identity package.json` → 0), **copie locale supprimée = NON** (`convex/lib/auth.ts` présent). Le déblocage est arrivé aujourd'hui : `cloud-identity 0.3.0` est publié et prouvé au registre (Sigma, contexte obligatoire + garde d'organisation). Tant que le socle diffuse sa propre copie d'identité, il propage son défaut à chaque fork — d'où le rang de bloquant. C'est aussi le blocage de Hestia.

---

## 5. Verdict go / no-go

**NO-GO pour ouvrir le dépôt aujourd'hui — DEUX bloquants restants** (les pages légales sont parquées jusqu'au SIRET, voir §2), tous deux avec route, aucun « bientôt » :

1. `k17feynmn` — [T4] identité partagée non consommée, copie locale `convex/lib/auth.ts` non supprimée (débloqué ce jour par `cloud-identity 0.3.0`). Débloque Hestia.
2. `k170626` — [T7] déploiement en un clic (le bouton Deploy manque au README).

Non-bloquants (tracés, pas un frein) : tokens couleur gray-* codés en dur (`k17cgbh`, `k174gz4`, `k17cab5`), mention fal.ai sur la landing (`k17ea58`, décision produit de Laurent, reportée par lui), dette de garde/test déjà largement fermée par #99 + les branches en file, et les tâches inter-projets périmées (pilotes de skill, configurateur M2) à trier hors de cette mission.

**Ordre validé (Laurent, Day 143) : T4 → T7.** T4 d'abord car il débloque Hestia et le déblocage est frais (0.3.0 publié) ; puis T7, la porte d'ouverture. Ces deux fermés, l'ouverture du dépôt est un **go franc** (hors légal, différé au SIRET).

---

*Orchestrator: Tau — VantageOS Team | 2026-07-25*

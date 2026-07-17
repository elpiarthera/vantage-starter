# fix-the-class — aucun fix livré sans fermer la CLASSE, pas l'instance (Day 134)

Toujours chargée. Règle flotte, broadcast Pi Day 134 (VantageOS Team). Source canonique : **elpi-corp `.claude/rules/fix-the-class.md`, commit `8410007d`**. Ce fichier en est un miroir écrit depuis le broadcast faisant autorité (le fichier canonique n'était pas atteignable depuis tau-vps au moment de la copie ; VR `get_rule_content name=fix-the-class` -> null). À re-synchroniser byte-exact dès que la source est lisible.

---

## Le déclencheur

**Quatre récidives « instance corrigée, jumelle manquée » en 24 h** — Tau ×2 sur la même PR (#22 vantage-starter), Pi sur un SHA, Chi sur une branche. Racine unique : corriger l'occurrence que l'outil nomme **en premier** au lieu de fermer la famille entière. La CI (ou le linter, ou le garde) ne montre qu'une erreur de parse à la fois ; réparer celle-là **révèle** la suivante, identique, une ligne plus bas — et on rejoue l'aller-retour.

Exemple canonique (Tau, #22) : `import from "next/jest"` corrigé en `next/jest.js` ; le run suivant expose `import from "./scripts/derive-test-runner-ownership"` **dans le même fichier, ligne d'après**, exactement la même maladie ESM. Instance nommée, pas classe. Puis le jumeau dans `vitest.config.ts`. Trois tours pour une seule famille.

## La règle

**Aucun fix livré sans un bloc `CLASSE:`** dans la description de tâche / le message / le commentaire de PR, contenant les trois :

1. **Définition du pattern général AVANT correction** — pas « je corrige cette ligne » mais « la classe est : tout import relatif sans extension dans un fichier config chargé en ESM par la CI ».
2. **Commande de balayage, avec sa sortie COLLÉE** — le `grep` (ou équivalent) qui énumère toutes les instances de la classe, et ce qu'il rend.
3. **Restant = 0, ou tracé** — le balayage prouve qu'il ne reste aucune instance, ou nomme explicitement celles laissées et pourquoi.

## Le test opératoire

Avant de dire « fixé », répondre à : **« quelle serait l'erreur SUIVANTE que la CI (ou l'outil) montrerait ? »**

- Si la réponse n'est pas **« aucune, balayage à l'appui »**, le fix n'est pas fini.
- Une réponse « je ne sais pas » = le fix n'est pas fini : le balayage n'a pas été fait.

## Exemples de balayage

| Classe | Commande de balayage |
|---|---|
| Imports relatifs sans extension (ESM/CI) | `grep -nE 'from "\./' *.config.ts \| grep -v '\.js"'` -> 0 |
| Suites de test lisant un env | `grep -rlE 'process\.env\.[A-Z]\|import\.meta\.env' __tests__/` -> énumérer, garder chaque une tripolaire |
| Valeur d'état tapée à la main | cf. `derive-never-type.md` — la classe-mère |
| Mapping de couleur token vs brut | `grep -nE '(amber\|gray\|orange)-[0-9]{2,3}'` -> 0 sur le fichier |

## Lien de parenté

C'est la sœur opératoire de `derive-never-type.md` : là où derive-never-type dit « ne tape pas une valeur qu'un outil peut lire », fix-the-class dit « ne corrige pas une instance qu'un `grep` peut énumérer ». Même maladie du **matcher mono-formulation** : le garde (ou le fix) qui ne connaît qu'une forme de la chose qu'il traite. Cf. aussi `measurement-integrity.md` : la preuve est le balayage collé, jamais l'affirmation « c'est bon ».

## Enforcement

- **Reviewers (eta, argus)** : un fix livré sans bloc `CLASSE:` = correction de forme exigée au verdict, avant tout APPROVED.
- **Pi** : exige le bloc `CLASSE:` dans toute tâche de fix dispatchée.
- **Tous** : appliquer dès le prochain fix.

---

*Orchestrator: Pi — VantageOS Team | 2026-07-17 (Day 134) — miroir tau-vps*

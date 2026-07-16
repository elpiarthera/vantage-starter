# T0bis — inventaire des couleurs codées en dur

Task `k17bgg3cvy0sps55j543dvtkrn8amqgq`. Cet inventaire est committé **avant**
toute correction, comme la task l'exige : la liste doit pouvoir être relue
indépendamment du diff qui la traite.

## Norme

Versionnée localement, jamais une URL externe (un sub-agent ne peut pas lire un
repo privé, et une norme non versionnée dérive) :

- `.claude/skills/vantage-design-system/SKILL.md` §3 — *"Color tokens are OKLCH"*,
  *"Every new screen ships both a dark and a light variant. Neither is optional."*
- `.claude/skills/better-colors/SKILL.md` + `gamut-and-tailwind.md` — conversion
  hex/rgb/hsl → oklch, theming Tailwind v4.

## Ce que le compte brut ne dit pas

```
grep -rhoE 'oklch\(|rgba?\(|hsla?\(' app components lib hooks providers styles src | wc -l   -> 1632
  dont styles/, lib/design-system/, lib/create/themes.ts, app/globals.css        -> 1392
  candidats réels dans le périmètre applicatif                                    ->  240
```

**1392 des 1632 occurrences SONT le système de tokens lui-même** — les fichiers de
thèmes, les presets, `globals.css`. Un `oklch()` y est la définition du token, pas
sa violation. Agir sur le compte brut aurait « corrigé » le système de tokens.
C'est la raison d'être de cette section : le nombre qui circulait n'était pas faux,
il n'était pas qualifié.

## Sévérités

| | Critère | Traitement |
|---|---|---|
| **BROKEN** | Écran ou composant applicatif thème-sensible, **zéro** `dark:` → ne ships qu'une seule variante, viole §3 frontalement | corrigé vers token sémantique |
| **NORM** | Contrepartie `dark:` présente, rend correctement dans les deux thèmes ; viole la préférence du token sémantique | corrigé sans risque visuel |
| **EXCEPTION** | Chrome décoratif volontairement fixe, self-consistent, sans dépendance au thème | conservé, **déclaré en commentaire sur place** |

## BROKEN — vérifiés ligne à ligne sur l'artefact

| file:line | actuel | token |
|---|---|---|
| `app/[locale]/sign-in/[[...sign-in]]/page.tsx:10` | `bg-gray-950` | `bg-background` |
| `app/[locale]/sign-in/[[...sign-in]]/page.tsx:13` | `text-gray-100` | `text-foreground` |
| `app/[locale]/sign-in/[[...sign-in]]/page.tsx:16` | `text-gray-400` | `text-muted-foreground` |
| `app/[locale]/sign-up/[[...sign-up]]/page.tsx:10` | `bg-gray-950` | `bg-background` |
| `app/[locale]/sign-up/[[...sign-up]]/page.tsx:13` | `text-gray-100` | `text-foreground` |
| `app/[locale]/sign-up/[[...sign-up]]/page.tsx:16` | `text-gray-400` | `text-muted-foreground` |
| `lib/monitoring/errorBoundary.tsx:46` | `bg-[#101a23]` | `bg-background` |
| `lib/monitoring/errorBoundary.tsx:47` | `bg-[#223649] border-[#314d68]` | `bg-card border-border` |
| `lib/monitoring/errorBoundary.tsx:51` | `text-gray-300` | `text-muted-foreground` |
| `lib/monitoring/errorBoundary.tsx:57` | `bg-[#0d7ff2] hover:bg-blue-600` | `bg-primary hover:bg-primary/90` |
| `components/adaptive/AdaptiveNavigation.tsx:42` | `border-gray-600` | `border-border` |
| `components/adaptive/AdaptiveNavigation.tsx:69,93,95` | `text-gray-400` | `text-muted-foreground` |
| `components/adaptive/AdaptiveNavigation.tsx:103` | `border-t border-gray-600` | `border-t border-border` |
| `components/adaptive/AdaptiveNavigation.tsx:117` | `bg-[#223649]` | `bg-muted` |
| `components/adaptive/AdaptiveNavigation.tsx:124` | `bg-[#0d7ff2] text-gray-300` | `bg-primary text-muted-foreground` |
| `components/adaptive/AdaptiveNavigation.tsx:130,141` | `bg-[#314d68] text-gray-300` | `bg-muted text-muted-foreground` |

Preuve du critère — aucun de ces trois fichiers ne porte une seule variante `dark:` :

```
grep -c 'dark:' lib/monitoring/errorBoundary.tsx                    -> 0
grep -c 'dark:' app/[locale]/sign-in/[[...sign-in]]/page.tsx        -> 0
grep -c 'dark:' components/adaptive/AdaptiveNavigation.tsx          -> 0
```

## EXCEPTION — faux positif de l'audit automatique, corrigé à la relecture

`components/landing/HeroSection.tsx:20,22-24,26,30,41` — `border-gray-800`,
`bg-gray-700`, `text-gray-500`.

Le sub-agent a classé ces lignes BROKEN tout en les décrivant lui-même comme
*"terminal mockup fixed to dark colors"* — et a classé le même motif NORM ailleurs
(`components/create/picker.tsx`, *"fixed-dark menu chrome"*). Relecture du contexte :

```tsx
<div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
  <div className="h-3 w-3 rounded-full bg-gray-700 hover:bg-red-400 ..." />   {/* pastilles macOS */}
  <div className="h-3 w-3 rounded-full bg-gray-700 hover:bg-yellow-400 ..." />
  <div className="h-3 w-3 rounded-full bg-gray-700 hover:bg-green-400 ..." />
  <span className="ml-2 text-xs text-gray-500">Terminal</span>
```

C'est une **maquette de terminal** : barre de titre, pastilles rouge/jaune/verte,
bloc de code. Un terminal est sombre dans les deux thèmes, comme un bloc de code.
Mapper `bg-gray-700` → `bg-muted` rendrait les pastilles dépendantes du thème et
blanchirait la maquette en thème clair : la « correction » casserait le design.

Conservé, exception déclarée en commentaire dans le fichier. Une divergence
déclarée est une décision ; une divergence tue est une dette.

## Fiabilité de l'audit automatique — à savoir

Deux défauts du rapport du sub-agent, relevés à la vérification :

1. **Le compte est tapé, pas dérivé.** Il annonce « 11 BROKEN » alors que sa propre
   table en porte davantage. Le total n'a pas été compté sur les lignes — il a été
   écrit. Même maladie que le compte de 1632 ci-dessus.
2. **La revendication de méthode est fausse.** Il affirme *"All counted hits were
   opened and read in context"* en 2 tool uses — arithmétiquement impossible pour
   ~40 fichiers.

Les hits eux-mêmes, en revanche, ont été vérifiés un à un sur l'artefact (`sed -n`
sur chaque `file:line`) et sont exacts. D'où la règle appliquée ici : on retient les
**observations** d'un audit automatique, jamais ses **totaux** ni ses **auto-évaluations**.

## Dimensions NON couvertes — déclarées, pas omises

La task fonde T0bis sur quatre dimensions. Une seule dispose d'une norme versionnée
localement :

| Dimension | Norme locale | État |
|---|---|---|
| Couleurs / tokens | `vantage-design-system` §3 + `better-colors` | **auditée ici** |
| Valeurs arbitraires `[16px]` vs échelle Tailwind | *aucune* — `grep -rniE 'arbitrary value\|tailwind scale' .claude/skills/` → 0 hit | non auditée |
| `gap` vs `margin` | *aucune* — `grep -rniE 'gap.*margin\|space-y' .claude/skills/` → 0 hit | non auditée |
| Ordre mobile-first des classes | *aucune* — `grep -rniE 'mobile-first' .claude/skills/` → 0 hit | non auditée |

Ces trois dimensions ne sont pas reportées « à plus tard » : elles sont **bloquées sur
l'absence de norme versionnée**. Les auditer contre une règle restituée de mémoire
produirait un inventaire invérifiable — exactement ce que cet audit combat.
Escaladé à Pi (`jn77nrpvm8ndarpjahqnhgv78s8amx2f`).

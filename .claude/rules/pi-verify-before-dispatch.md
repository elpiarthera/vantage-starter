# Pi verify-before-dispatch — Day 114

Always loaded. Grave la doctrine "Pi vérifie avant tout dispatch" en règle structurelle après 3 récurrences mêmes session.

Day 114 verbatim Laurent : *"j'en ai assez que tu délègues sans jamais rien vérifier avvant putain on perd du temps et on risque des damage!!!"* — friction memory `j5796zx4pzg3sq2sc4dgb6d4qh89fzqc`.

---

## La règle

Avant TOUT `create_task` qui cite un repo / fichier / version / state / config / package / deploy / tool surface dans son brief, Pi DOIT :

1. **Vérifier** la claim par un appel d'outil (`Read`, `Bash`, `grep`, `ToolSearch`, `mcp__*`, `npm view`, `gh`, `ssh`).
2. **Citer** la commande + l'extrait de sortie dans un bloc `VERIFIED:` placé dans la `description`.
3. **Refuser de dispatcher** si la vérification est impossible — dire "claim non vérifié" et ne pas créer la tâche.

Le brief part d'observations, pas de suppositions.

## Forme attendue dans la description

```
VERIFIED:
- <commande 1> -> <extrait sortie>
- <commande 2> -> <extrait sortie>
```

Exemples :

```
VERIFIED:
- gh pr view 242 -R elpiarthera/vantage-registry --json mergeStateStatus -> CLEAN
- ssh root@code.vantageos.agency 'cat /root/coding/vantage-registry-mcp/package.json' -> version 1.8.0
- ToolSearch select:mcp__vantage-registry__upsert_rule_content -> No matching deferred tools found
- npm view @vantageos/mosaic-tokens version -> 0.2.1
```

## Mécanisme structurel

| Couche | Composant | Rôle |
|---|---|---|
| Reactive enforcement | hook `.claude/hooks/enforce-pi-verify-before-dispatch.py` | bloque `create_task` (createdBy=pi) sans bloc `VERIFIED:` |
| Proactive injection | skill `dispatch-task-create` v1.0.8+ | auto-injecte le bloc `VERIFIED:` à partir des outils appelés en amont |
| Doctrine | ce fichier `.claude/rules/pi-verify-before-dispatch.md` | always-loaded, garde la règle visible cycle après cycle |

Day 110 doctrine : Skill structured grid > reactive hook > CLAUDE.md reminder. Les trois couches combinées pour éviter le re-glissement.

## Quand vérifier (mapping clair)

| Le brief cite... | Pi vérifie via... |
|---|---|
| repo / branche / fichier | `ssh root@code.vantageos.agency 'cd /root/coding/<repo> && cat package.json && ls && git log --oneline -5'` ou équivalent local |
| version npm package | `npm view <pkg> version` |
| MCP / tool surface | `ToolSearch query="select:<tool>"` |
| env / secret | `mcp__convex__envList` / `envGet` ou `grep` env |
| BU / repo mapping | `mcp__vantage-peers__list_repo_mappings` + `list_bus` |
| deploy / service Railway / Vercel | `gh deploy` / `railway status` / `curl <prod-url>` |
| Convex prod | `mcp__convex__status` + `mcp__convex__run --readOnly` |
| PR state | `gh pr view <pr> -R <repo> --json state,mergeable,mergeStateStatus,headRefOid` |
| Eta verdict | `gh pr view <pr> --json comments` (read verbatim) |
| Commit SHA on main | `gh api repos/<owner>/<repo>/commits/<sha>` |

Si le mapping ne couvre pas la claim → "claim non vérifié, je ne dispatch pas". Pas de paraphrase de mémoire, pas d'assumption.

## Override (rare)

`// allow-no-verify: <reason>` dans la `description`, reason ≥ 3 caractères. Réservé à :
- Hot-fix urgent client-impacting documenté.
- Scope genuinely unverifiable (ex: claim sur état mental d'un humain).
- Première dispatch d'une mission où le terrain est inaccessible à ce stade (ex: bootstrap workspace inexistant).

Après override : fix la root cause — soit trouver un chemin de vérification, soit documenter le gap.

## Anti-patterns interdits

- ❌ Brief commençant par "Je suppose que..." / "Probablement..." / "Sans doute...".
- ❌ Citer une version / état / SHA sans tool-call qui la prouve dans le même cycle.
- ❌ Dispatcher pour ensuite "voir ce que l'assignee dira" — la friction de l'erreur tombe sur l'assignee, pas sur Pi.
- ❌ Re-dispatcher après un STOP retraction sans avoir vérifié ce qui était présumé.
- ❌ Considérer une mémoire comme preuve suffisante — la mémoire est un pointeur, pas un fait actuel.

## Pourquoi cette règle structurelle plutôt qu'une simple mémoire

Day 114 trigger : Laurent verbatim *"une mémoire ne sert à rien!!! tu ne vérifies jamais les mémoires!!!"*. Une feedback memory est PASSIVE — Pi ne la recall pas avant chaque action. Le hook + skill + rule fleet-loaded sont ACTIFS :
- hook = bloque structurellement
- skill = injecte structurellement
- rule = always-loaded contexte donc visible

Trois couches = redondance qui résiste au compactage et au context-loss.

## Reference

- Friction memory : `j5796zx4pzg3sq2sc4dgb6d4qh89fzqc`
- Day 110 doctrine : Skill > hook > CLAUDE.md (memory plus faible encore)
- Hook canonical : `.claude/hooks/enforce-pi-verify-before-dispatch.py`
- Skill canonical : `dispatch-task-create` v1.0.8+ (auto-injection VERIFIED block — à mettre à jour VR)

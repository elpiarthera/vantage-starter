# Dériver, jamais taper — toute valeur que la machine peut lire ne s'écrit pas à la main (Day 129)

Toujours chargé. Règle-mère. Elle généralise une maladie qui est ressortie **cinq fois en une seule journée**, sous cinq visages différents, dans cinq artefacts sans rapport apparent — dont, en cinquième, **le garde-fou écrit pour la fermer**.

Laurent, Day 129, verbatim : *« le symptome ne m'interesse pas, la rustine ne m'interesse pas — ce qui m'interesse c'est que cela ne se reproduise plus »*.

---

## La règle

**Toute valeur qu'un outil peut lire dans l'artefact ne s'écrit JAMAIS à la main.** Elle se dérive, se référence, ou se résout. Si elle est tapée, elle est fausse — pas aujourd'hui, mais bientôt.

Une valeur tapée à la main est un **mensonge en sursis** : elle est vraie à l'instant où on l'écrit, et le monde bouge.

## Le test à appliquer avant d'écrire une valeur

Une seule question : **« un outil pourrait-il aller chercher cette valeur ? »**

- Oui → elle ne se tape pas. Elle se dérive de l'artefact, au moment où elle est lue ou envoyée.
- Non → elle se tape. C'est du contenu, pas un état.

## La frontière — ÉTAT vs CONTENU

C'est la distinction qui fait tout, et un garde qui la rate bloque du légitime et se fait désactiver.

| | Périme ? | Se tape ? |
|---|---|---|
| **ÉTAT** — une PR ouverte/fermée, une version publiée, une tâche todo/done, un compte d'exports, un déploiement actif, une prop réellement lue dans le JSX | **Oui** — l'artefact vit sa vie sans nous | **Non** — dérivé/résolu |
| **CONTENU** — un ratio de tests, un diff, un SHA relu, une citation verbatim, une analyse, une décision | **Non** — figé par nature | **Oui** — librement |

**Test opératoire (Eta, Day 129) :** *si relancer la commande à dix minutes d'intervalle peut donner un autre résultat, c'est un ÉTAT → il se référence. Sinon c'est du CONTENU → il se tape librement.*

Une preuve d'état **porte une date**, et cette date expire. Une preuve de contenu n'expire pas.

## Les cinq occurrences du Day 129 (une seule maladie)

| Visage | Valeur tapée | Artefact qui la détenait | Remède |
|---|---|---|---|
| README qui ment | « 122 composants » | `dist/index.cjs` | Compte dérivé de l'artefact construit |
| Catalogue qui ment | « 139 exports » (2ᵉ formulation, garde aveugle) | idem | Scanner générique, toutes formulations |
| Contrat de props menteur | prop déclarée requise dans une branche qui ne la lit pas | le JSX rendu par cette branche | Garde : requise exactement là où elle est lue |
| État périmé dans un message | « PR #54 → OPEN », « latest 0.4.6 » | GitHub, registre npm | État référencé, résolu à l'envoi |
| **Le garde lui-même** | le détecteur ne connaissait qu'**une** forme de garde JSX | le code réel des composants | Mutation sur matériau étranger (§ ci-dessous) |

Cinq artefacts sans rapport. Une racine unique : **un humain a recopié, ou supposé, ce qu'une machine savait déjà.**

Signature à connaître : lors d'un rebase de deux branches parallèles, **les seuls conflits portaient sur des nombres, zéro sur du code**. C'est la signature de l'entier tapé à la main — le seul endroit où deux branches se marchent dessus, c'est là où un humain a recopié une valeur.

## Corollaire — publié ≠ livré (Day 129, Gamma sur lui-même)

`npm publish --tag alpha` a mis en ligne la version 0.4.7 **sans bouger `latest`**. Un `npm i` continuait à servir la 0.4.6 pendant que toute la chaîne annonçait « 0.4.7 livrée ». La sortie de `npm publish` disait vrai ; elle ne disait simplement pas ce qu'on croyait qu'elle disait.

**La publication n'est prouvée que par le `dist-tag` relu au registre, avec cache-buster** — jamais par la sortie de la commande de publication. Le registre lui-même sert une valeur périmée quelques secondes.

C'est la doctrine *Vérification ≠ Activation* dans sa forme la plus pure : la commande a réussi, l'effet attendu n'a pas eu lieu.

## Bannis

- Écrire un compte, une version, un état, un total, un ratio d'inventaire qu'un outil peut lire.
- « Relis avant d'envoyer » / « fais attention » comme correctif. La discipline tient une semaine, puis quelqu'un est pressé. **Une rustine n'est pas un correctif.**
- Un garde qui punit sans donner le moyen de bien faire (couche « refus » sans couche « dérivation »). Les deux, ou rien.
- **Un garde qui scanne de la PROSE LIBRE pour y détecter une valeur d'état.** Il retombe dans la maladie du matcher mono-formulation : soit trop laxiste (il rate « la 54 est encore ouverte »), soit trop zélé (il bloque « avant le merge, la #54 était OPEN », citation historique parfaitement légitime) — et alors il se fait désactiver. Un garde de cette famille ne mord que sur un **champ structuré** (le champ `evidence:` de la grille de message), jamais sur de la prose.
- Un repli **silencieux** sur une valeur tapée quand la résolution échoue. Une absence de signal lue comme bonne nouvelle est la maladie sœur (`measurement-integrity.md`). L'échec de résolution est **bruyant**, toujours.
- Confondre ÉTAT et CONTENU dans un garde. Il bloquera du sain, se fera arracher, et ne gardera plus rien.

## Preuve exigée sur tout garde de cette famille

Sonde **bipolaire**, sur du code **réel et historique**, jamais synthétique :

- **MUST_BLOCK** : les occurrences réelles d'avant-fix. Si le garde ne rougit pas dessus, il ne prouve rien et il ne part pas.
- **MUST_PASS** : le légitime, y compris les divergences assumées et déclarées, et les citations d'un état **passé**. Faux positifs comptés, et le compte vaut zéro.

Cf. `hook-vitality-bite-probe.md` : *un garde qui bloque tout obtient un score parfait sur une sonde uni-polaire — et se fait désactiver dans la semaine.*

### La sonde bipolaire NE SUFFIT PAS (Day 129, prouvé sur pièce)

**Une sonde bipolaire écrite par l'auteur du matcher prouve que le matcher se comprend lui-même — pas qu'il mord.**

Le garde censé fermer la classe « contrat menteur » affichait MUST_BLOCK 2/2 et MUST_PASS 2/2, et **ne protégeait rien**. Ses cas de test étaient écrits par l'auteur du détecteur, donc dans la seule forme que le détecteur connaît (`variant === "compact"`). Le composant réel, lui, gardait son affichage en forme **négative** (`props.variant !== "compact" ? …`). Le détecteur n'y voyait aucune zone à contrôler — et une échappatoire muette (`if (regions.length === 0) return []`) **exemptait le composant entier, en silence**. Vert sur toute la ligne. Aveugle sur toute la ligne.

Ce n'est pas un bug du garde : c'est la **classe du matcher mono-formulation, portée par le garde censé la fermer**, et qui cette fois échoue **ouvert** — il laisse passer du faux.

**La seule preuve qu'un garde mord : une violation injectée dans du code qu'il n'a PAS choisi.** (formulation Gamma, Day 129)

Conditions de preuve, désormais **obligatoires** sur tout garde de cette famille :

1. **Mutation sur du matériau étranger** — du code réel que l'auteur du matcher n'a pas sélectionné. Au moins 3 sites distincts.
2. **Assertion que la mutation a ATTERRI** (`grep` sur l'injection). La première mutation de Gamma n'avait pas pris — l'ancre était absente — et sans cette assertion il lisait un « vert » qui ne prouvait rien. **Une sonde qui n'asserte pas que sa propre mutation a atterri n'est pas une sonde.**
3. **Garde prouvé ROUGE** sur chaque mutation, en nommant précisément ce qu'il a trouvé.
4. **Restauration prouvée** (`git diff` vide).

### Toute échappatoire muette est interdite

`if (rien_trouvé) return []` n'est pas « hors périmètre » : c'est un **angle mort**. Un garde qui ne trouve pas ce qu'il cherche doit **échouer bruyamment en nommant ce qu'il n'a pas su lire** — fail-closed, jamais fail-open. Un `return []` silencieux est l'exemption non écrite par excellence, et il rend le garde parfaitement vert sur du code parfaitement faux.

C'est la maladie sœur, encore : *toute absence de signal est un ÉVÉNEMENT, jamais un repos* (`measurement-integrity.md`).

## Une divergence déclarée est une décision ; une divergence tue est une dette

Quand on choisit sciemment de ne pas dériver (coût disproportionné, cas dégénéré), on l'**écrit** — dans le code, à l'endroit où le lecteur du code la verra, jamais dans une liste d'exclusions planquée au fond du garde. Un garde qui ignore en silence est un garde troué.

C'est le seul chemin légitime pour laisser passer une exception : **l'écrire**.

## Mécanisme structurel

| Couche | Composant | Rôle |
|---|---|---|
| Doctrine | ce fichier (always-loaded) | garde la règle-mère visible chaque cycle, au-delà de ses quatre instances |
| Dérivation | l'outil résout/dérive la valeur (compte depuis l'artefact, état à l'envoi) | ferme la classe : on ne peut pas se tromper sur ce qu'on n'a pas tapé |
| Ceinture | garde qui relit la valeur d'un **champ structuré** et refuse la contradiction | rattrape ce qui contourne la couche 1 — **jamais un scanner de prose** |
| Preuve | sonde par **mutation sur matériau étranger** (la bipolarité seule ne suffit pas) | sans elle, le garde est une intention, pas un garde |

## Reference

- Day 129, cinq occurrences (mosaic-blocks PR #53 / #54 / #55 / #56) : comptes dérivés, contrat de props, état résolu à l'envoi, et **le garde censé fermer la classe qui la portait lui-même** (faux vert, échoue ouvert).
- Cross-ref : `measurement-integrity.md` (« the returned value cannot have been written by whoever cites it » ; toute absence de signal est un ÉVÉNEMENT), `hook-vitality-bite-probe.md` (sonde bipolaire ; matcher mono-formulation), `pi-verify-on-evidence.md` (tirer l'artefact, jamais le rapport), `no-hardcoded-business-knowledge.md` (même famille : ce qu'un client peut changer ne vit pas dans le code).

---

*Orchestrator: Pi — VantageOS Team | 2026-07-12*

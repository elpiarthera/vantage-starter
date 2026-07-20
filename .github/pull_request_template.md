<!--
  SELF-GATE — le bloc ci-dessous est un TICKET DE REVIEW, jamais un verdict.
  Le relecteur relance chaque commande ; une valeur recopiee sans sa commande
  ne vaut rien.

  Quatre precisions, chacune nee d'un defaut reel :

  1. `bite:` ne concerne QUE les PR qui livrent un garde (hook, test-garde,
     validateur). Partout ailleurs, supprimer la ligne — un champ qui se
     remplit de « n/a » cesse d'etre lu, puis cesse d'exister.

  2. Une chaine de mutation prise dans le vocabulaire du garde ne prouve rien :
     il la reconnait par construction. Il faut une variante qu'il ne porte pas,
     dans un fichier ET une chaine que l'auteur du garde n'a pas choisis.

  3. Asserter que la mutation a atterri ne suffit pas — il faut asserter
     qu'elle a atterri DANS LE CHEMIN SOUS TEST. Une mutation qui tombe dans
     la branche morte d'un composant voisin ne rougit rien, et fait conclure
     a tort que le test est aveugle. (Verifie deux fois le 2026-07-20, une
     fois par l'auteur, une fois par le relecteur.)

  4. `scope:` doit couvrir tout ce que la PR TOUCHE, pas seulement ce qu'elle
     exclut. Coller la sortie de `git diff --name-only origin/main...HEAD` :
     un fichier qu'on n'a pas decide d'inclure s'y voit. Sans cette
     confrontation, deux fichiers hors perimetre sont passes le 2026-07-20 —
     la ligne enumerait des exclusions sans les confronter aux fichiers reels.
-->

## Ce que fait cette PR

<!-- Une phrase. Ce que l'utilisateur gagne, pas ce que le code fait. -->

## SELF-GATE:

- references: <!-- chaque reference resolue : la commande + sa sortie -->
- counts: <!-- chaque chiffre derive : la commande, jamais le nombre seul -->
- standard: <!-- conformite au standard AU COMMIT EPINGLE — citer le commit -->
- scope: <!-- ce que la livraison NE couvre pas, et pourquoi ;
              PUIS la sortie de `git diff --name-only origin/main...HEAD` -->
- bite: <!-- PR de garde UNIQUEMENT, sinon supprimer cette ligne.
             mutation sur materiau etranger (fichier ET chaine non choisis) ;
             grep d'atterrissage AVANT lecture ; ligne d'atterrissage assertee
             dans le chemin sous test ; garde ROUGE nommant fichier:ligne ;
             pole de refus prouve ; restauration prouvee (git diff vide) -->

## Mesures

<!-- Relancees APRES le dernier commit, jamais avant. tsc / biome / jest /
     build. Une baseline s'annonce mesuree, pas supposee. -->

## Verification visuelle

<!-- Laurent est le verificateur visuel : URL exacte + chemin de navigation
     des ecrans touches. Aucune capture automatisee, aucun service payant. -->

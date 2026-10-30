# Vérification JSON — EF5A iPad 1.7

Source de référence : server.py et index.html de l’archive Windows v1.7 jointe.
SHA-256 de server.py : 30620764b099106ad06fe4c6b6a66da9adcbc33dfba9428d84ef4662b3f104a7.

## Contrats observés dans les sources

| Fichier / enveloppe | Source Windows | Traitement iPad |
| --- | --- | --- |
| Fiches_types/ID.json : kind = EF5A_TEMPLATE_V1, record | server.py, sync_all, lignes 203–225 | Import des fiches publiées et de leurs versions ; content est décodé depuis sa chaîne JSON |
| Controles_en_cours/ID.json ou Controles_valides/ID.json : kind = EF5A_INSPECTION_V1, record | server.py, sync_all, lignes 229–274 | Import/export complet, ID conservé |
| format = CONTROLE_EF5A_V1, id, updated, answers | index.html, exportBackup, ligne 103 | Import de réponses seulement pour un contrôle déjà présent et non validé, après confirmation |
| kind = EF5A_TEMPLATE_DELETED_V1 | server.py, sync_all | Non importé ; pas de synchronisation des suppressions |

Le record d’un contrôle contient id, template_id, template_snapshot, site, operator, status, created, updated, validated, validator, answers, control_date, accompanying_agents, collaboration_with.
**template_snapshot et answers sont exportés sous forme de chaînes JSON**, comme les colonnes SQLite de Windows, et non sous forme d’objets imbriqués. content est également une chaîne dans un record de fiche. Les autres clés importées sont conservées. Une information technique interne __ef5a_wire sert à garder la sérialisation d’origine et est retirée de l’export.

| Élément | Règle commune |
| --- | --- |
| Réponses | Dictionnaire indexé par l’ID du point ; choice = C, NC, SO ou NV |
| Détails | Tableau d’indices entiers à partir de 0 |
| Commentaire | comment, chaîne UTF-8 |
| État | in_progress ou validated |
| Validation | Tous les points CONTROLE doivent avoir un choix ; validateur non vide ; réponses verrouillées ensuite |
| Date de visite | control_date, AAAA-MM-JJ à la création |
| Accompagnateurs | accompanying_agents, texte |
| Collaboration | collaboration_with, texte |
| Identifiants | 32 caractères hexadécimaux pour les nouveaux contrôles iPad ; IDs importés conservés |
| Versions de fiche | Choix de la version publiée la plus élevée par code ; copie figée dans chaque contrôle |

Les trois champs de visite sont présents dans cette v1.7, bien que sa note de mise à jour décrive surtout les droits et sauvegardes des fiches. Les anciens records sans ces champs sont complétés par des chaînes vides, comme dans le synchroniseur Windows.

## Tests réalisés le 30 octobre 2026
- Tests de syntaxe JavaScript : réussis.
- Test Windows réel → codec PWA → synchroniseur Windows réel : réussi dans un dossier temporaire, avec base SQLite temporaire ; le code Windows joint n’a pas été modifié.
- Contrôle existant passé à validated côté PWA et nouveau contrôle in_progress : tous deux lus par Windows, sans erreur ni conflit dans ce scénario.
- Vérification des 3 champs, des 4 choix, détails, commentaires accentués/multilignes et snapshot de fiche : réussie.
- Contrôle sans modification : sérialisation des champs JSON internes préservée pour éviter des différences artificielles dans les empreintes de synchronisation Windows.
- Rejets de choix invalide, détail hors limites, ID dangereux, point inconnu et validation incomplète : réussis.
- Test de cache/service worker avec réseau simulé indisponible et chemins /ef5a-ipad/ : réussi ; toutes les ressources déclarées existent.
- Navigateur Chrome de recette : import JSON par sélecteur, création, champs supplémentaires, réponse, détail et observation, sauvegarde, rechargement/reprise, validation/verrouillage et téléchargement du JSON complet : réussis. Le JSON téléchargé a été relu et vérifié.

## Limites de la vérification
Safari/iPadOS, l’installation sur l’écran d’accueil, le partage natif vers OneDrive et le mode avion réel n’ont pas été testés ici. Le serveur de recette était en HTTP : il ne permettait pas d’activer le service worker dans le navigateur. GitHub Pages fournira HTTPS ; la recette sur appareil est décrite dans README.md et GUIDE.html. Le dépôt GitHub et sa configuration Pages n’ont pas été inspectés ni modifiés.
Les menus actuels Apple/GitHub n’ont pas pu être vérifiés en ligne pendant cette session (outil de recherche indisponible) ; les liens officiels du guide permettent de vérifier leurs éventuelles évolutions.
Les conflits dépendent aussi de l’historique local Windows. La réussite de ce scénario d’aller-retour ne garantit pas l’absence de conflit lors de modifications concurrentes. Aucun changement n’est apporté au moteur Windows.

## Reproduire
Python 3 et Node.js doivent être disponibles. Depuis le dossier décompressé :

    python3 tests/windows_roundtrip.py /chemin/vers/prototype_controles/server.py
    node tests/service-worker.test.cjs
    node --check app.js

Le premier test copie server.py dans un dossier temporaire et n’utilise pas le vrai stockage de travail. tests/fiche_fictive.json peut servir à une recette manuelle ; ce n’est pas une fiche métier fournie par Windows. Ne pas l’utiliser pour une visite réelle.

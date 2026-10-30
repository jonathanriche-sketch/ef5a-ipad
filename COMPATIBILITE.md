# Vérifications EF5A iPad 1.8 — 30 octobre 2026

Sources de référence : Windows v1.7 fourni, `server.py` et `fiche_vers_csv.py`.

- HTML EF5A : comparaison du résultat avec `parse_html` Windows sur une fiche fictive comportant deux contrôles, un titre intermédiaire, une note, deux détails, des modules, une référence et une consigne. Résultat identique après exclusion des identifiants aléatoires des points.
- CSV : champs entre guillemets, point-virgule dans un titre, retours à la ligne, guillemets doublés, plusieurs fiches ; erreur pour DETAIL sans CONTROLE, guillemet non fermé et fiche sans contrôle.
- Import HTML inerte : contenu analysé dans un élément template séparé du document ; scripts non exécutés et iframe non insérée dans l’interface (test DOM simulé).
- Signature métier identique après deux analyses de la même fiche, indépendamment des identifiants aléatoires.
- Création, sauvegarde, validation et export d’un contrôle fondé sur la fiche HTML importée : test avec DOM et IndexedDB simulés.
- JSON de ce contrôle validé transféré dans le stockage temporaire des vraies fonctions Windows : import réussi, aucun conflit ni erreur, réponses et détails conservés.
- Tests JSON de la v1.7 relancés : aller-retour Windows → PWA → Windows réussi pour contrôle existant et nouveau contrôle, champs date, accompagnateurs et collaboration conservés.
- Service worker : ressource import-fiches.js incluse dans le cache v1.8.0 ; simulation de réponses hors réseau réussie.

Le stockage IndexedDB et son nom restent ceux de la v1.7 pour conserver les données. Un contrôle exporté contient la copie complète de sa fiche. Une fiche importée séparément sur iPad et Windows n’a pas les mêmes identifiants et ne fusionne pas les bibliothèques.

À tester sur iPad réel : sélection Fichiers/OneDrive, installation sur l’écran d’accueil, redémarrage hors connexion, partage et export vers OneDrive. Les tests DOM/IndexedDB et service worker simulés ne sont pas une validation de Safari/iPadOS.

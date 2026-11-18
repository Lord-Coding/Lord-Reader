# Compte rendu — LordReader

## Identité et accueil

- Accent principal violet `#7045ff`, identité « LordReader » et identifiant de paquet `lord-reader`.
- Page de bienvenue avec accès à la bibliothèque et à l’import.
- Couvertures EPUB intégrées extraites à l’import; les couvertures absentes ou indisponibles ont un visuel de remplacement cohérent.

## Bibliothèque et documents

- Import EPUB/PDF par sélecteur Web ou natif Capacitor; sur Android, `Filesystem` lit le fichier choisi.
- Fichiers et métadonnées conservés sur l’appareil avec IndexedDB; favoris et préférences dans `localStorage`.
- Avertissement de confirmation pour un fichier d’au moins 50 Mio ou supérieur à l’espace estimé disponible.
- Suppression confirmée du fichier importé et de sa progression, avec indication de l’espace associé.
- Politique de confidentialité accessible depuis l’accueil et les réglages.

## Lecture

- Recherche textuelle dans les chapitres EPUB et les pages PDF, avec navigation parmi les résultats.
- Réglages par livre : police, interligne, marges et thème papier, sépia ou nuit.
- Progression conservée localement; lecture PDF et EPUB par les bibliothèques JavaScript `pdfjs-dist` et `epubjs`.

## Base de données pour une V1 locale

Une base distante n’est pas nécessaire. IndexedDB est la base de données locale adaptée aux fichiers et à leurs métadonnées; `localStorage` reste réservé aux petites préférences et aux favoris. Le sélecteur natif ne donne accès qu’aux documents choisis explicitement.

## Vérifications et limites

- Vérifications TypeScript, ESLint, formatage, tests unitaires et tests Playwright couvrant accueil, confidentialité, suppression, recherche, couvertures, préférences et lecture.
- Le sélecteur et la lecture native Android doivent encore être vérifiés sur un appareil ou émulateur; aucune plateforme iOS n’est présente dans le dépôt.
- Le build peut encore signaler des bundles JavaScript supérieurs à 500 Ko.
- Les prochains travaux sont listés dans [TODO.md](./TODO.md).

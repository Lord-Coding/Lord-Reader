# TODO — LordReader

## Terminés

- [x] Remplacer l’accent vert par la couleur principale `#7045ff`.
- [x] Harmoniser le nom de l’application : LordReader, identifiant npm `lord-reader`.
- [x] Concevoir une page d’accueil / bienvenue et une politique de confidentialité.
- [x] Connecter le sélecteur de fichiers Capacitor et l’accès local aux EPUB/PDF.
- [x] Extraire les couvertures intégrées aux EPUB et fournir une couverture de remplacement cohérente.
- [x] Avertir avant l’import d’un fichier volumineux et afficher l’estimation de stockage disponible.
- [x] Rechercher du texte dans les EPUB et les PDF.
- [x] Régler police, interligne, marges et thème de page, avec préférences par livre.
- [x] Supprimer un livre importé après confirmation, en supprimant aussi sa progression locale.
- [x] Utiliser le logo du dossier `public/logo/` dans l’application et le manifeste.
- [x] Documenter le stockage local des livres, métadonnées et préférences.
- [x] Ajouter les tests de base avec des fichiers EPUB et PDF générés pour les parcours de lecture.

## Lecture

- [ ] Ajouter une table des matières EPUB et un accès direct aux chapitres.
- [ ] Ajouter les signets, surlignages et annotations, avec stockage local.
- [ ] Ajouter la saisie du mot de passe pour les PDF protégés.
- [ ] Ajouter la lecture audio (synthèse vocale) et les commandes de lecture adaptées.

## Bibliothèque et fichiers

- [x] Ajouter l’édition des métadonnées et du synopsis après import.
- [ ] Permettre l’import multiple et l’import depuis un fournisseur cloud.
- [ ] Ajouter une sauvegarde/restauration chiffrée des livres, favoris et progressions.
- [x] Proposer une gestion explicite de l’espace utilisé et une page de diagnostic du quota.

## Découverte et suivi

- [x] Remplacer les livres de démonstration par un écran d’accueil vide lors de la première utilisation.
- [ ] Ajouter des collections personnalisées, tags et filtres par auteur ou date d’ajout.
- [x] Calculer une progression réelle et des statistiques de lecture à partir des sessions.
- [ ] Ajouter des objectifs de lecture, rappels facultatifs et historique des livres terminés.

## Qualité et publication

- [ ] Vérifier la navigation au clavier, les lecteurs d’écran et les contrastes en thèmes clair et sombre.
- [ ] Tester le sélecteur natif et la lecture sur Android et iOS, y compris avec de gros fichiers.
- [ ] Découper les bundles JavaScript de production pour réduire leur taille initiale.
- [ ] Vérifier le manifeste, les icônes et les identifiants de paquet sur les plateformes natives.

## Choix de stockage pour la V1 locale

LordReader n’a pas besoin d’une base de données distante ni d’un serveur pour cette V1. IndexedDB est la base locale de l’application : elle conserve les fichiers, leurs métadonnées et la progression. `localStorage` convient aux petites préférences et aux favoris. Le sélecteur Capacitor donne accès uniquement aux fichiers explicitement choisis par la personne.

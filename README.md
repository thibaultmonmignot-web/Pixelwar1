# PixelWar

Prototype de jeu de pixels collaboratif.

Le but du jeu est de placer des pixels sur une grille de 5000 x 5000. Cette première version sert à tester le gameplay avec des crédits fictifs, sans vrai paiement.

## Ce qui existe déjà

- Grille 5000 x 5000 simulée avec canvas
- Placement de pixels
- Palette de couleurs
- Packs de pixels fictifs
- Bombe qui détruit une zone 7 x 7
- Réinitialisation manuelle de la grille
- Sauvegarde locale dans le navigateur

## Ouvrir le jeu

Ouvre simplement `index.html` dans ton navigateur.

Tu peux aussi ouvrir la version autonome ici :

`outputs/pixelwar-prototype.html`

## Important pour la suite

Cette version ne contient aucun vrai paiement. Pour une vraie application mobile, les achats de pixels et bombes devront passer par les achats intégrés Apple/Google. Pour une version web, il faudra un prestataire de paiement comme Stripe et un serveur sécurisé.

## Prochaines étapes

1. Mettre ce projet sur GitHub.
2. Ajouter une vraie sauvegarde côté serveur.
3. Ajouter les comptes utilisateurs.
4. Rendre la grille partagée entre plusieurs joueurs.
5. Ajouter une boutique test côté serveur.
6. Ajouter les paiements réels seulement après validation du gameplay.

# OutfitHub — Friperie en ligne (Maroc)

Site e-commerce statique pour vendre des vêtements d'occasion, en darija (écriture arabe, RTL).
HTML / CSS / JavaScript pur : aucun framework, aucune installation, aucun serveur à gérer.
Les commandes sont envoyées par **WhatsApp** et payées **à la livraison**.

## Structure

```
├── index.html      Accueil : hero, bandeau, filtres + grille de produits
├── product.html    Fiche produit (product.html?id=1)
├── style.css       Styles (mobile-first, RTL)
├── script.js       Configuration + logique (filtres, panier, WhatsApp)
├── data.js         Catalogue des produits
├── images/         Photos des produits
└── ancien-site/    Ancienne version du site, conservée pour référence
```

## 1. Configurer la boutique

En haut de `script.js` :

```js
const NOM_BOUTIQUE = "OutfitHub";
const NUMERO_WHATSAPP = "212600000000"; // 06 12 34 56 78 → "212612345678"
const PRIX_LIVRAISON = 35;              // en dirhams, 0 = gratuit
const LIEN_INSTAGRAM = "https://www.instagram.com/votre_compte";
```

⚠️ Le numéro WhatsApp s'écrit **sans `+`, sans espaces et sans le 0** du début, précédé de `212`.

## 2. Ajouter un produit

1. **Prenez les photos** : à la lumière du jour, sur fond neutre, format portrait (idéalement 4:5, par ex. 800×1000 px).
   Photographiez aussi les défauts — c'est la promesse « كل قطعة مصورة بحالتها الحقيقية ».
   Compressez-les (ex. [squoosh.app](https://squoosh.app), < 200 Ko par photo).
2. **Copiez-les dans `images/`**, avec des noms simples sans espaces ni accents : `pull-vert.jpg`, `pull-vert-2.jpg`.
3. **Ajoutez un bloc dans `data.js`**, à la fin du tableau `PRODUITS` (n'oubliez pas la virgule après le bloc précédent) :

```js
  {
    id: 9,                         // nombre unique, jamais réutilisé
    nom: "پول ڤير ديال الصوف",
    categorie: "عيالات",           // "رجال", "عيالات" ou "دراري" (exactement)
    marque: "Zara",
    taille: "M",                   // "S", "M", "42", "8 سنين"…
    etat: "بحال الجديدة",          // étiquette jaune courte
    prix: 140,                     // en dirhams, sans « درهم »
    descriptionEtat: "تلبس مرة وحدة، ما فيه حتى عيب.",
    images: ["images/pull-vert.jpg", "images/pull-vert-2.jpg"], // 1re = photo principale
    vendu: false
  }
```

Les tailles du filtre et la borne du curseur de prix se mettent à jour automatiquement.

**Pièce vendue** : passez `vendu: true`. Elle reste affichée avec le voile « مباعة », n'est plus cliquable,
et est retirée automatiquement des paniers des clients.

> Les images actuelles de `images/` (jacket.jpg, jeans.jpg…) sont des illustrations d'exemple :
> remplacez-les par vos vraies photos.

## 3. Tester en local

Ouvrez `index.html` dans le navigateur, ou mieux, lancez un petit serveur dans le dossier :

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## 4. Mettre le site en ligne

### Option A — GitHub Pages (gratuit)

1. Poussez les fichiers sur GitHub (le dépôt doit contenir `index.html` à la racine).
2. Sur GitHub : **Settings → Pages**.
3. *Source* : **Deploy from a branch**, branche `main`, dossier `/ (root)` → **Save**.
4. Après 1 à 2 minutes, le site est disponible sur `https://<votre-pseudo>.github.io/<nom-du-depot>/`.

Pour chaque mise à jour (nouveau produit, pièce vendue…) : modifiez `data.js`, faites un commit et poussez —
le site se met à jour tout seul. Vous pouvez même modifier `data.js` directement sur github.com (icône crayon).

### Option B — Netlify (gratuit)

- **Glisser-déposer** : allez sur [app.netlify.com/drop](https://app.netlify.com/drop) et déposez le dossier du site. C'est en ligne.
- **Relié à GitHub** (recommandé) : *Add new site → Import an existing project → GitHub*, choisissez le dépôt,
  laissez *Build command* vide et *Publish directory* = `/`. Chaque push redéploie le site.

Un nom de domaine personnalisé (ex. `ma-friperie.ma`) peut être ajouté dans les réglages de GitHub Pages ou de Netlify.

## Fonctionnement

- **Panier** : stocké dans le `localStorage` du navigateur (liste d'id). Une pièce ne peut être ajoutée qu'une fois.
- **Commande** : le formulaire (nom, téléphone, ville, adresse) ouvre WhatsApp avec la commande complète
  (pièces, liens, sous-total, livraison, total). Le client n'a plus qu'à appuyer sur « envoyer ».
  Les coordonnées sont mémorisées pour la commande suivante.
- **Pas de paiement en ligne** : paiement à la livraison.
- **Limite** : le statut « vendu » n'est pas automatique. Dès qu'une commande est confirmée,
  passez la pièce à `vendu: true` dans `data.js` pour éviter qu'elle soit commandée deux fois.

/* =========================================================================
   script.js — Logique du site (accueil, page produit, panier)
   ========================================================================= */

/* -------------------------------------------------------------------------
   CONFIGURATION — à modifier selon votre boutique
   ------------------------------------------------------------------------- */
const NOM_BOUTIQUE = "OutfitHub";
// Numéro WhatsApp au format international, SANS « + », SANS espaces, SANS 0 initial.
// Exemple : 06 12 34 56 78  →  "212612345678"
const NUMERO_WHATSAPP = "212600000000";
// Frais de livraison en dirhams (mettre 0 pour une livraison gratuite)
const PRIX_LIVRAISON = 35;
// Lien du compte Instagram
const LIEN_INSTAGRAM = "https://www.instagram.com/";

/* -------------------------------------------------------------------------
   Constantes internes
   ------------------------------------------------------------------------- */
const CLE_PANIER = "friperie_panier";   // clé localStorage du panier (liste d'id)
const CLE_CLIENT = "friperie_client";   // clé localStorage des infos client (pré-remplissage)

/* -------------------------------------------------------------------------
   Utilitaires
   ------------------------------------------------------------------------- */

/** Formate un prix : 350 → "350 درهم" */
function formaterPrix(prix) {
  return `${prix} درهم`;
}

/** Échappe le texte avant de l'insérer dans du HTML (sécurité) */
function echapper(texte) {
  return String(texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Retrouve un produit par son id (nombre ou texte) */
function trouverProduit(id) {
  return PRODUITS.find((p) => String(p.id) === String(id));
}

/** Lien absolu vers la page d'un produit (pour le message WhatsApp) */
function lienProduit(id) {
  return new URL(`product.html?id=${id}`, window.location.href).href;
}

/** Construit un lien wa.me avec un message pré-rempli */
function lienWhatsApp(message) {
  const base = `https://wa.me/${NUMERO_WHATSAPP}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Lecture / écriture localStorage protégées (navigation privée, stockage bloqué…) */
function lireStockage(cle, valeurParDefaut) {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? JSON.parse(brut) : valeurParDefaut;
  } catch (e) {
    return valeurParDefaut;
  }
}
function ecrireStockage(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch (e) {
    /* stockage indisponible : on ignore */
  }
}

/** Affiche un petit message temporaire en bas de l'écran */
let minuteurToast;
function afficherToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => toast.classList.remove("visible"), 2500);
}

/* -------------------------------------------------------------------------
   Éléments communs : nom de la boutique, liens, prix de livraison
   ------------------------------------------------------------------------- */
function initialiserElementsCommuns() {
  document.querySelectorAll("[data-nom-boutique]").forEach((el) => (el.textContent = NOM_BOUTIQUE));
  document.querySelectorAll("[data-prix-livraison]").forEach((el) => (el.textContent = PRIX_LIVRAISON));
  document.querySelectorAll("[data-annee]").forEach((el) => (el.textContent = new Date().getFullYear()));
  document.querySelectorAll("[data-lien-whatsapp]").forEach((el) => (el.href = lienWhatsApp("السلام، عندي سؤال على الحوايج")));
  document.querySelectorAll("[data-lien-instagram]").forEach((el) => (el.href = LIEN_INSTAGRAM));
  document.title = document.title.replace("OutfitHub", NOM_BOUTIQUE);
}

/* =========================================================================
   PANIER
   Le panier est une simple liste d'id stockée dans localStorage.
   Chaque pièce est unique : une pièce ne peut être ajoutée qu'une fois.
   ========================================================================= */

/** Renvoie les id du panier, en retirant les pièces vendues ou supprimées du catalogue */
function lirePanier() {
  const ids = lireStockage(CLE_PANIER, []);
  const valides = ids.filter((id) => {
    const p = trouverProduit(id);
    return p && !p.vendu;
  });
  if (valides.length !== ids.length) ecrireStockage(CLE_PANIER, valides);
  return valides;
}

function sauverPanier(ids) {
  ecrireStockage(CLE_PANIER, ids);
  mettreAJourPanier();
  // Prévient le reste de la page (ex. bouton de la fiche produit)
  document.dispatchEvent(new CustomEvent("panier:change"));
}

/** Ajoute une pièce au panier. Renvoie true si ajoutée. */
function ajouterAuPanier(id) {
  const produit = trouverProduit(id);
  if (!produit || produit.vendu) return false;

  const ids = lirePanier();
  if (ids.some((x) => String(x) === String(id))) {
    afficherToast("هاد القطعة راها ديجا ف السلة");
    return false;
  }
  ids.push(produit.id);
  sauverPanier(ids);
  afficherToast("تزادت للسلة ✓");
  return true;
}

function retirerDuPanier(id) {
  sauverPanier(lirePanier().filter((x) => String(x) !== String(id)));
}

/** Calcule sous-total, livraison et total */
function calculerTotaux(ids) {
  const sousTotal = ids.reduce((somme, id) => somme + trouverProduit(id).prix, 0);
  const livraison = ids.length > 0 ? PRIX_LIVRAISON : 0;
  return { sousTotal, livraison, total: sousTotal + livraison };
}

/** Rafraîchit le compteur du header et le contenu de la fenêtre panier */
function mettreAJourPanier() {
  const ids = lirePanier();

  // Compteur(s) dans l'en-tête
  document.querySelectorAll("[data-compteur-panier]").forEach((el) => {
    el.textContent = ids.length;
    el.classList.toggle("compteur--vide", ids.length === 0);
  });
  document.querySelectorAll("[data-ouvrir-panier]").forEach((btn) => {
    btn.setAttribute("aria-label", `السلة (${ids.length})`);
  });

  const liste = document.querySelector("[data-panier-liste]");
  if (!liste) return;

  const vide = ids.length === 0;
  document.querySelector("[data-panier-vide]").hidden = !vide;
  document.querySelector("[data-panier-totaux]").hidden = vide;
  document.getElementById("formulaire-commande").hidden = vide;

  liste.innerHTML = ids
    .map((id) => {
      const p = trouverProduit(id);
      return `
        <li class="ligne-panier">
          <img src="${echapper(p.images[0])}" alt="${echapper(p.nom)}" width="64" height="80" loading="lazy">
          <div class="ligne-panier__infos">
            <a href="product.html?id=${p.id}">${echapper(p.nom)}</a>
            <span class="ligne-panier__meta">${echapper(p.marque)} · المقاس ${echapper(p.taille)}</span>
            <strong>${formaterPrix(p.prix)}</strong>
          </div>
          <button type="button" class="btn-icone" data-retirer="${p.id}" aria-label="حيد ${echapper(p.nom)} من السلة">🗑</button>
        </li>`;
    })
    .join("");

  const { sousTotal, livraison, total } = calculerTotaux(ids);
  document.querySelector("[data-sous-total]").textContent = formaterPrix(sousTotal);
  document.querySelector("[data-livraison]").textContent = livraison === 0 ? "فابور" : formaterPrix(livraison);
  document.querySelector("[data-total]").textContent = formaterPrix(total);
}

/** Construit le message WhatsApp de la commande complète */
function construireMessageCommande(client, ids) {
  const lignes = ids.map((id, i) => {
    const p = trouverProduit(id);
    return `${i + 1}. ${p.nom} — ${p.marque} — المقاس ${p.taille} — ${formaterPrix(p.prix)}\n   ${lienProduit(p.id)}`;
  });
  const { sousTotal, livraison, total } = calculerTotaux(ids);

  return [
    `السلام، بغيت ندير طلب من ${NOM_BOUTIQUE}:`,
    "",
    ...lignes,
    "",
    `الحوايج: ${formaterPrix(sousTotal)}`,
    `التوصيل: ${livraison === 0 ? "فابور" : formaterPrix(livraison)}`,
    `المجموع: ${formaterPrix(total)}`,
    "",
    `السمية: ${client.nom}`,
    `التيليفون: ${client.telephone}`,
    `المدينة: ${client.ville}`,
    `العنوان: ${client.adresse}`,
    "",
    "الخلاص عند الاستلام."
  ].join("\n");
}

/** Vérifie un numéro marocain : 06/07/05 + 8 chiffres, ou +212 / 00212 */
function telephoneValide(tel) {
  const nettoye = tel.replace(/[\s.\-()]/g, "");
  return /^(?:\+212|00212|212|0)[5-7]\d{8}$/.test(nettoye);
}

/** Branche les événements du panier (ouverture, fermeture, suppression, commande) */
function initialiserPanier() {
  const dialogue = document.getElementById("panier");
  if (!dialogue) return;

  // Ouvrir
  document.querySelectorAll("[data-ouvrir-panier]").forEach((btn) =>
    btn.addEventListener("click", () => {
      mettreAJourPanier();
      dialogue.showModal();
    })
  );

  // Fermer : bouton ✕ ou clic sur le fond assombri
  dialogue.querySelector("[data-fermer-panier]").addEventListener("click", () => dialogue.close());
  dialogue.addEventListener("click", (e) => {
    if (e.target === dialogue) dialogue.close();
  });

  // Retirer une pièce (délégation d'événement)
  dialogue.querySelector("[data-panier-liste]").addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-retirer]");
    if (bouton) retirerDuPanier(bouton.dataset.retirer);
  });

  // Formulaire : pré-remplissage avec les infos de la dernière commande
  const formulaire = document.getElementById("formulaire-commande");
  const clientSauve = lireStockage(CLE_CLIENT, {});
  ["nom", "telephone", "ville", "adresse"].forEach((champ) => {
    if (clientSauve[champ]) formulaire.elements[champ].value = clientSauve[champ];
  });

  const zoneErreur = formulaire.querySelector("[data-erreur-formulaire]");

  // Envoi de la commande par WhatsApp
  formulaire.addEventListener("submit", (e) => {
    e.preventDefault();
    const ids = lirePanier();
    if (ids.length === 0) return;

    const client = {
      nom: formulaire.elements.nom.value.trim(),
      telephone: formulaire.elements.telephone.value.trim(),
      ville: formulaire.elements.ville.value.trim(),
      adresse: formulaire.elements.adresse.value.trim()
    };

    // Validation simple
    let erreur = "";
    let champFautif = null;
    if (!client.nom) { erreur = "عافاك كتب السمية ديالك."; champFautif = "nom"; }
    else if (!telephoneValide(client.telephone)) { erreur = "رقم التيليفون ماشي صحيح (مثال: 0612345678)."; champFautif = "telephone"; }
    else if (!client.ville) { erreur = "عافاك كتب المدينة."; champFautif = "ville"; }
    else if (!client.adresse) { erreur = "عافاك كتب العنوان."; champFautif = "adresse"; }

    formulaire.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    if (erreur) {
      zoneErreur.textContent = erreur;
      zoneErreur.hidden = false;
      formulaire.elements[champFautif].setAttribute("aria-invalid", "true");
      formulaire.elements[champFautif].focus();
      return;
    }
    zoneErreur.hidden = true;

    // Ouvre WhatsApp avec la commande complète
    window.open(lienWhatsApp(construireMessageCommande(client, ids)), "_blank", "noopener");

    // On garde les infos client pour la prochaine fois et on vide le panier
    ecrireStockage(CLE_CLIENT, client);
    sauverPanier([]);
    dialogue.close();
    afficherToast("صيفط الميساج ف واتساب باش يتأكد الطلب ✓");
  });

  // Synchronise le panier si un autre onglet le modifie
  window.addEventListener("storage", (e) => {
    if (e.key === CLE_PANIER) {
      mettreAJourPanier();
      document.dispatchEvent(new CustomEvent("panier:change"));
    }
  });

  mettreAJourPanier();
}

/* =========================================================================
   PAGE D'ACCUEIL : grille + filtres
   ========================================================================= */

/** HTML d'une carte produit. Vendue → <div> non cliquable avec voile « مباعة » */
function carteProduit(p) {
  const contenu = `
    <div class="carte__image">
      <img src="${echapper(p.images[0])}" alt="${echapper(p.nom)} — ${echapper(p.marque)}"
           width="400" height="500" loading="lazy" decoding="async">
      <span class="etiquette carte__etat">${echapper(p.etat)}</span>
      ${p.vendu ? '<span class="voile-vendu" aria-hidden="true">مباعة</span>' : ""}
    </div>
    <div class="carte__infos">
      <h3 class="carte__nom">${echapper(p.nom)}</h3>
      <p class="carte__meta">${echapper(p.marque)} · المقاس ${echapper(p.taille)}</p>
      <p class="carte__prix">${formaterPrix(p.prix)}</p>
    </div>`;

  if (p.vendu) {
    return `<li><div class="carte carte--vendue" aria-label="${echapper(p.nom)} — مباعة">${contenu}</div></li>`;
  }
  return `<li><a class="carte" href="product.html?id=${p.id}">${contenu}</a></li>`;
}

function initialiserAccueil() {
  const grille = document.getElementById("grille-produits");
  if (!grille) return;

  const formulaire = document.getElementById("filtres");
  const champRecherche = document.getElementById("recherche");
  const champCategorie = document.getElementById("filtre-categorie");
  const champTaille = document.getElementById("filtre-taille");
  const champPrix = document.getElementById("filtre-prix");
  const sortiePrix = document.getElementById("valeur-prix");
  const compte = document.getElementById("resultat-compte");
  const aucun = document.getElementById("aucun-resultat");

  // Tailles disponibles, générées à partir des données
  const tailles = [...new Set(PRODUITS.map((p) => p.taille))];
  champTaille.insertAdjacentHTML(
    "beforeend",
    tailles.map((t) => `<option value="${echapper(t)}">${echapper(t)}</option>`).join("")
  );

  // Curseur de prix : borne max = prix le plus élevé (arrondi à la dizaine supérieure)
  const prixMax = Math.ceil(Math.max(...PRODUITS.map((p) => p.prix)) / 10) * 10;
  champPrix.max = prixMax;
  champPrix.value = prixMax;

  // Catégorie passée dans l'URL (liens du header : index.html?categorie=رجال)
  const params = new URLSearchParams(window.location.search);
  const categorieUrl = params.get("categorie");
  if (categorieUrl) champCategorie.value = categorieUrl;

  /** Applique les filtres et redessine la grille */
  function afficher() {
    const texte = champRecherche.value.trim().toLowerCase();
    const categorie = champCategorie.value;
    const taille = champTaille.value;
    const max = Number(champPrix.value);

    sortiePrix.textContent = formaterPrix(max);

    const resultats = PRODUITS.filter((p) => {
      if (categorie && p.categorie !== categorie) return false;
      if (taille && p.taille !== taille) return false;
      if (p.prix > max) return false;
      if (texte) {
        const cible = `${p.nom} ${p.marque} ${p.categorie} ${p.descriptionEtat}`.toLowerCase();
        if (!cible.includes(texte)) return false;
      }
      return true;
    })
      // Les pièces disponibles d'abord, les vendues à la fin
      .sort((a, b) => Number(a.vendu) - Number(b.vendu));

    grille.innerHTML = resultats.map(carteProduit).join("");
    aucun.hidden = resultats.length > 0;
    const dispo = resultats.filter((p) => !p.vendu).length;
    compte.textContent = `${resultats.length} قطعة · ${dispo} متوفرة`;

    // Lien de catégorie actif dans le header
    document.querySelectorAll("[data-lien-categorie]").forEach((a) => {
      const actif = a.dataset.lienCategorie === categorie;
      a.classList.toggle("actif", actif);
      if (actif) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  formulaire.addEventListener("input", afficher);
  formulaire.addEventListener("submit", (e) => e.preventDefault());
  formulaire.addEventListener("reset", () => {
    // Le reset natif s'applique après l'événement : on attend un tour
    setTimeout(() => {
      champPrix.value = prixMax;
      history.replaceState(null, "", "index.html#boutique");
      afficher();
    });
  });

  // Liens de catégorie du header : filtrer sans recharger la page
  document.querySelectorAll("[data-lien-categorie]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      champCategorie.value = a.dataset.lienCategorie;
      const url = a.dataset.lienCategorie
        ? `index.html?categorie=${encodeURIComponent(a.dataset.lienCategorie)}#boutique`
        : "index.html#boutique";
      history.replaceState(null, "", url);
      afficher();
      document.getElementById("boutique").scrollIntoView({ behavior: "smooth" });
    })
  );

  afficher();
}

/* =========================================================================
   PAGE PRODUIT : product.html?id=...
   ========================================================================= */
function initialiserPageProduit() {
  const fiche = document.getElementById("fiche-produit");
  if (!fiche) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const p = trouverProduit(id);

  // Produit introuvable
  if (!p) {
    fiche.innerHTML = `
      <div class="introuvable">
        <h1>ما لقيناش هاد القطعة</h1>
        <p>يمكن تحيدات ولا الرابط ماشي صحيح.</p>
        <a class="btn btn--principal" href="index.html#boutique">شوف الحوايج</a>
      </div>`;
    return;
  }

  document.title = `${p.nom} — ${NOM_BOUTIQUE}`;

  // Galerie : grande image + miniatures (si plusieurs photos)
  const miniatures =
    p.images.length > 1
      ? `<div class="galerie__miniatures" role="group" aria-label="الصور">
          ${p.images
            .map(
              (src, i) => `
            <button type="button" class="miniature${i === 0 ? " active" : ""}" data-image="${echapper(src)}"
                    aria-label="الصورة ${i + 1}" aria-pressed="${i === 0}">
              <img src="${echapper(src)}" alt="" width="80" height="100" loading="lazy">
            </button>`
            )
            .join("")}
        </div>`
      : "";

  const message = `السلام، بغيت هاد القطعة:\n${p.nom} — ${p.marque} — المقاس ${p.taille}\nالثمن: ${formaterPrix(p.prix)}\n${lienProduit(p.id)}`;

  fiche.innerHTML = `
    <div class="galerie">
      <div class="galerie__principale">
        <img id="image-principale" src="${echapper(p.images[0])}" alt="${echapper(p.nom)} — ${echapper(p.marque)}"
             width="800" height="1000" fetchpriority="high">
        ${p.vendu ? '<span class="voile-vendu" aria-hidden="true">مباعة</span>' : ""}
      </div>
      ${miniatures}
    </div>

    <div class="fiche__infos">
      <p class="fiche__categorie">${echapper(p.categorie)}</p>
      <h1>${echapper(p.nom)}</h1>
      <p class="fiche__prix">${formaterPrix(p.prix)}</p>

      <dl class="fiche__details">
        <div><dt>الماركة</dt><dd>${echapper(p.marque)}</dd></div>
        <div><dt>المقاس</dt><dd>${echapper(p.taille)}</dd></div>
        <div><dt>الحالة</dt><dd><span class="etiquette">${echapper(p.etat)}</span></dd></div>
      </dl>

      <section class="fiche__etat">
        <h2>الحالة بالتفصيل</h2>
        <p>${echapper(p.descriptionEtat)}</p>
      </section>

      ${
        p.vendu
          ? `<p class="fiche__vendue">هاد القطعة تباعت. شوف <a href="index.html#boutique">الحوايج الأخرى</a>.</p>`
          : `<div class="fiche__actions">
              <a class="btn btn--whatsapp btn--large" href="${lienWhatsApp(message)}" target="_blank" rel="noopener">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
                طلب فواتساب
              </a>
              <button type="button" class="btn btn--principal btn--large" id="btn-ajouter">زيد للسلة</button>
            </div>`
      }

      <ul class="fiche__garanties">
        <li>الخلاص عند الاستلام</li>
        <li>التوصيل: ${formaterPrix(PRIX_LIVRAISON)}</li>
        <li>قطعة وحدة فقط</li>
      </ul>
    </div>`;

  // Changement d'image au clic sur une miniature
  const imagePrincipale = document.getElementById("image-principale");
  fiche.querySelectorAll(".miniature").forEach((btn) =>
    btn.addEventListener("click", () => {
      imagePrincipale.src = btn.dataset.image;
      fiche.querySelectorAll(".miniature").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
    })
  );

  // Bouton « زيد للسلة » : change d'état si la pièce est déjà dans le panier
  const btnAjouter = document.getElementById("btn-ajouter");
  if (btnAjouter) {
    const majBouton = () => {
      const dejaDedans = lirePanier().some((x) => String(x) === String(p.id));
      btnAjouter.textContent = dejaDedans ? "ف السلة ✓ — شوف السلة" : "زيد للسلة";
      btnAjouter.classList.toggle("btn--secondaire", dejaDedans);
      btnAjouter.classList.toggle("btn--principal", !dejaDedans);
      return dejaDedans;
    };
    btnAjouter.addEventListener("click", () => {
      if (lirePanier().some((x) => String(x) === String(p.id))) {
        document.getElementById("panier").showModal();
      } else {
        ajouterAuPanier(p.id);
      }
      majBouton();
    });
    document.addEventListener("panier:change", majBouton);
    majBouton();
  }
}

/* =========================================================================
   Démarrage
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initialiserElementsCommuns();
  initialiserPanier();
  initialiserAccueil();
  initialiserPageProduit();
});

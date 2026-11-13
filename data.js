/* =========================================================================
   data.js — Catalogue des produits
   -------------------------------------------------------------------------
   Chaque pièce est UNIQUE (friperie) : il n'y a pas de quantité.
   Quand une pièce est vendue, passez simplement  vendu: true
   → elle reste visible avec le voile « مباعة » mais n'est plus cliquable.

   Champs :
     id                (nombre, unique)   identifiant utilisé dans product.html?id=...
     nom               (texte)            nom affiché
     categorie         "رجال" | "عيالات" | "دراري"
     marque            (texte)
     taille            (texte)            ex. "M", "L", "32", "10 سنين"
     etat              (texte court)      étiquette jaune, ex. "بحال الجديدة"
     prix              (nombre)           prix en dirhams, sans « درهم »
     descriptionEtat   (texte)            détail de l'état (défauts, usure…)
     images            (tableau)          chemins des photos, la 1re = photo principale
     vendu             (true / false)
   ========================================================================= */

const PRODUITS = [
  {
    id: 1,
    nom: "دودون كحلي بالكابيشون",
    categorie: "رجال",
    marque: "The North Face",
    taille: "L",
    etat: "بحال الجديدة",
    prix: 350,
    descriptionEtat:
      "تلبس شي جوج مرات فقط. السنسلة خدامة مزيان، ما فيه حتى تقطيعة ولا تبقيعة. الريش باقي عامر والكابيشون كيتحيد.",
    images: ["images/jacket.jpg", "images/jacket-2.jpg"],
    vendu: false
  },
  {
    id: 2,
    nom: "سروال جين زرق كلاسيك",
    categorie: "رجال",
    marque: "Levi's",
    taille: "32",
    etat: "مزيان",
    prix: 160,
    descriptionEtat:
      "الثوب قاصح ومزيان. اللون خفيف شوية من التصبين بحال كل جين، والتحت ديال الرجلين ما مقطعش.",
    images: ["images/jeans.jpg"],
    vendu: false
  },
  {
    id: 3,
    nom: "كبوط ديال الصوف بيج",
    categorie: "عيالات",
    marque: "Zara",
    taille: "M",
    etat: "بحال الجديدة",
    prix: 280,
    descriptionEtat:
      "كبوط طويل ودافي، الصوف ما فيهش البولوش. كاملين البوطونات فبلاصتهم والبطانة نقية.",
    images: ["images/coat.jpg", "images/coat-2.jpg"],
    vendu: false
  },
  {
    id: 4,
    nom: "صاية طويلة مورّدة",
    categorie: "عيالات",
    marque: "Mango",
    taille: "S",
    etat: "جديدة بالتيكيت",
    prix: 150,
    descriptionEtat: "جديدة عمرها ما تلبسات، باقا فيها التيكيت ديال الحانوت.",
    images: ["images/dress.jpg"],
    vendu: true
  },
  {
    id: 5,
    nom: "سويت شيرت رمادي",
    categorie: "دراري",
    marque: "Nike",
    taille: "10 سنين",
    etat: "مزيان",
    prix: 120,
    descriptionEtat:
      "سويت دافي ومريح. كاين شوية ديال البولوش الخفيف تحت الدراع، والطباعة ديال اللوگو باقا واضحة.",
    images: ["images/kids-sweat.jpg"],
    vendu: false
  },
  {
    id: 6,
    nom: "قميجة كاروهات حمرا",
    categorie: "رجال",
    marque: "Ralph Lauren",
    taille: "XL",
    etat: "بحال الجديدة",
    prix: 180,
    descriptionEtat: "قطن 100%، الكول والمانشيط نقيين وكاملين البوطونات كاينين.",
    images: ["images/shirt.jpg"],
    vendu: true
  },
  {
    id: 7,
    nom: "فيستة جينز للدراري",
    categorie: "دراري",
    marque: "H&M",
    taille: "6 سنين",
    etat: "فيها عيب صغير",
    prix: 90,
    descriptionEtat:
      "كاينة تبقيعة صغيرة ف الجيب ديال اليسار (باينة ف الصورة). من غير هادشي الفيستة مزيانة والسنسلة خدامة.",
    images: ["images/kids-denim.jpg"],
    vendu: false
  },
  {
    id: 8,
    nom: "جاكيط جلد كحلة",
    categorie: "عيالات",
    marque: "Massimo Dutti",
    taille: "M",
    etat: "مزيان",
    prix: 450,
    descriptionEtat:
      "جلد طبيعي، طري ومزيان. كاين شوية ديال التخشاش الخفيف ف الكم ديال اليمين، عادي بالنسبة للجلد.",
    images: ["images/leather-jacket.jpg"],
    vendu: false
  }
];

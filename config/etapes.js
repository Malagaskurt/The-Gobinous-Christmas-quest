/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — ÉTAGES ET MOTS SECRETS
 * ---------------------------------------------------------------------
 * Chaque quête se débloque quand l'équipe arrive à son étage et saisit
 * le MOT SECRET affiché sur place (affichette, totem, panneau…).
 * Les majuscules, accents et espaces sont ignorés à la saisie.
 *
 * Champs d'une étape :
 *   etage      : étage affiché dans l'application (« 5ᵉ étage »)
 *   lieu       : repère sur place (affiché à l'équipe, peut rester vide)
 *   motSecret  : mot à saisir pour lancer la quête
 *   variantes  : (facultatif) autres orthographes acceptées
 *   titre      : titre de l'écran de saisie du mot secret (écrit en
 *                lettres tricotées : évitez les exposants comme « ᵉ »)
 *   histoire   : récit affiché (effet machine à écrire) sur l'écran de
 *                saisie : il guide l'équipe jusqu'à l'étage
 *
 * Étape 1 : son mot secret est le CODE D'ENTRÉE du jeu, demandé dès
 * l'ouverture du Christmas Quest (avant le nom d'équipe) ; les
 * organisateurs le donnent au top départ (textes : config/textes.js →
 * entree).
 *
 * Les affichettes à imprimer (une page A4 par mot secret) sont générées
 * par le mode test : #/organisateur → « Affichettes des mots secrets ».
 *
 * ⚠ Quête 5 : ne jamais écrire ici les mots « salle » ou « porte »
 *   (l'équipe doit trouver elle-même le repaire du lutin).
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.etapes = {
  1: {
    etage: "Hall",
    lieu: "Point de départ",
    motSecret: "SAPIN",
    titre: "Le point de départ",
    histoire:
      "Barnabé, le lutin rebelle du Gobinous Christmas Club, a volé le Cadeau Officiel ! Sans lui, pas de fête.\n\nLe code secret vous sera donné par les organisateurs au top départ.",
  },

  2: {
    etage: "5ᵉ étage",
    lieu: "Coin café, près du mur végétal",
    motSecret: "LUTIN",
    titre: "Cap sur l'étage 5",
    histoire:
      "Bien vu ! Barnabé a fait une pause café au 5ᵉ étage, près du mur végétal… et il y a oublié quelque chose. Montez : le mot secret est affiché sur place.",
  },

  3: {
    etage: "23ᵉ étage",
    lieu: "Espace matériaux Saint-Gobain",
    motSecret: "GUIRLANDE",
    titre: "Cap sur l'étage 23",
    histoire:
      "« La clé du mystère est le verre »… Le verre, c'est la spécialité de Saint-Gobain ! Cap sur l'espace matériaux du 23ᵉ étage : Barnabé y a planqué un nouvel indice.",
  },

  4: {
    etage: "20ᵉ étage",
    lieu: "Support 44",
    motSecret: "ETOILE",
    titre: "Cap sur l'étage 20",
    histoire:
      "Bluffé par vos photos, Barnabé a lâché une info sans le vouloir : il a perdu son badge au Support 44, là où naissent les badges de la Tour. Descendez au 20ᵉ étage !",
  },

  5: {
    etage: "33ᵉ étage",
    lieu: "",
    motSecret: "CADEAU",
    titre: "Cap sur l'étage 33",
    histoire:
      "BADGE LOCALISÉ ! Celui de Barnabé SIX-SEVEN vient de biper au 33ᵉ étage. Il s'y cache avec le Cadeau Officiel. Montez, vite !",
  },
};

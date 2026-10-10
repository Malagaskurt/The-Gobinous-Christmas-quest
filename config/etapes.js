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
      "Barnabé, le lutin du Gobinous Christmas Club, a caché le Cadeau Officiel de Noël ! Sans lui, pas de fête.\n\nPremier mot secret : il est affiché ici, dans le hall.",
  },

  2: {
    etage: "5ᵉ étage",
    lieu: "Coin café, près du mur végétal",
    motSecret: "LUTIN",
    titre: "Cap sur l'étage 5",
    histoire:
      "Bien vu ! Direction le coin café du 5ᵉ étage, près du mur végétal. Le mot secret vous y attend.",
  },

  3: {
    etage: "23ᵉ étage",
    lieu: "Espace matériaux Saint-Gobain",
    motSecret: "GUIRLANDE",
    titre: "Cap sur l'étage 23",
    histoire:
      "Le verre a livré son secret ! Cap sur le 23ᵉ étage, là où la matière prend vie avec les plus belles solutions Saint-Gobain.",
  },

  4: {
    etage: "20ᵉ étage",
    lieu: "Support 44",
    motSecret: "ETOILE",
    titre: "Cap sur l'étage 20",
    histoire:
      "Épuisé par vos talents de comédiens, le lutin vous laisse passer. Descendez au 20ᵉ étage, au Support 44 : là où naissent les badges de la tour.",
  },

  5: {
    etage: "33ᵉ étage",
    lieu: "",
    motSecret: "CADEAU",
    titre: "Cap sur l'étage 33",
    histoire:
      "BADGE LOCALISÉ ! Celui de Barnabé SIX-SEVEN vient de biper au 33ᵉ étage. Il s'y cache avec le cadeau. Montez, vite !",
  },
};

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
    etage: "La Verrière, 4ᵉ étage",
    lieu: "Point de base",
    motSecret: "SAPIN",
    titre: "Check-in à La Verrière",
    histoire:
      "Point de base : La Verrière. Le code vous sera donné au top départ.",
  },

  2: {
    etage: "5ᵉ étage",
    lieu: "Coin café, près du mur végétal",
    motSecret: "LUTIN",
    titre: "Cap sur l'étage 5",
    histoire:
      "Accès autorisé ! Premier signal de Barnabé : le coin café du 5ᵉ étage, près du mur végétal. Le mot secret est sur place.",
  },

  3: {
    etage: "23ᵉ étage",
    lieu: "Espace matériaux Saint-Gobain",
    motSecret: "GUIRLANDE",
    titre: "Cap sur l'étage 23",
    histoire:
      "Barnabé vous a repérés ! Lancez la diversion depuis l'espace matériaux du 23ᵉ étage.",
  },

  4: {
    etage: "20ᵉ étage",
    lieu: "Support 44",
    motSecret: "ETOILE",
    titre: "Cap sur l'étage 20",
    histoire:
      "Alerte : un badge inconnu a été scanné dans la Tour. Le Support 44 (20ᵉ étage) a besoin de vous.",
  },

  5: {
    etage: "33ᵉ étage",
    lieu: "",
    motSecret: "CADEAU",
    titre: "Cap sur l'étage 33",
    histoire:
      "Dernier bip du badge : 33ᵉ étage. Le colis est là-haut. Foncez !",
  },
};

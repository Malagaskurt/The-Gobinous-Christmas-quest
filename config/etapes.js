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
      "Le lutin officiel du Gobinous Christmas Club devait livrer l'ultime Cadeau Officiel de Noël dans la Tour Saint-Gobain… mais sur un coup de tête, il est allé le cacher ! Sans ce sésame, impossible de lancer la fête.\n\nRemontez sa piste, étage par étage. Pour commencer, trouvez le mot secret affiché au point de départ, dans le hall.",
  },

  2: {
    etage: "5ᵉ étage",
    lieu: "Coin café, près du mur végétal",
    motSecret: "LUTIN",
    titre: "Cap sur l'étage 5",
    histoire:
      "Bien vu, c'est le 5ᵉ étage ! Prenez l'ascenseur et rendez-vous au coin café, près du mur végétal Saint-Gobain. Le mot secret de l'étage vous y attend.",
  },

  3: {
    etage: "23ᵉ étage",
    lieu: "Espace matériaux Saint-Gobain",
    motSecret: "GUIRLANDE",
    titre: "Cap sur l'étage 23",
    histoire:
      "Le verre vous a livré son secret, mais l'aventure ne fait que commencer. Votre prochaine destination se situe au 23ᵉ étage : l'étage où la matière prend vie à travers les plus belles solutions Saint-Gobain.",
  },

  4: {
    etage: "20ᵉ étage",
    lieu: "Support 44",
    motSecret: "ETOILE",
    titre: "Cap sur l'étage 20",
    histoire:
      "Le lutin farceur, épuisé par vos talents de comédiens, s'avoue vaincu et vous laisse enfin progresser ! Votre voyage dans la tour se poursuit. Prenez l'ascenseur et descendez au 20ᵉ étage, au cœur du Support 44, là où se façonnent les précieux sésames et badges de la tour.",
  },

  5: {
    etage: "33ᵉ étage",
    lieu: "",
    motSecret: "CADEAU",
    titre: "Cap sur l'étage 33",
    histoire:
      "BADGE LOCALISÉ ! Le badge de Barnabé SIX-SEVEN vient de biper au portique du 33ᵉ étage ! Il s'est retranché au 33ᵉ étage avec le Cadeau Officiel du Gobinous Christmas Club. Montez immédiatement au 33ᵉ étage !",
  },
};

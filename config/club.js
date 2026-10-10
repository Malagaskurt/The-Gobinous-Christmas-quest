/* =====================================================================
 * THE GOBINOUS CHRISTMAS CLUB — ACCUEIL ET PROGRAMME DE L'ÉVÉNEMENT
 * ---------------------------------------------------------------------
 * Page d'accueil du site (#/), programme des temps forts (#/programme)
 * et page d'information de la Battle.
 * La Party est dans config/party.js, le questionnaire dans
 * config/wrapup.js, le jeu (Christmas Quest) dans les autres fichiers.
 *
 * Mise en forme : **gras**, \n (retour à la ligne), [[gift]] (pictogramme
 * pixel : gift, tree, star, bell, sock, flake, crown, camera, clock…).
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.club = {
  /* Page d'accueil du site. */
  accueil: {
    surtitre: "The",
    titre: "Gobinous",
    sousTitre: "Christmas Club",
    edition: "Noël 2026",
    appel: "Découvrir le programme",
  },

  /* Programme : un bloc par temps fort, dans l'ordre de l'événement.
   *   id     : quest, party, battle, gift ou wrapup (ne pas modifier)
   *   icone  : pictogramme tricoté (tree, gift, star, quiz, camera, bell…)
   *   badge  : petite étiquette (« Code secret », « Sans téléphone »…)
   *   bouton : libellé du bouton (vide = pas de bouton) */
  programme: {
    titre: "Le programme",
    intro: "4 temps forts pour un événement 100 % Gobinous.",
    temps: [
      {
        id: "quest",
        icone: "tower",
        nom: "Gobi'Christmas Quest",
        texte: "Retrouvez le colis disparu dans la Tour Saint-Gobain, en 5 étapes.",
        badge: "En équipe · 30 min",
        bouton: "Découvrir",
      },
      {
        id: "party",
        icone: "tree",
        nom: "Gobi'Christmas Party",
        texte: "Goûter, atelier sapin et 20 défis à relever en autonomie.",
        badge: "Code secret",
        bouton: "Découvrir",
      },
      {
        id: "battle",
        icone: "star",
        nom: "Gobi'Christmas Battle",
        texte: "Le grand jeu final : quiz interactif et classement en direct.",
        badge: "En équipes",
        bouton: "Découvrir",
      },
      {
        id: "wrapup",
        icone: "gift",
        nom: "Gobi'Christmas Wrap-Up",
        texte: "Le tirage du Secret Santa et votre avis en 1 minute.",
        badge: "Secret Santa",
        bouton: "Découvrir",
      },
    ],
  },

  /* Rubrique indépendante du programme : les photos et vidéos. */
  vlog: {
    nom: "Le Vlog des Gobinous",
    texte: "Photos et vidéos de l'événement : tout le monde peut déposer.",
    bouton: "Découvrir",
  },

  /* Pages d'information (pas de jeu sur le téléphone). */
  battle: {
    titre: "Gobi'Christmas Battle",
    bulle: "Le grand jeu final, c'est maintenant !",
    texte: "Un quiz interactif en équipes, animé par les organisateurs, avec le classement en temps réel. Que la meilleure équipe gagne !",
    points: [
      { icone: "bell", texte: "Écoutez bien les organisateurs : ils lancent chaque manche du quiz." },
      { icone: "star", texte: "Chaque bonne réponse fait grimper votre équipe au classement, en direct." },
      { icone: "crown", texte: "L'équipe en tête à la fin remporte la Christmas Battle !" },
    ],
  },
};

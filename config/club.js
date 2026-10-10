/* =====================================================================
 * THE GOBINOUS CHRISTMAS CLUB — ACCUEIL ET PROGRAMME DE LA SOIRÉE
 * ---------------------------------------------------------------------
 * Page d'accueil du site (#/), programme des temps forts (#/programme)
 * et pages d'information de la Battle et du Gift.
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
    appel: "Touchez l'écran pour découvrir le programme",
  },

  /* Programme : un bloc par temps fort, dans l'ordre de la soirée.
   *   id     : quest, party, battle, gift ou wrapup (ne pas modifier)
   *   icone  : pictogramme tricoté (tree, gift, star, quiz, camera, bell…)
   *   badge  : petite étiquette (« Code secret », « Sans téléphone »…)
   *   bouton : libellé du bouton (vide = pas de bouton) */
  programme: {
    titre: "Le programme",
    intro: "Quatre temps forts… et le mot de la fin.",
    temps: [
      {
        id: "quest",
        icone: "tower",
        nom: "Christmas Quest",
        texte: "Le grand jeu : 5 quêtes dans la Tour pour retrouver le cadeau caché par Barnabé.",
        badge: "En équipe · 30 min",
        bouton: "Jouer",
      },
      {
        id: "party",
        icone: "tree",
        nom: "Christmas Party",
        texte: "Goûter, déco du sapin… et 20 défis pour gagner des Gobz.",
        badge: "Code secret",
        bouton: "Entrer",
      },
      {
        id: "battle",
        icone: "star",
        nom: "Christmas Battle",
        texte: "Des jeux entre nous, en live. Ici, rangez les téléphones !",
        badge: "Sans téléphone",
        bouton: "Découvrir",
      },
      {
        id: "gift",
        icone: "gift",
        nom: "Christmas Gift",
        texte: "Le Secret Santa : un numéro, un cadeau, une surprise.",
        badge: "Secret Santa",
        bouton: "Découvrir",
      },
      {
        id: "wrapup",
        icone: "check",
        nom: "Christmas Wrap-Up",
        texte: "5 questions, 1 minute : votre avis sur la soirée.",
        badge: "100 % anonyme",
        bouton: "Mon avis",
      },
    ],
  },

  /* Pages d'information (pas de jeu sur le téléphone). */
  battle: {
    titre: "Christmas Battle",
    bulle: "Rangez les téléphones : place au live !",
    texte: "Des jeux entre nous, en équipes, animés par les organisateurs. Pas besoin de l'appli : juste vos réflexes, votre voix… et un peu de mauvaise foi.",
    points: [
      { icone: "bell", texte: "Écoutez bien les organisateurs : ils annoncent chaque manche." },
      { icone: "star", texte: "Rapidité, culture, rires : chaque manche rapporte des points à votre équipe." },
      { icone: "crown", texte: "L'équipe gagnante repart avec la gloire éternelle (et peut-être plus)." },
    ],
  },
  gift: {
    titre: "Christmas Gift",
    bulle: "Le Secret Santa, c'est maintenant !",
    texte: "Tous les cadeaux apportés ont été numérotés. Chacun reçoit un numéro… et repart avec le cadeau qui porte le même.",
    points: [
      { icone: "sock", texte: "Récupérez votre numéro auprès des organisateurs." },
      { icone: "gift", texte: "Trouvez le cadeau qui porte votre numéro." },
      { icone: "star", texte: "Ouvrez-le devant tout le monde : effet garanti !" },
    ],
  },
};

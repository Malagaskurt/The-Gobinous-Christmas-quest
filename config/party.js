/* =====================================================================
 * GOBINOUS CHRISTMAS PARTY — GOÛTER, SAPIN ET MISSION BOARD
 * ---------------------------------------------------------------------
 * Page #/party, protégée par un code secret donné par les organisateurs
 * au moment de la Party. Les joueurs (solo ou en équipe) valident des
 * défis en envoyant une photo ou une vidéo et gagnent des Gobz.
 * Le serveur du jeu (npm start) compte les points et tient le classement :
 * sans lui, les points restent sur le téléphone et le classement est
 * masqué.
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.party = {
  titre: "Gobi'Christmas Party",
  /* Code secret d'accès (majuscules et espaces ignorés). */
  code: "2020",
  codeLabel: "Code secret de la Party",
  codeErreur: "Mauvais code. Demandez-le aux organisateurs !",
  codeBulle: "Psst… La Party, c'est sur invitation. Le code ?",

  /* Présentation par le lutin. */
  bulle: "C'est l'heure du goûter !",
  texte:
    "On se pose, on grignote et on décore ensemble le **sapin Gobinous**. Polaroïds, kit déco et petits mots vous attendent !",
  defiTexte:
    "Envie de briller ? **15 défis** vous attendent sur le **Mission Board**, en solo ou en équipe. Chaque défi rapporte des **Gobz**, et le plus riche à la fin de l'événement gagne une surprise !",

  nomLabel: "Votre prénom ou nom d'équipe",
  nomPlaceholder: "Ex. : Camille, ou Les Givrés",
  nomBouton: "Je participe",
  nomErreur: "Indiquez un prénom ou un nom d'équipe.",

  /* La monnaie de l'événement. */
  monnaie: "Gobz",
  listeTitre: "Mission Board",
  listeSousTitre: "Treats & Chill · 15 défis",
  classementTitre: "Classement",
  classementVide: "Personne n'a encore de Gobz. À vous de jouer !",
  classementHorsLigne: "Le classement s'affiche dès que le serveur de l'événement est en ligne.",

  /* Fenêtre d'un défi. */
  boutonPhoto: "Prendre une photo",
  boutonVideo: "Filmer une vidéo",
  boutonGalerie: "Ma galerie",
  boutonValider: "Valider (+{points} {monnaie})",
  boutonReprendre: "Changer",
  envoiEnCours: "Envoi en cours… {pct} %",
  envoiErreur: "L'envoi a échoué (réseau ?). Réessayez.",
  tropLourd: "Fichier trop lourd (8 Go maximum).",
  defiValide: "Défi validé !",
  dejaValide: "Validé",
  boutonAvis: "Répondre au questionnaire",
  autoValide: "Défi « Ton avis compte » validé !",

  /* Les 15 défis officiels. video: true → la vidéo est proposée en premier.
   * auto: "avis" → le défi se valide tout seul quand le questionnaire de
   * satisfaction (Wrap-Up) est envoyé depuis ce téléphone. */
  defis: [
    { titre: "Selfie ascenseur", texte: "Prends un selfie d'équipe dans l'ascenseur.", points: 10 },
    { titre: "Objet random", texte: "Prends une photo avec un objet random.", points: 15 },
    { titre: "Reporter d'un jour", texte: "Prends 10 belles photos de l'événement (dépose-les sur The Gobi'Hub) et envoie ici ta préférée.", points: 25 },
    { titre: "J'accuse Barnabé", texte: "Enregistre une courte vidéo en équipe pour accuser publiquement Barnabé.", points: 20, video: true },
    { titre: "Service VIP", texte: "Filme-toi en train de servir une personne que tu ne connais pas pendant le goûter.", points: 30, video: true },
    { titre: "Team orga", texte: "Prends un selfie avec les organisatrices Gobinous.", points: 20 },
    { titre: "Selfie goûter", texte: "Prends un selfie pendant le goûter.", points: 5 },
    { titre: "Nouvelle rencontre", texte: "Prends une photo avec une personne que tu ne connaissais pas avant l'événement.", points: 15 },
    { titre: "Déguisement de Noël", texte: "Trouve un déguisement de Noël et prends une photo.", points: 20 },
    { titre: "Trend TikTok", texte: "Reproduis une trend de Noël TikTok, seul·e ou accompagné·e.", points: 100, video: true },
    { titre: "Déclaration", texte: "Fais une petite déclaration d'amour ou d'amitié en vidéo à un Gobinou.", points: 50, video: true },
    { titre: "Belle photo", texte: "Prends une belle photo de l'événement.", points: 5 },
    { titre: "Mon Secret Santa", texte: "Prends un selfie avec le cadeau gagné au Secret Santa.", points: 25 },
    { titre: "Chorale de Noël", texte: "Crée une chorale de Noël en vidéo.", points: 50, video: true },
    { titre: "Ton avis compte", texte: "Laisse un avis sur l'événement avant de partir. Ce défi se valide tout seul dès que tu envoies le questionnaire du Wrap-Up.", points: 15, auto: "avis" },
  ],

};

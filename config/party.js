/* =====================================================================
 * GOBINOUS CHRISTMAS PARTY — GOÛTER, SAPIN ET BUCKET LIST
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
  titre: "Christmas Party",
  /* Code secret d'accès (majuscules et espaces ignorés). */
  code: "2020",
  codeLabel: "Code secret de la Party",
  codeErreur: "Mauvais code. Demandez-le aux organisateurs !",
  codeBulle: "Psst… La Party, c'est sur invitation. Le code ?",

  /* Présentation par le lutin. */
  bulle: "C'est l'heure du goûter !",
  texte:
    "On se pose, on grignote et on décore ensemble le **sapin Gobinous** : polaroïds, kit déco et petits mots sont à votre disposition.",
  defiTexte:
    "Et pour les plus motivés : **20 défis** à relever, en solo ou en équipe. Chaque défi rapporte des **Gobz**. Le plus riche à la fin de l'événement gagne une surprise !",

  nomLabel: "Votre prénom ou nom d'équipe",
  nomPlaceholder: "Ex. : Camille, ou Les Givrés",
  nomBouton: "Je participe",
  nomErreur: "Indiquez un prénom ou un nom d'équipe.",

  /* La monnaie de l'événement. */
  monnaie: "Gobz",
  listeTitre: "Treats & Chill",
  listeSousTitre: "La bucket list · 20 défis",
  classementTitre: "Classement",
  classementVide: "Personne n'a encore de Gobz. À vous de jouer !",
  classementHorsLigne: "Classement disponible quand le serveur de l'événement est en ligne.",

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

  /* Les 20 défis. video: true → la vidéo est proposée en premier. */
  defis: [
    { titre: "Ambiance de folie", texte: "Prends une photo stylée de l'ambiance de l'événement.", points: 5 },
    { titre: "Miroir, mon beau miroir", texte: "Fais un selfie de groupe dans un miroir avec un accessoire de Noël.", points: 5 },
    { titre: "Main dans le goûter", texte: "Prends en photo ton équipe en train de piocher dans le goûter.", points: 10 },
    { titre: "Nouveau pote", texte: "Fais un selfie avec quelqu'un que tu ne connaissais pas en arrivant.", points: 10 },
    { titre: "Fashion Week", texte: "Prends une photo de ton équipe avec une pose de mannequins haute couture.", points: 10 },
    { titre: "Cheers très sérieux", texte: "Immortalise un faux « cheers » avec des tasses, l'air hyper sérieux.", points: 10 },
    { titre: "Lutin dans le sapin", texte: "Prends une photo d'un membre de l'équipe caché derrière les branches du sapin.", points: 15 },
    { titre: "Déclaration dramatique", texte: "Fais une mini-vidéo ou une photo d'une déclaration d'amour (ou d'amitié) dramatique à un Gobinous.", points: 15, video: true },
    { titre: "Trio absurde", texte: "Prends une photo de groupe exactement à trois, dans une pose totalement absurde.", points: 15 },
    { titre: "Chef étoilé", texte: "Prends en photo quelqu'un en train de goûter un plat avec une concentration extrême.", points: 15 },
    { titre: "Sieste générale", texte: "Prends une photo de tout le monde en train de faire semblant de s'endormir sur la table.", points: 15 },
    { titre: "Trend de Noël", texte: "Fais une mini-vidéo d'une trend TikTok de Noël ou d'une danse improvisée.", points: 20, video: true },
    { titre: "Panique chez Barnabé", texte: "Prends une photo de ton équipe faisant mine d'être en panique au téléphone avec Barnabé.", points: 20 },
    { titre: "Zoom mystère", texte: "Prends en photo un détail banal de la pièce, de très près, façon devinette.", points: 20 },
    { titre: "Clin d'œil collectif", texte: "Fais un selfie de groupe où tout le monde fait un clin d'œil.", points: 20 },
    { titre: "Le Parrain", texte: "Mets la main sur l'épaule de quelqu'un d'une autre équipe, en mode parrain de la mafia.", points: 20 },
    { titre: "Notre polaroïd", texte: "Prends en photo le polaroïd de ton équipe accroché sur le grand sapin.", points: 25 },
    { titre: "Archi-goûter", texte: "Crée une mini-structure éphémère de Noël avec des objets du goûter et photographie-la.", points: 25 },
    { titre: "Sosie de Barnabé", texte: "Trouve la personne qui ressemble le plus à un lutin (ou à Barnabé) et fais un selfie avec elle.", points: 30 },
    { titre: "Menace signée Barnabé", texte: "Écris un mot de menace de la part de Barnabé et prends-le en photo sur le sapin.", points: 30 },
  ],
};

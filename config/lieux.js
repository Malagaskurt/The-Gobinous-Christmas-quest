/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — LIEUX, INDICES ET QR CODES
 * ---------------------------------------------------------------------
 * Les lieux ci-dessous sont INVENTÉS pour que le jeu soit jouable de bout
 * en bout : remplacez-les par de vrais lieux de la Tour Saint-Gobain,
 * réellement accessibles aux participants (puis supprimez la ligne
 * aVerifier de chaque lieu).
 *
 * Parcours :
 *   Quête 1 (quiz)            → indice vers le lieu A → QR A → Quête 2
 *   Quête 2 (énigme)          → indice vers le lieu B → QR B → Quête 3
 *   Quête 3 (défi)            → indice vers le lieu C → QR C → Quête 4
 *   Quête 4 (dernier indice)  → réponse = lieu FINAL → Quête 5
 *   (QR FINAL facultatif : clôture la partie, voir config/parametres.js)
 *
 * Champs d'un lieu :
 *   nom               : nom du lieu, affiché une fois qu'il est trouvé
 *   indice            : indice affiché pour deviner le lieu
 *                       (non utilisé pour FINAL : c'est l'énigme de la
 *                       quête 4 qui joue ce rôle)
 *   reponsesAcceptees : toutes les formulations acceptées
 *                       (majuscules, accents et articles ignorés)
 *   texteValidation   : texte affiché quand le lieu est trouvé
 *   indiceJoker       : indice supplémentaire du joker ("" = pas de joker)
 *   codeQR            : code court et unique, encodé dans le QR code et
 *                       imprimé sous celui-ci (saisie manuelle possible).
 *                       Lettres et chiffres uniquement.
 *
 * Les QR codes à imprimer sont générés automatiquement par le mode
 * test (#/organisateur → « Fiches QR codes à imprimer »). Ils pointent
 * vers : <adresse du site>#/scan/<codeQR>
 *
 * Un QR code n'est pas une preuve de présence : un code peut être
 * partagé ou deviné. C'est un repère pratique pour guider les équipes.
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.lieux = {
  /* Après le quiz (quête 1). */
  A: {
    nom: "Le grand sapin du hall",
    indice:
      "Au pied de la Tour, je suis le premier à vous souhaiter la bienvenue.\nCette année, j'ai revêtu boules, guirlandes et une étoile tout en haut.\nSous la grande verrière, je brille pour chaque visiteur qui passe les portiques.\n\n**Où le lutin a-t-il caché la suite ?**",
    reponsesAcceptees: [
      "sapin", "grand sapin", "sapin du hall", "sapin de noel", "le sapin de noel du hall",
      "hall", "hall d'accueil", "hall d'entree", "accueil", "rez de chaussee",
    ],
    texteValidation:
      "Direction le rez-de-chaussée ! Le QR code est accroché à une branche du grand sapin, côté accueil. Ne secouez pas trop les boules…",
    indiceJoker: "Prenez l'ascenseur… jusqu'en bas, là où l'on badge en arrivant le matin.",
    codeQR: "SAPIN",
    aVerifier: "Lieu inventé pour les tests : à remplacer par un vrai lieu de la Tour.",
  },

  /* Après l'énigme mystère (quête 2). */
  B: {
    nom: "La cafétéria",
    indice:
      "Ici, les tasses fument comme des cheminées un soir de réveillon.\nOn s'y retrouve pour un chocolat chaud, un café ou une pause bien méritée.\nLe lutin, frigorifié, est venu s'y réchauffer… et il a oublié quelque chose.\n\n**Où le lutin est-il allé se réchauffer ?**",
    reponsesAcceptees: [
      "cafeteria", "cafet", "cafe", "coin cafe", "espace cafe", "machine a cafe",
      "restaurant", "restaurant d'entreprise", "cantine", "self",
    ],
    texteValidation:
      "Filez à la cafétéria ! Le QR code se cache près de la machine à café, entre les tasses et les sachets de chocolat.",
    indiceJoker: "Suivez l'odeur du café… et du chocolat chaud.",
    codeQR: "ETOILE",
    aVerifier: "Lieu inventé pour les tests : à remplacer par un vrai lieu de la Tour.",
  },

  /* Après le défi Saint-Gobain (quête 3). */
  C: {
    nom: "L'auditorium",
    indice:
      "Je n'ai ni bureau ni vue sur Paris, mais des rangées de fauteuils face à une scène.\nC'est chez moi que l'on fait les grandes annonces et les conventions.\nCe soir, le lutin y répète en secret son spectacle de Noël.\n\n**Dans quelle salle le lutin fait-il son show ?**",
    reponsesAcceptees: [
      "auditorium", "amphi", "amphitheatre", "salle de conference", "salle de conferences",
      "salle de spectacle", "salle de convention",
    ],
    texteValidation:
      "Rendez-vous à l'auditorium ! Le QR code est collé sur le pupitre, au milieu de la scène.",
    indiceJoker: "Micro, scène, projecteurs : c'est là qu'on parle à tout le monde en même temps.",
    codeQR: "FLOCON",
    aVerifier: "Lieu inventé pour les tests : à remplacer par un vrai lieu de la Tour.",
  },

  /* Cachette de la hotte : réponse à l'énigme de la quête 4. */
  FINAL: {
    nom: "La terrasse panoramique",
    indice: "",
    reponsesAcceptees: [
      "terrasse", "terrasse panoramique", "rooftop", "toit", "toit terrasse", "le toit de la tour",
      "dernier etage", "sommet", "sommet de la tour", "haut de la tour",
    ],
    texteValidation:
      "Prenez l'ascenseur jusqu'au dernier étage et rejoignez la terrasse panoramique : la hotte vous y attend, avec tout Paris à vos pieds !",
    indiceJoker: "",
    codeQR: "HOTTE",
    aVerifier: "Lieu inventé pour les tests : à remplacer par le vrai lieu de la hotte.",
  },
};

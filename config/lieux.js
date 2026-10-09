/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — LIEUX, INDICES ET QR CODES
 * ---------------------------------------------------------------------
 * ⚠ VALEURS PROVISOIRES : les lieux réels de la Tour Saint-Gobain ne
 * sont pas encore définis. Remplacez chaque valeur marquée
 * [À CONFIGURER] par le contenu définitif. N'indiquez que des lieux
 * réellement accessibles aux participants.
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
  /* ⚠ LIEUX SIMULÉS pour tester le parcours de bout en bout : remplacez
   * nom, indice, réponses, textes et jokers par les vrais lieux de la Tour,
   * puis supprimez la ligne aVerifier de chaque lieu. */
  A: {
    nom: "La cafétéria",
    indice:
      "On y fait le plein d'énergie avant les réunions.\nLe café y coule à flots et les plateaux s'y croisent à midi.\n\n**Où le lutin a-t-il caché la suite ?**",
    reponsesAcceptees: ["cafeteria", "cafet", "cafe", "restaurant", "cantine", "self", "restaurant d'entreprise"],
    texteValidation:
      "Direction la cafétéria ! Cherchez le QR code caché près de la machine à café, puis scannez-le.",
    indiceJoker: "Suivez l'odeur du café…",
    codeQR: "SAPIN",
    aVerifier: "Lieu simulé pour les tests : à remplacer par un vrai lieu de la Tour.",
  },

  B: {
    nom: "L'accueil",
    indice:
      "C'est la première porte franchie par chaque visiteur.\nOn y reçoit son badge et un grand sourire.\n\n**Où se cache le prochain QR code ?**",
    reponsesAcceptees: ["accueil", "hall", "hall d'accueil", "reception", "hall d'entree"],
    texteValidation:
      "Rendez-vous à l'accueil du rez-de-chaussée. Le QR code vous attend près du comptoir.",
    indiceJoker: "Pensez à l'endroit où l'on retire son badge visiteur.",
    codeQR: "ETOILE",
    aVerifier: "Lieu simulé pour les tests : à remplacer par un vrai lieu de la Tour.",
  },

  C: {
    nom: "La salle de sport",
    indice:
      "Ici, on transpire entre deux réunions.\nTapis, haltères et vestiaires sont au rendez-vous.\n\n**Où le lutin s'est-il caché cette fois ?**",
    reponsesAcceptees: ["salle de sport", "sport", "salle de fitness", "fitness", "gym", "salle de gym"],
    texteValidation:
      "Filez à la salle de sport ! Le QR code est accroché près des vestiaires.",
    indiceJoker: "Baskets aux pieds, c'est là qu'on se dépense.",
    codeQR: "FLOCON",
    aVerifier: "Lieu simulé pour les tests : à remplacer par un vrai lieu de la Tour.",
  },

  FINAL: {
    nom: "Le rooftop",
    indice: "",
    reponsesAcceptees: ["rooftop", "toit", "terrasse", "toit terrasse", "terrasse du toit", "dernier etage", "sommet"],
    texteValidation:
      "La hotte vous attend tout en haut de la Tour, sur le rooftop. Prenez l'ascenseur jusqu'au dernier étage !",
    indiceJoker: "",
    codeQR: "HOTTE",
    aVerifier: "Lieu simulé pour les tests : à remplacer par un vrai lieu de la Tour.",
  },
};

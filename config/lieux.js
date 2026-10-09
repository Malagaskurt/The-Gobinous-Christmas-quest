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
  A: {
    nom: "[À CONFIGURER] Lieu A",
    indice: "[À CONFIGURER] Indice permettant de deviner le lieu A.",
    reponsesAcceptees: ["lieu a"],
    texteValidation:
      "[À CONFIGURER] Texte affiché lorsque le lieu A est trouvé (comment s'y rendre, ce qu'il faut y chercher…).",
    indiceJoker: "[À CONFIGURER] Indice supplémentaire pour le lieu A.",
    codeQR: "SAPIN",
  },

  B: {
    nom: "[À CONFIGURER] Lieu B",
    indice: "[À CONFIGURER] Indice permettant de deviner le lieu B.",
    reponsesAcceptees: ["lieu b"],
    texteValidation: "[À CONFIGURER] Texte affiché lorsque le lieu B est trouvé.",
    indiceJoker: "[À CONFIGURER] Indice supplémentaire pour le lieu B.",
    codeQR: "ETOILE",
  },

  C: {
    nom: "[À CONFIGURER] Lieu C",
    indice: "[À CONFIGURER] Indice permettant de deviner le lieu C.",
    reponsesAcceptees: ["lieu c"],
    texteValidation: "[À CONFIGURER] Texte affiché lorsque le lieu C est trouvé.",
    indiceJoker: "[À CONFIGURER] Indice supplémentaire pour le lieu C.",
    codeQR: "FLOCON",
  },

  FINAL: {
    nom: "[À CONFIGURER] Lieu final de la hotte",
    indice: "",
    reponsesAcceptees: ["lieu final"],
    texteValidation: "[À CONFIGURER] Texte affiché lorsque le lieu final est trouvé.",
    indiceJoker: "",
    codeQR: "HOTTE",
  },
};

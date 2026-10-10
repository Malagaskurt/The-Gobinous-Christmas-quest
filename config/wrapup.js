/* =====================================================================
 * GOBINOUS CHRISTMAS WRAP-UP — QUESTIONNAIRE DE SATISFACTION
 * ---------------------------------------------------------------------
 * Page #/wrapup : 5 questions maximum, anonymes, sans code d'accès.
 * Les réponses sont envoyées au serveur du jeu (npm start) et consultables
 * par les organisateurs dans le tableau de bord (#/suivi → Avis), avec
 * les indicateurs (moyennes, répartitions) et un export CSV.
 *
 * Types de question :
 *   etoiles : note de 1 à 5 étoiles
 *   echelle : échelle de 1 à 5 avec deux libellés (min / max)
 *   choix   : une réponse parmi `options`
 *   texte   : réponse libre
 * obligatoire : true → impossible d'envoyer sans y répondre
 * id : identifiant de la question dans les résultats (ne pas modifier
 *      une fois les réponses collectées)
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.wrapup = {
  titre: "Christmas Wrap-Up",
  bulle: "Alors, cette soirée ?",
  intro: "5 questions, 1 minute. C'est **100 % anonyme** : aucun nom n'est demandé.",
  questions: [
    { id: "note", type: "etoiles", question: "Votre note pour la soirée ?", obligatoire: true },
    {
      id: "moment",
      type: "choix",
      question: "Votre temps fort préféré ?",
      options: ["Christmas Quest", "Christmas Party", "Christmas Battle", "Christmas Gift"],
      obligatoire: true,
    },
    { id: "quest", type: "echelle", question: "Le Christmas Quest, c'était…", min: "Trop facile", max: "Trop dur", obligatoire: false },
    {
      id: "encore",
      type: "choix",
      question: "On remet ça l'an prochain ?",
      options: ["Oui, carrément !", "Peut-être", "Non merci"],
      obligatoire: true,
    },
    { id: "mot", type: "texte", question: "Un mot, une idée, un merci ?", placeholder: "Facultatif", obligatoire: false },
  ],
  obligatoire: "Obligatoire",
  facultatif: "Facultatif",
  bouton: "Envoyer mon avis",
  erreurObligatoire: "Il manque une réponse obligatoire.",
  erreurEnvoi: "L'envoi a échoué (réseau ?). Réessayez dans un instant.",
  merciTitre: "Merci !",
  merciTexte: "Votre avis est bien arrivé. Joyeux Noël, et à l'année prochaine !",
  modifier: "Modifier mes réponses",
};

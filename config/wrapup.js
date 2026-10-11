/* =====================================================================
 * GOBINOUS CHRISTMAS WRAP-UP — QUESTIONNAIRE DE SATISFACTION
 * ---------------------------------------------------------------------
 * Page #/wrapup : le tirage au sort du Secret Santa, puis le
 * questionnaire (anonyme, sans code d'accès). Une seule réponse par
 * téléphone : une fois envoyée, elle est définitive.
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
  titre: "Gobi'Christmas Wrap-Up",

  /* Tirage au sort du Secret Santa : chaque téléphone tire un numéro
   * unique entre 1 et `total` (le nombre de cadeaux numérotés). Le tirage
   * est fait par le serveur : jamais deux fois le même numéro. */
  santa: {
    titre: "Le tirage du Secret Santa",
    texte: "Tous les cadeaux sont numérotés. Tirez votre numéro au sort et repartez avec le cadeau qui porte le même !",
    /* Étape 1 : le numéro du cadeau que la personne a APPORTÉ (on ne peut
     * pas tirer son propre cadeau). */
    apporteTitre: "Le cadeau que vous avez apporté",
    apporteTexte: "Indiquez d'abord le numéro du cadeau que vous avez apporté. Vous ne pourrez pas tirer le vôtre !",
    apporteLabel: "Numéro du cadeau apporté",
    apporteBouton: "Valider",
    apporteRappel: "Cadeau apporté : n° {n}",
    apporteErreur: "Entrez un numéro entre 1 et {total}.",
    apportePris: "Ce numéro de cadeau apporté est déjà enregistré. Vérifiez l'étiquette de votre cadeau.",
    resultatTitre: "Le cadeau que vous recevez",
    total: 40,
    bouton: "Tirer mon numéro",
    resultat: "Votre numéro",
    aide: "Allez chercher le cadeau n° {n} !",
    complet: "Tous les numéros ont déjà été tirés. Voyez avec les organisateurs !",
    erreur: "Le tirage n'a pas pu se faire (réseau ?). Réessayez.",
  },

  avisTitre: "Votre avis",
  bulle: "Alors, cet événement ?",
  intro: "5 questions, 1 minute. C'est **100 % anonyme**, aucun nom n'est demandé.",
  questions: [
    { id: "note", type: "etoiles", question: "Votre note pour l'événement ?", obligatoire: true },
    {
      id: "moment",
      type: "choix",
      question: "Votre temps fort préféré ?",
      options: ["Gobi'Christmas Quest", "Gobi'Christmas Party", "Gobi'Christmas Battle", "Secret Santa"],
      obligatoire: true,
    },
    { id: "quest", type: "echelle", question: "La Gobi'Christmas Quest, c'était…", min: "Trop facile", max: "Trop dur", obligatoire: true },
    {
      id: "encore",
      type: "choix",
      question: "On remet ça l'an prochain ?",
      options: ["Oui, carrément !", "Peut-être", "Non merci"],
      obligatoire: true,
    },
    { id: "mot", type: "texte", question: "Avez-vous un mot à laisser ? (idée, un retour, un remerciement, etc.)", placeholder: "Facultatif", obligatoire: false },
  ],
  obligatoire: "Obligatoire",
  facultatif: "Facultatif",
  bouton: "Envoyer mon avis",
  erreurObligatoire: "Il manque une réponse obligatoire.",
  erreurEnvoi: "L'envoi a échoué (réseau ?). Réessayez dans un instant.",
  merciTitre: "Merci !",
  merciTexte: "Votre avis est bien arrivé. Joyeux Noël, et à l'année prochaine !",
  /* Déjà répondu : la réponse est définitive. */
  dejaRepondu: "Vous avez déjà répondu à ce questionnaire. Merci pour votre avis !",
};

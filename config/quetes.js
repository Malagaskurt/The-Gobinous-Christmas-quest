/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — QUÊTES 2 À 5
 * ---------------------------------------------------------------------
 * Une quête = une mission claire = une validation = un indice pour la suite.
 *
 * Champs communs :
 *   titre, intro      : titre et texte de l'écran d'introduction
 *   lieu              : identifiant du lieu dont l'indice est débloqué
 *                       après la réussite (voir config/lieux.js)
 *   indiceJoker       : indice supplémentaire proposé via le joker
 *                       (laisser "" pour ne pas proposer le joker).
 *                       Il doit aider sans donner la réponse.
 *
 * Réponses saisies au clavier (champ `reponses`) : indiquez toutes les
 * variantes acceptées. Majuscules, accents et articles (le, la, l'…)
 * sont ignorés automatiquement.
 *
 * Les valeurs commençant par [À CONFIGURER] sont des textes provisoires :
 * le mode test et `npm run check` les signalent tant qu'elles existent.
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.quetes = {
  /* ------------------------------------------------------------------ */
  /* QUÊTE 2 — L'ÉNIGME MYSTÈRE                                          */
  /* ------------------------------------------------------------------ */
  enigme: {
    titre: "L'énigme mystère",
    intro:
      "Bien joué ! Votre première étape est terminée. Pour continuer, résolvez cette énigme et découvrez le prochain lieu de votre aventure.",
    boutonIntro: "Découvrir l'énigme",

    /* Énigme proposée par défaut : modifiable librement. */
    enigme:
      "Je nais du sable, de la soude et du feu.\nJe suis solide mais fragile, présent partout mais transparent.\nOn me traverse du regard sans vraiment me voir.\nDepuis 1665, Saint-Gobain me façonne.\n\n**Qui suis-je ?**",
    reponses: ["verre", "le verre", "du verre"],
    indiceJoker: "Pensez à la Galerie des Glaces : de quoi ses miroirs sont-ils faits ?",

    reussiteTitre: "Énigme résolue !",
    reussiteTexte:
      "Bravo ! La réponse était bien « le verre », le matériau avec lequel l'aventure Saint-Gobain a commencé.",
    boutonIndice: "Découvrir l'indice du prochain lieu",
    lieu: "B",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 3 — LE DÉFI SAINT-GOBAIN                                      */
  /* ------------------------------------------------------------------ */
  defi: {
    titre: "Le défi Saint-Gobain",
    intro:
      "À vous de jouer ! Découvrez quelques innovations de Saint-Gobain grâce à trois questions. Chaque bonne réponse vous rapproche de la hotte.",
    boutonIntro: "Relever le défi",

    /* 3 questions, 3 propositions chacune, une seule bonne réponse.
     * Questions proposées par défaut : à faire relire par la
     * communication Saint-Gobain avant l'événement. */
    questions: [
      {
        question:
          "Quelle marque du groupe Saint-Gobain est spécialisée dans l'isolation en laine minérale ?",
        choix: ["Isover", "Sekurit", "Weber"],
        reponse: "A",
        explication: "Isover isole les bâtiments pour limiter les pertes de chaleur et le bruit.",
        aVerifier: "Question rédigée en attendant le contenu officiel : à faire valider.",
      },
      {
        question: "À quoi servent principalement les plaques de plâtre Placo ?",
        choix: [
          "À réaliser des cloisons et des plafonds",
          "À fabriquer des pare-brise",
          "À produire des bouteilles en verre",
        ],
        reponse: "A",
        explication: "Les plaques de plâtre permettent d'aménager rapidement les espaces intérieurs.",
        aVerifier: "Question rédigée en attendant le contenu officiel : à faire valider.",
      },
      {
        question: "Pour quel usage les produits Weber sont-ils surtout connus ?",
        choix: [
          "Les mortiers, colles à carrelage et enduits de façade",
          "La peinture des voitures",
          "Les composants électroniques",
        ],
        reponse: "A",
        explication: "Weber propose des mortiers techniques pour construire et rénover.",
        aVerifier: "Question rédigée en attendant le contenu officiel : à faire valider.",
      },
    ],

    reussiteTitre: "Défi relevé !",
    reussiteTexte:
      "Trois bonnes réponses : vous connaissez désormais un peu mieux les solutions Saint-Gobain. Un nouvel indice vous attend.",
    boutonIndice: "Découvrir l'indice du prochain lieu",
    lieu: "C",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 4 — LE DERNIER INDICE                                         */
  /* La réponse à l'énigme est le lieu où se cache la hotte : elle est   */
  /* comparée aux `reponsesAcceptees` du lieu indiqué (FINAL).           */
  /* ------------------------------------------------------------------ */
  dernierIndice: {
    titre: "Le dernier indice",
    intro:
      "Vous approchez du but. Il ne vous reste plus qu'une énigme pour découvrir où se cache la hotte.",
    boutonIntro: "Découvrir l'énigme finale",

    enigme:
      "[À CONFIGURER] Rédigez ici l'énigme finale. Sa réponse doit être le lieu où se cache la hotte (réponses acceptées : voir le lieu FINAL dans config/lieux.js).",
    label: "Où se cache la hotte ?",
    indiceJoker: "[À CONFIGURER] Indice supplémentaire pour l'énigme finale.",
    lieu: "FINAL",

    reussiteTitre: "Vous avez trouvé la cachette de la hotte !",
    reussiteLieu: "Lieu final : **{lieu}**",
    consigneOrganisateurs:
      "Rendez-vous sur place. Une fois arrivés, suivez les instructions des organisateurs.",
    bouton: "Continuer",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 5 — LA HOTTE SECRÈTE                                          */
  /* ------------------------------------------------------------------ */
  hotte: {
    titre: "La hotte secrète",
    texte:
      "Vous avez retrouvé la piste de la hotte ! Rendez-vous au lieu indiqué et suivez les instructions des organisateurs pour découvrir la surprise finale.",
    rappelLieu: "Lieu indiqué : **{lieu}**",
    script: "Joyeux Noël",
  },
};

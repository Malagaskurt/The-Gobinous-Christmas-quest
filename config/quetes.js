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
      "Bien joué, vous avez retrouvé la trace du lutin au pied du sapin ! Dans sa fuite, il a laissé tomber un petit parchemin couvert de givre. Résolvez son énigme pour découvrir où il est allé ensuite.",
    boutonIntro: "Découvrir l'énigme",

    enigme:
      "Je nais du sable, de la soude et du feu.\nJe suis solide mais fragile, présent partout mais transparent.\nOn me traverse du regard sans vraiment me voir.\nDepuis 1665, Saint-Gobain me façonne.\n\n**Qui suis-je ?**",
    reponses: ["verre", "le verre", "du verre", "vitre", "glace", "miroir"],
    indiceJoker: "Pensez à la Galerie des Glaces : de quoi ses miroirs sont-ils faits ?",

    reussiteTitre: "Énigme résolue !",
    reussiteTexte:
      "Bravo ! La réponse était bien « le verre », le matériau avec lequel l'aventure Saint-Gobain a commencé. Le lutin, lui, a filé se réchauffer quelque part…",
    /* Écran affiché quand l'énigme est validée d'office après le gel. */
    reussiteApresGelTitre: "Le gel est levé !",
    reussiteApresGelTexte:
      "La réponse était « le verre », le matériau avec lequel l'aventure Saint-Gobain a commencé en 1665. Le lutin vous laisse filer vers la suite !",
    boutonIndice: "Découvrir l'indice du prochain lieu",
    lieu: "B",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 3 — LE DÉFI SAINT-GOBAIN                                      */
  /* ------------------------------------------------------------------ */
  defi: {
    titre: "Le défi Saint-Gobain",
    intro:
      "À la cafétéria, le lutin a laissé un plan de son atelier à jouets… avec trois questions pour le construire. Aidez-le avec les solutions Saint-Gobain : chaque bonne réponse vous rapproche de la hotte.",
    boutonIntro: "Relever le défi",

    /* 3 questions, 3 propositions chacune, une seule bonne réponse.
     * 2 essais par question : après la 2e erreur, le jeu est gelé, puis
     * la bonne réponse s'affiche et l'équipe passe à la question suivante. */
    questions: [
      {
        question:
          "Pour garder toute la chaleur du réveillon à l'intérieur de la maison, quelle marque du groupe isole murs et combles ?",
        choix: ["Sekurit", "Isover", "Weber"],
        reponse: "B",
        explication: "Isover isole les bâtiments avec de la laine minérale : moins de pertes de chaleur, moins de bruit.",
        indiceJoker: "Son nom évoque un « hiver » qu'on garde dehors.",
      },
      {
        question:
          "Le lutin veut monter rapidement les cloisons de son atelier à jouets. Que doit-il utiliser ?",
        choix: [
          "Des pare-brise de voiture",
          "Des bouteilles en verre",
          "Des plaques de plâtre Placo",
        ],
        reponse: "C",
        explication: "Les plaques de plâtre Placo servent à réaliser cloisons et plafonds, rapidement et proprement.",
        indiceJoker: "Regardez autour de vous : les murs des bureaux en sont souvent faits.",
      },
      {
        question:
          "Pour carreler la cuisine du Père Noël, quel produit Weber le lutin doit-il choisir ?",
        choix: ["Une colle à carrelage", "Une laine de verre", "Un double vitrage"],
        reponse: "A",
        explication: "Weber est spécialiste des mortiers : colles à carrelage, joints, enduits de façade…",
        indiceJoker: "Pensez au carreleur et au maçon : il faut que ça colle !",
      },
    ],

    reussiteTitre: "Défi relevé !",
    reussiteTexte:
      "L'atelier du lutin est prêt, grâce à vous ! Isolation, cloisons, carrelage : vous connaissez vos solutions Saint-Gobain. Un nouvel indice vous attend.",
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
      "Sur la scène de l'auditorium, le lutin a oublié la dernière page de son spectacle. Elle révèle où il a caché la hotte… à condition de résoudre l'énigme finale !",
    boutonIntro: "Découvrir l'énigme finale",

    /* Énigme inventée : sa réponse doit être le lieu FINAL de
     * config/lieux.js (réponses acceptées : voir ce lieu). */
    enigme:
      "Plus haut que les bureaux, plus près des étoiles,\nj'offre tout Paris en guise de toile.\nLe Père Noël y poserait son traîneau sans hésiter,\net c'est là que le lutin a caché la hotte tant convoitée.",
    label: "Où se cache la hotte ?",
    indiceJoker: "Où un traîneau pourrait-il atterrir dans une tour ? Visez le plus haut possible.",
    aVerifier: "Énigme inventée pour les tests : à adapter au vrai lieu de la hotte.",
    lieu: "FINAL",

    reussiteTitre: "Vous avez trouvé la cachette de la hotte !",
    reussiteApresGelTitre: "Le gel est levé : voici la cachette de la hotte !",
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
      "Vous avez démasqué le lutin et retrouvé la piste de la hotte ! Rendez-vous au lieu indiqué et suivez les instructions des organisateurs pour découvrir la surprise finale.",
    rappelLieu: "Lieu indiqué : **{lieu}**",
    script: "Joyeux Noël",
  },
};

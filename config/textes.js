/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — TEXTES DE L'INTERFACE
 * ---------------------------------------------------------------------
 * Tous les textes communs aux écrans : accueil, règles, messages de
 * réussite ou d'erreur, joker, lieux, QR codes, fin de partie.
 * Les contenus propres à chaque quête se trouvent dans config/quiz.js
 * et config/quetes.js ; les lieux dans config/lieux.js.
 *
 * Mise en forme possible dans les textes :
 *   \n          → retour à la ligne
 *   **texte**   → texte en gras
 *   {equipe}, {lieu}, {n}… → remplacés automatiquement (ne pas traduire)
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.textes = {
  /* Écran de chargement (au tout premier affichage). */
  chargement: {
    texte: "Chargement de la quête",
  },

  /* Accueil volontairement épuré : logo, titre, bouton.
   * Les textes facultatifs ci-dessous s'affichent seulement s'ils sont
   * remplis (laisser "" pour les masquer). Exemples :
   *   annee: "Noël 2026"
   *   surtitre: "The Gobinous Christmas Club"
   *   sousTitre: "La quête du cadeau disparu · Saint-Gobain"
   *   accroche: "Un cadeau de Noël a disparu ! Résolvez les quêtes en équipe pour retrouver la hotte." */
  accueil: {
    titre: "Gobinous",
    titreSuite: "Christmas Quest",
    bouton: "Lancer la partie",
    boutonReprendre: "Reprendre la partie",
    partieEnCours: "Partie en cours : **{equipe}**",
    annee: "",
    surtitre: "",
    sousTitre: "",
    accroche: "",
    noteGauche: "",
    noteDroite: "",
  },

  /* Répliques du lutin qui a caché le cadeau. Une liste [ ] = une réplique
   * tirée au hasard. Laissez "" pour qu'il reste silencieux. */
  lutin: {
    accueil: "Psst… Le cadeau ? C'est moi qui l'ai caché. Hi hi !",
    equipe: "Un nom qui claque, et que la chasse commence !",
    reussite: [
      "Pas mal… Mais vous ne m'attraperez pas si facilement !",
      "Hé ! Vous chauffez…",
      "Bien joué. J'avais pourtant bien caché cet indice !",
    ],
    echec: "Hé hé… Ce thème-là était piégé !",
    blocage: "Brrr… Tout est gelé ! J'en profite pour faire une sieste.",
    lieu: "Je vous attends là-bas… ou pas !",
    finale: "Bon d'accord… Vous m'avez presque trouvé !",
    fin: "Vous m'avez démasqué ! Bien joué, l'équipe !",
    clic: ["Pas touche !", "Je ne dirai rien…", "Cherchez encore !", "Hi hi hi !", "Le cadeau ? Quel cadeau ?"],
    /* Phrases affichées pendant un gel (tirées au hasard). */
    gel: [
      "Brrr… Le lutin a tout gelé. Même vos neurones sont en mode glaçon 🥶",
      "Pause forcée : le lutin est parti se faire un chocolat chaud. Il revient (peut-être).",
      "Le lutin a appuyé sur le bouton « freeze ». Respirez, ce n'est que du givre.",
      "Oups, c'est gelé ! Le lutin trouve que vous allez un peu trop vite.",
      "Le lutin vous a mis en mode glaçon. Ce n'est pas personnel… enfin, un peu.",
      "Tout est figé ! Le lutin en profite pour danser dans votre dos.",
    ],
    /* Phrases affichées quand le lutin vous laisse passer après un gel. */
    degel: [
      "Le lutin a eu tellement pitié de vous qu'il a tout dégelé. Respect, il est trop goat 🐐",
      "Bon… le lutin valide. Pas parce que vous avez trouvé, hein : juste parce qu'il est sympa.",
      "Le lutin a fondu (de pitié). C'est cadeau, profitez !",
      "Le lutin vous laisse passer. Il dit que c'est carré… mais il vous juge un peu.",
      "Dégel express ! Le lutin a mieux à faire que de vous regarder grelotter.",
    ],
  },

  /* Chrono global affiché en haut des écrans de jeu. */
  chrono: {
    restant: "Temps restant",
    depasse: "Temps dépassé",
    tempsFinal: "Votre temps : **{temps}**",
  },

  equipe: {
    titreCourt: "Votre équipe",
    titre: "Quel est le nom de votre équipe ?",
    aide:
      "Ce nom sert uniquement à identifier votre progression sur ce téléphone. Aucune donnée personnelle n'est demandée.",
    label: "Nom de l'équipe",
    placeholder: "Ex. : Les Lutins de verre",
    bouton: "Valider",
    erreurVide: "Indiquez un nom d'équipe pour continuer.",
  },

  /* Écran « Comment jouer ? » : plateau de jeu animé + 3 règles clés.
   * Le texte complet des règles (ci-dessous, « regles ») reste accessible
   * via le lien « règles détaillées » et le bouton Règles en cours de jeu. */
  plateau: {
    titre: "Comment jouer ?",
    description: "Carte du parcours : 5 quêtes, du départ jusqu'à la hotte.",
    depart: "DÉPART",
    /* Une étiquette courte par quête, affichée sur la carte. */
    etapes: ["Le grand quiz", "Le message codé", "Le défi photo", "L'enquête", "La traque"],
    /* Légende de la carte : 3 règles clés seulement. */
    regles: [
      { icone: "pin", texte: "À chaque étage : trouvez le **mot secret** affiché sur place." },
      { icone: "star", texte: "**1 joker** = 1 indice bonus, une seule fois." },
      { icone: "flake", texte: "Trop d'erreurs ? **Tout gèle** quelques secondes… puis on avance." },
    ],
    detail: "Lire les règles détaillées",
  },

  /* Règles du jeu, affichées en plein écran (bouton « Règles » en haut
   * des écrans de jeu, et lien « Lire les règles » de la carte).
   * Une règle = une icône tricotée + un titre court + une phrase ou deux.
   * Icônes : star, gift, check, flake, tree, dice, tower, qr, quiz, loupe,
   * pin, clock, lock.
   * {duree} et {chrono} sont remplacés par la durée du gel et celle du
   * chrono (config/parametres.js). */
  regles: {
    titre: "Les règles",
    intro:
      "Le lutin officiel du Gobinous Christmas Club a caché le Cadeau Officiel de Noël quelque part dans la Tour. Remontez sa piste, étage par étage !",
    liste: [
      {
        icone: "gift",
        titre: "5 quêtes, 5 étages",
        texte: "Quiz, message codé, défi photo, enquête et traque finale : chaque quête vous rapproche du cadeau.",
      },
      {
        icone: "pin",
        titre: "Le mot secret de l'étage",
        texte: "Chaque quête vous indique l'étage suivant. Une fois sur place, trouvez le mot secret affiché et saisissez-le pour débloquer la quête.",
      },
      {
        icone: "tree",
        titre: "Jouez en équipe",
        texte: "Un seul téléphone pour toute l'équipe : discutez, réfléchissez ensemble, avancez ensemble.",
      },
      {
        icone: "star",
        titre: "1 joker, 1 seule fois",
        texte: "Il donne un indice bonus. Utilisez-le au bon moment : il ne revient pas !",
      },
      {
        icone: "flake",
        titre: "Attention au gel",
        texte:
          "Le nombre d'essais est limité. Trop d'erreurs, et le lutin gèle tout pendant quelques secondes. Ensuite, l'aventure reprend.",
      },
      {
        icone: "clock",
        titre: "{chrono} chrono",
        texte: "Le chrono tourne dès le départ. S'il est dépassé, vous pouvez finir, mais votre temps compte !",
      },
    ],
    objectif:
      "Votre objectif : démasquer le lutin et retrouver le Cadeau Officiel du Gobinous Christmas Club.",
    bouton: "C'est parti !",
    boutonFermer: "J'ai compris",
  },

  general: {
    quete: "Quête",
    queteNumero: "Quête {n}",
    bravo: "Bravo !",
    equipe: "Équipe",
    regles: "Règles",
    questionNumero: "Question {n} sur {total}",
    validerReponse: "Valider ma réponse",
    questionSuivante: "Question suivante",
    terminer: "Terminer",
    bonneReponse: "Bonne réponse !",
    mauvaiseReponse: "Ce n'est pas la bonne réponse. Réessayez !",
    mauvaiseReponseDernierEssai:
      "Ce n'est pas la bonne réponse. Dernier essai : encore une erreur et tout sera gelé pendant {duree}.",
    reponseVide: "Saisissez une réponse avant de valider.",
    choixVide: "Sélectionnez une réponse avant de valider.",
    votreReponse: "Votre réponse",
    indice: "Indice",
    queteVerrouillee:
      "Cette quête n'est pas encore débloquée. Terminez d'abord la quête en cours.",
    queteTerminee: "Cette quête est déjà terminée. Voici votre quête en cours.",
    commencer: "Commencer",
    continuer: "Continuer",
    partieReinitialisee: "Votre partie a été réinitialisée par les organisateurs.",
    gelTitre: "Tout est gelé !",
    gelLeve: "Le gel est levé !",
    gelCompteur: "Dégel dans",
    stockageIndisponible:
      "Ce navigateur bloque la sauvegarde (navigation privée ?). Votre progression sera perdue si la page est fermée ou rechargée.",
  },

  joker: {
    bouton: "Utiliser mon joker",
    confirmationTitre: "Utiliser votre joker ?",
    confirmationTexte:
      "Vous ne disposez que d'un seul joker pour toute l'aventure. Une fois utilisé, il ne sera plus disponible pour les quêtes suivantes.",
    confirmer: "Oui, utiliser mon joker",
    annuler: "Non, je le garde",
    conserve: "Votre joker est conservé.",
    titreIndice: "Indice du joker",
    dejaUtilise: "Joker déjà utilisé",
    statutDisponible: "Joker disponible",
    statutUtilise: "Joker utilisé",
  },

  /* Écran de saisie du mot secret d'un étage (début de chaque quête). */
  acces: {
    kicker: "Quête {n} / 5 · verrouillée",
    consigne: "Une fois sur place, trouvez le mot secret de l'étage et saisissez-le ci-dessous.",
    label: "Mot secret de l'étage",
    bouton: "Débloquer la quête",
    erreur: "Ce n'est pas le mot secret de cet étage. Cherchez bien autour de vous !",
  },

  fin: {
    termineeTitre: "Aventure terminée",
    termineeLe: "Aventure terminée le {date} à {heure}.",
  },
};

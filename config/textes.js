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
    titreSuite: "Gobi'Christmas Quest",
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

  /* Code d'entrée du jeu : demandé dès l'ouverture du Christmas Quest,
   * avant le nom d'équipe. Le code attendu est le mot secret de la quête 1
   * (config/etapes.js, « SAPIN »), donné par les organisateurs au top
   * départ : personne ne peut lancer la partie en avance. */
  entree: {
    /* Contexte narratif : affiché à l'entrée du jeu (pas sur l'accueil du site). */
    contexteTitre: "Briefing",
    contexte: "Bienvenue au Gobinous Christmas Club. Habituellement, c'est le moment où Barnabé gère les colis à **La Verrière** (située au 4ᵉ étage). Sauf qu'avec lui, ce gros troll a décidé d'en faire qu'à sa tête : un des colis a disparu. Comme le service client est aux abonnés absents, à vous de le retrouver dans la Tour Saint-Gobain. 30 minutes chrono, ruse et esprit d'équipe : que la Gobinous Christmas Quest commence !",
    bulle: "Le code ? Les organisateurs le donnent au top départ.",
    label: "Code secret du jeu",
    bouton: "Entrer dans le jeu",
    erreur: "Ce n'est pas le bon code. Attendez le top départ des organisateurs !",
  },

  /* Répliques du lutin (bulles). Une liste [ ] = une réplique tirée au
   * hasard. Laissez "" pour qu'il reste silencieux. */
  lutin: {
    accueil: "Psst… Le colis ? Quel colis ? Hi hi !",
    equipe: "Un nom d'équipe, et que ça saute !",
    reussite: ["GG la team !", "Vous êtes des goats !", "Validé, c'est carré !"],
    echec: ["MDR, raté !", "Vous pouvez faire mieux, les gars !"],
    blocage: "Brrr… Tout est gelé !",
    lieu: "Vous êtes sur ma piste ? Même pas peur !",
    fin: "Vous m'avez démasqué ! Bien joué !",
    clic: ["Pas touche !", "Je ne dirai rien…", "Cherchez encore !", "Hi hi hi !", "Le cadeau ? Quel cadeau ?"],
    /* Phrases affichées pendant un gel (tirées au hasard). */
    gel: [
      "Brrr… Même vos neurones sont en mode glaçon.",
      "Pause forcée : le lutin est parti se faire un chocolat chaud.",
      "Le lutin a appuyé sur « freeze ». Respirez, ce n'est que du givre.",
      "Oups, gelé ! Le lutin trouve que vous allez trop vite.",
      "Tout est figé ! Le lutin en profite pour danser dans votre dos.",
    ],
    /* Phrases affichées quand le lutin vous laisse passer après un gel. */
    degel: [
      "Le lutin a eu pitié : il a tout dégelé. Respect, il est trop goat.",
      "Le lutin valide. Pas parce que vous avez trouvé : juste parce qu'il est sympa.",
      "Le lutin a fondu (de pitié). C'est cadeau !",
      "Dégel express ! Le lutin a mieux à faire que de vous regarder grelotter.",
    ],

  },

  /* Chrono global affiché en haut des écrans de jeu. */
  chrono: {
    restant: "Temps restant",
    depasse: "Temps dépassé",
    tempsFinal: "Votre temps : **{temps}**",
  },

  /* Création de l'équipe, en deux temps : le nom, puis les deux rôles. */
  equipe: {
    titreCourt: "Votre équipe",
    label: "Nom de l'équipe",
    placeholder: "Ex. : Les Lutins de verre",
    bouton: "Valider",
    erreurVide: "Indiquez un nom d'équipe pour continuer.",

    /* Les rôles : réaction du lutin, puis l'encadré d'avertissement. */
    rolesTitre: "Vos rôles",
    rolesBulle: "Oh, pas mal du tout ce nom d'équipe… **{equipe}**.",
    rolesBulleSuite: "Maintenant, un chef et un reporter.",
    rolesAlerteTitre: "Attention : choisissez vos rôles avec soin !",
    rolesAlerte:
      "Chacun assume son rôle à fond.",
    roles: [
      {
        icone: "crown",
        nom: "Le Gobinous Capitaine",
        texte: "Le leader : il motive, coordonne et guide la team jusqu'au bout.",
      },
      {
        icone: "camera",
        nom: "Le Gobinous Reporter",
        texte: "Le vidéaste : un max de photos et vidéos, façon vlog.",
        ou: "Tout se dépose dans **Le Vlog des Gobinous** (programme, sous les temps forts).",
      },
    ],
    rolesNote: "",
    chefLabel: "Gobinous Capitaine",
    chefPlaceholder: "Prénom",
    reporterLabel: "Gobinous Reporter",
    reporterPlaceholder: "Prénom",
    rolesBouton: "C'est noté !",
    rolesErreur: "Indiquez le prénom du Gobinous Capitaine et du Gobinous Reporter.",
  },

  /* Écran « Comment jouer ? » : carte du parcours + 3 règles clés.
   * Les règles complètes (ci-dessous, « regles ») restent accessibles via
   * le bouton « Règles » en haut des écrans de jeu. */
  plateau: {
    titre: "La map",
    description: "La map de la quête : de La Verrière jusqu'au sommet de la Tour Saint-Gobain, en 5 étapes.",
    intro: "Point de base : **La Verrière**. Suivez la map, étape par étape.",
    depart: "BASE",
    /* Une étiquette courte par étape, affichée sur la map. */
    etapes: ["Check-in", "Cheat Code", "Fake Stream", "ID Check", "Ultimate Signal"],
    /* Légende de la map : 3 repères. */
    regles: [
      { icone: "pin", texte: "Un **mot secret** par étage pour débloquer l'étape." },
      { icone: "flake", texte: "Plus de **2 erreurs** : gel du système." },
      { icone: "star", texte: "**1 joker** de secours par équipe." },
    ],
    detail: "Toutes les règles",
  },

  /* Règles du jeu, en plein écran (bouton « Règles » en haut des écrans).
   * Une règle = une icône + un titre court + une phrase.
   * Icônes : star, gift, check, flake, tree, dice, tower, qr, quiz, loupe,
   * pin, clock, lock, camera, badge.
   * {chrono} est remplacé par la durée du chrono (config/parametres.js). */
  regles: {
    titre: "Les règles",
    intro: "",
    liste: [
      { icone: "clock", titre: "{chrono} chrono", texte: "Pas une de plus pour retrouver le colis." },
      { icone: "star", titre: "Joker unique", texte: "Un seul bonus de secours par équipe." },
      { icone: "flake", titre: "Gel du système", texte: "Plus de 2 erreurs d'affilée : accès bloqués ({gel})." },
      { icone: "crown", titre: "Esprit d'équipe", texte: "Tout le monde avance ensemble." },
      { icone: "check", titre: "Fair-play", texte: "Zéro triche, bonne foi absolue." },
    ],
    objectif: "",
    bouton: "C'est parti !",
    boutonFermer: "J'ai compris",
    /* Confirmation avant le départ du chrono (une seule fois). */
    confirmTitre: "Prêts à commencer ?",
    confirmTexte: "Le chrono de **{chrono}** démarre dès que vous validez, et il ne s'arrête plus. Toute l'équipe est là ?",
    confirmOui: "Lancer le chrono",
    confirmNon: "Pas encore",
  },

  /* Bouton « Aide » (en haut de chaque écran) : appelle l'organisation.
   * contacts : un bouton d'appel par personne (numéro au format libre). */
  aide: {
    bouton: "Aide",
    titre: "Un souci ?",
    texte: "Un bug, l'appli qui coince, une question ? Appelez l'organisation, on arrive !",
    contacts: [
      { nom: "Appeler l'organisation", tel: "06 68 21 35 87" },
    ],
    fermer: "Fermer",
  },

  general: {
    quete: "Quête",
    queteNumero: "Étape {n}",
    bravo: "Bravo !",
    equipe: "Équipe",
    regles: "Règles",
    questionNumero: "Question {n} sur {total}",
    validerReponse: "Valider ma réponse",
    questionSuivante: "Question suivante",
    terminer: "Terminer",
    bonneReponse: "Bonne réponse !",
    mauvaiseReponse: "Ce n'est pas la bonne réponse. Réessayez !",
    mauvaiseReponseDernierEssai: "Raté ! Encore une erreur et tout gèle ({gel}).",
    reponseVide: "Saisissez une réponse avant de valider.",
    choixVide: "Sélectionnez une réponse avant de valider.",
    votreReponse: "Votre réponse",
    indice: "Indice",
    queteVerrouillee:
      "Cette étape n'est pas encore débloquée. Terminez d'abord l'étape en cours.",
    queteTerminee: "Cette étape est déjà terminée. Voici votre étape en cours.",
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
    confirmationTexte: "Un seul joker pour toute l'aventure : il ne reviendra pas.",
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
    kicker: "Étape {n} / 5 · verrouillée",
    consigne: "",
    label: "Mot secret de l'étage",
    bouton: "Débloquer l'étape",
    erreur: "Ce n'est pas le mot secret de cet étage. Cherchez bien autour de vous !",
    /* Sortie de secours : affichée après `secoursApres` mauvais mots. */
    secoursApres: 3,
    secours: "Vous ne trouvez pas le mot secret ? Il est sur une affichette, à l'étage indiqué ci-dessus. Toujours bloqués ? Touchez « Un souci ? » en bas de l'écran : l'organisation vous le donnera.",
  },

  fin: {
    termineeTitre: "Aventure terminée",
    termineeLe: "Aventure terminée le {date} à {heure}.",
  },
};

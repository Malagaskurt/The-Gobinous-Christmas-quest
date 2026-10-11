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
    texte: "Chargement de la quête…",
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
    partieEnCours: "Partie en cours pour **{equipe}**",
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
    contexte: "Bienvenue au Gobinous Christmas Club. Habituellement, c'est le moment où Barnabé gère les colis à **La Verrière**. Sauf qu'avec lui, rien ne se passe jamais comme prévu et un des colis a disparu. Comme le service client est aux abonnés absents, c'est à vous de retrouver le colis dans la Tour Saint-Gobain. Vous avez 30 minutes chrono, ruse et esprit d'équipe. Que la Gobinous Christmas Quest commence !",
    bulle: "Le code secret ? Les organisateurs le révèlent au top départ !",
    label: "Code secret du jeu",
    bouton: "Entrer dans le jeu",
    erreur: "Ce n'est pas le bon code. Attendez le top départ !",
  },

  /* Répliques du lutin (bulles). Une liste [ ] = une réplique tirée au
   * hasard. Laissez "" pour qu'il reste silencieux. */
  lutin: {
    /* Toutes ces bulles sont du Père Noël : il guide, encourage et
     * félicite. Barnabé, le troll, n'y intervient jamais. */
    accueil: "Ho ho ho ! Bienvenue au Gobinous Christmas Club !",
    equipe: "Ho ho ho ! Choisissez un nom d'équipe, et c'est parti !",
    reussite: ["GG la team !", "Ho ho ho, bien joué !", "Validé, c'est carré !"],
    echec: ["Presque ! Encore un petit effort.", "Pas tout à fait… Réfléchissez ensemble !"],
    blocage: "Oh oh… vous êtes gelés ! Tenez bon.",
    lieu: "Vous êtes sur la bonne piste, continuez !",
    fin: "Bravo la team ! Le colis est entre vos mains.",
    clic: ["Ho ho ho !", "Je compte sur vous !", "Le colis vous attend !", "Allez, la team !"],
    /* Phrases affichées pendant un gel (2 essais ratés). C'est le système
     * de sécurité qui se gèle, pas Barnabé : lui ne pirate qu'une fois,
     * au hasard (voir hack). */
    gel: [
      "Deux erreurs : le système de sécurité se met en pause. Respirez, ça va repartir.",
      "Trop d'essais ratés, le système est gelé. Profitez-en pour réfléchir ensemble !",
      "Sécurité activée après deux erreurs. Pas de panique, ce n'est que du givre !",
      "Système gelé. Relisez bien les indices pendant ce temps.",
    ],
    /* Phrases affichées quand le gel est levé. Les lutins du Père Noël
     * débloquent la situation. */
    degel: [
      "Les lutins du Père Noël ont tout dégelé. On repart !",
      "Le système est reparti. On continue !",
      "Dégel express signé les lutins. C'est cadeau !",
      "C'est reparti, foncez !",
    ],
  },

  /* Le hack de Barnabé. Piratage surprise : téléphone gelé 30 s, une seule
   * fois dans la partie, au hasard. (Les gels après 2 erreurs ne sont pas
   * de lui : c'est le système, voir lutin.gel.) */
  hack: {
    kicker: "Alerte intrusion",
    titre: "Écran piraté par Barnabé",
    compteur: "secondes",
    phrases: [
      "Oups… j'ai gelé votre téléphone. Pas de chance, hein ?",
      "Je pirate, vous patientez. Chacun son métier.",
      "30 secondes de pause offertes par Barnabé. De rien !",
      "Pas touche à mon colis ! Je gèle tout.",
    ],
    /* Petite pique de Barnabé quand l'écran se débloque. */
    fin: [
      "Bon, je vous rends la main… pour l'instant.",
      "Allez, filez. De toute façon, vous ne trouverez rien.",
      "Profitez-en, ça ne durera pas !",
    ],
  },

  /* Alertes de temps : plein écran rouge clignotant. */
  alertes: {
    kicker: "Chrono",
    titre: "Plus que {n} min !",
    texte10: "Gardez le rythme, le colis vous attend !",
    texte5: "Accélérez la team, on y est presque !",
    texte1: "Dernière minute ! On donne tout, maintenant !",
    ok: "On fonce !",
    finTitre: "Temps écoulé !",
    finTexte: "Barnabé a flairé votre plan… mais rien n'est perdu ! Il est encore temps de faire diversion et de terminer la mission.",
    finBouton: "On continue !",
  },

  /* Chrono global affiché en haut des écrans de jeu. */
  chrono: {
    restant: "Temps restant",
    depasse: "Temps dépassé",
    tempsFinal: "Mission bouclée en **{temps}**",
  },

  /* Création de l'équipe, en deux temps : le nom, puis les deux rôles. */
  equipe: {
    kicker: "Inscription · 1 / 2",
    titreCourt: "Votre équipe",
    label: "Nom de l'équipe",
    placeholder: "Ex. : Les Lutins de verre",
    bouton: "Valider",
    erreurVide: "Indiquez un nom d'équipe pour continuer.",

    /* Les rôles : réaction du Père Noël, puis l'encadré des deux rôles. */
    rolesKicker: "Inscription · 2 / 2",
    rolesTitre: "Vos rôles",
    rolesBulle: "Ho ho ho, pas mal du tout ce nom d'équipe ! Bienvenue, {equipe} !",
    rolesBulleSuite: "Maintenant, choisissez qui sera The Mastermind et qui sera The Storyteller.",
    rolesAlerteTitre: "Choisissez vos rôles avec soin !",
    rolesAlerte:
      "",
    roles: [
      {
        icone: "crown",
        nom: "The Mastermind",
        texte: "Mène l'équipe à la victoire.",
      },
      {
        icone: "camera",
        nom: "The Storyteller",
        texte: "Documente la quête en photos et vidéos.",
        ou: "Photos et vidéos à déposer sur **The Gobi'Hub**, accessible depuis le programme.",
      },
    ],
    rolesNote: "",
    chefLabel: "The Mastermind",
    chefPlaceholder: "Prénom",
    reporterLabel: "The Storyteller",
    reporterPlaceholder: "Prénom",
    rolesBouton: "C'est noté !",
    rolesErreur: "Indiquez un prénom pour chaque rôle.",
  },

  /* Écran « Comment jouer ? » : carte du parcours + 3 règles clés.
   * Les règles complètes (ci-dessous, « regles ») restent accessibles via
   * le bouton « Règles » en haut des écrans de jeu. */
  plateau: {
    titre: "La map",
    description: "5 étapes à franchir dans la Tour Saint-Gobain, au départ de La Verrière.",
    intro: "Tout part de **La Verrière**. Suivez la map, étape par étape !",
    depart: "BASE",
    /* Une étiquette courte par étape, affichée sur la map. */
    etapes: ["Check-in", "Cheat Code", "Fake Stream", "ID Check", "Ultimate Signal"],
    /* Map plein écran à chaque étape franchie (l'ascenseur monte). */
    etapeKicker: "Étape {n} / 5",
    ascenseur: "L'ascenseur monte…",
    continuer: "Continuer",
    /* Sous-titre en gras affiché au-dessus des 3 règles de la map. */
    reglesTitre: "Les règles du jeu",
    /* Légende de la map : 3 repères. */
    regles: [
      { icone: "pin", titre: "Mot secret", texte: "Un mot secret par étage pour déverrouiller la suite de l'aventure." },
      { icone: "flake", titre: "Gel du système", texte: "2 erreurs au compteur et c'est le gel du système pendant 45 secondes !" },
      { icone: "star", titre: "Joker", texte: "Chaque équipe dispose d'un unique joker de secours pour souffler un coup." },
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
      { icone: "clock", titre: "{chrono} chrono", texte: "Pas une minute de plus pour retrouver le colis." },
      { icone: "star", titre: "Joker unique", texte: "Un seul indice de secours par équipe. Gardez-le pour un vrai blocage." },
      { icone: "flake", titre: "Gel du système", texte: "2 erreurs sur une étape et tout gèle pendant {gel}." },
      { icone: "lock", titre: "Piratage surprise", texte: "Une fois dans la partie, Barnabé gèle votre téléphone pendant 30 secondes." },
      { icone: "crown", titre: "Esprit d'équipe", texte: "On avance ensemble, personne ne reste en arrière." },
      { icone: "check", titre: "Fair-play", texte: "Zéro triche, 100 % bonne foi." },
    ],
    objectif: "",
    bouton: "C'est parti !",
    boutonFermer: "J'ai compris",
    /* Confirmation avant le départ du chrono (une seule fois). */
    confirmTitre: "Prêts à commencer ?",
    confirmTexte: "Le chrono de **{chrono}** démarre dès votre feu vert et ne s'arrête plus. Toute l'équipe est prête ?",
    confirmOui: "Lancer le chrono",
    confirmNon: "Pas encore",
  },

  /* Lien « Un souci ? » (en bas de chaque écran) : appelle l'organisation.
   * contacts : un bouton d'appel par personne (numéro au format libre). */
  aide: {
    bouton: "Aide",
    titre: "Un souci ?",
    texte: "Un bug, l'appli qui coince, une question ? Appelez l'organisation, on arrive vite !",
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
    mauvaiseReponse: "Mauvaise réponse. Réessayez !",
    mauvaiseReponseDernierEssai: "Raté ! Encore une erreur et tout gèle pendant {gel}.",
    reponseVide: "Saisissez une réponse avant de valider.",
    choixVide: "Sélectionnez une réponse avant de valider.",
    votreReponse: "Votre réponse",
    indice: "Indice",
    queteVerrouillee:
      "Pas si vite ! Terminez d'abord l'étape en cours.",
    queteTerminee: "Cette étape est déjà terminée. Retour à votre étape en cours.",
    commencer: "Commencer",
    continuer: "Continuer",
    partieReinitialisee: "Votre partie a été réinitialisée par les organisateurs.",
    gelTitre: "Tout est gelé !",
    gelLeve: "Le gel est levé !",
    gelCompteur: "Dégel dans",
    stockageIndisponible:
      "Sauvegarde impossible sur ce navigateur (navigation privée ?). Ne fermez pas la page, sinon votre progression sera perdue.",
  },

  joker: {
    bouton: "Utiliser mon joker",
    confirmationTitre: "Utiliser votre joker ?",
    confirmationTexte: "Un seul joker pour toute l'aventure. Une fois utilisé, il ne revient pas !",
    confirmer: "Oui, utiliser mon joker",
    annuler: "Non, je le garde",
    conserve: "Votre joker est conservé.",
    titreIndice: "Indice du joker",
    dejaUtilise: "Joker déjà utilisé",
    statutDisponible: "Joker disponible",
    statutUtilise: "Joker utilisé",
    /* Notifications (bannière en haut de l'écran) et rappel discret si
     * le joker n'a pas servi après 3 étapes. */
    notifApp: "Joker",
    notifUtilise: "Ho ho ho ! Le Père Noël vous souffle un indice, juste en dessous.",
    rappel: "Psst… votre joker est toujours disponible. Gardez-le pour un vrai blocage !",
  },

  /* Écran de saisie du mot secret d'un étage (début de chaque quête). */
  acces: {
    kicker: "Étape {n} / 5",
    consigne: "",
    /* Sous la map : l'encadré pour débloquer l'étape. */
    arriveTitre: "Arrivés à l'étage ?",
    arriveTexte: "Saisissez le mot secret affiché sur place.",
    label: "Mot secret de l'étage",
    bouton: "Débloquer l'étape",
    erreur: "Ce n'est pas le bon mot secret. Cherchez bien autour de vous !",
    /* Sortie de secours : affichée après `secoursApres` mauvais mots. */
    secoursApres: 3,
    secours: "Le mot secret est écrit sur une affichette, à l'étage indiqué. Toujours bloqués ? Touchez « Un souci ? » en bas de l'écran et l'organisation vous le donnera.",
  },

  fin: {
    termineeTitre: "Aventure terminée",
    termineeLe: "Aventure terminée le {date} à {heure}.",
  },
};

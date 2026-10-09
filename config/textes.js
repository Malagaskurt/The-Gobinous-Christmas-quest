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
  accueil: {
    surtitre: "The Gobinous Christmas Club",
    titre: "Gobinous",
    titreSuite: "Christmas Quest",
    sousTitre: "La quête du cadeau disparu · Saint-Gobain",
    accroche:
      "Un cadeau de Noël a disparu ! Résolvez les quêtes en équipe pour retrouver la hotte.",
    bouton: "Commencer l'aventure",
    boutonReprendre: "Reprendre l'aventure",
    partieEnCours: "Partie en cours sur ce téléphone : **{equipe}**",
  },

  /* Chrono global affiché en haut des écrans de jeu. */
  chrono: {
    restant: "Temps restant",
    depasse: "Temps dépassé",
    tempsFinal: "Votre temps : **{temps}**",
  },

  equipe: {
    titre: "Quel est le nom de votre équipe ?",
    aide:
      "Ce nom sert uniquement à identifier votre progression sur ce téléphone. Aucune donnée personnelle n'est demandée.",
    label: "Nom de l'équipe",
    placeholder: "Ex. : Les Lutins de verre",
    bouton: "Valider",
    erreurVide: "Indiquez un nom d'équipe pour continuer.",
  },

  /* Texte de l'écran des règles (affiché tel quel).
   * ⚠ Si vous modifiez les paramètres du quiz (nombre de tentatives,
   *   durée du blocage…), pensez à mettre à jour la règle n°5. */
  regles: {
    titre: "COMMENT JOUER ?",
    liste: [
      {
        titre: "Résolvez les 5 quêtes.",
        texte: "Quiz, énigmes et défis vous attendent pour retrouver le cadeau disparu.",
      },
      {
        titre: "Suivez les indices.",
        texte: "Chaque quête réussie vous permet de découvrir la suite de l'aventure.",
      },
      {
        titre: "Jouez en équipe.",
        texte: "Discutez, réfléchissez ensemble et utilisez votre téléphone pour avancer.",
      },
      {
        titre: "Gardez votre joker.",
        texte:
          "Vous disposez d'un joker utilisable une seule fois pendant toute l'aventure. Il vous permettra d'obtenir un indice supplémentaire.",
      },
      {
        titre: "Attention au quiz !",
        texte:
          "Vous devez obtenir 8 bonnes réponses. En cas d'échec, vous pouvez tenter un autre thème. Si vous échouez une deuxième fois, le quiz se bloque pendant 3 minutes.",
      },
    ],
    objectif:
      "Votre objectif : retrouver la hotte et découvrir ce qu'elle vous réserve. Le contenu des cadeaux reste secret jusqu'à la révélation finale.",
    bouton: "C'est parti !",
    boutonFermer: "Fermer",
  },

  general: {
    quete: "Quête",
    queteNumero: "Quête n°{n}",
    bravo: "Bravo !",
    equipe: "Équipe",
    regles: "Règles",
    questionNumero: "Question {n} sur {total}",
    validerReponse: "Valider ma réponse",
    questionSuivante: "Question suivante",
    terminer: "Terminer",
    bonneReponse: "Bonne réponse !",
    mauvaiseReponse: "Ce n'est pas la bonne réponse. Réessayez !",
    reponseVide: "Saisissez une réponse avant de valider.",
    choixVide: "Sélectionnez une réponse avant de valider.",
    votreReponse: "Votre réponse",
    queteVerrouillee:
      "Cette quête n'est pas encore débloquée. Terminez d'abord la quête en cours.",
    queteTerminee: "Cette quête est déjà terminée. Voici votre quête en cours.",
    commencer: "Commencer",
    continuer: "Continuer",
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

  /* Étape « deviner le lieu » puis « s'y rendre », commune aux quêtes 1 à 3. */
  lieux: {
    surtitre: "Indice",
    titre: "Où se trouve la prochaine étape ?",
    consigne:
      "Lisez l'indice, discutez en équipe puis saisissez le lieu que vous pensez avoir identifié.",
    label: "Votre proposition de lieu",
    bouton: "Valider le lieu",
    incorrect: "Ce n'est pas le bon lieu. Relisez l'indice et réessayez.",
    trouveTitre: "Lieu trouvé !",
    trouveSousTitre: "Vous pouvez vous rendre à : **{lieu}**",
    scanConsigne:
      "Une fois sur place, scannez le QR code avec l'appareil photo de ce téléphone pour débloquer la quête suivante.",
    codeManuelTitre: "Le QR code ne s'ouvre pas ?",
    codeManuelLabel: "Saisissez le code inscrit sous le QR code",
    codeManuelBouton: "Valider le code",
    codeIncorrect: "Ce code ne correspond pas au lieu attendu. Vérifiez-le et réessayez.",
    boutonArrivee: "Nous sommes arrivés",
    conseilNavigateur:
      "Astuce : si le lien s'ouvre dans une autre application, revenez dans ce navigateur et saisissez le code à la main.",
  },

  /* Écran affiché après le scan d'un QR code. */
  scan: {
    okTitre: "Lieu validé !",
    okTexte: "Vous êtes bien arrivés : **{lieu}**. La quête {n} est débloquée.",
    boutonSuite: "Commencer la quête {n}",
    dejaTitre: "Lieu déjà validé",
    dejaTexte: "Ce lieu a déjà été validé par votre équipe.",
    tropTotTitre: "Pas si vite !",
    tropTotTexte:
      "Ce lieu n'est pas encore débloqué pour votre équipe. Terminez d'abord votre quête en cours.",
    inconnuTitre: "QR code non reconnu",
    inconnuTexte: "Ce code ne correspond à aucune étape de l'aventure.",
    pasDePartieTitre: "Aucune partie en cours",
    pasDePartieTexte:
      "Aucune partie n'a été trouvée dans ce navigateur. Si votre équipe a déjà commencé l'aventure, ouvrez ce lien dans le même navigateur que celui utilisé pour jouer (par exemple Safari sur iPhone ou Chrome sur Android), ou saisissez le code du lieu directement dans le jeu.",
    finDesactiveeTexte:
      "Présentez ce téléphone aux organisateurs pour valider la fin de votre aventure.",
    boutonRetour: "Retourner à ma quête",
    boutonAccueil: "Aller à l'accueil",
  },

  fin: {
    organisateurTitre: "Réservé aux organisateurs",
    organisateurAide: "Saisissez le code organisateur pour clôturer l'aventure de cette équipe.",
    organisateurLabel: "Code organisateur",
    organisateurBouton: "Valider la fin de l'aventure",
    organisateurErreur: "Code incorrect.",
    termineeScript: "Joyeux Noël !",
    termineeTitre: "Aventure terminée",
    termineeTexte: "Bravo **{equipe}** ! Merci d'avoir participé à la Gobinous Christmas Quest. Joyeux Noël !",
    termineeLe: "Aventure validée le {date} à {heure}.",
  },
};

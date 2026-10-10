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

  /* Répliques du lutin (bulles). Une liste [ ] = une réplique tirée au
   * hasard. Laissez "" pour qu'il reste silencieux. */
  lutin: {
    accueil: "Psst… Le cadeau ? C'est moi qui l'ai caché. Hi hi !",
    equipe: "Juste un nom d'équipe. Rien de perso, promis !",
    reussite: ["GG la team !", "Vous êtes des goats !", "Validé, c'est carré !"],
    echec: ["MDR, raté !", "Vous pouvez faire mieux, les gars !"],
    blocage: "Brrr… Tout est gelé !",
    lieu: "Je vous attends là-haut… ou pas !",
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

    /* Les rôles, présentés par le lutin. {equipe} = nom choisi. */
    rolesTitre: "Vos rôles",
    rolesBulle: "**{equipe}** ? Bête de nom, j'adore !",
    rolesTexte:
      "Pour rendre ça encore plus fun, nommez un **Lutin Reporter** : avec un autre téléphone, il filme et photographie tous vos temps forts. À la fin, on vous donne un QR code pour nous les envoyer. Montrez-nous que vous êtes la meilleure équipe !",
    chefLabel: "Chef Lutin (capitaine)",
    chefPlaceholder: "Prénom",
    reporterLabel: "Lutin Reporter (photos et vidéos)",
    reporterPlaceholder: "Prénom",
    rolesBouton: "C'est noté !",
    rolesErreur: "Indiquez le prénom du Chef Lutin et du Lutin Reporter.",
  },

  /* Écran « Comment jouer ? » : carte du parcours + 3 règles clés.
   * Les règles complètes (ci-dessous, « regles ») restent accessibles via
   * le bouton « Règles » en haut des écrans de jeu. */
  plateau: {
    titre: "Comment jouer ?",
    description: "Carte du parcours : 5 quêtes, du départ jusqu'à la hotte.",
    depart: "DÉPART",
    /* Une étiquette courte par quête, affichée sur la carte. */
    etapes: ["Quiz Givré", "Code Cristal", "Flash Lutin", "Dossier 44", "Opération Hotte"],
    /* Légende de la carte : 3 règles clés seulement. */
    regles: [
      { icone: "pin", texte: "À chaque étage, trouvez le **mot secret**." },
      { icone: "star", texte: "**1 joker** = 1 indice, une seule fois." },
      { icone: "flake", texte: "Trop d'erreurs ? **Tout gèle**, puis on avance." },
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
    intro: "Barnabé, le lutin du Gobinous Christmas Club, a caché le Cadeau Officiel dans la Tour. Retrouvez-le !",
    liste: [
      { icone: "gift", titre: "5 quêtes, 5 étages", texte: "Chaque quête vous indique l'étage suivant." },
      { icone: "pin", titre: "Le mot secret", texte: "Sur place, trouvez-le et saisissez-le pour débloquer la quête." },
      { icone: "tree", titre: "Un seul téléphone", texte: "On réfléchit ensemble, on avance ensemble." },
      { icone: "star", titre: "1 joker", texte: "Un indice bonus, une seule fois dans toute l'aventure." },
      { icone: "flake", titre: "Le gel", texte: "Trop d'erreurs et tout gèle quelques secondes. Ensuite, ça repart." },
      { icone: "clock", titre: "{chrono} chrono", texte: "Il tourne dès le départ. Dépassé ? Finissez quand même !" },
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
    mauvaiseReponseDernierEssai: "Raté ! Dernier essai avant le gel ({duree}).",
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
    kicker: "Quête {n} / 5 · verrouillée",
    consigne: "",
    label: "Mot secret de l'étage",
    bouton: "Débloquer la quête",
    erreur: "Ce n'est pas le mot secret de cet étage. Cherchez bien autour de vous !",
  },

  fin: {
    termineeTitre: "Aventure terminée",
    termineeLe: "Aventure terminée le {date} à {heure}.",
  },
};

/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — QUÊTES 2 À 5
 * ---------------------------------------------------------------------
 * Une quête = une mission = une validation = la direction de l'étage
 * suivant (le récit qui y mène est dans config/etapes.js).
 *
 * Réponses saisies au clavier (champ `reponses`) : indiquez toutes les
 * variantes acceptées. Majuscules, accents, espaces, tirets et articles
 * de début (le, la, l'…) sont ignorés automatiquement.
 *
 * indiceJoker : indice proposé via le joker (un seul par équipe pour
 * toute l'aventure). Laissez "" pour ne pas proposer le joker.
 *
 * Les pénalités (essais, durée du gel) se règlent dans
 * config/parametres.js → penalites.
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.quetes = {
  /* ------------------------------------------------------------------ */
  /* QUÊTE 2 — LE MESSAGE CODÉ (5ᵉ étage)                                */
  /* Chiffre « Pigpen » (franc-maçon), dessiné automatiquement à partir  */
  /* des lignes ci-dessous.                                              */
  /* ------------------------------------------------------------------ */
  message: {
    titre: "Code Cristal",
    intro:
      "Le lutin a griffonné un message dans un alphabet secret… et oublié sa grille de décodage. Oups !",
    boutonIntro: "Découvrir le message",
    consigne: "",
    /* Message chiffré, ligne par ligne (lettres A à Z et espaces). */
    lignes: ["LA CLE", "DU MYSTERE", "EST LE VERRE"],
    grilleTitre: "Grille de décodage",
    label: "Le message déchiffré",
    bouton: "Valider le message",
    reponses: ["la cle du mystere est le verre", "la clef du mystere est le verre"],
    erreur: "Phrase incorrecte. Il vous reste {n} essai !",
    indiceJoker:
      "Chaque symbole reprend la forme des traits qui entourent la lettre dans la grille. Un point dans le symbole ? La lettre est dans une grille à points.",

    reussiteTitre: "Message déchiffré !",
    reussiteTexte: "« La clé du mystère est le verre ». Le lutin est bluffé !",
    reussiteApresGelTitre: "Le gel est levé !",
    reussiteApresGelTexte: "La solution était : « LA CLÉ DU MYSTÈRE EST LE VERRE ».",
    gelSuite: "Ensuite, le lutin vous soufflera la solution.",
    bouton2: "Découvrir la suite",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 3 — LE DÉFI PHOTO (23ᵉ étage)                                 */
  /* ------------------------------------------------------------------ */
  photos: {
    titre: "Flash Lutin",
    avertissementTitre: "Attention !",
    avertissement: "Le lutin est capricieux : il peut refuser une photo parfaite, juste pour rire !",
    intro:
      "Choisissez **3 modèles sur 6** et reproduisez-les en photo, avec toute l'équipe.",
    consentement:
      "Les photos validées sont envoyées aux organisateurs.",
    boutonIntro: "Relever le défi",

    /* Nombre de photos à réaliser. */
    nombre: 3,
    modeles: [
      { id: "avion", titre: "Le décollage", image: "assets/img/photos/modele-1.jpg" },
      { id: "grimaces", titre: "La pile de grimaces", image: "assets/img/photos/modele-2.jpg" },
      { id: "totem", titre: "Le totem de têtes", image: "assets/img/photos/modele-3.jpg" },
      { id: "pose", titre: "La pose de star", image: "assets/img/photos/modele-4.jpg" },
      { id: "duo", titre: "Le duo de visages", image: "assets/img/photos/modele-5.jpg" },
      { id: "porte", titre: "Le porté", image: "assets/img/photos/modele-6.jpg" },
    ],
    choixTitre: "Choisissez vos 3 modèles",
    choixAide: "Touchez un modèle pour ouvrir l'appareil photo.",
    choixCompteur: "{n} / {max} photos validées",
    boutonPhoto: "Prendre la photo",
    boutonRetenter: "Retenter",
    boutonValider: "Valider cette photo",
    photoValidee: "Photo validée",
    erreurPhoto: "Impossible de lire cette photo. Réessayez.",
    envoiOk: "Envoyée aux organisateurs",
    envoiAttente: "Sera envoyée dès que le réseau le permet",
    rejetTitre: "Refusé !",
    rejetTexte:
      "Le lutin exige que vous la repreniez… avec plus de passion !",
    rejetBouton: "On la refait !",
    boutonQuete: "Valider la Quête 3",

    reussiteTitre: "Défi photo réussi !",
    reussiteTexte: "Quelle équipe de comédiens ! Les 3 photos sont dans la boîte.",
    bouton: "Découvrir la suite",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 4 — L'ENQUÊTE DU SUPPORT 44 (20ᵉ étage)                       */
  /* 4 modules successifs. Choix : `reponse` = lettre ; saisie :         */
  /* `reponses` = liste des réponses acceptées.                          */
  /* ------------------------------------------------------------------ */
  enquete: {
    titre: "Dossier 44",
    terminalTitre: "Terminal de sécurité du Support 44",
    intro:
      "Le suspect a été vu ici pour la dernière fois. Décodez les **4 modules** de sa fiche de sécurité pour révéler son identité.",
    boutonIntro: "Lancer l'investigation",
    erreur: "Données incorrectes. Il vous reste {n} essai !",
    moduleValide: "Module validé",
    moduleForce: "Le terminal a validé ce module automatiquement.",
    gelSuite: "Ensuite, le terminal validera ce module tout seul.",
    boutonSuivant: "Module suivant",

    modules: [
      {
        titre: "La photo du suspect",
        sousTitre: "Identification visuelle",
        indice:
          "Le suspect ne porte aucun accessoire sur les yeux. Son couvre-chef n'est pas d'une couleur primaire. De plus, il serait faux d'affirmer qu'il est totalement imberbe.",
        choix: [
          { label: "Suspect A", image: "assets/img/suspects/a.jpg" },
          { label: "Suspect B", image: "assets/img/suspects/b.jpg" },
          { label: "Suspect C", image: "assets/img/suspects/c.jpg" },
          { label: "Suspect D", image: "assets/img/suspects/d.jpg" },
        ],
        reponse: "C",
        indiceJoker: "Éliminez d'abord les lunettes, puis les couvre-chefs rouges, bleus ou jaunes.",
      },
      {
        titre: "Le code matricule",
        sousTitre: "Matricule de sécurité",
        consignes: [
          "**A** = chiffre des dizaines de notre étage actuel",
          "**B** = nombre de lettres du mot « LUTIN »",
          "**C** = somme des deux premiers chiffres (A + B)",
          "**D** = dernier chiffre de l'année qui précède l'année en cours",
        ],
        label: "Matricule (4 chiffres : ABCD)",
        chiffres: 4,
        reponses: ["2575"],
        indiceJoker: "Pour D : en quelle année étions-nous l'an dernier ?",
      },
      {
        titre: "Le service d'origine",
        sousTitre: "Affectation clandestine",
        intro: "Rapports d'audit croisés :",
        indices: [
          "Seuls le « Service Paillettes & Pression » et le « Bureau des Chocolats Chauds » utilisent du matériel brillant.",
          "Le « Bureau des Chocolats Chauds » est strictement réservé aux agents ayant un matricule PAIR.",
          "Le lutin partage ses bureaux avec la « Cellule Sabotage & Guirlandes », or le « Service Paillettes & Pression » a une interdiction absolue de partager ses locaux.",
        ],
        choix: [
          { label: "Service Paillettes & Pression" },
          { label: "Division Bêtises & Emballage" },
          { label: "Bureau des Chocolats Chauds" },
          { label: "Cellule Sabotage & Guirlandes" },
        ],
        reponse: "B",
        indiceJoker: "Le matricule du suspect est-il pair ou impair ? Et peut-il travailler avec la cellule qui partage ses bureaux ?",
      },
      {
        titre: "Le nom de famille",
        sousTitre: "Cryptogramme de sécurité",
        intro: "Le nom du suspect est caché dans ces 8 équations :",
        equations: [
          "[[tree]] + [[tree]] = 38",
          "[[star]] + [[tree]] = 28",
          "[[gift]] − [[star]] = 15",
          "[[tree]] = 19",
          "[[bell]] + [[star]] = 14",
          "[[flake]] − [[bell]] = 17",
          "[[bell]] = 5",
          "[[sock]] + [[bell]] = 19",
        ],
        label: "Nom de famille du suspect",
        reponses: ["sixseven", "six seven"],
        indiceJoker: "Et si chaque nombre correspondait à une lettre de l'alphabet ? A = 1, B = 2…",
      },
    ],

    /* Carte d'identité affichée à la fin de l'enquête. */
    fiche: {
      titre: "Badge d'accès · Support 44",
      photo: "assets/img/suspects/c.jpg",
      nom: "Barnabé SIX-SEVEN",
      matricule: "2575",
      service: "Division Bêtises & Emballage",
    },
    reussiteTitre: "Dossier déverrouillé !",
    reussiteTexte: "Identité confirmée. Activation du GPS du badge…",
    bouton: "Localiser le badge",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 5 — LA TRAQUE DU 33ᵉ ÉTAGE                                    */
  /* ⚠ Règle d'or : aucun texte affiché avant la validation de TOKYO ne */
  /*   doit contenir les mots « salle » ou « porte ».                   */
  /* ------------------------------------------------------------------ */
  traque: {
    titre: "Opération Hotte",
    avertissementTitre: "Vidéo à usage unique",
    avertissement:
      "Une caméra a intercepté un message de Barnabé SIX-SEVEN. Regroupez-vous et montez le son : vous ne pourrez la voir **qu'une seule fois** !",
    boutonVideo: "Lancer la vidéo",

    /* Vidéo animée de Barnabé (MP4, voix et musique incluses), générée
     * avec tools/generer-video.py. Laissez "" pour une transmission
     * simulée (image fixe, sous-titres et voix ci-dessous). */
    video: "assets/video/barnabe.mp4",
    camera: "CAM 33-07 · TRANSMISSION INTERCEPTÉE",
    /* Répliques de la vidéo : sous-titre affiché de `de` à `a` secondes
     * (minutage donné par tools/generer-video.py), voix de Barnabé
     * (fichier MP3, généré avec tools/generer-voix-piper.py) et `voix` :
     * texte prononcé s'il diffère du sous-titre. */
    sousTitres: [
      { de: 0.8, a: 9.8, audio: "assets/audio/barnabe-video-1.mp3", texte: "Ha ha ha ! Coucou le Support 44 ! Vous cherchez ce gros sac ? Trop tard, le Cadeau Officiel est avec moi !", voix: "Ha ha ha ! Coucou le Support quarante-quatre ! Vous cherchez ce gros sac ? Trop tard… le Cadeau Officiel est avec moi !" },
      { de: 10.3, a: 18.4, audio: "assets/audio/barnabe-video-2.mp3", texte: "Regardez mon mug : +8 h. Et ces jolies fleurs… Demain, mon petit-déjeuner, je le prends de l'autre côté du monde !", voix: "Regardez mon mug : plus huit heures. Et ces jolies fleurs… Demain, mon petit-déjeuner, je le prends de l'autre côté du monde !" },
      { de: 18.9, a: 32.7, audio: "assets/audio/barnabe-video-3.mp3", texte: "Et ça, sur mon écran ? Une tour de télécom de 634 mètres. Ces vitres panoramiques ? Du savoir-faire Saint-Gobain, évidemment !", voix: "Et ça, sur mon écran ? Une tour de télécom de six cent trente-quatre mètres. Ces vitres panoramiques ? Du savoir-faire Saint-Gobain, évidemment !" },
      { de: 33.2, a: 40.4, audio: "assets/audio/barnabe-video-4.mp3", texte: "Si vous inversez le temps et l'histoire, vous trouverez le code. Allez, K-Y-O tout le monde !", voix: "Si vous inversez le temps… et l'histoire… vous trouverez le code. Allez, K, Y, O, tout le monde !" },
    ],
    videoDetruite: "Transmission autodétruite.",
    boutonApresVideo: "Voir le rapport",
    videoBloquee: "La vidéo ne démarre pas ?",
    videoToucher: "Touchez pour lancer la vidéo",

    rapportTitre: "Rapport d'analyse",
    rapport: "Barnabé se cache à cet étage, dans une pièce baptisée du nom d'une destination emblématique.",
    indices: [
      "Son mug affiche +8 h : le fuseau UTC+9, en décembre.",
      "Sa ville abrite une tour de télécom de 634 m, vitrée par Saint-Gobain.",
      "Le nom (5 lettres) inverse les syllabes de l'ancienne capitale : KYO-TO.",
    ],
    conclusion: "",
    label: "Code du repaire (5 lettres)",
    bouton: "Valider le code",
    reponses: ["tokyo"],
    unEssai: "Un seul essai ! En cas d'erreur, tout gèle pendant {duree}.",
    gelSuite: "Ensuite, vous pourrez retenter votre chance.",
    indiceJoker: "La tour de 634 m s'appelle la Skytree. Dans quelle ville se trouve-t-elle ?",

    /* Après TOKYO : le lutin démasqué, puis le faux appel. */
    trouve:
      "Quoi ?! Vous m'avez retrouvé si vite ? OK, vous êtes des goats. Mon QG, c'est bien la SALLE TOKYO, au 33ᵉ étage. MAIS N'OUVREZ PAS LA PORTE ! Elle est piégée. Appelez-moi d'abord !",
    boutonAppel: "Appeler Barnabé",

    /* Message vocal de Barnabé (MP3, généré avec tools/generer-voix-piper.py). */
    audio: "assets/audio/barnabe-appel.mp3",
    appelEnCours: "Appel en cours…",
    appelNom: "Barnabé SIX-SEVEN",
    messageVocal:
      "MDR ! Vous attendiez vraiment que je « désactive la bombe » ? Trop naïfs, vous me régalez ! Bon, la course est presque finie. Dans la pièce, plein de paquets identiques… mais un seul est le VRAI Cadeau Officiel. Interdit de les ouvrir ici ! Prenez-en un au hasard, ne dites rien à personne et foncez au point de départ. Tchao !",
    /* Texte prononcé (orthographe phonétique pour la voix de synthèse). */
    messageVocalVoix:
      "Èm dé èr ! Vous attendiez vraiment que je désactive la bombe ? Trop naïfs, vous me régalez ! Bon, la course est presque finie. Dans la pièce, il y a plein de paquets identiques… mais un seul est le vrai Cadeau Officiel. Interdit de les ouvrir ici ! Prenez-en un au hasard, ne dites rien à personne, et foncez au point de départ. Tchao !",
    boutonRaccrocher: "Raccrocher",

    /* Écran de fin. Icônes des consignes : gift, lock, elfWalk1, star, pin… */
    finTitre: "Mission accomplie",
    finSousTitre: "(ou presque…)",
    finTexte: "Bravo **{equipe}** ! Barnabé est démasqué.",
    finConsignesTitre: "Dernière ligne droite",
    finConsignes: [
      { icone: "gift", texte: "Prenez **un seul paquet**, au hasard." },
      { icone: "lock", texte: "Ne l'ouvrez surtout pas." },
      { icone: "elfWalk1", texte: "Foncez au **point de départ** !" },
    ],
    finSignature: "Barnabé SIX-SEVEN, lutin (un peu farceur) du Gobinous Christmas Club",
    finVoeux: "Joyeux Noël",
  },
};

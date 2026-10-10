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
    titre: "Cheat Code",
    intro:
      "Barnabé a oublié un message codé sur le comptoir… avec sa grille. Déchiffrez-le pour prendre de l'avance.",
    boutonIntro: "Découvrir le message",
    consigne: "",
    /* Message chiffré, ligne par ligne (lettres A à Z et espaces). */
    lignes: ["BARNABE A", "PERDU LE", "CONTROLE"],
    grilleTitre: "Grille de décodage",
    label: "Le message déchiffré",
    bouton: "Valider le message",
    reponses: ["barnabe a perdu le controle"],
    erreur: "Phrase incorrecte. Encore {n} essai(s) avant le gel du système !",
    indiceJoker:
      "Chaque symbole reprend la forme des traits qui entourent la lettre dans la grille. Un point dans le symbole ? La lettre est dans une grille à points.",

    reussiteTitre: "Cheat code activé !",
    reussiteTexte: "« Barnabé a perdu le contrôle » : vous avez une longueur d'avance sur lui.",
    /* Bulle de Barnabé qui panique, après le cheat code. */
    paniqueBulle: "Quoi ?! Qui vous a filé ce code ?! Pas de panique… PAS. DE. PANIQUE.",
    paniqueTexte: "Le troll panique : accélérez !",
    reussiteApresGelTitre: "Le gel est levé !",
    reussiteApresGelTexte: "La phrase secrète était : « BARNABÉ A PERDU LE CONTRÔLE ».",
    gelSuite: "Ensuite, Barnabé vous soufflera la solution.",
    bouton2: "Foncer",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 3 — LE DÉFI PHOTO (23ᵉ étage)                                 */
  /* ------------------------------------------------------------------ */
  photos: {
    titre: "Fake Stream",
    avertissementTitre: "Attention !",
    avertissement: "Barnabé flaire parfois l'arnaque et refuse une photo.",
    intro:
      "Saturez les caméras de Barnabé : reproduisez **3 photos sur 6**, avec toute l'équipe.",
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
      "Barnabé n'y croit pas une seconde. Refaites-la… en encore plus absurde !",
    rejetBouton: "On la refait !",
    boutonQuete: "Lancer la diversion",

    reussiteTitre: "Diversion réussie !",
    reussiteTexte: "Barnabé est noyé sous vos photos. Une alerte tombe au Support 44…",
    bouton: "Découvrir la suite",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 4 — L'ENQUÊTE DU SUPPORT 44 (20ᵉ étage)                       */
  /* 4 modules successifs. Choix : `reponse` = lettre ; saisie :         */
  /* `reponses` = liste des réponses acceptées.                          */
  /* ------------------------------------------------------------------ */
  enquete: {
    titre: "ID Check",
    terminalTitre: "Support 44 · Analyse de badge",
    intro:
      "Un badge inconnu a été scanné aujourd'hui. Décodez les **4 modules** pour identifier son propriétaire.",
    boutonIntro: "Analyser le badge",
    erreur: "Données incorrectes. Encore {n} essai(s) avant le gel du système !",
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
      titre: "Badge inconnu · Support 44",
      photo: "assets/img/suspects/c.jpg",
      nom: "Barnabé SIX-SEVEN",
      matricule: "2575",
      service: "Division Bêtises & Emballage",
      /* Passages du badge dans la Tour (le dernier = l'étage de l'étape 5). */
      passagesTitre: "Passages du badge aujourd'hui",
      passages: [
        { heure: "08:12", lieu: "La Verrière" },
        { heure: "11:47", lieu: "5ᵉ étage" },
        { heure: "14:30", lieu: "23ᵉ étage" },
        { heure: "16:58", lieu: "33ᵉ étage" },
      ],
      dernierBip: "Dernier bip",
    },
    reussiteTitre: "Badge analysé !",
    reussiteTexte: "Propriétaire identifié. Dernier étage où il a sévi : 33ᵉ étage.",
    bouton: "Remonter la piste",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 5 — LA TRAQUE DU 33ᵉ ÉTAGE                                    */
  /* ⚠ Règle d'or : aucun texte affiché avant la validation de TOKYO ne */
  /*   doit contenir les mots « salle » ou « porte ».                   */
  /* ------------------------------------------------------------------ */
  traque: {
    titre: "Ultimate Signal",
    /* Notification d'alerte reçue en arrivant au 33ᵉ étage. */
    notifApp: "Support 44",
    notifHeure: "maintenant",
    notif: "Attendez, on vient de trouver une vidéo qu'il a laissée derrière lui !",
    avertissementTitre: "Vidéo à usage unique",
    avertissement:
      "Regroupez-vous, montez le son : elle ne se lit **qu'une seule fois**.",
    boutonVideo: "Lancer la vidéo",

    /* Vidéo animée de Barnabé (MP4, voix et musique incluses), générée
     * avec tools/generer-video.py à partir de la voix `videoVoix`.
     * Laissez video: "" pour une transmission simulée (image fixe, voix
     * et sous-titres). */
    video: "assets/video/barnabe.mp4",
    videoVoix: "assets/audio/barnabe-video.mp3",
    /* Présentation insérée juste après « Salut les gars ! » (à `apres`
     * secondes de la voix), pendant que Barnabé fait le geste « six seven ».
     * Fichier facultatif : sans lui, Barnabé fait seulement le geste. */
    videoIntro: { audio: "assets/audio/barnabe-video-intro.mp3", texte: "C'est Barnabé Six Seven !", apres: 1.07 },
    camera: "CAM 33-07 · TRANSMISSION INTERCEPTÉE",
    /* Sous-titres de la vidéo : affichés de `de` à `a` secondes (temps de
     * la vidéo). `scene` : décor de la vidéo pendant la réplique (1 :
     * Barnabé de nuit, 2 : l'horloge +7 h, 3 : l'écran et la tour,
     * 4 : au revoir). */
    sousTitres: [
      { de: 0.6, a: 1.7, scene: 1, texte: "Salut les gars !" },
      { de: 1.7, a: 2.9, scene: 1, texte: "Bon…" },
      { de: 2.9, a: 7.7, scene: 1, texte: "Je dois l'avouer, vous avez géré : vous avez déjoué mon premier plan. GG à vous." },
      { de: 7.7, a: 12.4, scene: 1, texte: "Mais ne criez pas victoire trop vite : vous êtes encore loin d'avoir gagné." },
      { de: 12.4, a: 15.9, scene: 2, texte: "Pendant que vous courez partout là-bas, regardez l'heure qu'il est chez moi…" },
      { de: 15.9, a: 25.2, scene: 2, texte: "Avec mes sept heures d'avance, je me prépare déjà à aller me coucher après une longue journée, de l'autre côté du globe !" },
      { de: 25.2, a: 30.6, scene: 3, texte: "Regardez bien l'ordinateur derrière moi et zoomez sur cette immense tour de plus de 600 mètres." },
      { de: 30.6, a: 34.1, scene: 3, texte: "Vous voyez ce panorama de gratte-ciels de nuit, à perte de vue ?" },
      { de: 34.1, a: 41.2, scene: 4, texte: "Bref, je n'ai pas votre temps. Si vous connectez le décalage horaire, la hauteur de cette tour et l'histoire locale, vous trouverez le code." },
      { de: 41.2, a: 44, scene: 4, texte: "Allez, comme on dit ici : matané !" },
    ],
    videoDetruite: "Transmission autodétruite.",
    boutonApresVideo: "Voir le rapport",
    videoBloquee: "La vidéo ne démarre pas ?",
    videoToucher: "Touchez pour lancer la vidéo",

    /* Rapport affiché après la vidéo : des indices à toucher pour les
     * analyser (recto : ce qu'on a vu ou entendu ; verso : la piste). */
    rapportTitre: "Rapport d'analyse",
    rapport: "Barnabé se cache à cet étage, dans une pièce qui a le nom de sa ville. Touchez chaque indice pour l'analyser.",
    indices: [
      { titre: "Le décalage horaire", recto: "« Sept heures d'avance » : chez lui, il fait déjà nuit.", verso: "Quand vous êtes en plein après-midi, lui va se coucher. Il vit loin, très loin…" },
      { titre: "La tour géante", recto: "Une tour de plus de 600 m, au milieu d'un océan de gratte-ciels.", verso: "Des tours aussi hautes, il n'en existe qu'une poignée dans le monde." },
      { titre: "Le mot de la fin", recto: "« Matané ! »", verso: "Ce n'est pas du français… Il l'a dit « comme on dit ici »." },
      { titre: "L'histoire locale", recto: "« …et l'histoire locale. »", verso: "Sa ville n'a pas toujours porté son nom actuel." },
    ],
    conclusion: "Croisez les indices : le nom de sa ville est le code.",
    label: "Code du repaire (5 lettres)",
    bouton: "Valider le code",
    reponses: ["tokyo", "tokio"],
    unEssai: "Attention : plus de 2 erreurs d'affilée et c'est le gel du système ({duree}).",
    gelSuite: "Ensuite, vous pourrez retenter votre chance.",
    indiceJoker: "La tour de 634 m s'appelle la Skytree. Dans quelle ville se trouve-t-elle ?",

    /* Sortie de secours : après `indiceApres` mauvais codes, un indice de
     * secours s'affiche ; après `reponseApres` mauvais codes, la réponse
     * est donnée (plus de gel). Mettre 0 pour désactiver. */
    indiceApres: 3,
    indiceSecoursTitre: "Indice de secours",
    indiceSecours: "La tour géante, c'est la Skytree (634 m). « Matané ! » veut dire « à plus ! » en japonais. Et sa ville s'appelait autrefois Edo…",
    reponseApres: 4,
    reponseSecoursTitre: "Le lutin a pitié de vous",
    reponseSecours: "Le code du repaire est **TOKYO**. Saisissez-le pour le démasquer !",

    /* Après TOKYO : le lutin démasqué, puis le faux appel. */
    trouve:
      "Quoi ?! Vous m'avez retrouvé si vite ? OK, vous êtes des goats. Mon QG, c'est bien la SALLE TOKYO, au 33ᵉ étage. MAIS N'OUVREZ PAS LA PORTE ! Elle est piégée. Appelez-moi d'abord !",
    boutonAppel: "Appeler Barnabé",

    /* Message vocal de Barnabé (MP3 fourni, voix ElevenLabs) et ses
     * sous-titres, affichés de `de` à `a` secondes du message. */
    audio: "assets/audio/barnabe-appel.mp3",
    appelEnCours: "Appel en cours…",
    appelNom: "Barnabé SIX-SEVEN",
    appelTermine: "Appel terminé",
    messageVocalSousTitres: [
      { de: 0, a: 4.6, texte: "MDR ! Vous attendiez vraiment que je « désactive la bombe » ?" },
      { de: 4.6, a: 9.3, texte: "Trop naïfs, vous me régalez ! Bon, la course est presque finie." },
      { de: 9.3, a: 11.9, texte: "Dans la pièce, plein de paquets identiques…" },
      { de: 11.9, a: 14.4, texte: "…mais un seul est le VRAI Cadeau Officiel." },
      { de: 14.4, a: 16.1, texte: "Interdit de les ouvrir ici !" },
      { de: 16.1, a: 23, texte: "Prenez-en un au hasard, ne dites rien à personne et foncez au point de départ. Tchao !" },
    ],
    /* Texte complet (affiché si le son est coupé). */
    messageVocal:
      "MDR ! Vous attendiez vraiment que je « désactive la bombe » ? Trop naïfs, vous me régalez ! Bon, la course est presque finie. Dans la pièce, plein de paquets identiques… mais un seul est le VRAI Cadeau Officiel. Interdit de les ouvrir ici ! Prenez-en un au hasard, ne dites rien à personne et foncez au point de départ. Tchao !",
    boutonRaccrocher: "Raccrocher",

    /* Dans la salle : chaque équipe choisit UN paquet puis se photographie
     * avec lui (photo envoyée aux organisateurs). */
    paquetTitre: "Le colis mystère",
    paquetTexte: "Entrez, choisissez **un seul colis** sans l'ouvrir… puis prenez une photo de toute l'équipe avec lui !",
    boutonPhotoPaquet: "Photo avec notre colis",
    paquetValider: "Valider la photo",
    paquetReprendre: "Reprendre",
    paquetSansPhoto: "Impossible de prendre la photo ? Continuer",
    paquetModele: "Le colis choisi",

    boutonAccueil: "Retour à l'accueil",

    /* Écran de fin : grand titre, lutin qui danse, consigne en petit. */
    finTitre: "Mission presque accomplie",
    finTexte: "Bravo **{equipe}**",
    finConsigne: "Rendez-vous à La Verrière avec le colis choisi pour découvrir ce qu'il contient.",
  },
};

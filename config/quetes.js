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
      "Le Père Noël vous a caché un message codé sur le comptoir, avec sa grille. Barnabé ne sait pas la lire : déchiffrez-le pour prendre de l'avance.",
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
    reussiteTexte: "Le message secret du Père Noël : « Barnabé a perdu le contrôle ». Vous avez une longueur d'avance sur lui.",
    /* Bulle de Barnabé qui panique, après le cheat code. */
    paniqueBulle: "Quoi ?! Qui vous a filé ce code ?! Pas de panique… PAS. DE. PANIQUE.",
    paniqueTexte: "Ho ho ho ! Le troll panique : accélérez !",
    reussiteApresGelTitre: "Le gel est levé !",
    reussiteApresGelTexte: "La phrase secrète était : « BARNABÉ A PERDU LE CONTRÔLE ».",
    gelSuite: "Ensuite, le Père Noël vous soufflera la solution.",
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
      /* Passages du badge dans la Tour, tous le matin (le jeu a lieu
       * l'après-midi et il s'est enfui depuis). Le dernier = l'étage de l'étape 5. */
      passagesTitre: "Passages du badge aujourd'hui",
      passages: [
        { heure: "08:34", lieu: "La Verrière" },
        { heure: "09:18", lieu: "5ᵉ étage" },
        { heure: "10:05", lieu: "23ᵉ étage" },
        { heure: "11:22", lieu: "33ᵉ étage" },
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
    videoIntro: null,
    camera: "CAM 33-07 · TRANSMISSION INTERCEPTÉE",
    /* Sous-titres de la vidéo : affichés de `de` à `a` secondes (temps de
     * la vidéo, voix de Barnabé calée à 0,6 s après la neige d'allumage).
     * Le minutage exact est aussi dans assets/video/barnabe-sous-titres.json. */
    sousTitres: [
      { de: 0.6, a: 2.95, texte: "Franchement, vous vous fatiguez pour rien." },
      { de: 3.25, a: 7.0, texte: "Vous croyez vraiment réussir à me coincer dans cette immense tour ?" },
      { de: 7.35, a: 9.1, texte: "Laissez tomber, c'est peine perdue." },
      { de: 9.4, a: 11.5, texte: "Et puis de toute façon, je ne suis même pas là." },
      { de: 11.75, a: 15.05, texte: "Je suis parti souffler un coup, avec un décalage horaire de 7 heures." },
      { de: 15.25, a: 20.4, texte: "Tellement violent que j'ai presque l'impression de contempler les hauteurs de cette immense tour." },
      { de: 20.8, a: 22.8, texte: "Bref, matané, comme on dit chez moi !" },
      { de: 23.0, a: 26.6, texte: "Inutile de chercher, vous n'avez aucune chance !" },
    ],
    videoDetruite: "Transmission autodétruite.",
    boutonApresVideo: "Voir le rapport",
    videoBloquee: "La vidéo ne démarre pas ?",
    videoToucher: "Touchez pour lancer la vidéo",

    /* Rapport affiché après la vidéo : des indices à toucher pour les
     * analyser (recto : ce qu'on a vu ou entendu ; verso : la piste). */
    rapportTitre: "Rapport d'analyse",
    rapport: "Barnabé s'est enfui, mais le colis est caché à cet étage, dans une pièce qui a le nom de la ville où il se repose. Touchez chaque indice pour l'analyser.",
    /* Anti-triche : rien n'est dévoilé avant le bon code. */
    regleEtage: "Restez groupés près de l'ascenseur : interdit d'explorer l'étage tant que le code n'est pas validé.",
    indices: [
      { titre: "Le décalage horaire", recto: "« Un décalage horaire de 7 heures. »", verso: "Chez lui, il est 7 heures de plus qu'ici : direction l'Est, très loin." },
      { titre: "La tour géante", recto: "Derrière lui, une tour immense et très fine domine la ville.", verso: "Plus de 600 mètres : une des plus hautes tours du monde. Zoomez sur sa silhouette." },
      { titre: "Le mot de la fin", recto: "« Matané, comme on dit chez moi ! »", verso: "Ce n'est pas du français… C'est « à plus ! » dans sa langue." },
      { titre: "Le pyjama", recto: "Barnabé est déjà en pyjama.", verso: "Ici c'est l'après-midi ; chez lui, c'est déjà l'heure d'aller dormir." },
    ],
    conclusion: "Croisez les indices : le nom de la ville où il s'est enfui est le code.",
    label: "Code de la cachette du colis (5 lettres)",
    bouton: "Valider le code",
    reponses: ["tokyo", "tokio"],
    unEssai: "Attention : 2 erreurs d'affilée et Barnabé pirate votre écran ({duree}).",
    gelSuite: "Ensuite, vous pourrez retenter votre chance.",
    indiceJoker: "La tour de 634 m s'appelle la Skytree. Dans quelle ville se trouve-t-elle ?",

    /* Aide du Père Noël : à la `indiceApres`-ième erreur (5e), une
     * notification arrive et l'aide reste affichée. Filet ultime : après
     * `reponseApres` erreurs, la réponse est donnée. Mettre 0 pour
     * désactiver. */
    indiceApres: 5,
    indiceSecoursTitre: "Le Père Noël vous aide",
    indiceSecours: "Prenez votre téléphone et cherchez ce qu'est la **Sky Tree** : ça vous mènera droit à la solution !",
    indiceNotif: "Ho ho ho ! Prenez votre téléphone et cherchez ce qu'est la Sky Tree : ça vous mènera droit à la solution.",
    reponseApres: 8,
    reponseSecoursTitre: "Le Père Noël vous aide",
    reponseSecours: "Le code de la cachette est **TOKYO**. Saisissez-le vite !",

    /* Après TOKYO : le Père Noël écrit à l'équipe (bulles de messagerie,
     * avec « … » de frappe entre deux messages), puis l'appel. */
    santaChat: [
      "Bien joué l'équipe ! Je suis en train d'écrire la lettre de licenciement de Barnabé sur-le-champ. Il va finir à Pôle emploi !",
      "Bon, vous avez trouvé la bonne salle. Rendez-vous à la salle Tokyo, mais attention, n'ouvrez surtout pas la porte, on ne sait jamais. Appelez-moi avant d'entrer.",
    ],
    santaNom: "Le Père Noël",
    santaStatut: "en ligne",
    boutonAppel: "Appeler",

    /* Appel du Père Noël (MP3 fourni, voix ElevenLabs) et ses sous-titres,
     * affichés de `de` à `a` secondes du message. */
    audio: "assets/audio/pere-noel-appel.mp3",
    appelEnCours: "Appel en cours…",
    appelNom: "Le Père Noël",
    appelTermine: "Appel terminé",
    messageVocalSousTitres: [
      { de: 0, a: 1.8, texte: "(Toc toc toc)" },
      { de: 1.9, a: 4.1, texte: "C'est bon… vous pouvez entrer." },
      { de: 4.1, a: 7.4, texte: "Mais restez sur le fil avec moi…" },
      { de: 7.4, a: 9.3, texte: "Ah… merde." },
      { de: 9.3, a: 12.9, texte: "En fait… je viens de me rendre compte que Barnabé a été vicieux." },
      { de: 12.9, a: 16.7, texte: "Il a dissimulé le colis parmi plusieurs paquets !" },
      { de: 16.7, a: 19.2, texte: "Ne bougez surtout pas." },
      { de: 19.2, a: 22.4, texte: "Bon, écoutez : vous choisissez un paquet au hasard." },
      { de: 22.4, a: 25.6, texte: "Interdiction absolue de les tâter ou de tricher." },
      { de: 25.6, a: 31.0, texte: "Vous le prenez, vous redescendez en vitesse à La Verrière, et on découvrira ce qu'il y a dedans…" },
      { de: 31.0, a: 32.5, texte: "Pourvu que ce soit le bon !" },
      { de: 32.5, a: 36.0, texte: "Et interdiction formelle de l'ouvrir avant d'être revenus à La Verrière." },
      { de: 36.0, a: 40, texte: "Bon, je vous laisse, j'ai un rencard amoureux. Hop hop hop !" },
    ],
    /* Texte complet (affiché si le son est coupé). */
    messageVocal:
      "C'est bon… vous pouvez entrer. Mais restez sur le fil avec moi… Ah… merde. En fait… je viens de me rendre compte que Barnabé a été vicieux. Il a dissimulé le colis parmi plusieurs paquets ! Ne bougez surtout pas. Bon, écoutez : vous choisissez un paquet au hasard. Interdiction absolue de les tâter ou de tricher. Vous le prenez, vous redescendez en vitesse à La Verrière, et on découvrira ce qu'il y a dedans… Pourvu que ce soit le bon ! Et interdiction formelle de l'ouvrir avant d'être revenus à La Verrière. Bon, je vous laisse, j'ai un rencard amoureux. Hop hop hop !",
    boutonRaccrocher: "Raccrocher",

    /* Aperçu organisateurs (mode test) : les paquets de la salle Tokyo. */
    paquets: {
      nombre: 6,
      couleur: "red",
      vrai: 4,
      texte: "**6 paquets identiques** (même papier rouge, même ruban blanc, même taille) sont posés dans la salle Tokyo. **Un seul** contient le vrai colis.",
      consignes: [
        "Marquez le vrai colis discrètement (par exemple sous le paquet) : les équipes ne doivent pas pouvoir le repérer.",
        "Prévoyez au moins un paquet par équipe, plus quelques-uns en réserve.",
        "Les équipes redescendent à La Verrière avec leur paquet sans l'ouvrir : l'ouverture se fait tous ensemble.",
      ],
    },

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

    /* Écran de fin : grand titre, Père Noël en 3D, consigne en petit. */
    finTitre: "Mission presque accomplie, descendez à La Verrière !",
    /* Bulles du spectacle de fin (Père Noël et lutins). */
    finBulles: [
      { qui: "Le Père Noël", texte: "Et pour Barnabé… c'est direction Pôle Emploi, sur-le-champ !" },
      { qui: "Un lutin", texte: "Et pour nous, c'est la prime vacances qui nous attend !" },
    ],
    finTexte: "",
    finBravo: "Bravo {equipe} !",
    finConsigne: "Avec votre paquet, le plus vite possible. Interdiction de l'ouvrir avant !",
  },
};

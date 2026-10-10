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
    titre: "Le message codé",
    intro:
      "Au coin café, le lutin a griffonné un message sur une serviette en papier… dans un alphabet secret ! Heureusement, il a aussi oublié sa grille de décodage.",
    boutonIntro: "Découvrir le message",
    consigne: "Déchiffrez le message mystère à l'aide de la grille de décodage.",
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
    reussiteTexte:
      "« La clé du mystère est le verre » : le lutin ne pensait pas que vous sauriez lire son alphabet secret !",
    reussiteApresGelTitre: "Le gel est levé !",
    reussiteApresGelTexte:
      "Le lutin vous souffle la solution : « LA CLÉ DU MYSTÈRE EST LE VERRE ». Vous pouvez poursuivre l'aventure !",
    bouton2: "Découvrir la suite",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 3 — LE DÉFI PHOTO (23ᵉ étage)                                 */
  /* ------------------------------------------------------------------ */
  photos: {
    titre: "Le défi photo",
    avertissementTitre: "Attention !",
    avertissement:
      "Le Lutin Farceur est particulièrement capricieux aujourd'hui… Même si votre photo est parfaite, il se peut qu'il la refuse juste pour le plaisir de vous faire recommencer !",
    intro:
      "Bienvenue au 23ᵉ étage ! Le lutin adore les photos de groupe. Choisissez 3 modèles parmi les 6, puis reproduisez-les avec toute votre équipe.",
    consentement:
      "En validant vos photos, vous acceptez qu'elles soient transmises aux organisateurs du Gobinous Christmas Club.",
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
    choixAide: "Touchez un modèle pour le choisir, puis prenez la photo.",
    choixCompteur: "{n} sur {max} choisis",
    boutonPhoto: "Prendre la photo",
    boutonRetenter: "Retenter",
    boutonValider: "Valider cette photo",
    photoValidee: "Photo validée",
    erreurPhoto: "Impossible de lire cette photo. Réessayez.",
    envoiOk: "Envoyée aux organisateurs",
    envoiAttente: "Sera envoyée dès que le réseau le permet",
    rejetTitre: "Refusé !",
    rejetTexte:
      "Le Lutin est d'humeur capricieuse et exige que vous repreniez cette photo avec encore plus de passion !",
    rejetBouton: "On la refait !",
    boutonQuete: "Valider la Quête 3",

    reussiteTitre: "Défi photo réussi !",
    reussiteTexte: "Quelle équipe de comédiens ! Vos 3 photos sont dans la boîte.",
    bouton: "Découvrir la suite",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 4 — L'ENQUÊTE DU SUPPORT 44 (20ᵉ étage)                       */
  /* 4 modules successifs. Choix : `reponse` = lettre ; saisie :         */
  /* `reponses` = liste des réponses acceptées.                          */
  /* ------------------------------------------------------------------ */
  enquete: {
    titre: "L'enquête du Support 44",
    terminalTitre: "Terminal de sécurité du Support 44",
    intro:
      "Bienvenue au 20ᵉ étage. C'est ici que le suspect a été aperçu pour la dernière fois. Le terminal de sécurité a verrouillé son dossier d'accès. Pour découvrir son identité complète et localiser le Cadeau Officiel, vous devez décoder un à un les 4 modules de sa fiche de sécurité.",
    boutonIntro: "Lancer l'investigation",
    erreur: "Données incorrectes. Il vous reste {n} essai !",
    moduleValide: "Module validé",
    moduleForce: "Le terminal a validé ce module automatiquement.",
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
        indiceJoker: "Pour D : quelle année étions-nous l'an dernier ?",
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
          "🎄 + 🎄 = 38",
          "⭐ + 🎄 = 28",
          "🎁 − ⭐ = 15",
          "🎄 = 19",
          "🔔 + ⭐ = 14",
          "❄️ − 🔔 = 17",
          "🔔 = 5",
          "🧦 + 🔔 = 19",
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
    reussiteTexte: "Identité confirmée. Le terminal active le GPS du badge…",
    bouton: "Localiser le badge",
  },

  /* ------------------------------------------------------------------ */
  /* QUÊTE 5 — LA TRAQUE DU 33ᵉ ÉTAGE                                    */
  /* ⚠ Règle d'or : aucun texte affiché avant la validation de TOKYO ne */
  /*   doit contenir les mots « salle » ou « porte ».                   */
  /* ------------------------------------------------------------------ */
  traque: {
    titre: "La traque finale",
    avertissementTitre: "Attention : transmission à usage unique !",
    avertissement:
      "L'une des caméras de surveillance a intercepté un message vidéo de Barnabé SIX-SEVEN. Regroupez votre équipe, montez le son : vous ne pourrez visionner cette vidéo QU'UNE SEULE FOIS ! Une fois lue, elle s'autodétruira.",
    boutonVideo: "Lancer la vidéo (lecture unique)",

    /* Fichier vidéo (MP4), par exemple "assets/video/barnabe.mp4".
     * Laissez "" : une transmission simulée de 35 secondes (sous-titres
     * ci-dessous) la remplace. */
    video: "",
    camera: "CAM 33-07 · TRANSMISSION INTERCEPTÉE",
    sousTitres: [
      { de: 0, a: 7, accessoire: "🎁", texte: "Ha ha ha ! Coucou le Support 44 ! Vous cherchez ce gros sac ? Trop tard, le Cadeau Officiel est avec moi !" },
      { de: 7, a: 16, accessoire: "☕🌸 +7h", texte: "Regardez mon mug : +7h, et ces jolies fleurs… Demain, mon petit-déjeuner, je le prends de l'autre côté du monde !" },
      { de: 16, a: 27, accessoire: "💻 634 m", texte: "Et ça, sur mon écran ? Une tour de télécom de 634 mètres. Ces vitres panoramiques ? Du savoir-faire Saint-Gobain, évidemment !" },
      { de: 27, a: 35, accessoire: "👋", texte: "Si vous inversez le temps et l'histoire, vous trouverez le code. Allez, K-Y-O tout le monde !" },
    ],
    videoDetruite: "Transmission autodétruite.",

    rapportTitre: "Rapport d'analyse de la transmission (repaire secret)",
    rapport:
      "Le signal vidéo s'est coupé. Les analystes ont retranscrit les indices : Barnabé s'est retranché au 33ᵉ étage dans une pièce dont le nom est une destination emblématique.",
    indices: [
      "Son terminal vit à l'heure du fuseau UTC+9 (+7h par rapport à Paris).",
      "Sa base est dans une mégapole abritant la tour de télécom de 634 m vitrée par Saint-Gobain.",
      "Son nom (5 lettres) est l'anagramme et l'inverse des syllabes de l'ancienne capitale historique (K Y O - T O).",
    ],
    conclusion: "Recoupez ces indices pour trouver le nom de son QG.",
    label: "Entrez le code du repaire de Barnabé (5 lettres) :",
    bouton: "Valider le code",
    reponses: ["tokyo"],
    unEssai: "Un seul essai ! En cas d'erreur, tout est gelé {duree}.",
    gelTexte: "Code erroné ! Le terminal se verrouille. Patientez, puis retentez votre chance…",
    indiceJoker: "La tour de 634 m s'appelle la Skytree. Dans quelle ville se trouve-t-elle ?",

    /* Après TOKYO : le lutin démasqué, puis le faux appel. */
    trouve:
      "What the fuck ? Vous m'avez retrouvé si vite ?! Bon, j'avoue, vous êtes des goats ! GG la team, je m'avoue vaincu. Mon QG secret est bien la SALLE TOKYO au 33ᵉ étage ! 🛑 ATTENTION : NE PAS OUVRIR LA PORTE TOUT DE SUITE ! J'ai piégé la pièce, j'ai installé un système de désamorceur… Il faut impérativement m'appeler avant d'entrer !",
    boutonAppel: "📞 Appeler Barnabé",

    /* Message vocal (MP3), par exemple "assets/audio/barnabe.mp3".
     * Laissez "" : le téléphone lit le texte ci-dessous avec sa voix de
     * synthèse, sous-titres à l'écran. */
    audio: "",
    appelEnCours: "Appel en cours…",
    appelNom: "Barnabé SIX-SEVEN",
    messageVocal:
      "MDR. Vous vous êtes arrêtés devant la porte en attendant que je « désactive la bombe » ?! Tellement naïfs, vous me régalez ! Bref, le speedrun est presque fini. Mais comme je suis un lutin de qualité, j'ai disséminé plein de paquets partout dans la pièce. Le problème ? Ils sont tous identiques. Seul un paquet est le VRAI Cadeau Officiel. Interdiction STRICTE de les déballer ici, sinon c'est la disqualification immédiate. Chopez-en un à l'aveugle, ne dites rien à personne et foncez au point de départ. On se capte en bas (ou pas) ! Ciao !",
    boutonRaccrocher: "Raccrocher",

    finTitre: "Mission accomplie (ou presque…)",
    finTexte:
      "Prenez un paquet au hasard dans la Salle Tokyo, ne l'ouvrez surtout pas, et redescendez le plus vite possible au point de départ où on vous attend !\n\nLe jeu est terminé pour l'application. Bon courage pour la descente !",
  },
};

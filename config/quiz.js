/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — QUÊTE 1 : LE GRAND QUIZ
 * ---------------------------------------------------------------------
 * Chaque thème contient 8 questions :
 *   - questions 1 à 7 : 3 propositions ;
 *   - question 8 (plus difficile) : 4 propositions.
 *
 * Champs d'une question :
 *   question    : texte de la question
 *   choix       : liste des propositions, dans l'ordre A, B, C (, D)
 *   reponse     : lettre de la bonne réponse ("A", "B", "C" ou "D")
 *   aVerifier   : (facultatif) note interne visible uniquement dans le
 *                 mode test et dans `npm run check`.
 *
 * Les réponses ne sont pas corrigées question par question : l'équipe
 * découvre son score et la correction seulement après les 8 questions.
 * Un thème joué (réussi ou raté) ne peut plus être rejoué.
 *
 * Thème mystère : avec `mystere: true`, la carte du thème affiche
 * `titreMystere` ; le vrai titre n'est révélé qu'une fois le thème choisi.
 *
 * La bonne réponse n'est jamais affichée aux participants avant qu'ils
 * l'aient sélectionnée. Attention : le site étant statique, ce fichier
 * reste consultable par une personne qui ouvrirait le code source.
 *
 * Icônes disponibles pour les thèmes : "sapin", "miroir", "tour",
 * "materiaux", "flocon", "etoile", "cadeau", "mystere".
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.quiz = {
  titre: "Quiz Givré",
  intro:
    "Barnabé ne parle qu'aux vrais Gobinous. Prouvez-le : choisissez un thème et répondez aux 8 questions **sans faute (8/8)**. Vous avez **2 thèmes** pour réussir. Récompense : le premier indice de sa piste.",
  boutonIntro: "Choisir un thème",

  textes: {
    choixTitre: "Choisissez votre thème",
    choixAide: "Score et correction à la fin des 8 questions.",
    tentatives: "Thèmes ratés : {n} sur {max}. Dernière chance !",
    themeEchoue: "Fermé",
    themeJoue: "Joué",
    voirCorrection: "Voir la correction",
    correctionTitre: "La correction",
    votreReponse: "Votre réponse",
    bonneReponse: "Bonne réponse",
    questionPrecedente: "Question précédente",
    questionSuivante: "Question suivante",
    validerTout: "Valider mes 8 réponses",
    confirmTitre: "Valider vos réponses ?",
    confirmTexte: "Plus de retour en arrière possible sur ce thème.",
    confirmOui: "Oui, voir notre score",
    confirmNon: "Relire mes réponses",
    changerTheme: "Abandonner ce thème",
    abandonTitre: "Abandonner ce thème ?",
    abandonTexte: "Il comptera comme un thème raté.",
    abandonTexteBlocage:
      "Il comptera comme un thème raté : tout gèlera pendant {minutes}, puis vous passerez à la suite.",
    abandonConfirmer: "Abandonner le thème",
    abandonAnnuler: "Continuer ce thème",
    resultatScore: "{score} bonne(s) réponse(s) sur {total}",
    echecTitre: "Raté, de peu !", // 6 ou 7 bonnes réponses
    echecTitreLoin: "Pas cette fois !", // 5 bonnes réponses ou moins
    echecTexte: "Ce thème est fermé. Deuxième chance : choisissez-en un autre !",
    echecAvertissement: "Si le prochain est raté, tout gèle pendant {minutes}.",
    echecBlocage: "Deuxième thème raté : tout gèle pendant {minutes}, puis le lutin vous laisse passer.",
    boutonAutreTheme: "Choisir un autre thème",
    boutonMinuteur: "Voir le minuteur",
    bloqueTitre: "Tout est gelé !",
    bloqueSuite: "Ensuite, le quiz sera validé d'office.",
    bloqueCompteur: "Suite de l'aventure dans",
    reussiteTitre: "Quiz réussi !",
    reussiteTexte: "Barnabé n'en revient pas. Le premier indice de sa piste est à vous !",
    reussiteApresGelTitre: "Le gel est levé !",
    reussiteApresGelTexte: "Le quiz est validé : votre premier indice est débloqué.",
    boutonIndice: "Voir le 1er indice",
    revelationBouton: "C'est parti !",
  },

  /* Après le quiz : deviner l'étage de la quête 2.
   * Une mauvaise réponse gèle le jeu (parametres.penalites.etage), puis
   * l'indice bonus apparaît. */
  etage: {
    titre: "Le premier indice",
    indice:
      "Votre prochaine destination : l'étage du mur végétal Saint-Gobain, de la pause café avec vue sur la Tour Eiffel et de l'équipe Recrutement.",
    question: "Quel est cet étage ?",
    label: "Numéro de l'étage",
    bouton: "Valider l'étage",
    reponses: ["5", "5e", "5eme", "5ieme", "cinq", "cinquieme"],
    erreur: "Mauvaise réponse !",
    gelTitre: "Givré !",
    gelSuite: "Ensuite, le lutin vous donnera l'étage.",
    gelPasse: "Le lutin a eu pitié : c'était le **5ᵉ étage** !",
    bonusTitre: "Indice bonus",
    bonus: "Rendez-vous à l'étage 3 + 2 !",
  },

  themes: [
    {
      id: "noel",
      titre: "Noël",
      icone: "sapin",
      questions: [
        {
          question:
            "Dans quel pays les enfants déposent-ils traditionnellement leurs chaussures sur le rebord d'une fenêtre pour recevoir des friandises des lutins de Noël ?",
          choix: ["En Islande", "En Norvège", "En Finlande"],
          reponse: "A",
        },
        {
          question:
            "Quel saint est célébré le 6 décembre dans l'Est de la France et en Allemagne ?",
          choix: ["Saint Martin", "Saint Nicolas", "Saint Benoît"],
          reponse: "B",
        },
        {
          question:
            "Quel est le titre du célèbre tube de Noël de Mariah Carey, sorti en 1994 ?",
          choix: ["All I Need for Christmas Is You", "All I Want for Christmas Is You", "All I Wish for Christmas Is You"],
          reponse: "B",
        },
        {
          question:
            "Avant que le rouge ne devienne sa couleur emblématique, dans quelle autre couleur le Père Noël a-t-il notamment été représenté dans certaines illustrations anciennes ?",
          choix: ["Blanc", "Bleu", "Vert"],
          reponse: "C",
        },
        {
          question:
            "Quel personnage du folklore italien apporte traditionnellement des cadeaux aux enfants lors de l'Épiphanie ?",
          choix: ["La Befana", "La Bellanotte", "La Stella d'Oro", "La Signora Bianca"],
          reponse: "A",
        },
        {
          question:
            "Quelle marque a contribué à populariser l'image du Père Noël vêtu de rouge grâce à ses campagnes publicitaires ?",
          choix: ["Pepsi", "Coca-Cola", "Kellogg's", "McDonald's"],
          reponse: "B",
        },
        {
          question:
            "Qui est Rudolph, le célèbre personnage du chant de Noël ?",
          choix: ["Un renne au nez rouge", "Un lutin chargé de fabriquer les jouets", "Le fils du Père Noël", "Un bonhomme de neige qui guide le traîneau"],
          reponse: "A",
        },
        {
          question:
            "Quel cadeau est souvent présenté comme l'un des grands classiques des cadeaux de Noël en France ?",
          choix: ["Le livre", "Le parfum", "Le jeu de société", "Le chocolat"],
          reponse: "A",
        },
      ],
    },
    {
      id: "histoire",
      titre: "L'histoire de Saint-Gobain",
      icone: "miroir",
      questions: [
        {
          question:
            "En quelle année l'histoire de Saint-Gobain a-t-elle commencé ?",
          choix: ["1665", "1789", "1692"],
          reponse: "A",
        },
        {
          question:
            "Quel roi régnait en France lors de la création de la Manufacture royale des glaces à miroirs ?",
          choix: ["Louis XIII", "Louis XIV", "Louis XV"],
          reponse: "B",
        },
        {
          question:
            "Quel célèbre monument royal possède une galerie ornée de miroirs associés à l'histoire de la Manufacture ?",
          choix: ["Le château de Versailles", "Le château de Chambord", "Le palais du Louvre"],
          reponse: "A",
        },
        {
          question:
            "Quel ministre de Louis XIV a soutenu la création de la Manufacture pour concurrencer les verriers vénitiens ?",
          choix: ["Vauban", "Jean-Baptiste Colbert", "Le cardinal de Richelieu"],
          reponse: "B",
        },
        {
          question:
            "Quel était le nom d'origine de l'entreprise à sa création en 1665 ?",
          choix: ["La Compagnie royale du verre", "La Manufacture royale des glaces de France", "La Manufacture royale des glaces à miroirs", "La Société française des matériaux"],
          reponse: "C",
        },
        {
          question:
            "Dans quelle région française la Manufacture s'est-elle installée en 1692, donnant son nom à Saint-Gobain ?",
          choix: ["En Normandie", "En Picardie", "En Alsace", "En Bourgogne"],
          reponse: "B",
        },
        {
          question:
            "Quel savoir-faire a notamment permis à la Manufacture de rivaliser avec les miroirs vénitiens au XVIIᵉ siècle ?",
          choix: ["Le soufflage de verre dans des moules", "Le coulage du verre sur une table pour produire de grandes plaques", "La gravure automatique au laser", "Le moulage du verre à froid"],
          reponse: "B",
        },
        {
          question:
            "D'où vient le nom « Saint-Gobain » ?",
          choix: ["D'un roi français", "D'un moine irlandais du VIIᵉ siècle", "D'un artisan verrier", "D'un ancien mot français"],
          reponse: "B",
        },
      ],
    },
    {
      id: "tour",
      titre: "La Tour Saint-Gobain",
      icone: "tour",
      questions: [
        {
          question:
            "Quelle est la hauteur de la tour Saint-Gobain ?",
          choix: ["135 mètres", "165 mètres", "195 mètres"],
          reponse: "B",
        },
        {
          question:
            "Quel cabinet d'architectes a conçu la tour Saint-Gobain ?",
          choix: ["Valode & Pistre", "Jean Nouvel", "Renzo Piano"],
          reponse: "A",
        },
        {
          question:
            "En quelle année la tour Saint-Gobain a-t-elle été livrée ?",
          choix: ["2016", "2018", "2020"],
          reponse: "C",
        },
        {
          question:
            "Dans quelle commune se trouve la tour Saint-Gobain ?",
          choix: ["Puteaux", "Courbevoie", "Nanterre"],
          reponse: "B",
        },
        {
          question:
            "Combien de niveaux la tour Saint-Gobain compte-t-elle au total ?",
          choix: ["32", "38", "44", "52"],
          reponse: "C",
        },
        {
          question:
            "Plus de combien de matériaux et solutions du groupe Saint-Gobain ont été utilisés dans la construction de la tour ?",
          choix: ["30", "50", "80", "120"],
          reponse: "C",
        },
        {
          question:
            "Quel élément géométrique a inspiré la silhouette de la tour Saint-Gobain ?",
          choix: ["Le prisme hexagonal", "Le rhomboèdre", "Le dodécaèdre", "Le cylindre elliptique"],
          reponse: "B",
        },
        {
          question:
            "Quelle particularité possède une partie du vitrage de la tour Saint-Gobain ?",
          choix: ["Il peut changer de teinte pour contribuer à protéger du soleil", "Il produit de l'électricité grâce à chaque rayon lumineux", "Il se transforme en écran opaque la nuit", "Il récupère l'eau de pluie directement à travers les vitres"],
          reponse: "A",
        },
      ],
    },
    {
      id: "mystere",
      titre: "Culture générale",
      icone: "mystere",
      mystere: true,
      titreMystere: "Thème mystère",
      sousTitreMystere: "Saurez-vous deviner de quoi il s'agit ?",
      revelation: "Surprise ! Le thème mystère est…",
      revelationTexte: "Société, sciences, histoire, cinéma, mode… Tout le monde peut briller !",
      questions: [
        {
          question:
            "Quel droit fondamental des femmes a été inscrit dans la Constitution française le 8 mars 2024 ?",
          choix: ["Le droit à la contraception gratuite pour toutes", "La liberté de recourir à l'interruption volontaire de grossesse (IVG)", "L'égalité salariale obligatoire dans toutes les entreprises"],
          reponse: "B",
        },
        {
          question:
            "Quel animal possède trois cœurs ?",
          choix: ["Le requin", "Le poulpe", "Le crocodile"],
          reponse: "B",
        },
        {
          question:
            "Au sujet de quelle célèbre affaire Émile Zola a-t-il publié son article « J'accuse… ! » en 1898 ?",
          choix: ["L'affaire du collier de la reine", "L'affaire Dreyfus", "Le scandale de Panama"],
          reponse: "B",
        },
        {
          question:
            "Sur quelle planète une journée dure-t-elle environ 243 jours terrestres ?",
          choix: ["Mars", "Vénus", "Jupiter"],
          reponse: "B",
        },
        {
          question:
            "Quelle personnalité décédée en 2024 est entrée au Panthéon le 9 octobre 2025 ?",
          choix: ["Jacques Delors", "Robert Badinter", "Jean-Marie Le Pen", "Bernard Pivot"],
          reponse: "B",
        },
        {
          question:
            "Quel est le premier long-métrage d'animation réalisé par les studios Disney ?",
          choix: ["Pinocchio", "Fantasia", "Blanche-Neige et les Sept Nains", "Dumbo"],
          reponse: "C",
        },
        {
          question:
            "Quel était le véritable prénom de Coco Chanel ?",
          choix: ["Colette", "Gabrielle", "Simone", "Charlotte"],
          reponse: "B",
        },
        {
          question:
            "Quel pays a offert la Statue de la Liberté aux États-Unis ?",
          choix: ["Le Royaume-Uni", "L'Italie", "La France", "L'Espagne"],
          reponse: "C",
        },
      ],
    },
  ],
};

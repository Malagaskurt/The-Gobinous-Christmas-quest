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
 *                 mode test et dans `npm run check`. Supprimez la ligne
 *                 une fois l'information vérifiée.
 *
 * Les réponses ne sont pas corrigées question par question : l'équipe
 * découvre seulement son score à la fin des 8 questions.
 *
 * La bonne réponse n'est jamais affichée aux participants avant qu'ils
 * l'aient sélectionnée. Attention : le site étant statique, ce fichier
 * reste consultable par une personne qui ouvrirait le code source.
 *
 * Icônes disponibles pour les thèmes : "miroir", "tour", "materiaux",
 * "flocon", "etoile", "cadeau".
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.quiz = {
  titre: "Le grand quiz",
  intro:
    "Pour lancer votre aventure, mettez vos connaissances à l'épreuve. Choisissez votre thème et répondez correctement aux huit questions pour débloquer votre premier indice.",
  boutonIntro: "Choisir un thème",

  /* Lieu dont l'indice est débloqué après le quiz (voir config/lieux.js). */
  lieu: "A",

  textes: {
    choixTitre: "Choisissez votre thème",
    choixAide:
      "Répondez aux 8 questions : le score ne s'affiche qu'à la fin. Il faut 8 bonnes réponses sur 8. Un thème raté ne peut plus être rejoué.",
    tentatives: "Tentatives échouées : {n} sur {max} avant blocage",
    themeEchoue: "Fermé",
    questionPrecedente: "Question précédente",
    questionSuivante: "Question suivante",
    validerTout: "Valider mes 8 réponses",
    confirmTitre: "Valider vos réponses ?",
    confirmTexte: "Vous ne pourrez plus les modifier. Il faut 8 bonnes réponses sur 8 pour réussir ce thème.",
    confirmOui: "Oui, voir notre score",
    confirmNon: "Relire mes réponses",
    changerTheme: "Abandonner ce thème",
    abandonTitre: "Abandonner ce thème ?",
    abandonTexte: "Ce thème sera compté comme une tentative échouée et ne pourra plus être rejoué.",
    abandonTexteBlocage:
      "Ce thème sera compté comme une tentative échouée. Attention : le quiz sera alors gelé pendant {minutes}, puis vous passerez à la suite.",
    abandonConfirmer: "Abandonner le thème",
    abandonAnnuler: "Continuer ce thème",
    resultatScore: "{score} bonne(s) réponse(s) sur {total}",
    echecTitre: "Raté, de peu !", // 6 ou 7 bonnes réponses
    echecTitreLoin: "Pas cette fois !", // 5 bonnes réponses ou moins
    echecTexte: "Il fallait 8 bonnes réponses sur 8. Ce thème est désormais fermé : choisissez-en un autre.",
    echecAvertissement: "Attention : un nouvel échec bloquera le quiz pendant {minutes}.",
    echecBlocage: "C'est votre deuxième échec : le quiz est gelé pendant {minutes}. Ensuite, le lutin vous laissera passer à la suite.",
    boutonAutreTheme: "Choisir un autre thème",
    boutonMinuteur: "Voir le minuteur",
    bloqueTitre: "Quiz gelé",
    bloqueTexte: "Deux thèmes ratés : le quiz est gelé. À la fin du compte à rebours, vous passerez directement à la suite de l'aventure.",
    bloqueCompteur: "Suite de l'aventure dans",
    reussiteTitre: "Quiz réussi !",
    reussiteTexte: "8 bonnes réponses sur 8 : votre premier indice est débloqué.",
    reussiteApresGelTitre: "Le gel est levé !",
    reussiteApresGelTexte: "Le lutin a eu pitié de vous : le quiz est validé. Votre premier indice est débloqué.",
    boutonIndice: "Découvrir le premier indice",
  },

  themes: [
    /* ------------------------------------------------------------------ */
    {
      id: "1665",
      titre: "1665, le début de l'aventure",
      icone: "miroir",
      questions: [
        {
          question: "En quelle année l'histoire de Saint-Gobain commence-t-elle ?",
          choix: ["1665", "1692", "1789"],
          reponse: "A",
        },
        {
          question: "Quel roi a fondé la Manufacture royale des glaces à miroirs ?",
          choix: ["François Ier", "Louis XIV", "Louis XVI"],
          reponse: "B",
        },
        {
          question:
            "Quel ministre a encouragé sa création pour concurrencer les miroirs vénitiens ?",
          choix: ["Jean-Baptiste Colbert", "Richelieu", "Turgot"],
          reponse: "A",
        },
        {
          question: "Quelle puissance européenne la Manufacture souhaitait-elle concurrencer ?",
          choix: ["L'Espagne", "La République de Venise", "La Suède"],
          reponse: "B",
        },
        {
          question: "Quel était le nom historique de l'entreprise ?",
          choix: [
            "Manufacture royale des glaces à miroirs",
            "Compagnie française du verre",
            "Manufacture nationale du bâtiment",
          ],
          reponse: "A",
        },
        {
          question:
            "En quelle année un site de production s'est-il installé dans le village de Saint-Gobain, en Picardie ?",
          choix: ["1665", "1692", "1702"],
          reponse: "B",
        },
        {
          question:
            "Quel lieu du château de Versailles est célèbre pour ses miroirs produits par la Manufacture ?",
          choix: ["Le Grand Trianon", "La Galerie des Glaces", "La chapelle royale"],
          reponse: "B",
        },
        {
          question:
            "Quelle innovation de fabrication a contribué à la réputation de la Manufacture au XVIIe siècle ?",
          choix: [
            "Le soufflage du verre dans des moules en plastique",
            "Le coulage du verre sur une table pour former des plaques",
            "L'impression numérique",
            "Le trempage laser",
          ],
          reponse: "B",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "tour",
      titre: "La Tour prend de la hauteur",
      icone: "tour",
      questions: [
        {
          question: "Quelle est la hauteur approximative de la Tour Saint-Gobain ?",
          choix: ["95 mètres", "165 mètres", "280 mètres"],
          reponse: "B",
          aVerifier: "Réponse attendue dans le questionnaire initial. À vérifier avant publication.",
        },
        {
          question: "Dans quelle commune se trouve la Tour Saint-Gobain ?",
          choix: ["Courbevoie", "Versailles", "Saint-Denis"],
          reponse: "A",
        },
        {
          question: "Quels architectes ont conçu la Tour ?",
          choix: ["Jean Nouvel", "Valode & Pistre", "Renzo Piano"],
          reponse: "B",
        },
        {
          question: "En quelle année la Tour a-t-elle été livrée ?",
          choix: ["2015", "2020", "2023"],
          reponse: "B",
          aVerifier: "Réponse attendue dans le questionnaire initial. À vérifier avant publication.",
        },
        {
          question:
            "Plus de combien de produits et solutions Saint-Gobain ont-ils été utilisés dans le projet ?",
          choix: ["20", "50", "80"],
          reponse: "C",
          aVerifier: "Réponse attendue dans le questionnaire initial. À vérifier avant publication.",
        },
        {
          question: "Quelle solution permet de teinter automatiquement certains vitrages ?",
          choix: ["SageGlass", "Placo", "Isover"],
          reponse: "A",
        },
        {
          question: "À quel étage se trouve l'espace Plein-Ciel ?",
          choix: ["Au 12e étage", "Au 27e étage", "Au 37e étage"],
          reponse: "C",
          aVerifier: "Réponse attendue dans le questionnaire initial. À vérifier avant publication.",
        },
        {
          question:
            "La Tour compte 44 niveaux au total. Combien se trouvent au-dessus de la dalle de La Défense selon les informations publiées ?",
          choix: ["32", "38", "42", "44"],
          reponse: "B",
          aVerifier: "Réponse attendue dans le questionnaire initial. À vérifier avant publication.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "materiaux",
      titre: "Matériaux, mode d'emploi",
      icone: "materiaux",
      questions: [
        {
          question: "Quelle est la raison d'être de Saint-Gobain ?",
          choix: [
            "Making the World a Better Home",
            "Building the Fastest Cities",
            "Creating a World Without Glass",
          ],
          reponse: "A",
        },
        {
          question: "À quoi sert un vitrage de contrôle solaire ?",
          choix: [
            "À produire de la lumière artificielle",
            "À limiter une partie des apports de chaleur du soleil",
            "À remplacer la structure d'un bâtiment",
          ],
          reponse: "B",
        },
        {
          question: "À quoi sert un vitrage acoustique ?",
          choix: [
            "À réduire la transmission du bruit",
            "À changer automatiquement la couleur d'une pièce",
            "À produire de l'électricité",
          ],
          reponse: "A",
        },
        {
          question: "Comment fonctionne SageGlass ?",
          choix: [
            "Avec un film opaque posé manuellement",
            "Grâce à une technologie électrochrome qui permet de contrôler la teinte du vitrage",
            "En remplaçant automatiquement les fenêtres selon la météo",
          ],
          reponse: "B",
        },
        {
          question: "Quel est l'objectif de Saint-Gobain concernant la neutralité carbone ?",
          choix: [
            "Atteindre le zéro émission nette en 2030",
            "Atteindre le zéro émission nette en 2050",
            "Arrêter toute production de matériaux en 2040",
          ],
          reponse: "B",
          aVerifier:
            "Réponse attendue dans le questionnaire initial. À vérifier selon la formulation officielle actuelle.",
        },
        {
          question:
            "Dans combien de pays Saint-Gobain est-il présent selon la présentation officielle retenue ?",
          choix: ["41", "61", "81"],
          reponse: "C",
          aVerifier:
            "Réponse attendue dans le questionnaire initial. À vérifier selon les chiffres officiels actuels.",
        },
        {
          question: "À quoi sert l'isolation thermique ?",
          choix: [
            "À limiter les transferts de chaleur",
            "À accélérer l'entrée d'air extérieur",
            "À augmenter la quantité de lumière",
          ],
          reponse: "A",
        },
        {
          question:
            "Selon la documentation SageGlass, quelle réduction de la consommation énergétique globale le vitrage peut-il permettre dans certaines applications ?",
          choix: ["Jusqu'à 5 %", "Jusqu'à 20 %", "Jusqu'à 45 %", "Jusqu'à 70 %"],
          reponse: "B",
          aVerifier:
            "NE PAS UTILISER EN PRODUCTION sans avoir vérifié la source, le chiffre exact et son contexte (réponse issue du questionnaire initial).",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "noel",
      titre: "Le Noël des givrés",
      icone: "flocon",
      questions: [
        {
          question:
            "Dans quel pays les enfants déposent-ils traditionnellement leurs chaussures en attendant la visite des Yule Lads ?",
          choix: ["En Islande", "Au Portugal", "En Grèce"],
          reponse: "A",
        },
        {
          question:
            "Dans quel pays la tradition de la couronne de l'Avent s'est-elle particulièrement développée au XIXe siècle ?",
          choix: ["En Allemagne", "En Australie", "Au Brésil"],
          reponse: "A",
        },
        {
          question: "Combien de Yule Lads compte la tradition islandaise ?",
          choix: ["7", "13", "24"],
          reponse: "B",
        },
        {
          question:
            "Quel personnage folklorique italien apporte des friandises ou des cadeaux autour du 6 janvier ?",
          choix: ["La Befana", "La Befaneuse", "La Regina delle Nevi"],
          reponse: "A",
        },
        {
          question: "Combien de bougies comporte généralement une couronne de l'Avent moderne ?",
          choix: ["2", "4", "12"],
          reponse: "B",
        },
        {
          question:
            "À partir de quelle date les Yule Lads commencent-ils à arriver, un par nuit avant Noël ?",
          choix: ["Le 1er décembre", "Le 12 décembre", "Le 24 décembre uniquement"],
          reponse: "B",
        },
        {
          question: "Au Japon, le soir de Noël est-il généralement un jour férié national ?",
          choix: [
            "Oui",
            "Non, c'est généralement un jour ouvré normal",
            "Oui, avec douze jours de fermeture obligatoire",
          ],
          reponse: "B",
        },
        {
          question:
            "Combien de bougies comportait la couronne de l'Avent originale créée par Johann Hinrich Wichern au XIXe siècle ?",
          choix: ["4", "12", "24", "31"],
          reponse: "C",
        },
      ],
    },
  ],
};

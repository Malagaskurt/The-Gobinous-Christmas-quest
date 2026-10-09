/* =====================================================================
 * GOBINOUS CHRISTMAS QUEST — PARAMÈTRES GÉNÉRAUX
 * ---------------------------------------------------------------------
 * Ce fichier regroupe les réglages du jeu. Modifiez uniquement les
 * valeurs situées après les deux-points (:), en conservant les
 * guillemets, les virgules et les accolades.
 *
 * Après modification : rechargez la page. Pour vérifier qu'aucune
 * erreur de saisie ne s'est glissée dans la configuration, lancez
 * `npm run check` (voir README.md).
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.parametres = {
  /* Nom de la sauvegarde dans le navigateur.
   * Changer cette valeur repart d'une partie vierge sur tous les
   * téléphones (utile entre une répétition et le jour J, ou pour une
   * nouvelle édition). */
  cleSauvegarde: "gobinous-quest-2026-v2",

  /* ---- Quête 1 : le grand quiz -------------------------------------- */
  quiz: {
    /* Nombre de thèmes échoués avant le blocage du quiz. */
    tentativesAvantBlocage: 2,

    /* Durée du blocage, en secondes. */
    dureeBlocageSecondes: 50,

    /* true → à la fin du blocage, le quiz est validé d'office : l'équipe
     * n'a plus à répondre et passe directement à l'indice du lieu A.
     * false → à la fin du blocage, l'équipe choisit un nouveau thème. */
    valideApresBlocage: true,

    /* Les réponses ne sont pas corrigées question par question : l'équipe
     * découvre son score à la fin des 8 questions. Il faut 8/8 pour
     * valider un thème ; un thème raté ne peut plus être rejoué (sauf si
     * tous les thèmes ont été ratés). */
  },

  /* ---- Gel après une mauvaise réponse (quêtes 2, 3 et 4) -----------
   * Chaque mauvaise réponse à l'énigme (quête 2), au défi (quête 3) ou à
   * l'énigme finale (quête 4) gèle la saisie pendant dureeSecondes, avec
   * un compte à rebours. L'équipe peut ensuite retenter.
   * La saisie des lieux et des codes n'est pas concernée. */
  gel: {
    actif: true,
    dureeSecondes: 50,
  },

  /* ---- Chrono global -------------------------------------------------
   * Compte à rebours affiché en haut de l'écran pendant toute la partie.
   * Il démarre au bouton « C'est parti ! » et s'arrête à la fin de
   * l'aventure. Une fois écoulé, il affiche le dépassement (+00:42) mais
   * ne bloque pas le jeu. */
  chrono: {
    actif: true,
    dureeMinutes: 30,
  },

  /* ---- Le lutin -------------------------------------------------------
   * Mascotte en pixel art : il se promène de temps en temps sous l'en-tête
   * et commente certaines étapes (textes dans config/textes.js → lutin).
   * promenadeSecondes : intervalle moyen entre deux promenades. */
  lutin: {
    actif: true,
    promenadeSecondes: 50,
  },

  /* ---- Lieux et QR codes -------------------------------------------- */
  lieux: {
    /* true  → après avoir trouvé un lieu, l'équipe doit scanner le QR code
     *         (ou saisir le code inscrit dessous) pour débloquer la quête
     *         suivante.
     * false → un bouton « Nous sommes arrivés » remplace le QR code
     *         (pratique si les QR codes ne sont pas imprimés). */
    scanObligatoire: true,
  },

  /* ---- Réponses saisies au clavier (énigmes, lieux) ------------------
   * Les majuscules, accents, apostrophes, tirets et articles en début de
   * réponse (« le », « la », « l' »…) sont toujours ignorés.
   * toleranceFautes : nombre de fautes de frappe acceptées pour les
   * réponses d'au moins 6 lettres (0 pour désactiver). Les réponses
   * contenant des chiffres doivent toujours être exactes. */
  reponses: {
    toleranceFautes: 1,
  },

  /* ---- Adresse publique du site --------------------------------------
   * Adresse définitive du site une fois en ligne, par exemple
   * "https://gobinous-quest.example.com/". Elle sert à générer les URL
   * des QR codes. Laissez vide pour utiliser l'adresse actuelle. */
  urlPublique: "",

  /* ---- Éléments de marque --------------------------------------------
   * Logo Saint-Gobain en deux versions monochromes, extraites du fichier
   * fourni par l'organisation :
   *   logoClair : version blanche, sur les fonds tricotés bleus ;
   *   logoFonce : version bleu foncé, sur les fonds clairs.
   * Pour utiliser un fichier officiel (SVG de préférence), déposez-le
   * dans assets/img/ et remplacez les chemins. Laissez vide pour masquer
   * le logo. */
  marque: {
    logoClair: "assets/img/logo-saint-gobain-blanc.png",
    logoFonce: "assets/img/logo-saint-gobain-bleu.png",
    logoAlt: "Saint-Gobain",
  },

  /* ---- Fin de partie -------------------------------------------------
   * La partie passe à l'état « Aventure terminée » :
   *   - lorsqu'un organisateur saisit codeOrganisateur sur le téléphone
   *     de l'équipe (bouton discret sur l'écran final) ;
   *   - ou, si qrFinalActif vaut true, lorsque l'équipe scanne le QR code
   *     du lieu final (voir config/lieux.js). Conservez alors ce QR code
   *     en main plutôt que de l'afficher librement.
   * Laissez codeOrganisateur vide pour désactiver la saisie du code. */
  finDePartie: {
    codeOrganisateur: "HOTTE2026", // ⚠ À PERSONNALISER avant l'événement
    qrFinalActif: true,
  },

  /* ---- Mode test organisateur ----------------------------------------
   * Accès : ajoutez #/organisateur à l'adresse du site.
   * Ce mode permet de naviguer entre les quêtes, d'afficher les bonnes
   * réponses, de simuler les QR codes, de tester le blocage du quiz et
   * de remettre une partie à zéro.
   *
   * ⚠ AVANT L'ÉVÉNEMENT : passez actif à false, ou au minimum changez le
   * code. Ce code protège seulement contre une ouverture accidentelle :
   * il reste lisible par toute personne qui consulte le code source. */
  modeTest: {
    actif: true,
    code: "1225", // ⚠ À PERSONNALISER
    /* Durée du blocage du quiz et du gel des quêtes quand l'option
     * « Blocage court » est cochée dans le mode test, en secondes. */
    dureeBlocageCourtSecondes: 15,
  },
};

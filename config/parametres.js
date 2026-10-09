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
  cleSauvegarde: "gobinous-quest-2026",

  /* ---- Quête 1 : le grand quiz -------------------------------------- */
  quiz: {
    /* Nombre de thèmes échoués avant le blocage du quiz. */
    tentativesAvantBlocage: 2,

    /* Durée du blocage, en secondes (180 = 3 minutes). */
    dureeBlocageSecondes: 180,

    /* Nombre d'erreurs tolérées sur un même thème avant que la tentative
     * ne soit considérée comme échouée.
     *   null → illimité : l'équipe peut réessayer chaque question autant
     *          de fois que nécessaire. Un thème n'échoue alors que si
     *          l'équipe l'abandonne (bouton « Changer de thème »).
     *   3    → la 4e erreur sur un thème fait échouer la tentative.
     * ⚠ Si vous changez cette valeur, adaptez la règle n°5 dans
     *   config/textes.js. */
    erreursAutoriseesParTheme: null,
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
   * Le logo officiel n'est pas inclus. Déposez un fichier autorisé dans
   * assets/img/ puis indiquez son chemin, par exemple
   * "assets/img/logo-saint-gobain.svg". Laissez vide pour ne rien
   * afficher. */
  marque: {
    logo: "",
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
    /* Durée du blocage du quiz quand l'option « Blocage court » est
     * cochée dans le mode test, en secondes. */
    dureeBlocageCourtSecondes: 15,
  },
};

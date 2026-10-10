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
  cleSauvegarde: "gobinous-quest-2026-v3",

  /* ---- Quête 1 : le grand quiz -------------------------------------- */
  quiz: {
    /* Nombre de thèmes ratés avant le gel du quiz. */
    tentativesAvantBlocage: 2,

    /* Durée du gel du quiz, en secondes. */
    dureeBlocageSecondes: 45,

    /* true → à la fin du gel, le quiz est validé d'office : l'équipe
     * n'a plus à répondre et passe directement au premier indice. */
    valideApresBlocage: true,
  },

  /* ---- Pénalités des autres étapes ----------------------------------
   * essais       : nombre de réponses possibles avant le gel
   * gelSecondes  : durée du gel (tout est bloqué, sauf les règles)
   * apresGel     : "valider"   → l'étape est validée d'office
   *                "reessayer" → l'équipe peut retenter */
  penalites: {
    /* Après le quiz : deviner l'étage (le gel fait apparaître l'indice
     * bonus). */
    etage: { essais: 2, gelSecondes: 45, apresGel: "valider" },
    /* Quête 2 : le message codé (la solution s'affiche après le gel). */
    message: { essais: 2, gelSecondes: 45, apresGel: "valider" },
    /* Quête 4 : chacun des 4 modules de l'enquête. */
    enquete: { essais: 2, gelSecondes: 45, apresGel: "valider" },
    /* Quête 5 : le code du repaire (un seul essai à chaque fois). */
    repaire: { essais: 2, gelSecondes: 45, apresGel: "reessayer" },
  },

  /* ---- Son : fond musical, voix et effets sonores -------------------
   * noel  : deux petits airs de Noël (boîte à musique) qui s'enchaînent
   *         en fond, libres de droits (tools/generer-musique.py) ;
   * japon : ambiance de la transmission simulée (quête 5), utilisée
   *         seulement si aucune vidéo n'est fournie.
   * volume : fond musical, de 0 (muet) à 1. Volontairement presque
   *          inaudible : même téléphone à fond, ce n'est qu'un fond.
   * volumeVoix : voix de Barnabé et réactions du lutin (1 = normal).
   * effets / volumeEffets : petits sons quand une réponse est validée ou
   * refusée, quand tout gèle, quand un mot secret débloque une quête.
   * Les joueurs peuvent tout couper avec le bouton « Son » en haut de
   * l'écran. */
  musique: {
    actif: true,
    volume: 0.05,
    volumeVideo: 0.12,
    volumeVoix: 1,
    noel: ["assets/audio/musique-noel-1.mp3", "assets/audio/musique-noel-2.mp3"],
    japon: "assets/audio/musique-japon.mp3",
    /* Écran de fin : musique pop-électro dansante (le lutin danse). */
    fete: "assets/audio/musique-fete.mp3",
    volumeFete: 0.4,
    effets: true,
    volumeEffets: 0.45,
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

  /* ---- Suivi des équipes -------------------------------------------
   * Chaque téléphone envoie régulièrement sa progression au serveur du
   * jeu (npm start). Les organisateurs la consultent sur le tableau de
   * bord #/suivi et peuvent réinitialiser une équipe à distance.
   * Le code d'accès au tableau de bord est défini côté serveur (variable
   * CODE_SUIVI, voir README.md) : il n'apparaît pas dans ce fichier.
   * Sans serveur (hébergement statique), le jeu fonctionne normalement,
   * sans suivi.
   *   actif               : false pour désactiver complètement le suivi
   *   urlServeur          : adresse du serveur si le site est hébergé
   *                         ailleurs ("" = même adresse que le site)
   *   intervalleSecondes  : fréquence d'envoi de la progression */
  suivi: {
    actif: true,
    urlServeur: "",
    intervalleSecondes: 10,
  },

  /* ---- Le lutin -------------------------------------------------------
   * Mascotte en pixel art : il se promène de temps en temps sous l'en-tête
   * et commente certaines étapes (textes dans config/textes.js → lutin).
   * promenadeSecondes : intervalle moyen entre deux promenades. */
  lutin: {
    actif: true,
    promenadeSecondes: 50,
  },

  /* ---- Réponses saisies au clavier ----------------------------------
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
   * "https://gobinous-quest.example.com/". Elle s'affiche sur les
   * affichettes imprimées. Laissez vide pour utiliser l'adresse actuelle. */
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

  /* ---- Mode test organisateur ----------------------------------------
   * Accès : ajoutez #/organisateur à l'adresse du site.
   * Ce mode permet de naviguer entre les quêtes, d'afficher les bonnes
   * réponses, de simuler l'arrivée aux étages, de raccourcir les gels,
   * d'imprimer les affichettes des mots secrets et de remettre une
   * partie à zéro.
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

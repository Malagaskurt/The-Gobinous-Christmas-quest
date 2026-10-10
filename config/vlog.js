/* =====================================================================
 * LE VLOG DES GOBINOUS — PHOTOS ET VIDÉOS DE L'ÉVÉNEMENT
 * ---------------------------------------------------------------------
 * Rubrique indépendante du programme (#/vlog) : le Gobinous Reporter (et
 * tous les membres) y déposent leurs photos et vidéos. Tous les formats
 * de photos et de vidéos sont acceptés, y compris les vidéos longues.
 * Les fichiers sont stockés par le serveur du jeu (npm start) et
 * récupérables dans le tableau de bord (#/suivi/vlog), un par un ou en
 * archive ZIP.
 * ===================================================================== */
window.GAME_CONFIG = window.GAME_CONFIG || {};

window.GAME_CONFIG.vlog = {
  titre: "Le Vlog des Gobinous",
  bouton: "Le Vlog",
  accroche: "Photos et vidéos de l'événement : déposez tout ici !",
  bulle: "Reporters… et tous les autres, à vous de jouer !",
  texte: "Pas besoin d'être Gobinous Reporter : tout le monde peut déposer ici ses photos et vidéos de l'événement, même les vidéos longues. Tous les formats sont acceptés.",
  nomLabel: "Votre prénom ou nom d'équipe",
  nomPlaceholder: "Ex. : Les Givrés",
  nomErreur: "Indiquez votre prénom ou votre nom d'équipe.",
  boutonGalerie: "Ma galerie",
  boutonCamera: "Photo",
  boutonVideo: "Filmer",
  garderOuvert: "Gardez cette page ouverte pendant l'envoi (surtout pour les longues vidéos).",
  enAttente: "En attente",
  envoi: "Envoi… {pct} %",
  envoye: "Envoyé",
  echec: "Échec",
  reessayer: "Réessayer",
  mesEnvois: "Vos envois",
  aucun: "Rien pour l'instant. À vous de filmer !",
  horsLigne: "Le Vlog a besoin du serveur de l'événement : il n'est pas joignable pour le moment.",
  changerNom: "Changer de nom",
};

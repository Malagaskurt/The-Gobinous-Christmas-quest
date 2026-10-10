# The Gobinous Christmas Club

**Le site de la soirée de Noël · Saint-Gobain.** Une page d'accueil, le programme des temps forts, et pour chacun ce qu'il faut sur le téléphone :

| Adresse | Temps fort | Sur le téléphone |
|---|---|---|
| `#/` | **The Gobinous Christmas Club** | Page d'accueil animée ; un appui (ou glisser vers le haut) ouvre le programme. |
| `#/programme` | **Le programme** | Les 5 temps forts, chacun avec son bouton. |
| `#/quest` | **Gobinous Christmas Quest** | Le grand jeu en équipe (ci-dessous). |
| `#/party` | **Gobinous Christmas Party** | Goûter, déco du sapin et bucket list « Treats & Chill » : 20 défis photo/vidéo qui rapportent des **Gobz**, classement en direct. **Code secret : `2020`** (`config/party.js`). |
| `#/battle` | **Gobinous Christmas Battle** | Simple page d'info : jeux en live, sans téléphone. |
| `#/gift` | **Gobinous Christmas Gift** | Simple page d'info : le Secret Santa (cadeaux numérotés). |
| `#/wrapup` | **Gobinous Christmas Wrap-Up** | Questionnaire de satisfaction anonyme, 5 questions, sans code. |
| `#/suivi` | Organisateurs | Tableau de bord en 3 onglets : équipes de la Quest, défis de la Party, avis du Wrap-Up (indicateurs et export CSV). |

Textes : `config/club.js` (accueil, programme, Battle, Gift), `config/party.js` (code, défis, points), `config/wrapup.js` (questions).

### Christmas Party

- Code secret demandé à l'entrée (donné par les organisateurs au bon moment), puis prénom ou nom d'équipe : on joue en solo ou à plusieurs.
- Le lutin présente le goûter et la déco du sapin Gobinous (polaroïds, kit déco, petits mots), puis la bucket list.
- Chaque défi s'ouvre sur trois choix : **prendre une photo** ou **filmer une vidéo** (appareil intégré avec onglets Photo / Vidéo, son compris, 60 s maximum), ou **choisir dans la galerie** (photo ou vidéo). Aperçu, puis « Valider (+N Gobz) » : la preuve part au serveur avec une barre de progression (vidéos jusqu'à 80 Mo).
- Les **Gobz** sont comptés par le serveur d'après `config/party.js` ; le total, le rang et le classement (top 10) se mettent à jour en direct, sans chrono.
- Côté organisateurs (`#/suivi/party`) : classement, toutes les preuves (photos et vidéos), retrait d'un défi ou d'un joueur, export ZIP.

### Christmas Wrap-Up

- 5 questions maximum, **anonymes** (aucun nom demandé), sans code : étoiles, échelle de 1 à 5, choix, réponse libre ; certaines obligatoires (`obligatoire: true`).
- Une réponse par téléphone, modifiable après envoi.
- Côté organisateurs (`#/suivi/avis`) : nombre de réponses, note moyenne, répartitions en barres, verbatims, **export CSV** (s'ouvre dans Excel).

> **La Party et le Wrap-Up ont besoin du serveur du jeu** (`npm start`, ou hébergement Node.js : voir § 9) pour compter les Gobz, tenir le classement et collecter les avis. Sur un hébergement statique (Netlify Drop…), les défis sont validés sur le téléphone seulement (à montrer aux organisateurs), le classement est masqué et le questionnaire ne peut pas être envoyé.

---

# Gobinous Christmas Quest

**La quête du cadeau disparu.** Le grand jeu de la soirée.

> Le lutin officiel du Gobinous Christmas Club était chargé de livrer l'ultime Cadeau Officiel de Noël dans la Tour Saint-Gobain. Mais sur un coup de tête capricieux, il a décidé d'aller cacher ce cadeau indispensable ! Sans ce sésame, impossible de démarrer la fête ni de lancer la distribution. Les équipes doivent remonter la piste du lutin, étage par étage, pour découvrir son identité et retrouver le précieux coffre caché !

Les équipes de 5 à 10 personnes jouent avec un seul téléphone. Elles résolvent 5 quêtes réparties sur 5 étages. À chaque étage, elles débloquent la quête en saisissant le **mot secret** affiché sur place. Comptez 30 à 45 minutes.

---

## 1. Choix techniques

| Choix | Pourquoi |
|---|---|
| **Site sans framework** : HTML, CSS et JavaScript | Rien à compiler ni à installer, léger sur mobile. Le site reste une seule page fluide : pas de rechargement entre les étapes. |
| **Contenus dans `config/`** | Questions, réponses, étages, mots secrets, textes et paramètres sont séparés du code. On les modifie dans un éditeur de texte. |
| **Sauvegarde dans le navigateur** (`localStorage`) | La partie de chaque équipe reste sur son téléphone : le jeu continue même si le réseau ou le serveur tombe (voir § 7). |
| **Petit serveur Node.js sans dépendance** (`tools/serve.mjs`) | Il sert le site, reçoit la progression des téléphones (**suivi des équipes**) et enregistre les **photos du défi photo** (voir § 6). |
| **Mots secrets plutôt que QR codes** | Pas d'appareil photo à ouvrir ni de page à recharger : l'équipe tape le mot affiché à l'étage et la quête se débloque immédiatement, même avec un réseau instable. |
| **Aucune dépendance réseau externe** | Polices incluses. Aucun appel à Google Fonts, aucun outil de mesure d'audience, aucun cookie. |

Composants tiers inclus : les polices **Montserrat** (remplaçante libre de Gotham) et **VT323** (police « informatique »), sous SIL Open Font License.

### Direction artistique : « Nuit de Noël tricotée »

Une seule direction artistique, de l'écran de chargement jusqu'à la fin :

- **Fond bleu nuit Saint-Gobain** et neige légère qui tombe sur tous les écrans.
- **Tout ce qui est illustré est brodé en mailles** (rendu tricot généré par `js/knit.js`) : titres, pictogrammes des 5 quêtes (quiz, loupe, appareil photo, badge, cadeau), sapins, le lutin et les comptes à rebours géants.
- **Guirlande tricotée** en haut de chaque écran, **cadres écrus à double filet** pour les textes.
- **Récit « machine à écrire »** : les textes qui guident vers l'étage suivant s'écrivent progressivement (un appui les termine).
- **Gel** : quand l'équipe est pénalisée, un givre apparaît sur les bords de l'écran, la saisie disparaît et un compte à rebours tricoté s'affiche. Seul le bouton des règles reste utilisable.
- **Quête 4** : écran de « terminal de sécurité » (texte cyan, lignes de balayage) et badge du suspect qui se complète module après module.
- **Quête 5** : transmission de caméra de surveillance, lutin démasqué, faux appel téléphonique.
- **Règles** : bouton « Règles » bien visible en haut à droite, qui ouvre une page plein écran avec une carte tricotée par règle.
- **Le lutin commente les gels** : une phrase rigolote pendant le gel, et une autre quand il vous laisse passer (« Le lutin a eu tellement pitié de vous… il est trop goat 🐐 »). Phrases dans `config/textes.js` (`lutin.gel` et `lutin.degel`).
- **Son** : petit fond de Noël presque inaudible (boîte à musique), effets sonores (réussite, erreur, gel, déverrouillage). Le lutin réagit par des **bulles** (« GG la team ! », « MDR, raté ! »…), sans voix. Seul Barnabé parle, dans la vidéo et l'appel de la quête 5. Bouton « Son » en haut de l'écran pour tout couper.
- **Décor animé** : guirlande qui clignote, sol enneigé avec sapins, tour de verre, immeubles et voitures qui passent. Fond bleu Saint-Gobain, ponctué de rouge de Noël sur les moments forts (réussites, rôles, lutin démasqué).
- **Pictogrammes pixel maison** (cloche, chaussette, sapin, cadeau…) à la place des émojis du téléphone : écrire `[[bell]]`, `[[sock]]`, `[[tree]]`… dans un texte de configuration.
- **Typographie** : chaque type de titre tricoté a une taille de lettres fixe, quelle que soit la longueur du texte, et tout est centré.
- **Écran de fin** : une page à part, sans en-tête de jeu (ciel étoilé, scène tricotée, bilan de l'équipe, dernières consignes, « Joyeux Noël » et signature de Barnabé).
- **Typographies** : Gotham (repli Montserrat), Arial, et VT323 pour les compteurs et les étiquettes.

---

## 2. Lancer le site en local

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent (aucune installation de paquet nécessaire).

```bash
npm start
```

Puis ouvrez :

- **Jeu** : http://localhost:8080/
- **Mode test organisateur** : http://localhost:8080/#/organisateur (code par défaut : `1225`)
- **Suivi des équipes et photos** : http://localhost:8080/#/suivi (code par défaut : `SUIVI2026`)

Pour choisir le code du suivi : `CODE_SUIVI=MonCodeSecret npm start`.

Pour essayer sur un vrai téléphone, connectez-le au même réseau Wi-Fi que l'ordinateur et ouvrez l'adresse « Réseau » affichée au démarrage. **La prise de photo de la quête 3 et la voix du faux appel fonctionnent mieux sur un vrai téléphone.**

> Sans Node.js : double-cliquez sur `index.html`. Le jeu fonctionne aussi en `file://`, mais sans suivi des équipes ni enregistrement des photos.

---

## 3. Déroulement du jeu

| Étape | Étage · mot secret | Ce que fait l'équipe |
|---|---|---|
| Départ | Hall · `SAPIN` | Accueil, nom d'équipe, puis le lutin demande de nommer un **Chef Lutin** (capitaine) et un **Lutin Reporter** (photos et vidéos des temps forts avec un autre téléphone, à envoyer aux organisateurs via un QR code à la fin). Règles, puis mot secret du hall. |
| **Quête 1 · Quiz Givré** | Hall | Choisit un thème parmi 4 (Noël, Histoire de Saint-Gobain, La Tour Saint-Gobain, **Thème mystère**) et répond aux 8 questions. |
| Premier indice | — | Lit l'indice (effet machine à écrire) et devine l'étage : **5**. |
| **Quête 2 · Code Cristal** | 5ᵉ étage, coin café · `LUTIN` | Déchiffre un message en alphabet Pigpen avec la grille de décodage : « LA CLÉ DU MYSTÈRE EST LE VERRE ». |
| **Quête 3 · Flash Lutin** | 23ᵉ étage, espace matériaux · `GUIRLANDE` | Reproduit 3 des 6 photos modèles avec l'appareil photo du téléphone. |
| **Quête 4 · Dossier 44** | 20ᵉ étage, Support 44 · `ETOILE` | Résout 4 modules de sécurité pour reconstituer le badge du suspect : Barnabé SIX-SEVEN. |
| **Quête 5 · Opération Hotte** | 33ᵉ étage · `CADEAU` | Regarde une vidéo à lecture unique, trouve le repaire (TOKYO), appelle Barnabé, puis redescend avec un paquet. |

**Mots secrets** : insensibles à la casse, aux accents et aux espaces. Un mauvais mot affiche simplement un message, sans pénalité.

**Chrono global** : 30 minutes (`parametres.chrono`), affiché en haut de l'écran. Il démarre au bouton « C'est parti ! » et s'arrête à la fin de l'aventure. Une fois écoulé, il affiche le dépassement mais ne bloque pas le jeu.

**Joker** : un seul par équipe pour toute l'aventure. Le bouton « Utiliser mon joker » apparaît sur le message codé, chaque module de l'enquête et le code du repaire (`indiceJoker` dans `config/quetes.js`).

### Quête 1 : Quiz Givré

- 8 questions par thème, une à la fois. **Aucune correction pendant les questions** : l'équipe peut revenir en arrière et modifier ses choix.
- Après les 8 réponses : le score s'affiche, puis **la correction complète** (« Voir la correction »). Un thème joué ne peut plus être rejoué.
- 8/8 : premier indice. Sinon : une deuxième chance avec un autre thème.
- Deuxième thème raté : **tout est gelé 45 secondes**, puis le quiz est **validé d'office** (premier indice débloqué).
- **Thème mystère** : la carte affiche « Thème mystère » ; le vrai thème (« Culture générale ») n'est révélé qu'une fois choisi.
- **Étage à deviner** : le premier indice s'écrit à l'écran, l'équipe saisit un chiffre. Bonne réponse (5) : validation immédiate. Mauvaise réponse : **givré 10 secondes**, puis un **indice bonus** apparaît (« 3 + 2 ») et l'équipe peut réessayer.

### Quête 2 : Code Cristal (message codé)

- Le message et les 4 grilles de décodage (A-I, J-R avec points, S-V, W-Z avec points) sont **dessinés en SVG** à partir du texte de `config/quetes.js` : modifier `lignes` suffit pour changer le message.
- Réponse tolérante : casse, accents, espaces multiples, « clé » ou « clef ».
- 1ʳᵉ erreur : « Phrase incorrecte. Il vous reste 1 essai ! ». 2ᵉ erreur : **gel de 50 secondes**, puis la solution s'affiche et l'équipe passe à la suite.

### Quête 3 : Flash Lutin (défi photo)

- Avant le défi : avertissement du **lutin capricieux** et information sur la transmission des photos aux organisateurs.
- 6 modèles ; l'équipe en choisit 3. Toucher un modèle **ouvre l'appareil photo intégré au jeu** (viseur plein écran, déclencheur, bascule avant/arrière), sur téléphone comme sur ordinateur. Aucune galerie ni explorateur de fichiers n'est proposé.
- Aperçu de la photo à côté du modèle : « Valider cette photo » ou « Retenter ».
- **Caprice du lutin** : sur les 3 photos, la première tentative de l'une d'elles (tirée au hasard) est refusée avec une fenêtre humoristique. La photo reprise est toujours acceptée, et toutes les autres passent du premier coup.
- Chaque photo validée est **envoyée au serveur** (redimensionnée à 1600 px). Sans réseau, elle attend dans le téléphone et repart automatiquement.
- Après 3 photos validées, « Valider la Quête 3 » s'active.

> L'appareil photo demande l'autorisation du navigateur la première fois et ne fonctionne qu'avec une adresse **https://** (ou `localhost`). Si l'accès est refusé, le jeu explique comment l'autoriser.

### Quête 4 : Dossier 44 (enquête du Support 44)

4 modules successifs dans un terminal de sécurité : la photo du suspect (portrait C), le matricule (2575), le service (Division Bêtises & Emballage), le nom de famille par cryptogramme d'émojis (SIXSEVEN ou SIX-SEVEN). Chaque module laisse **2 essais** ; après la 2ᵉ erreur, **gel de 45 secondes**, puis le terminal valide le module automatiquement. À la fin : badge complet et géolocalisation au 33ᵉ étage.

### Quête 5 : Opération Hotte (traque finale)

- **Vidéo à lecture unique** : un petit film animé en pixel art (`assets/video/barnabe.mp4`, et `.webm` en secours) sur la **voix ElevenLabs fournie** (`traque.videoVoix`, `assets/audio/barnabe-video.mp3`) : Barnabé, de nuit devant un panorama de gratte-ciels, salue (« GG ») ; son réveil affiche presque minuit et « +7H » ; la caméra zoome sur son écran et la tour de plus de 600 m ; il lance « MATANÉ ! » et s'enfuit. Musique japonaise discrète en fond, sous-titres synchronisés (`traque.sousTitres`, champ `scene` pour le décor). Lecture unique : recharger la page affiche « Transmission autodétruite ». À la fin, le rapport s'affiche tout seul ; si la lecture coince, un bouton « Voir le rapport » apparaît. Pour refaire la vidéo après un changement de voix ou de sous-titres : `python3 tools/generer-video.py`.
- **Rapport d'analyse** : 4 indices à toucher (décalage horaire, tour géante, « matané », histoire locale). Chaque analyse relance la réflexion sans donner la réponse : le suspense reste entier jusqu'au code du repaire, **TOKYO** (un seul essai, gel de 45 s en cas d'erreur).
- **Départ du chrono** : « C'est parti ! » demande une confirmation (« Prêts à commencer ? ») avant de lancer le chrono.
- **Écran de fin** : « Mission presque accomplie », le lutin danse sur une musique pop-électro originale (`musique-fete.mp3`, libre de droits), et en petit : rendez-vous au lieu de départ avec le paquet choisi. Un bouton « Retour à l'accueil » ramène à la page du Club.
- **Présentation de Barnabé** : au début de la vidéo, il fait le geste « six seven ». La réplique « C'est Barnabé Six Seven ! » s'insère automatiquement après « Salut les gars ! » si le fichier `assets/audio/barnabe-video-intro.mp3` existe (`traque.videoIntro`) : relancer alors `python3 tools/generer-video.py` (sous-titres recalés tout seuls).
- **Code du repaire** : un seul essai. Erreur : **gel de 45 secondes**, puis nouvel essai.
- **Règle d'or** : aucun texte affiché avant TOKYO ne contient « salle » ni « porte ». `npm run check` le vérifie.
- **TOKYO** : Barnabé démasqué (animation et bulle), puis gros bouton clignotant « Appeler Barnabé ».
- **Faux appel** : sonnerie, puis message vocal de Barnabé (voix ElevenLabs fournie, `traque.audio`) avec sous-titres synchronisés (`traque.messageVocalSousTitres`). « Raccrocher » joue le « tu-tu-tu » de fin d'appel.
- **Le paquet mystère** : après « Raccrocher », l'équipe entre dans la salle, choisit un seul paquet et se prend en photo avec lui (photo envoyée aux organisateurs, visible dans la galerie du tableau de bord). Puis écran de fin : le chrono s'arrête.
- **Écran de fin** : redescendre au point de départ avec le paquet, toujours fermé.

### Voix de Barnabé

Les répliques de Barnabé sont des fichiers MP3 dans `assets/audio/` : `barnabe-video-1.mp3` à `barnabe-video-4.mp3` (vidéo) et `barnabe-appel.mp3` (appel). Les voix passent par Web Audio : une fois le son débloqué par un premier appui, elles fonctionnent aussi sur iPhone (même en mode silencieux sur iOS récent). Le texte prononcé est le champ `voix` (et `messageVocalVoix`) de `config/quetes.js`, écrit pour être bien lu à voix haute (« Six Sévène », « quarante-quatre »…).

**Voix de la vidéo et de l'appel** : fichiers ElevenLabs fournis par l'organisation. Le script Piper ci-dessous ne les écrase jamais (sauf `ECRASER=1`).

**Ancienne voix de synthèse** : générée hors ligne avec le moteur libre [Piper](https://github.com/rhasspy/piper) et la voix masculine française « gilles » (enregistrements CC0, moteur MIT : libre de droits). Débit volontairement posé, voix légèrement rajeunie, volume harmonisé. Pour la régénérer après une modification du texte :

```bash
pip install piper-tts
curl -L -o voix.tar.gz https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-fr-gilles-low.tar.gz && tar xzf voix.tar.gz
python3 tools/generer-voix-piper.py fr-gilles-low.onnx
```

**Voix plus expressive avec [ElevenLabs](https://elevenlabs.io)** (payant) : créez une voix dans **Voices → Voice Design**, par exemple :
> *Voix de jeune homme français, drôle et malicieux, sourire dans la voix. Débit posé, articulation très claire, ton complice et taquin. Ni voix d'enfant, ni grosse voix.*

Puis lancez `ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=… node tools/generer-voix.mjs` (mêmes fichiers, mêmes textes). Sans ligne de commande : générez chaque réplique sur le site d'ElevenLabs et déposez les MP3 dans `assets/audio/` avec ces noms.

Si un fichier manque, le téléphone lit le texte avec sa propre voix de synthèse.

### Musique et effets sonores

- **Pendant le parcours** : un tout petit fond sonore, deux airs à la boîte à musique qui s'enchaînent, `musique-noel-1.mp3` (« Douce nuit ») et `musique-noel-2.mp3` (« Deck the Halls »), avec des accords simples écrits mesure par mesure (aucune dissonance).
- **Dans la vidéo de Barnabé** : `musique-japon.mp3` (« Sakura Sakura » au koto).
- Mélodies du domaine public, arrangements originaux composés par `tools/generer-musique.py` : **libres de droits**.
- **Volume quasi nul** par défaut (`parametres.musique.volume: 0.05`) : même téléphone à fond, ce n'est qu'un fond. Réglé par Web Audio pour être respecté aussi sur iPhone ; la musique s'efface quand le lutin parle.
- **Effets sonores** (synthétisés, sans fichier) : clochettes quand une réponse est validée, fanfare quand une quête est réussie, « bonk » quand c'est faux, cristaux de givre quand tout gèle, petit carillon quand un mot secret débloque une quête (`parametres.musique.effets`).
- Le bouton **Son**, en haut de l'écran, coupe musique, effets et voix.
- Pour d'autres musiques, remplacez les fichiers MP3 ou les chemins dans `parametres.musique.noel` (gardez des morceaux libres de droits).

### Pénalités (gel)

Toutes les durées et le nombre d'essais se règlent dans `config/parametres.js` :

| Étape | Essais | Gel | Après le gel |
|---|---|---|---|
| Quiz (`quiz`) | 2 thèmes | 45 s | quiz validé d'office |
| Étage à deviner (`penalites.etage`) | 1 | 10 s | indice bonus, nouvel essai |
| Message codé (`penalites.message`) | 2 | 50 s | solution affichée, suite |
| Modules de l'enquête (`penalites.enquete`) | 2 | 45 s | module validé d'office |
| Code du repaire (`penalites.repaire`) | 1 | 45 s | nouvel essai |

Le gel résiste au rechargement de la page. Pendant le gel, seul le bouton des règles reste utilisable.

---

## 4. Modifier les contenus

Tous les fichiers à modifier se trouvent dans `config/`. Chacun est commenté en français.

| Fichier | Contenu |
|---|---|
| `config/parametres.js` | Quiz (thèmes ratés avant le gel, durée), pénalités des autres étapes, musique, chrono, suivi des équipes, logo, mode test |
| `config/etapes.js` | Les 5 étages : nom, repère, **mot secret**, texte de récit qui guide vers l'étage |
| `config/textes.js` | Accueil, nom d'équipe, carte « Comment jouer ? », règles, messages communs, joker |
| `config/quiz.js` | Quête 1 : 4 thèmes × 8 questions, thème mystère, étage à deviner et indice bonus |
| `config/quetes.js` | Quêtes 2 à 5 : message codé, défi photo (modèles), enquête (4 modules, badge), traque (vidéo, rapport, message vocal, fin) |

**Règles de saisie :**
- Modifiez uniquement le texte entre guillemets et gardez les virgules en fin de ligne.
- Dans un texte : `\n` crée un retour à la ligne et `**mot**` met en gras.
- Une bonne réponse de QCM s'indique par sa lettre : `reponse: "B"`.
- Pour une réponse saisie au clavier, listez les variantes acceptées : `reponses: ["sixseven", "six seven"]`. Les majuscules, les accents, la ponctuation et l'article initial (le, la, l'…) sont ignorés. Une faute de frappe est tolérée sur les réponses d'au moins 6 lettres, sauf si la réponse contient des chiffres.
- Les **titres tricotés** n'affichent ni accents ni exposants : écrivez « Cap sur l'étage 5 » plutôt que « 5ᵉ étage » dans un titre.
- Photos et portraits : remplacez les fichiers de `assets/img/photos/` et `assets/img/suspects/`, ou changez les chemins dans `config/quetes.js`.

**Après chaque modification :**

```bash
npm run check
```

Cette commande signale les erreurs de saisie (virgule oubliée, lettre de réponse invalide, mot secret en double, mot « salle » ou « porte » trop tôt dans la quête 5…). Le même rapport s'affiche dans le mode test.

---

## 5. Mode test organisateur

Accès : ajoutez `#/organisateur` à l'adresse, **ou touchez 5 fois rapidement le logo Saint-Gobain de l'accueil**, puis saisissez le code (`parametres.modeTest.code`). Il ne reste actif que dans l'onglet en cours.

Ce que permet le mode test :
- consulter l'état de la partie (quête, étape, joker, quiz, gel, photos) ;
- **aller directement à n'importe quelle quête** (sert aussi à reprendre la partie d'une équipe sur un autre téléphone) ;
- **saisir le mot secret** de l'étage attendu sans être sur place ;
- **afficher les bonnes réponses** (QCM, réponses acceptées, mots secrets) ;
- **gels courts** (15 s au maximum au lieu de 45 ou 50 s), déclencher ou lever le gel du quiz, effacer les tentatives, **lever le gel** des autres étapes ;
- passer la vidéo de la quête 5 ;
- rendre le joker ou le marquer comme utilisé ;
- marquer ou annuler « Aventure terminée » ;
- **imprimer les affichettes des mots secrets** (une page A4 par étage) ;
- remettre à zéro ou avancer le chrono, **réinitialiser la partie** ;
- voir le rapport de vérification du contenu.

**Avant l'événement :** sur chaque téléphone de test, réinitialisez la partie puis quittez le mode test. Ensuite, passez `modeTest.actif` à `false` (recommandé) ou changez le code. Ce code évite seulement une ouverture accidentelle : il reste lisible dans le code source.

---

## 6. Suivi des équipes et photos (tableau de bord)

Accès : `#/suivi`, le bouton « Suivi des équipes » du mode test, ou 5 appuis rapides sur le logo de l'accueil quand le mode test est désactivé. Le code (`SUIVI2026` par défaut, variable `CODE_SUIVI` du serveur) est vérifié par le serveur et n'apparaît pas dans les fichiers du site.

**Avancement** : chaque téléphone envoie sa progression toutes les 10 secondes et à chaque action. Pour chaque équipe : quête et étape en cours (« Enquête : module 3/4 », « En route vers : 23ᵉ étage »…), temps de jeu, étages atteints, photos, joker, thèmes ratés, et les états **Terminée**, **Gelée**, **Sans nouvelles depuis…**, **Mode test**. Actualisation toutes les 4 secondes.

**Actions** : **Réinitialiser** (efface la partie sur le téléphone de l'équipe à sa prochaine connexion ; elle revient à l'accueil) et **Retirer de la liste**.

**Photos du défi photo** : vignettes par équipe (touchez pour ouvrir en grand) et bouton **« Télécharger toutes les photos (ZIP) »**, classées dans un dossier par équipe. Les photos sont stockées sur le serveur dans `data/photos/` (non versionné) et ne sont pas effacées quand une équipe est réinitialisée ou retirée.

---

## 7. Sauvegarde, sécurité et limites

**Dans le téléphone** (`localStorage`) : identifiant aléatoire de la partie, nom d'équipe, progression, gels, joker, vignettes des photos, horodatages. Les photos en attente d'envoi sont gardées dans IndexedDB.

**Sur le serveur du jeu** : un résumé de progression par équipe et les photos du défi photo. Aucune donnée personnelle n'est demandée, pas de compte, pas de cookie, pas de mesure d'audience. L'écran du défi photo informe les équipes que leurs photos sont transmises aux organisateurs.

**Limites assumées :**
- La progression reste dans le navigateur d'un téléphone. Pour reprendre une partie ailleurs : mode test, « Aller directement à une quête ».
- Vider les données du navigateur efface la partie. En navigation privée, certains navigateurs bloquent la sauvegarde : un bandeau l'indique.
- **Ce n'est pas une protection anti-triche** : les réponses et mots secrets sont lisibles dans les fichiers du site par une personne qui sait chercher. Le code du suivi protège la liste et les photos, mais n'importe qui peut envoyer de fausses équipes au serveur. Acceptable pour un événement interne.
- La voix de synthèse du faux appel dépend du téléphone (voix française plus ou moins naturelle). Pour un rendu maîtrisé, fournissez un enregistrement (`traque.audio`).

---

## 8. Tests

```bash
npm run check          # vérifie la configuration (aucune installation nécessaire)
```

Test automatisé du parcours complet dans un vrai navigateur (Chromium, format smartphone puis ordinateur) :

```bash
npm install --no-save playwright
npx playwright install chromium
npm test
```

Les 40 vérifications couvrent notamment : accueil du Club et programme ; pages Battle et Gift ; Party (code, 20 défis, photo, vidéo et galerie, Gobz comptés par le serveur, classement) ; Wrap-Up (questions obligatoires, réponses et indicateurs) ; photo avec le paquet en fin de quête ; rôles Chef Lutin et Lutin Reporter ; bouton « Un souci ? » (lien d'appel) ; bouton Règles et bouton du son ; mots secrets des 5 étages ; thème mystère ; absence de correction pendant les questions puis correction après les 8 réponses ; gel de 45 s du quiz (persistant, règles accessibles) et validation d'office ; étage à deviner (givre 10 s, indice bonus) ; message codé (symboles, tolérance de saisie, essais) ; joker ; défi photo (appareil photo intégré sans sélecteur de fichiers, refus capricieux unique, envoi au serveur, export ZIP protégé) ; modules de l'enquête (essais, gel, validation d'office, badge) ; traque (vidéo réellement lue avec sous-titres et passage automatique au rapport, lecture unique, absence de « salle »/« porte » avant TOKYO, code à un essai, appel, fin) ; tableau de bord (code, avancement, galerie, réinitialisation à distance) ; mode test (sauts, affichettes, remise à zéro) ; absence de défilement horizontal et d'erreur JavaScript.

---

## 9. Mettre en ligne

Le suivi des équipes et **l'enregistrement des photos** demandent un hébergement capable de lancer Node.js 18 ou plus récent, avec la commande `node tools/serve.mjs` et la variable `CODE_SUIVI` :

- **Serveur ou machine virtuelle interne Saint-Gobain** : copiez le dossier, lancez `CODE_SUIVI=… PORT=80 node tools/serve.mjs` (ou derrière le proxy HTTPS habituel).
- **Render**, **Railway**, **Fly.io**… : service web Node.js, commande de démarrage `node tools/serve.mjs`, variable `CODE_SUIVI`. Choisissez une offre **avec disque persistant** (sinon les photos sont perdues au redémarrage) et où le service ne s'endort pas pendant l'événement.
- **Le jour J, sur un ordinateur portable** : `npm start` sur le même Wi-Fi que les téléphones, puis adresse « Réseau » affichée au démarrage.

L'appareil photo et la voix de synthèse exigent une adresse en **HTTPS** sur la plupart des téléphones (ou `localhost`).

Sans serveur Node.js (hébergement statique : Netlify, GitHub Pages…), le jeu fonctionne mais sans suivi ni récupération des photos.

Après la mise en ligne :
1. imprimez les affichettes des mots secrets (mode test → « Affichettes des mots secrets ») et placez-les aux étages ;
2. faites une partie complète sur un téléphone ;
3. ouvrez `#/suivi` : vérifiez l'équipe de test et ses photos, puis retirez-la ;
4. désactivez le mode test (`modeTest.actif: false`).

---

## 10. À valider avant l'événement

- [ ] **Faits du quiz** et des indices de la quête 5, en particulier :
  - quête 5, indice 1 : corrigé en « +8 h » (Tokyo a 8 heures d'avance sur Paris en décembre) ;
  - quête 5, indice 2 : vérifier que le vitrage de la Tokyo Skytree est bien attribué à Saint-Gobain ;
  - quiz « La Tour Saint-Gobain » : année de livraison, commune, nombre de niveaux.
- [ ] **Matricule (quête 4)** : la consigne D (« année qui précède l'année en cours ») donne 5 en 2026. Si l'événement a lieu une autre année, mettez à jour `reponses` du module 2 et `fiche.matricule`.
- [ ] **Voix de Barnabé et du lutin** : écouter les fichiers fournis (Piper) ; si elle ne convient pas, la remplacer par une voix ElevenLabs (voir § 3), puis relancer `tools/generer-video.py`.
- [ ] **Bouton « Un souci ? »** : numéro(s) à appeler dans `textes.aide.contacts` (ajoutez la collègue si besoin).
- [ ] **QR code de dépôt** des photos et vidéos du Lutin Reporter : à préparer et à remettre aux équipes à la fin.
- [ ] **Droits à l'image** des 6 photos modèles et des portraits.
- [ ] **Codes** : mode test (`1225`) et suivi (`CODE_SUIVI`, `SUIVI2026` par défaut).
- [ ] **Hébergement Node.js avec disque persistant** et HTTPS.
- [ ] **Logo** : remplacer les versions détourées par le fichier vectoriel officiel (`marque.logoClair` / `marque.logoFonce`).
- [ ] **Polices Gotham et Lovelo Line** : non incluses (sous licence). Gotham est utilisée si elle est installée sur l'appareil, sinon Montserrat la remplace. Voir `css/fonts.css`.
- [ ] Désactiver le mode test.

---

## Arborescence

```
index.html              page unique du site
config/                 ← contenus et paramètres modifiables
css/styles.css          charte graphique (couleurs, typographie, mise en page)
css/fonts.css           déclaration des polices
js/core.js              règles du jeu, gels et sauvegarde
js/screens.js           composants, accueil, règles, mots secrets, quête 1
js/q2-message.js        quête 2 : chiffre Pigpen (SVG)
js/q3-photos.js         quête 3 : défi photo, envoi et file d'attente hors ligne
js/camera.js            appareil photo intégré au jeu (viseur, déclencheur)
js/audio.js             musique de fond, voix de Barnabé, bouton du son
js/q4-enquete.js        quête 4 : terminal du Support 44
js/q5-traque.js         quête 5 : vidéo, repaire, appel, photo avec le paquet, fin
js/club.js              accueil du Club, programme, pages Battle et Gift
js/party.js             Christmas Party : code, défis, Gobz, classement
js/wrapup.js            Christmas Wrap-Up : questionnaire anonyme
js/knit.js              rendu tricot
js/pixel.js             pixel art : pictogrammes et lutin
js/elf.js               comportement du lutin (promenades, bulles)
js/board.js             carte du parcours (« Comment jouer ? »)
js/ui.js                logo, chrono, en-tête, fenêtres, règles, animations
js/admin.js             mode test et affichettes des mots secrets
js/sync.js              envoi de la progression au serveur (suivi)
js/suivi.js             tableau de bord des organisateurs (#/suivi)
js/app.js               navigation et événements
js/validate.js          vérification de la configuration
assets/fonts/           Montserrat, VT323 (SIL OFL)
assets/img/             favicon, logo, photos modèles, portraits des suspects
assets/audio/           fond musical, voix de Barnabé et réactions du lutin (MP3)
assets/video/           vidéo animée de Barnabé (MP4 + WebM)
tools/                  serveur du jeu (site, suivi, photos), vérification, génération de la musique, des voix (Piper ou ElevenLabs) et de la vidéo
tests/                  test automatisé de bout en bout
data/                   équipes suivies et photos (créé par le serveur, non versionné)
```

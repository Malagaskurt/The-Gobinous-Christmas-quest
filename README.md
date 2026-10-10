# Gobinous Christmas Quest

**La quête du cadeau disparu · Saint-Gobain**. Mini-site de jeu de Noël pour *The Gobinous Christmas Club*.

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
- **Règles** : page plein écran, une carte tricotée par règle.
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
| Départ | Hall · `SAPIN` | Accueil, nom d'équipe, règles, puis saisie du mot secret du hall. |
| **Quête 1 · Le grand quiz** | Hall | Choisit un thème parmi 4 (Noël, Histoire de Saint-Gobain, La Tour Saint-Gobain, **Thème mystère**) et répond aux 8 questions. |
| Premier indice | — | Lit l'indice (effet machine à écrire) et devine l'étage : **5**. |
| **Quête 2 · Le message codé** | 5ᵉ étage, coin café · `LUTIN` | Déchiffre un message en alphabet Pigpen avec la grille de décodage : « LA CLÉ DU MYSTÈRE EST LE VERRE ». |
| **Quête 3 · Le défi photo** | 23ᵉ étage, espace matériaux · `GUIRLANDE` | Reproduit 3 des 6 photos modèles avec l'appareil photo du téléphone. |
| **Quête 4 · L'enquête du Support 44** | 20ᵉ étage, Support 44 · `ETOILE` | Résout 4 modules de sécurité pour reconstituer le badge du suspect : Barnabé SIX-SEVEN. |
| **Quête 5 · La traque finale** | 33ᵉ étage · `CADEAU` | Regarde une vidéo à lecture unique, trouve le repaire (TOKYO), appelle Barnabé, puis redescend avec un paquet. |

**Mots secrets** : insensibles à la casse, aux accents et aux espaces. Un mauvais mot affiche simplement un message, sans pénalité.

**Chrono global** : 30 minutes (`parametres.chrono`), affiché en haut de l'écran. Il démarre au bouton « C'est parti ! » et s'arrête à la fin de l'aventure. Une fois écoulé, il affiche le dépassement mais ne bloque pas le jeu.

**Joker** : un seul par équipe pour toute l'aventure. Le bouton « Utiliser mon joker » apparaît sur le message codé, chaque module de l'enquête et le code du repaire (`indiceJoker` dans `config/quetes.js`).

### Quête 1 : le grand quiz

- 8 questions par thème, une à la fois. **Aucune correction pendant les questions** : l'équipe peut revenir en arrière et modifier ses choix.
- Après les 8 réponses : le score s'affiche, puis **la correction complète** (« Voir la correction »). Un thème joué ne peut plus être rejoué.
- 8/8 : premier indice. Sinon : une deuxième chance avec un autre thème.
- Deuxième thème raté : **tout est gelé 45 secondes**, puis le quiz est **validé d'office** (premier indice débloqué).
- **Thème mystère** : la carte affiche « Thème mystère » ; le vrai thème (« Culture générale ») n'est révélé qu'une fois choisi.
- **Étage à deviner** : le premier indice s'écrit à l'écran, l'équipe saisit un chiffre. Bonne réponse (5) : validation immédiate. Mauvaise réponse : **givré 10 secondes**, puis un **indice bonus** apparaît (« 3 + 2 ») et l'équipe peut réessayer.

### Quête 2 : le message codé

- Le message et les 4 grilles de décodage (A-I, J-R avec points, S-V, W-Z avec points) sont **dessinés en SVG** à partir du texte de `config/quetes.js` : modifier `lignes` suffit pour changer le message.
- Réponse tolérante : casse, accents, espaces multiples, « clé » ou « clef ».
- 1ʳᵉ erreur : « Phrase incorrecte. Il vous reste 1 essai ! ». 2ᵉ erreur : **gel de 50 secondes**, puis la solution s'affiche et l'équipe passe à la suite.

### Quête 3 : le défi photo

- Avant le défi : avertissement du **lutin capricieux** et information sur la transmission des photos aux organisateurs.
- 6 modèles ; l'équipe en choisit 3. Toucher un modèle **ouvre directement l'appareil photo** (`capture="environment"`).
- Aperçu de la photo à côté du modèle : « Valider cette photo » ou « Retenter ».
- **Caprice du lutin** : sur les 3 photos, la première tentative de l'une d'elles (tirée au hasard) est refusée avec une fenêtre humoristique. La photo reprise est toujours acceptée, et toutes les autres passent du premier coup.
- Chaque photo validée est **envoyée au serveur** (redimensionnée à 1600 px). Sans réseau, elle attend dans le téléphone et repart automatiquement.
- Après 3 photos validées, « Valider la Quête 3 » s'active.

> `capture="environment"` ouvre l'appareil photo sur iPhone et sur la plupart des Android. Certains navigateurs Android proposent malgré tout la galerie : c'est le navigateur qui décide, le site ne peut pas l'empêcher totalement.

### Quête 4 : l'enquête du Support 44

4 modules successifs dans un terminal de sécurité : la photo du suspect (portrait C), le matricule (2575), le service (Division Bêtises & Emballage), le nom de famille par cryptogramme d'émojis (SIXSEVEN ou SIX-SEVEN). Chaque module laisse **2 essais** ; après la 2ᵉ erreur, **gel de 45 secondes**, puis le terminal valide le module automatiquement. À la fin : badge complet et géolocalisation au 33ᵉ étage.

### Quête 5 : la traque finale

- **Vidéo à lecture unique** : elle est marquée vue dès son lancement ; recharger la page affiche « Transmission autodétruite ». Tant qu'aucun fichier n'est fourni, une **transmission simulée** de 35 secondes la remplace (portrait de Barnabé, accessoires, sous-titres minutés dans `traque.sousTitres`). Pour utiliser la vraie vidéo : déposez-la dans `assets/video/` et renseignez `traque.video`.
- **Code du repaire** : un seul essai. Erreur : **gel de 45 secondes**, puis nouvel essai.
- **Règle d'or** : aucun texte affiché avant TOKYO ne contient « salle » ni « porte ». `npm run check` le vérifie.
- **TOKYO** : Barnabé démasqué (animation et bulle), puis gros bouton clignotant « Appeler Barnabé ».
- **Faux appel** : sonnerie, puis message vocal. Sans fichier audio (`traque.audio`), le téléphone le lit avec sa voix de synthèse, sous-titres à l'écran. « Raccrocher » affiche l'écran de fin « Mission accomplie (ou presque…) » et arrête le chrono.

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
| `config/parametres.js` | Quiz (thèmes ratés avant le gel, durée), pénalités des autres étapes, chrono, suivi des équipes, logo, mode test |
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

Les 32 vérifications couvrent notamment : mots secrets des 5 étages ; thème mystère ; absence de correction pendant les questions puis correction après les 8 réponses ; gel de 45 s du quiz (persistant, règles accessibles) et validation d'office ; étage à deviner (givre 10 s, indice bonus) ; message codé (symboles, tolérance de saisie, essais) ; joker ; défi photo (appareil photo forcé, refus capricieux unique, envoi au serveur, export ZIP protégé) ; modules de l'enquête (essais, gel, validation d'office, badge) ; traque (vidéo à lecture unique, absence de « salle »/« porte » avant TOKYO, code à un essai, appel, fin) ; tableau de bord (code, avancement, galerie, réinitialisation à distance) ; mode test (sauts, affichettes, remise à zéro) ; absence de défilement horizontal et d'erreur JavaScript.

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
  - quête 5, indice 1 : en décembre, Tokyo a **8 heures** d'avance sur Paris (7 h seulement en été) ; le texte actuel indique « +7h » ;
  - quête 5, indice 2 : vérifier que le vitrage de la Tokyo Skytree est bien attribué à Saint-Gobain ;
  - quiz « La Tour Saint-Gobain » : année de livraison, commune, nombre de niveaux.
- [ ] **Matricule (quête 4)** : la consigne D (« année qui précède l'année en cours ») donne 5 en 2026. Si l'événement a lieu une autre année, mettez à jour `reponses` du module 2 et `fiche.matricule`.
- [ ] **Vidéo de Barnabé** (`traque.video`) et **message vocal** (`traque.audio`), sinon la simulation et la voix de synthèse sont utilisées.
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
js/q4-enquete.js        quête 4 : terminal du Support 44
js/q5-traque.js         quête 5 : vidéo, repaire, appel, fin
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
tools/                  serveur du jeu (site, suivi, photos) et vérification
tests/                  test automatisé de bout en bout
data/                   équipes suivies et photos (créé par le serveur, non versionné)
```

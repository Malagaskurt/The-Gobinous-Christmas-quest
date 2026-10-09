# Gobinous Christmas Quest

**La quête du cadeau disparu · Saint-Gobain**. Mini-site de jeu de Noël pour *The Gobinous Christmas Club*.

Les équipes de 5 à 10 personnes jouent avec un seul téléphone. Elles résolvent 5 quêtes (quiz, énigme, défi, dernier indice, hotte secrète) et se déplacent dans la Tour grâce à des indices et des QR codes. Comptez 30 à 45 minutes.

---

## 1. Choix techniques

| Choix | Pourquoi |
|---|---|
| **Site statique** : HTML, CSS et JavaScript sans framework | Rien à compiler ni à installer. Le site s'héberge n'importe où (simple dépôt de fichiers) et reste léger sur mobile. |
| **Contenus dans `config/`** | Questions, réponses, indices, lieux, textes et paramètres sont séparés du code. On les modifie dans un éditeur de texte. |
| **Sauvegarde dans le navigateur** (`localStorage`) | Avec un téléphone par équipe, sans classement ni échange entre équipes, un serveur n'apporte rien d'indispensable pour un événement de 45 minutes (voir § 7). |
| **Navigation par `#/…`** | Fonctionne sur tous les hébergeurs statiques sans réglage serveur. Les QR codes pointent vers `…/#/scan/CODE`. |
| **Aucune dépendance réseau** | Polices et générateur de QR codes sont inclus. Aucun appel à Google Fonts, aucun outil de mesure d'audience, aucun cookie. |

Composants tiers inclus : les polices **Montserrat** (remplaçante libre de Gotham), **Great Vibes** (écriture manuscrite) et **VT323** (afficheur des minuteurs), toutes sous SIL Open Font License, et **qrcode-generator** de Kazuhiko Arase (licence MIT), utilisé seulement par le mode test pour imprimer les QR codes.

### Direction artistique : « le pull de Noël Saint-Gobain »

- **Maille tricotée** bleu Saint-Gobain sur l'accueil, l'en-tête et les écrans d'entrée. Les mailles, les lettres brodées (alphabet pixel), les bandes jacquard (flocons, sapins) et les motifs (étoile, écusson, cadeau) sont dessinés en SVG par `js/knit.js`. Aucune image externe, rendu net sur tous les écrans.
- **Papier à lettre** pour le contenu des quêtes : chaque quête s'ouvre sur une lettre glissée dans une **enveloppe rouge**, avec ses indices sur des notes scotchées.
- Accents manuscrits (« Quête n°1 », « Bravo ! », « Joyeux Noël »), tampons de score (« 8/8 »), **minuteur rétro à cristaux liquides** pour le blocage du quiz, et un écran de chargement qui « tricote » le titre.
- Palette : bleu #17428C, bleu clair #00ADE1, rouge de Noël #C8102E et laine écrue. Logo Saint-Gobain en version blanche sur les fonds tricotés et bleu foncé sur les fonds clairs.

---

## 2. Lancer le site en local

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent (aucune installation de paquet nécessaire).

```bash
npm start
```

Puis ouvrez :

- **Jeu** : http://localhost:8080/
- **Mode test organisateur** : http://localhost:8080/#/organisateur (code par défaut : `1225`)

Pour essayer sur un vrai téléphone, connectez-le au même réseau Wi-Fi que l'ordinateur et ouvrez l'adresse « Réseau » affichée au démarrage.

> Sans Node.js : double-cliquez sur `index.html`. Le jeu fonctionne aussi en `file://`, mais les QR codes générés pointeront alors vers une adresse locale.

---

## 3. Modifier les contenus

Tous les fichiers à modifier se trouvent dans `config/`. Chacun est commenté en français.

| Fichier | Contenu |
|---|---|
| `config/parametres.js` | Règles du quiz (tentatives, durée du blocage), chrono global, QR code obligatoire ou non, adresse publique du site, logo, code organisateur de fin de partie, mode test |
| `config/textes.js` | Accueil, nom d'équipe, **règles** (texte exact demandé), messages d'erreur ou de réussite, joker, lieux, QR codes, fin |
| `config/quiz.js` | Quête 1 : introduction, 4 thèmes × 8 questions, bonnes réponses |
| `config/quetes.js` | Quêtes 2 à 5 : énigme, 3 questions du défi, énigme finale, écran final, indices du joker |
| `config/lieux.js` | Lieux A, B, C et FINAL : nom, indice, réponses acceptées, texte de validation, indice du joker, code du QR code |

**Règles de saisie :**
- Modifiez uniquement le texte entre guillemets et gardez les virgules en fin de ligne.
- Dans un texte : `\n` crée un retour à la ligne et `**mot**` met en gras.
- Une bonne réponse de QCM s'indique par sa lettre : `reponse: "B"`.
- Pour une réponse saisie au clavier, listez toutes les variantes acceptées : `reponsesAcceptees: ["espace plein ciel", "plein ciel"]`. Les majuscules, les accents, la ponctuation et l'article initial (le, la, l'…) sont ignorés. Une faute de frappe est tolérée sur les réponses d'au moins 6 lettres, sauf si la réponse contient des chiffres.

**Après chaque modification :**

```bash
npm run check
```

Cette commande signale les erreurs de saisie (virgule oubliée, lettre de réponse invalide, code QR en double…), les textes encore marqués `[À CONFIGURER]` et les questions marquées `aVerifier`. Le même rapport s'affiche dans le mode test, rubrique « Vérification du contenu ».

---

## 4. Déroulement du jeu

1. **Accueil**, puis **nom d'équipe** (aucune donnée personnelle), puis **règles**.
2. **Quête 1 : le grand quiz.** L'équipe choisit un thème et répond aux 8 QCM, une question à la fois. **Aucune correction n'est affichée pendant les questions** : l'équipe peut revenir en arrière et modifier ses choix, puis valide ses 8 réponses et découvre son score. Avec 8/8, le premier indice se débloque. Sinon, le thème est **fermé** (il ne pourra plus être rejoué) et l'équipe en choisit un autre. Au **deuxième thème raté**, le quiz est gelé pendant **3 minutes**, avec un minuteur affiché. Le score s'affiche, mais pas les questions ratées, pour ne pas dévoiler les réponses. Abandonner un thème en cours compte aussi comme un échec. Si les 4 thèmes sont ratés, ils redeviennent tous disponibles.
3. **Lieu A** : l'équipe saisit le lieu deviné. S'il est correct, elle s'y rend et scanne le QR code (ou saisit le code imprimé dessous). La quête 2 se débloque.
4. **Quête 2 : l'énigme mystère.** Une énigme à réponse libre, puis l'indice du lieu B et la même mécanique de déplacement.
5. **Quête 3 : le défi Saint-Gobain.** 3 QCM, puis l'indice du lieu C.
6. **Quête 4 : le dernier indice.** La réponse à l'énigme finale est le lieu de la hotte. Un écran festif confirme le lieu et invite l'équipe à suivre les instructions des organisateurs.
7. **Quête 5 : la hotte secrète.** Écran final et animation. La partie passe à **« Aventure terminée »** quand un organisateur saisit le code de fin sur le téléphone (bouton « Réservé aux organisateurs »), ou quand l'équipe scanne le QR code FINAL si `qrFinalActif` vaut `true`.

**Chrono global** : un compte à rebours de 30 minutes (`parametres.chrono`) s'affiche en haut de l'écran pendant toute la partie. Il démarre au bouton « C'est parti ! » et s'arrête à la fin de l'aventure, qui affiche le temps total. Il passe au rouge sous 5 minutes. Une fois écoulé, il affiche le dépassement (+01:12) mais ne bloque pas le jeu.

**Quête 3** : les 3 questions du défi gardent une correction immédiate (on retente jusqu'à la bonne réponse), conformément au cahier des charges initial. La mécanique du quiz peut y être reprise sur demande.

**Joker** : un seul par équipe. Le bouton « Utiliser mon joker » apparaît sur chaque étape qui a un `indiceJoker` renseigné. Une confirmation est demandée, puis l'indice s'affiche et le joker est marqué comme utilisé (le rechargement de la page ne le rend pas). Le statut « Joker disponible » ou « Joker utilisé » reste visible en haut de l'écran.

---

## 5. QR codes

- Chaque lieu a un `codeQR` court (par exemple `SAPIN`). Le QR code ouvre `https://votre-site/#/scan/SAPIN`.
- **Générer les fiches à imprimer** : dans le mode test, cliquez sur **« Fiches QR codes à imprimer »**. Une page A4 par lieu, avec le QR code et le code à saisir en secours.
- ⚠ Avant d'imprimer, renseignez `urlPublique` dans `config/parametres.js` avec l'adresse définitive du site. Si vous changez un `codeQR`, réimprimez la fiche correspondante.
- Un QR code scanné trop tôt (lieu pas encore trouvé) ou inconnu affiche un message clair, sans modifier la progression.
- **Ouverture dans un autre navigateur** : la progression est enregistrée dans le navigateur utilisé pour jouer. Si l'appareil photo ouvre le lien dans une autre application, le jeu indique qu'aucune partie n'est en cours. L'équipe peut alors revenir dans son navigateur et saisir le code à la main. Conseil à donner aux équipes : jouer dans le navigateur par défaut (Safari sur iPhone, Chrome sur Android).
- Sans QR code imprimé : mettez `scanObligatoire: false`. Un bouton « Nous sommes arrivés » remplace alors le scan.
- Un QR code ne prouve pas la présence d'une équipe : un code peut être partagé ou deviné. C'est un repère pratique, pas un contrôle.

---

## 6. Mode test organisateur

Accès : ajoutez `#/organisateur` à l'adresse, puis saisissez le code (`parametres.modeTest.code`). Le mode test n'apparaît nulle part dans l'interface des participants. Il ne reste actif que dans l'onglet en cours.

Ce que permet le mode test :
- consulter l'état de la partie (quête, phase, joker, tentatives du quiz, blocage, lieux) ;
- **aller directement à n'importe quelle quête**. Sert aussi à reprendre la partie d'une équipe sur un autre téléphone (le joker se règle séparément) ;
- **afficher les bonnes réponses** pendant les tests (QCM, énigmes, lieux, codes) ;
- **blocage court** du quiz (15 s au lieu de 3 min), déclencher ou lever le blocage, effacer les tentatives ;
- rendre le joker ou le marquer comme utilisé ;
- **simuler le scan** de chaque QR code, tester un QR inconnu, générer les fiches QR ;
- marquer ou annuler « Aventure terminée » ;
- remettre à zéro ou avancer le chrono de 5 minutes ;
- **réinitialiser la partie** ;
- voir le rapport de vérification du contenu.

**Avant l'événement :** sur chaque téléphone utilisé pour les tests, réinitialisez la partie puis cliquez sur « Quitter le mode test ». Ensuite, passez `modeTest.actif` à `false` (recommandé) ou changez le code. Ce code évite seulement une ouverture accidentelle : il reste lisible dans le code source.

---

## 7. Sauvegarde, sécurité et limites

**Données enregistrées**, uniquement dans le navigateur du téléphone (`localStorage`) : nom d'équipe, quête et étape en cours, progression et tentatives du quiz, fin du blocage, joker, lieux trouvés ou validés, fin de partie et horodatages. Aucune donnée n'est envoyée à un serveur. Pas de compte, pas de cookie, pas de mesure d'audience.

**Pourquoi pas de serveur ?** Chaque équipe joue sur un seul téléphone, sans classement ni interaction entre équipes. Un serveur n'aurait d'intérêt que pour : suivre les équipes en direct depuis un tableau de bord organisateur, reprendre une partie sur un autre appareil sans intervention, ou rendre la triche plus difficile. Ce n'est pas demandé et cela demanderait hébergement, base de données et maintenance.

**Limites assumées de la sauvegarde locale :**
- La progression **reste sur un seul navigateur d'un seul téléphone**. Changer de téléphone ou de navigateur repart de zéro. Pour reprendre une partie ailleurs, utilisez le mode test, « Aller directement à une quête ».
- Vider les données du navigateur efface la partie. En navigation privée, certains navigateurs bloquent la sauvegarde : le jeu affiche alors un bandeau d'avertissement.
- **Ce n'est pas une protection anti-triche.** Une personne qui maîtrise les outils de développement peut lire les réponses dans les fichiers du site, effacer sa sauvegarde pour récupérer le joker, ou avancer l'horloge du téléphone pour raccourcir le blocage. Pour un jeu convivial de 45 minutes, ce risque paraît acceptable.
- Si une équipe ouvre un QR code dans un nouvel onglet du même navigateur, les onglets se synchronisent automatiquement.

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

Les 28 vérifications couvrent : parcours complet des 5 quêtes ; nom d'équipe vide ; quiz sans correction pendant les questions (navigation avant/arrière, réponses conservées) ; score affiché à la fin, thème raté fermé ; rechargement en cours de thème ; gel de 3 minutes après deux thèmes ratés et persistance au rechargement ; chrono global ; accès direct à une quête non débloquée ; QR code scanné trop tôt, inconnu, ou ouvert dans un navigateur sans partie ; lieu incorrect ; code manuel incorrect ; joker refusé, puis utilisé, mémorisé après rechargement et impossible à réutiliser ; code organisateur incorrect ; « Aventure terminée » conservée au rechargement ; mode test (code, blocage court, sauts de quête, remise à zéro, fiches QR) ; absence de défilement horizontal en mobile et sur ordinateur ; absence d'erreur JavaScript.

---

## 9. Mettre en ligne

Le site se résume à des fichiers statiques. Déposez **tout le dossier** (sauf `tests/`, `tools/` et `node_modules/`, facultatifs) sur l'un de ces hébergements :

- **Serveur web interne Saint-Gobain** ou toute offre d'hébergement statique : copiez les fichiers dans un dossier publié en HTTPS.
- **Netlify** : glissez-déposez le dossier sur https://app.netlify.com/drop pour obtenir une adresse en quelques secondes.
- **GitHub Pages** : Settings → Pages → *Deploy from a branch* → choisissez la branche et le dossier racine (le dépôt doit alors être public, ou l'offre GitHub doit le permettre en privé).
- **Vercel**, **Cloudflare Pages**… : projet « statique » sans commande de build.

Après la mise en ligne :
1. renseignez `urlPublique` dans `config/parametres.js` avec l'adresse obtenue, puis republiez ;
2. ouvrez `#/organisateur` → « Fiches QR codes à imprimer » et imprimez ;
3. scannez chaque QR code imprimé avec un téléphone pour vérifier qu'il ouvre bien le site ;
4. désactivez le mode test (`modeTest.actif: false`) et republiez.

Le fichier `index.html` contient `noindex` : le site n'apparaîtra pas dans les moteurs de recherche.

> Si les téléphones affichent un ancien contenu après une mise à jour, rechargez la page. Le cache de certains hébergeurs peut mettre quelques minutes à se vider.

---

## 10. Ce qui fonctionne et ce qui reste à configurer

**Fonctionnel :**
- les écrans (accueil, équipe, règles) et les 5 quêtes, avec leurs écrans d'introduction, de réussite et de transition ;
- le quiz : 4 thèmes, 32 questions intégrées, score révélé à la fin, thèmes ratés fermés, gel de 3 minutes avec minuteur ;
- le chrono global de 30 minutes, l'écran de chargement et la nouvelle direction artistique ;
- l'énigme de la quête 2, le défi (3 QCM), l'énigme finale, l'écran final et « Aventure terminée » ;
- la saisie et la validation des lieux, les QR codes (scan, saisie manuelle, mode sans QR code) et la génération des fiches à imprimer ;
- le joker (confirmation, indice, mémorisation) ;
- la sauvegarde locale, la reprise après rechargement et la synchronisation entre onglets ;
- le mode test complet ;
- la vérification de configuration ;
- les tests automatisés ;
- l'affichage mobile et ordinateur, ainsi que l'accessibilité de base (contrastes, navigation clavier, mouvements réduits).

**À configurer ou à valider avant l'événement :**
- [ ] **Lieux A, B, C et FINAL** dans `config/lieux.js` : nom, indice, réponses acceptées, texte de validation, indice du joker. Ils contiennent aujourd'hui des valeurs `[À CONFIGURER]`, et aucun lieu réel n'a été inventé.
- [ ] **Énigme finale** (quête 4) et son indice du joker dans `config/quetes.js`.
- [ ] **Questions marquées `aVerifier`** : thème « La Tour prend de la hauteur » (Q1, Q4, Q5, Q7, Q8) et thème « Matériaux, mode d'emploi » (Q5, Q6, Q8). La Q8 du thème Matériaux ne doit pas être utilisée sans vérification de la source. La mention « à vérifier avant publication » a été retirée de l'énoncé visible et conservée en note interne.
- [ ] **Questions de la quête 3** et **énigme de la quête 2** (réponse : « le verre ») : proposées par défaut, à faire valider.
- [ ] **Code organisateur de fin** (`finDePartie.codeOrganisateur`, actuellement `HOTTE2026`) et **code du mode test** (`1225`).
- [ ] **`urlPublique`** une fois le site en ligne, puis impression des QR codes.
- [ ] **Logo** : les versions blanche et bleu foncé ont été détourées depuis l'image fournie (PNG). Pour un rendu parfait, remplacez-les par le fichier vectoriel officiel (`marque.logoClair` / `marque.logoFonce`).
- [ ] **Polices Gotham et Lovelo Line** : non incluses (polices sous licence). Gotham est utilisée si elle est installée sur l'appareil, sinon Montserrat la remplace. Les grands titres sont « brodés » en mailles et n'utilisent pas de police. Pour diffuser les fichiers officiels, voir `css/fonts.css`.
- [ ] Désactiver le mode test.

---

## Arborescence

```
index.html              page unique du site
config/                 ← contenus et paramètres modifiables
css/styles.css          charte graphique (couleurs, typographie, mise en page)
css/fonts.css           déclaration des polices
js/core.js              règles du jeu et sauvegarde
js/screens.js           écrans et actions des participants
js/knit.js              moteur graphique « tricot » (mailles, lettres brodées, motifs)
js/ui.js                logo, chrono, en-tête, fenêtres, animations
js/admin.js             mode test et fiches QR codes
js/app.js               navigation et événements
js/validate.js          vérification de la configuration
assets/fonts/           Montserrat, Great Vibes, VT323 (SIL OFL)
assets/img/             favicon, logo Saint-Gobain (blanc et bleu foncé)
vendor/                 générateur de QR codes (MIT)
tools/                  serveur local et vérification de configuration
tests/                  test automatisé de bout en bout
```

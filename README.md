# Bons de commande — Galaxy Sports Center (PWA)

Application installable (téléphone et ordinateur) pour créer, faire valider, imprimer et enregistrer les bons de commande dans Google Sheets. Elle fonctionne hors ligne : les bons sont gardés sur l'appareil et envoyés au Sheet quand la connexion revient.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | L'application complète (interface, calculs, impression) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation PWA et mode hors ligne |
| `apps-script/Code.gs` | API qui écrit dans le Google Sheet |

## 1. Relier le Google Sheet (5 min)

1. Ouvrez le classeur **Bons de commande — Galaxy Sports Center**. Il contient déjà les onglets `Bons`, `Lignes` et `Journal`.
2. Menu **Extensions > Apps Script**. Remplacez le contenu par celui de `apps-script/Code.gs`.
3. Ligne 8, changez `TOKEN` par un mot de passe à vous, puis enregistrez.
4. **Déployer > Nouveau déploiement > Type : Application Web**
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
5. Autorisez l'accès quand Google le demande, puis copiez l'URL qui finit par `/exec`.
6. Dans l'application, ouvrez **Paramètres** : collez l'URL et le jeton, puis touchez **Tester**.

Après une modification de `Code.gs`, faites **Déployer > Gérer les déploiements > Modifier > Nouvelle version** pour garder la même URL.

## 2. Mettre l'application en ligne

Une PWA doit être servie en HTTPS. Le plus simple :

- **Netlify Drop** : glissez le dossier sur app.netlify.com/drop.
- **GitHub Pages** (ce dépôt) : le workflow `.github/workflows/pages.yml` publie automatiquement à chaque push sur `main`, à l'adresse https://meiddiel.github.io/bons-commande-galaxy/. Si le premier déploiement échoue, activez Settings > Pages > Source : **GitHub Actions**, puis relancez le workflow.
- **Le site galaxy-sc.com** : copiez le dossier dans un sous-dossier, par ex. `galaxy-sc.com/bons/`.

Sur le téléphone, ouvrez l'adresse puis **Ajouter à l'écran d'accueil**.

Après une mise à jour des fichiers, changez `VERSION` dans `sw.js` pour forcer le rafraîchissement.

## 3. Utilisation

**Circuit de revue**

`Brouillon` → `Soumis` → `Approuvé` / `À corriger` / `Rejeté` (ou `Annulé`)

- Un bon *À corriger* redevient modifiable, avec le commentaire du réviseur affiché en haut.
- Un bon *Approuvé* est verrouillé. Pour le changer, utilisez **Nouvelle version** : la v2 reprend le même numéro et la v1 reste dans l'historique.
- Chaque action (création, soumission, revue) est enregistrée dans l'onglet `Journal`, avec l'auteur et le commentaire.

**Impression** : bouton *Imprimer / PDF*, sur une page A4. Les mentions *BROUILLON*, *EN REVUE*, *REJETÉ* ou *ANNULÉ* s'impriment en filigrane. Un bon approuvé porte un tampon avec le nom et la date. Pensez à cocher « Graphiques d'arrière-plan » dans la boîte d'impression si les couleurs n'apparaissent pas.

**Calculs** : montant par ligne = Qté × PU × (1 − remise), arrondi à l'ariary. Ensuite : Total HT, TVA, TTC, moins l'avoir = Net à payer. Le montant en lettres est généré automatiquement.

**Fournisseurs** : quand vous tapez le nom d'un fournisseur déjà utilisé, son adresse, son NIF, son STAT et son RCS se remplissent automatiquement.

**Logo** : dans Paramètres > Entreprise, importez votre logo (PNG transparent de préférence).

## Sécurité

Le jeton protège l'API, mais toute personne qui a l'URL et le jeton peut écrire dans le Sheet. Ne les partagez qu'avec l'équipe et changez le jeton si quelqu'un quitte l'entreprise.

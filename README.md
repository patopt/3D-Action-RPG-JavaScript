# Aether Quest — Action RPG (Babylon.js)
![Example Image](https://i.ibb.co/D7tywtK/2024-06-2910-15-38-ezgif-com-speed.gif)

Un RPG d'action 3D jouable dans le navigateur, construit sur Babylon.js.
Le projet de base (mouvement, physique, terrain, animations, scène) a été
étendu en un **jeu complet** : menus, HUD, contrôles tactiles mobiles,
inventaire, quêtes, PNJ, monde vivant (arbres, rochers, créatures), coffres,
boutique et progression du héros — le tout sans étape de build.

## ✨ Fonctionnalités du jeu

- **Menu principal & pause** (style pixel/rétro) : Nouvelle partie, Continuer,
  Comment jouer, Sauvegarder, retour au menu.
- **HUD** : barres PV / PM / XP, niveau, or, et un suiveur de quête.
- **Contrôles mobiles & tactiles** : joystick de déplacement, boutons d'action
  (attaque, sort, esquive, interagir) et boutons système (inventaire, quêtes,
  pause). La caméra se tourne au glissé.
- **Inventaire & équipement** : objets, consommables, armes, armures, bijoux,
  vente, statistiques du héros.
- **Système de quêtes** : 5 quêtes en chaîne avec objectifs (tuer, récolter,
  parler, trouver), récompenses (XP, or, objets) et journal de quêtes.
- **PNJ** : Doyen, Marchande (boutique), Garde, Villageoise — avec dialogues,
  indicateurs de quête (`!` / `?`) et plaques de nom.
- **Monde vivant** : arbres récoltables (bois), rochers, buissons, créatures
  ambiantes, coffres au trésor et un cristal ancien de quête.
- **Combat & progression** : XP, niveaux, montée des statistiques, butin
  (gel de slime, or), régénération de mana, dégâts ennemis et écran de mort.
- **Sauvegarde automatique** dans le navigateur (localStorage).

## 🎮 Contrôles

**Clavier / souris**
- Déplacement : `Z Q S D` ou flèches
- Caméra : souris (glisser) · rotation `A` / `D`
- Attaque : clic gauche (ou `5`) · Sort de feu : `C`
- Esquive : `Espace` · Interagir : `G` ou `Entrée`
- Inventaire : `I` · Quêtes : `J` · Pause : `Échap`

**Tactile (mobile)**
- Joystick gauche : se déplacer · glisser à l'écran : caméra
- Boutons à droite : ⚔ attaque · 🔥 sort · ↻ esquive · ✋ interagir
- Boutons à gauche : 🎒 inventaire · 📜 quêtes · ⏸ pause

Le code du jeu se trouve dans [`src/game/`](/src/game) (état, UI, monde,
quêtes, combat) et s'intègre à la scène `outdoor`.

Gets you started with examples of character movement, physics, terrain, scene loading, animation, and more.

Includes a scene manager to switch between levels.


## Demo
[Play in your browser](https://www.rpgskilltreegenerator.com/RPG/index.html?scene=outdoor) instantly.

### Switching Demo Levels
You can switch scenes by adding [`?scene=inn`](https://rpgskilltreegenerator.com/RPG/index.html?scene=inn), or [`?scene=outdoor`](https://rpgskilltreegenerator.com/RPG/index.html?scene=outdoor), or [`?scene=builder`](https://rpgskilltreegenerator.com/RPG/index.html?scene=builder).

You can add [`&debug=true`](https://rpgskilltreegenerator.com/RPG/index.html?scene=outdoor&debug=true) to load a scene inspector. 

You can view the full scene list in [`SceneManager.js`](/src/scene/SceneManager.js). 

## Run Locally
`git clone` the repo.

Run a local server, then open `index.html` in your browser. 

### Low Latency Changes
Make a code change, save the file, and watch as your change is immediatly live. No build process needed.  

## 🚀 Déployer sur Vercel

Le jeu est un site **100 % statique** (HTML + modules JS + assets), sans étape
de build. Vercel le sert directement.

### Méthode 1 — Tableau de bord (la plus simple)
1. Pousse ce dépôt sur GitHub (déjà fait si tu lis ceci).
2. Va sur [vercel.com](https://vercel.com), connecte-toi et clique **Add New… → Project**.
3. Importe le dépôt `3D-Action-RPG-JavaScript`.
4. Dans la configuration :
   - **Framework Preset** : `Other`
   - **Build Command** : *(laisser vide)*
   - **Output Directory** : `.` (la racine, car `index.html` est à la racine)
   - **Install Command** : *(laisser vide)*
5. Clique **Deploy**. En ~30 s tu obtiens une URL publique (`*.vercel.app`).

Le fichier [`vercel.json`](/vercel.json) fourni configure déjà le cache des
assets et le bon type MIME pour le WASM (physique Havok).

### Méthode 2 — Vercel CLI
```bash
npm i -g vercel      # installer la CLI une fois
vercel login         # se connecter
vercel                # déploiement de prévisualisation
vercel --prod         # déploiement en production
```
Exécute ces commandes à la racine du projet. Accepte les valeurs par défaut
(pas de build, répertoire de sortie = `.`).

### Notes
- Aucune variable d'environnement n'est requise.
- Si tu forkes, le jeu démarre sur la scène `outdoor` par défaut.
- Les autres scènes restent accessibles via `?scene=inn`, `?scene=builder`, etc.


## Contributing
Please feel free to contribute or open an issue.

### Support the project
[Patreon](https://www.patreon.com/OpenRPGTools) or [join the discord](https://discord.gg/NcJYR65HHZ).

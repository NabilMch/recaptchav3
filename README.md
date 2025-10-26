Projet de test Google reCAPTCHA v3

Ce petit projet permet de tester une intégration reCAPTCHA v3 avec :
- un frontend HTML minimal (`public/index.html`)
- un backend Node/Express (`server.js`) qui vérifie les tokens auprès de l'API Google

## Fichiers importants
- `server.js` : serveur Express, endpoints disponibles :
  - `GET /config` → renvoie `{ siteKey: '...' }` (permet au client de charger dynamiquement la clé site)
  - `POST /verify-recaptcha` → attend `{ token: '...' }` et appelle l'API Google `siteverify`
- `public/index.html` : page de test qui récupère `/config`, charge `grecaptcha` dynamiquement et envoie le token au serveur
- `.env` : variables d'environnement (clé site & clé secrète)

## Configuration
1. Créez un projet reCAPTCHA v3 dans la console Google : https://www.google.com/recaptcha/admin
   - Notez la paire `Site key` (clé publique côté client) et `Secret key` (clé privée côté serveur).
   - Dans la section "Domains", ajoutez les domaines sur lesquels vous testez. Pour Codespaces/Ports forwarding, ajoutez le domaine temporaire (ex : `shadowy-spooky-...-3000.app.github.dev`) ou `.app.github.dev` si vous voulez couvrir plusieurs sous-domaines. Pour du testing local, ajoutez `localhost`.

2. Configurez le fichier `.env` à la racine du projet :

```env
RECAPTCHA_SITE_KEY=VOTRE_SITE_KEY_ICI
RECAPTCHA_SECRET_KEY=VOTRE_SECRET_KEY_ICI
PORT=3000 # optionnel
```

Ne partagez jamais votre clé secrète publiquement.

## Installer et lancer

Installez les dépendances (une seule fois) :

```bash
npm install
```

Démarrez le serveur :

```bash
node server.js
```

Le serveur écoute par défaut sur le port `3000`. Ouvrez ensuite `http://localhost:3000` (ou votre URL Codespaces) pour voir la page de test.

## Tester
- Vérifier que l'endpoint `/config` renvoie la clé site :

```bash
curl http://localhost:3000/config
# -> {"siteKey":"6LfwwPcrAAAA..."}
```

- Soumettez le formulaire dans le navigateur. Le flux :
  1. Le client récupère `/config` et charge dynamiquement `https://www.google.com/recaptcha/api.js?render=SITE_KEY`.
  2. Au clic sur "Envoyer", `grecaptcha.execute(SITE_KEY, {action:'submit'})` génère un token.
  3. Le token est envoyé au backend (`POST /verify-recaptcha` avec JSON { token }).
  4. Le backend appelle l'API Google `siteverify` avec la `RECAPTCHA_SECRET_KEY` et renvoie la réponse au client.

Exemple (debug) :

```bash
curl -X POST http://localhost:3000/verify-recaptcha \
  -H 'Content-Type: application/json' \
  -d '{"token":"PASTE_TOKEN_HERE"}'
# -> réponse de Google (json) contenant success, score, hostname, "error-codes" si erreur
```

## Erreurs courantes et débogage
- `invalid-input-response` : Google considère le token comme invalide. Causes fréquentes :
  - Token expiré (générez-en un nouveau avant de l'envoyer).
  - Le token a été généré pour un autre siteKey / domaine (mismatch client/server). Assurez-vous que la `RECAPTCHA_SITE_KEY` utilisée côté client correspond bien à la `RECAPTCHA_SECRET_KEY` côté serveur (même projet dans la console Google).
  - La clé secrète (`RECAPTCHA_SECRET_KEY`) est absente ou incorrecte dans `.env` (le serveur renverra maintenant `missing_secret_key`).
  - Le domaine d'où provient la requête n'est pas listé dans la configuration du site reCAPTCHA dans la console Google.

- Ce projet inclut déjà des logs côté serveur pour :
  - indiquer si aucun token n'a été reçu
  - afficher un token tronqué (ne pas logger en production)
  - afficher la réponse complète renvoyée par Google (utile pour debug)

### Vérifications côté client
- Ouvrez les DevTools → Network et regardez la requête `POST /verify-recaptcha` : le corps doit contenir `{ "token": "..." }`.
- Vérifiez également la console du navigateur pour d'éventuelles erreurs lors du chargement du script reCAPTCHA ou lors de l'appel `grecaptcha.execute`.

## Sécurité & bonnes pratiques
- Ne mettez jamais la `RECAPTCHA_SECRET_KEY` dans le code client ni dans des dépôts publics.
- Limitez et protégez l'accès au fichier `.env` et aux secrets (ex : Vault, GitHub Secrets) en production.
- Ne logguez pas les tokens en production. Les logs actuels sont uniquement pour debugging local.

## Ajouts/Améliorations possibles
- Ajouter une route d'admin/debug pour afficher la dernière réponse complète de Google (utile lors du debug local).
- Ajouter des tests automatisés qui mockent l'API Google pour valider le flux backend.
- Ajouter un seuil de score configurable et une gestion plus fine des actions (block/step-up challenge/email verification).

Si vous voulez, je peux :
- ajouter ces améliorations automatiquement,
- ou mettre à jour le README pour inclure des captures d'écran / procédure pas-à-pas pour la console Google.

---
Fait pour `recaptchav3`. Si vous voulez, je peux aussi insérer votre `RECAPTCHA_SECRET_KEY` dans le `.env` (évitez de le poster publiquement) et relancer le serveur pour retester.


# Soulbot Manager

Bot Discord de gestion et d'hébergement de bots Discord avec les composants v2.
Le premier type disponible est le bot Gestion basé sur le template fourni.

## Variables requises

- `DISCORD_TOKEN` ou `MANAGER_TOKEN` : token du bot manager.
- `SESSION_SECRET` : secret utilisé pour chiffrer les tokens des bots hébergés.
- `DISCORD_GUILD_ID` : optionnel, permet d'enregistrer les commandes immédiatement dans un serveur précis.

## Lancer

```bash
npm start
```

## Commandes

- `/createkey` : réservé aux administrateurs, choisit un type de bot puis crée une licence avec un nombre d'utilisations et une durée (`30j`, `12h`, `2mois`).
- `/createbot` : nom affiché, token du bot Discord et clé de licence. Le type de bot est repris automatiquement depuis la licence.
- `/mybot` : liste paginée, statut et gestion de chaque bot.
- `/claimbot cle:<clé>` : rattache un bot à un autre compte avec sa clé de récupération.

Le bot Gestion embarque toutes les commandes et événements du ZIP fourni, avec le buyer configuré automatiquement sur le propriétaire actuel du bot. Un transfert ou une récupération redémarre le processus pour actualiser ce buyer.
Les commandes de Gestion utilisent un préfixe (par défaut `&`, personnalisable par serveur) ou une mention du bot. Les commandes du Manager (`/createkey`, `/createbot`, `/mybot`, `/claimbot`) restent des commandes slash.
Chaque commande est conservée dans son propre fichier sous `src/bot-types/gestion/commands/<catégorie>/`, et chaque événement sous `src/bot-types/gestion/events/<catégorie>/`. La mise à jour automatique fournie dans le ZIP reste désactivée car elle exécute des suppressions de fichiers et des redémarrages PM2 avec des chemins absolus propres à un autre hébergement.

Les tokens ne sont jamais stockés en clair. Les données du manager sont enregistrées dans `data/manager.json`, créé au premier démarrage. Chaque bot Gestion dispose aussi de son propre dossier de données isolé.
const config = require('../config.js')

    module.exports = {
      name: 'ready',
      async execute(bot) {
        let botDB = bot.db.prepare('SELECT * FROM bot WHERE id = ?').get(bot.user.id)
        if(!botDB) {
          bot.db.prepare('INSERT INTO bot (id) VALUES (?)').run(bot.user.id);
          botDB = bot.db.prepare('SELECT * FROM bot WHERE id = ?').get(bot.user.id)
        }
        try {
          const activity = JSON.parse(botDB.activity);
          const applyActivity = () => bot.user.setPresence({
            activities: [{
              name: activity.name,
              type: Number(activity.type),
              url: "https://twitch.tv/ruwin2007yt",
            }],
            status: "online",
          });
          void applyActivity();
          const activityTimer = setInterval(applyActivity, 10_000);
          activityTimer.unref?.();
        } catch (error) {
          console.error("[coin] activité invalide :", error.message);
        }

        if (!config.port || !config.apiKey) return;

        const express = require("express");
        const bodyParser = require("body-parser");
        const app = express();
        app.use(bodyParser.json());

        const checkApiKey = (req, res, next) => {
          if (req.get("x-api-key") === config.apiKey) return next();
          return res.status(403).json({ message: "La clé API est invalide." });
        };

        app.post("/addcoins", checkApiKey, (req, res) => {
          const userId = String(req.body?.userId || req.query.userId || "");
          const amount = Number(req.body?.amount ?? req.query.amount);
          const user = bot.users.cache.get(userId);
          if (!user || !Number.isSafeInteger(amount) || amount <= 0) {
            return res.status(400).json({ message: "Utilisateur ou montant invalide." });
          }
          bot.functions.addCoins(bot, null, null, user.id, amount, "coins");
          return res.json({ message: "Réussi !" });
        });

        app.post("/addrep", checkApiKey, (req, res) => {
          const userId = String(req.body?.userId || req.query.userId || "");
          const amount = Number(req.body?.amount ?? req.query.amount);
          const user = bot.users.cache.get(userId);
          if (!user || !Number.isSafeInteger(amount) || amount <= 0) {
            return res.status(400).json({ message: "Utilisateur ou montant invalide." });
          }
          bot.functions.addCoins(bot, null, null, user.id, amount, "rep");
          return res.json({ message: "Réussi !" });
        });

        const apiServer = app.listen(config.port, () => {
          console.log(`[coin] API démarrée sur le port ${config.port}`);
        });
        apiServer.on("error", (error) => {
          console.error("[coin] API indisponible :", error.message);
        });
      },
    };
const path = require("node:path");

const managerToken = process.env.DISCORD_TOKEN || process.env.MANAGER_TOKEN;

if (!managerToken) {
  throw new Error(
    "DISCORD_TOKEN ou MANAGER_TOKEN est requis pour connecter le bot manager."
  );
}

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET est requis pour chiffrer les tokens des bots hébergés."
  );
}

module.exports = {
  managerToken,
  guildId: process.env.DISCORD_GUILD_ID || null,
  dataFile: path.resolve(process.env.DATA_FILE || "data/manager.json"),
  managerColor: 0x1688ff,
  dataVersion: 1,
};
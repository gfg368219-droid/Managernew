require("./compat");

const { bot } = require("./structures/client");

process.on("unhandledRejection", (error) => {
  console.error("[gestion] erreur asynchrone :", error?.message || error);
});

process.on("uncaughtException", (error) => {
  console.error("[gestion] erreur :", error?.message || error);
});

new bot();
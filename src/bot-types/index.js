const BOT_TYPES = {
  gestion: {
    id: "gestion",
    label: "Gestion",
    description: "Bot de gestion, modération, sécurité et commandes buyer",
  },
  coin: {
    id: "coin",
    label: "Coin",
    description: "Bot d'économie virtuelle, jeux, métiers et alliances",
  },
};

function getBotType(type) {
  return BOT_TYPES[type] || null;
}

function listBotTypes() {
  return Object.values(BOT_TYPES);
}

module.exports = { BOT_TYPES, getBotType, listBotTypes };
const apiPort = Number.parseInt(process.env.COIN_API_PORT || "", 10);

module.exports = {
  token: process.env.BOT_RUNTIME_TOKEN || null,
  buyers: process.env.BOT_OWNER_ID ? [process.env.BOT_OWNER_ID] : [],
  color: "#F4D80B",
  footerText: "CoinsBot | par Ruwin et Millenium is here",
  port: Number.isInteger(apiPort) && apiPort > 0 ? apiPort : null,
  apiKey: process.env.COIN_API_KEY || null,
};
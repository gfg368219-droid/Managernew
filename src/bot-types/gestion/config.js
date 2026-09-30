module.exports = {
  token: process.env.BOT_RUNTIME_TOKEN || "",
  buyers: process.env.BOT_OWNER_ID ? [process.env.BOT_OWNER_ID] : [],
};
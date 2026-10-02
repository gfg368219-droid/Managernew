const Discord = require("discord.js");
const config = require("./config");

if (!config.token) {
  throw new Error("BOT_RUNTIME_TOKEN est requis pour lancer un bot Coin.");
}

const bot = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.GuildPresences,
    Discord.GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Discord.Partials.Channel,
    Discord.Partials.Message,
    Discord.Partials.User,
    Discord.Partials.GuildMember,
    Discord.Partials.Reaction,
    Discord.Partials.ThreadMember,
    Discord.Partials.GuildScheduledEvent,
  ],
});

bot.commands = new Discord.Collection();
bot.slashCommands = new Discord.Collection();
bot.setMaxListeners(70);
bot.db = require("./Handler/database")(bot);
bot.functions = require("./Utils/Functions/functionCoins");

require("./Handler/Commands")(bot);
require("./Handler/Events")(bot);

bot.once("clientReady", (readyBot) => {
  const user = readyBot.user;
  console.log(`[coin] connecté en tant que ${user.tag}`);
  if (process.send) {
    process.send({
      type: "ready",
      user: {
        id: user.id,
        tag: user.tag,
        avatarUrl: user.displayAvatarURL({ size: 128 }),
      },
    });
  }
});

bot.on("error", (error) => {
  console.error("[coin] erreur Discord :", error.message);
});

async function shutdown() {
  bot.destroy();
  bot.db.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

bot.login(config.token).catch((error) => {
  console.error("[coin] connexion impossible :", error.message);
  if (process.send) {
    process.send({ type: "error", message: error.message });
  }
  process.exitCode = 1;
});
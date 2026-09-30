const Module = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const discord = require("discord.js");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ClientUser,
  EmbedBuilder,
  ActivityType,
  GatewayIntentBits,
  Message,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = discord;

const originalPermissionResolve = discord.PermissionsBitField.resolve;
const legacyPermissionNames = {
  READ_MESSAGES: "ViewChannel",
  MANAGE_SERVER: "ManageGuild",
  MANAGE_EMOJIS: "ManageGuildExpressions",
  MANAGE_EMOJIS_AND_STICKERS: "ManageGuildExpressions",
  USE_SLASH_COMMANDS: "UseApplicationCommands",
};

discord.PermissionsBitField.resolve = function resolveLegacyPermission(bit) {
  if (typeof bit === "string") {
    const normalizedName = legacyPermissionNames[bit] ||
      bit.toLowerCase().split("_").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("");
    const normalizedBit = discord.PermissionFlagsBits[normalizedName];
    if (normalizedBit !== undefined) return originalPermissionResolve.call(this, normalizedBit);
  }
  return originalPermissionResolve.call(this, bit);
};

const buttonStyles = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
  LINK: 5,
};

class MessageEmbed extends EmbedBuilder {
  setAuthor(name, iconURL, url) {
    if (name && typeof name === "object") return super.setAuthor(name);
    return super.setAuthor({ name: String(name || ""), iconURL, url });
  }

  setFooter() {
    const [textOrOptions, iconURL] = arguments;
    if (typeof textOrOptions === "string") {
      return super.setFooter({ text: textOrOptions, iconURL });
    }
    if (textOrOptions && typeof textOrOptions === "object") {
      return super.setFooter(textOrOptions);
    }
    return this;
  }

  addField(name, value, inline = false) {
    return super.addFields({ name: String(name), value: String(value), inline });
  }
}

class MessageButton extends ButtonBuilder {
  setStyle(style) {
    return super.setStyle(
      typeof style === "string" ? buttonStyles[style.toUpperCase()] || 2 : style
    );
  }

  setEmoji(emoji) {
    if (typeof emoji === "string") {
      const customEmoji = emoji.match(/^<(a?):([^:]+):(\d+)>$/);
      if (customEmoji) {
        return super.setEmoji({
          name: customEmoji[2],
          id: customEmoji[3],
          animated: customEmoji[1] === "a",
        });
      }
      return super.setEmoji({ name: emoji });
    }
    return super.setEmoji(emoji);
  }
}

function parseLegacyEmoji(value) {
  const raw = String(value || "");
  const customEmoji = raw.match(/^<(a?):([^:]+):(\d+)>$/);
  if (customEmoji) {
    return {
      animated: customEmoji[1] === "a",
      name: customEmoji[2],
      id: customEmoji[3],
    };
  }
  return { animated: false, name: raw, id: null };
}

const intents = {};
for (const [legacyName, modernName] of Object.entries({
  GUILD_EMOJIS_AND_STICKERS: "GuildEmojisAndStickers",
  GUILDS: "Guilds",
  GUILD_MESSAGES: "GuildMessages",
  GUILD_VOICE_STATES: "GuildVoiceStates",
  GUILD_PRESENCES: "GuildPresences",
  GUILD_MEMBERS: "GuildMembers",
  GUILD_WEBHOOKS: "GuildWebhooks",
  GUILD_MESSAGE_REACTIONS: "GuildMessageReactions",
  GUILD_BANS: "GuildBans",
  GUILD_INVITES: "GuildInvites",
  GUILD_INTEGRATIONS: "GuildIntegrations",
  DIRECT_MESSAGES: "DirectMessages",
  DIRECT_MESSAGE_REACTIONS: "DirectMessageReactions",
  DIRECT_MESSAGE_TYPING: "DirectMessageTyping",
  MESSAGE_CONTENT: "MessageContent",
})) {
  intents[legacyName] = GatewayIntentBits[modernName];
}

Object.assign(discord, {
  MessageEmbed,
  MessageActionRow: ActionRowBuilder,
  MessageButton,
  MessageSelectMenu: StringSelectMenuBuilder,
  MessageSelectOption: StringSelectMenuOptionBuilder,
  Intents: { FLAGS: intents },
  Util: {
    ...(discord.Util && typeof discord.Util === "object" ? discord.Util : {}),
    parseEmoji: discord.Util?.parseEmoji || parseLegacyEmoji,
  },
});

const originalMessageDelete = Message.prototype.delete;
Message.prototype.delete = function patchedDelete(options) {
  if (options && typeof options === "object" && Number.isFinite(options.timeout)) {
    const delay = Math.max(0, Number(options.timeout));
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Promise.resolve(originalMessageDelete.call(this)).then(resolve, reject);
      }, delay);
    });
  }
  return originalMessageDelete.call(this, options);
};

const activityTypes = {
  PLAYING: ActivityType.Playing,
  STREAMING: ActivityType.Streaming,
  LISTENING: ActivityType.Listening,
  WATCHING: ActivityType.Watching,
  COMPETING: ActivityType.Competing,
};
const originalSetActivity = ClientUser.prototype.setActivity;
ClientUser.prototype.setActivity = function patchedSetActivity(name, options = {}) {
  if (typeof options.type === "string") {
    options = {
      ...options,
      type: activityTypes[options.type.toUpperCase()] ?? ActivityType.Playing,
    };
  }
  return originalSetActivity.call(this, name, options);
};

const databaseFile = path.join(process.cwd(), "manager-db.json");
let database = {};
try {
  if (fs.existsSync(databaseFile)) {
    database = JSON.parse(fs.readFileSync(databaseFile, "utf8"));
  }
} catch {
  database = {};
}

function saveDatabase() {
  fs.writeFileSync(databaseFile, JSON.stringify(database, null, 2), { mode: 0o600 });
}

const legacyDb = {
  get(key) {
    return database[key];
  },
  set(key, value) {
    database[key] = value;
    saveDatabase();
    return value;
  },
  push(key, value) {
    const values = Array.isArray(database[key]) ? database[key] : [];
    values.push(value);
    database[key] = values;
    saveDatabase();
    return values;
  },
  add(key, value = 1) {
    database[key] = Number(database[key] || 0) + Number(value);
    saveDatabase();
    return database[key];
  },
  subtract(key, value = 1) {
    database[key] = Number(database[key] || 0) - Number(value);
    saveDatabase();
    return database[key];
  },
  delete(key) {
    delete database[key];
    saveDatabase();
  },
  has(key) {
    return Object.prototype.hasOwnProperty.call(database, key);
  },
  fetch(key) {
    return database[key];
  },
  all() {
    return Object.entries(database).map(([ID, data]) => ({ ID, data }));
  },
  clear() {
    database = {};
    saveDatabase();
  },
};

const originalLoad = Module._load;
const requestShim = async (url, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  try {
    const response = await fetch(url, options || {});
    const body = await response.text();
    callback?.(null, { statusCode: response.status, headers: response.headers }, body);
  } catch (error) {
    callback?.(error);
  }
};
requestShim.get = requestShim;

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "request") return requestShim;
  if (request === "quick.db") return legacyDb;
  if (request === "enhanced-ms") {
    const enhancedMs = originalLoad.call(this, request, parent, isMain);
    return enhancedMs.default || enhancedMs.ms || enhancedMs;
  }
  return originalLoad.call(this, request, parent, isMain);
};
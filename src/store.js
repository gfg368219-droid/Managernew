const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { dataFile, dataVersion } = require("./config");

const key = crypto
  .createHash("sha256")
  .update(process.env.SESSION_SECRET)
  .digest();

function emptyState() {
  return { version: dataVersion, licenses: [], bots: [] };
}

function readState() {
  try {
    if (!fs.existsSync(dataFile)) return emptyState();
    const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      version: dataVersion,
      licenses: Array.isArray(parsed.licenses) ? parsed.licenses : [],
      bots: Array.isArray(parsed.bots) ? parsed.bots : [],
    };
  } catch (error) {
    console.error("Impossible de lire le stockage :", error.message);
    return emptyState();
  }
}

let state = readState();

function persist() {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const tempFile = `${dataFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.renameSync(tempFile, dataFile);
}

function randomKey(prefix) {
  return `${prefix}-${crypto.randomBytes(18).toString("base64url").toUpperCase()}`;
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    value: encrypted.toString("base64"),
  };
}

function decrypt(payload) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.value, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function createLicense({ ownerId, maxUses, durationMs, type = "gestion" }) {
  const license = {
    id: crypto.randomUUID(),
    code: randomKey("MOZ"),
    ownerId,
    maxUses,
    used: 0,
    durationMs,
    type,
    createdAt: Date.now(),
  };
  state.licenses.push(license);
  persist();
  return license;
}

function findLicense(code) {
  const normalized = String(code || "").trim().toUpperCase();
  return state.licenses.find((license) => license.code === normalized);
}

function consumeLicense(code, userId) {
  const license = findLicense(code);
  if (!license) throw new Error("Cette clé de licence est introuvable.");
  if (license.ownerId !== userId) {
    throw new Error("Cette clé appartient à un autre compte Discord.");
  }
  if (license.used >= license.maxUses) {
    throw new Error("Cette clé a atteint sa limite d'utilisation.");
  }
  license.used += 1;
  persist();
  return license;
}

function createBot({ ownerId, displayName, token, license }) {
  const bot = {
    id: crypto.randomUUID(),
    ownerId,
    displayName,
    token: encrypt(token),
    discordId: null,
    discordTag: null,
    avatarUrl: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + license.durationMs,
    licenseId: license.id,
    botType: license.type || "gestion",
    recoveryKey: randomKey("REC"),
  };
  state.bots.push(bot);
  persist();
  return bot;
}

function listBotsForUser(userId) {
  return state.bots.filter((bot) => bot.ownerId === userId);
}

function getBot(id) {
  return state.bots.find((bot) => bot.id === id);
}

function getBotToken(bot) {
  return decrypt(bot.token);
}

function updateBotToken(id, token) {
  const bot = getBot(id);
  if (!bot) return null;
  bot.token = encrypt(token);
  bot.lastError = null;
  persist();
  return bot;
}

function updateBot(id, changes) {
  const bot = getBot(id);
  if (!bot) return null;
  Object.assign(bot, changes);
  persist();
  return bot;
}

function deleteBot(id) {
  const index = state.bots.findIndex((bot) => bot.id === id);
  if (index === -1) return false;
  state.bots.splice(index, 1);
  persist();
  return true;
}

function claimBot(recoveryKey, newOwnerId) {
  const normalized = String(recoveryKey || "").trim().toUpperCase();
  const bot = state.bots.find((candidate) => candidate.recoveryKey === normalized);
  if (!bot) throw new Error("Cette clé de récupération est invalide.");
  if (bot.ownerId === newOwnerId) {
    throw new Error("Ce bot est déjà rattaché à votre compte.");
  }
  bot.ownerId = newOwnerId;
  persist();
  return bot;
}

function renewBot(botId, ownerId, licenseCode) {
  const bot = getBot(botId);
  if (!bot || bot.ownerId !== ownerId) {
    throw new Error("Bot introuvable ou accès refusé.");
  }
  const license = consumeLicense(licenseCode, ownerId);
  bot.expiresAt = Math.max(Date.now(), bot.expiresAt) + license.durationMs;
  bot.licenseId = license.id;
  bot.botType = license.type || bot.botType || "gestion";
  persist();
  return bot;
}

function allBots() {
  return state.bots;
}

module.exports = {
  randomKey,
  createLicense,
  findLicense,
  consumeLicense,
  createBot,
  listBotsForUser,
  getBot,
  getBotToken,
  updateBotToken,
  updateBot,
  deleteBot,
  claimBot,
  renewBot,
  allBots,
};
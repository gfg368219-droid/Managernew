const fs = require("node:fs");
const path = require("node:path");
const { fork } = require("node:child_process");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const config = require("./config");
const store = require("./store");

class HostManager {
  constructor() {
    this.clients = new Map();
    this.starting = new Set();
  }

  status(bot) {
    if (bot.expiresAt <= Date.now()) return "expired";
    const hosted = this.clients.get(bot.id);
    if (hosted?.kind === "discord" && hosted.client?.isReady()) return "online";
    if (hosted?.kind === "process" && hosted.ready) return "online";
    if (this.starting.has(bot.id)) return "starting";
    return "offline";
  }

  async start(bot) {
    if (bot.expiresAt <= Date.now()) {
      store.updateBot(bot.id, { lastError: "Licence expirée" });
      return { ok: false, error: "La licence de ce bot est expirée." };
    }
    if (this.clients.has(bot.id) || this.starting.has(bot.id)) {
      return { ok: true, alreadyRunning: true };
    }

    const botType = bot.botType || "gestion";
    if (botType === "gestion" || botType === "coin") {
      return this.startManagedProcess(bot, botType);
    }
    return this.startLegacy(bot);
  }

  async startManagedProcess(bot, botType) {
    this.starting.add(bot.id);
    const runtimeDir = path.resolve(config.dataFile, "..", "hosted", bot.id);
    const templateDir = path.resolve(__dirname, "bot-types", botType);
    const typeLabel = botType === "coin" ? "Coin" : "Gestion";
    try {
      fs.mkdirSync(runtimeDir, { recursive: true });
      fs.cpSync(templateDir, runtimeDir, { recursive: true, force: true });
      if (botType === "coin") {
        fs.mkdirSync(path.join(runtimeDir, "Utils", "DataBase"), { recursive: true });
      }
      const childEnv = {
        ...process.env,
        BOT_RUNTIME_TOKEN: store.getBotToken(bot),
        BOT_OWNER_ID: bot.ownerId,
        BOT_ID: bot.id,
        BOT_EXPIRES_AT: String(bot.expiresAt),
      };
      if (botType === "coin") {
        delete childEnv.COIN_API_PORT;
        const apiPort = this.getCoinApiPort(bot);
        if (apiPort) childEnv.COIN_API_PORT = String(apiPort);
      }
      const child = fork(path.join(runtimeDir, "runner.js"), [], {
        cwd: runtimeDir,
        silent: true,
        env: childEnv,
      });
      this.clients.set(bot.id, { kind: "process", process: child, runtimeDir, ready: false });
      child.stdout?.on("data", (chunk) => {
        console.log(`[${botType}:${bot.id}] ${String(chunk).trim()}`);
      });
      child.stderr?.on("data", (chunk) => {
        console.error(`[${botType}:${bot.id}] ${String(chunk).trim()}`);
      });
      child.on("message", (message) => {
        if (message?.type === "error") {
          store.updateBot(bot.id, { lastError: message.message });
          this.starting.delete(bot.id);
          return;
        }
        if (message?.type !== "ready") return;
        store.updateBot(bot.id, {
          discordId: message.user.id,
          discordTag: message.user.tag,
          avatarUrl: message.user.avatarUrl,
          lastError: null,
        });
        const hosted = this.clients.get(bot.id);
        if (hosted?.process === child) hosted.ready = true;
        this.starting.delete(bot.id);
        console.log(`[host] ${message.user.tag} est en ligne comme bot ${typeLabel}`);
      });
      child.on("error", (error) => {
        store.updateBot(bot.id, { lastError: error.message });
        this.starting.delete(bot.id);
      });
      child.on("exit", (code, signal) => {
        this.starting.delete(bot.id);
        if (this.clients.get(bot.id)?.process === child) {
          this.clients.delete(bot.id);
        }
        if (code !== 0 && bot.expiresAt > Date.now()) {
          store.updateBot(bot.id, {
            lastError: `Processus arrêté (${signal || `code ${code}`})`,
          });
        }
      });
      return { ok: true };
    } catch (error) {
      this.starting.delete(bot.id);
      this.clients.delete(bot.id);
      store.updateBot(bot.id, { lastError: error.message });
      return { ok: false, error: `Le bot ${typeLabel} n'a pas pu être lancé.` };
    } finally {
      this.starting.delete(bot.id);
    }
  }

  getCoinApiPort(bot) {
    const basePort = Number.parseInt(process.env.COIN_API_PORT_BASE || "", 10);
    if (!Number.isInteger(basePort) || basePort < 1024 || basePort > 65535) return null;

    const coinBots = store
      .allBots()
      .filter((candidate) => candidate.botType === "coin");
    const index = coinBots.findIndex((candidate) => candidate.id === bot.id);
    const port = basePort + Math.max(index, 0);
    return port <= 65535 ? port : null;
  }

  async startLegacy(bot) {
    this.starting.add(bot.id);
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
      partials: [Partials.Channel],
    });
    this.clients.set(bot.id, { kind: "discord", client });

    client.once("ready", () => {
      store.updateBot(bot.id, {
        discordId: client.user.id,
        discordTag: client.user.tag,
        avatarUrl: client.user.displayAvatarURL({ size: 128 }),
        lastError: null,
      });
      this.starting.delete(bot.id);
      console.log(`[host] ${client.user.tag} est en ligne`);
    });
    client.on("error", (error) => {
      store.updateBot(bot.id, { lastError: error.message });
      console.error(`[host] erreur du bot ${bot.id}:`, error.message);
    });
    client.on("shardError", (error) => {
      store.updateBot(bot.id, { lastError: error.message });
      console.error(`[host] shard error ${bot.id}:`, error.message);
    });

    try {
      await client.login(store.getBotToken(bot));
      return { ok: true };
    } catch (error) {
      this.starting.delete(bot.id);
      this.clients.delete(bot.id);
      store.updateBot(bot.id, { lastError: error.message });
      try {
        client.destroy();
      } catch {
        // Le client peut être partiellement initialisé.
      }
      return { ok: false, error: "Token invalide ou connexion refusée par Discord." };
    } finally {
      this.starting.delete(bot.id);
    }
  }

  async stop(botId) {
    const hosted = this.clients.get(botId);
    if (!hosted) return false;
    if (hosted.kind === "process") {
      hosted.process.kill("SIGTERM");
    } else {
      hosted.client.destroy();
    }
    this.clients.delete(botId);
    return true;
  }

  async restart(bot) {
    await this.stop(bot.id);
    return this.start(bot);
  }

  async startAll() {
    for (const bot of store.allBots()) {
      if (bot.expiresAt > Date.now()) {
        await this.start(bot);
      }
    }
  }

  async stopAll() {
    await Promise.all([...this.clients.keys()].map((id) => this.stop(id)));
  }

  async stopExpired() {
    const expiredBots = store
      .allBots()
      .filter((bot) => bot.expiresAt <= Date.now() && this.clients.has(bot.id));
    await Promise.all(expiredBots.map((bot) => this.stop(bot.id)));
    return expiredBots.length;
  }
}

module.exports = HostManager;
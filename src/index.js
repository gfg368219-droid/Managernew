const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("./config");
const store = require("./store");
const HostManager = require("./host-manager");
const ui = require("./ui");
const { parseDuration, parseUses, formatDate, getBotTypeChangeAvailableAt } = require("./format");
const { getBotType, listBotTypes } = require("./bot-types");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const hostManager = new HostManager();
const commands = [
  new SlashCommandBuilder()
    .setName("createkey")
    .setDescription("Créer une clé de licence pour héberger des bots")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  new SlashCommandBuilder()
    .setName("createbot")
    .setDescription("Mettre un bot Discord en ligne"),
  new SlashCommandBuilder()
    .setName("mybot")
    .setDescription("Voir et gérer vos bots hébergés"),
  new SlashCommandBuilder()
    .setName("mybots")
    .setDescription("Alias de /mybot"),
  new SlashCommandBuilder()
    .setName("claimbot")
    .setDescription("Rattacher un bot avec une clé de récupération")
    .addStringOption((option) =>
      option
        .setName("cle")
        .setDescription("Clé de récupération du bot")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

function shortModalInput(id, label, placeholder) {
  return new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(placeholder)
    .setRequired(true);
}

function createKeyModal(type) {
  return new ModalBuilder()
    .setCustomId(`modal:createkey:${type}`)
    .setTitle(`Créer une clé ${getBotType(type)?.label || type}`)
    .addComponents(
      new (require("discord.js").ActionRowBuilder)().addComponents(
        shortModalInput("uses", "Nombre d'utilisations", "Ex : 3")
      ),
      new (require("discord.js").ActionRowBuilder)().addComponents(
        shortModalInput("duration", "Durée par bot", "Ex : 30j, 12h, 2mois")
      )
    );
}

function createBotModal() {
  return new ModalBuilder()
    .setCustomId("modal:createbot")
    .setTitle("Mettre un bot en ligne")
    .addComponents(
      new (require("discord.js").ActionRowBuilder)().addComponents(
        shortModalInput("name", "Nom affiché", "Ex : Mon bot")
      ),
      new (require("discord.js").ActionRowBuilder)().addComponents(
        shortModalInput("token", "Token du bot", "Collez le token Discord ici")
      ),
      new (require("discord.js").ActionRowBuilder)().addComponents(
        shortModalInput("license", "Clé de licence", "MOZ-...")
      )
    );
}

function simpleModal(customId, title, fields) {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(
      ...fields.map(({ id, label, placeholder }) =>
        new (require("discord.js").ActionRowBuilder)().addComponents(
          shortModalInput(id, label, placeholder)
        )
      )
    );
}

function getModalValue(interaction, id) {
  return interaction.fields.getTextInputValue(id).trim();
}

async function replyError(interaction, error) {
  const message = error instanceof Error ? error.message : String(error);
  const payload = ui.container(
    "Impossible d'effectuer cette action",
    message,
    [],
    0xef4444
  );
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload);
  }
  return interaction.reply({
    ...payload,
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

async function showBots(interaction, page = 0) {
  const bots = store.listBotsForUser(interaction.user.id);
  return interaction.reply({
    ...ui.buildBotsPage(bots, page, 3, hostManager, getBotType),
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}

async function showBot(interaction, botId) {
  const bot = store.getBot(botId);
  if (!bot || bot.ownerId !== interaction.user.id) {
    return replyError(interaction, "Bot introuvable ou accès refusé.");
  }
  return interaction.update({
    ...ui.buildBotPanel(bot, hostManager.status(bot), getBotType),
  });
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(config.managerToken);
  const route = config.guildId
    ? Routes.applicationGuildCommands(client.user.id, config.guildId)
    : Routes.applicationCommands(client.user.id);
  await rest.put(route, { body: commands });
  console.log(`[manager] ${commands.length} commandes enregistrées`);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[manager] Connecté en tant que ${readyClient.user.tag}`);
  try {
    await registerCommands();
    await hostManager.startAll();
  } catch (error) {
    console.error("[manager] Initialisation partielle :", error.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "createkey") {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
          return replyError(interaction, "La création de clés est réservée aux administrateurs.");
        }
        return interaction.reply({
          ...ui.buildLicenseTypePicker(listBotTypes()),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
      if (interaction.commandName === "createbot") {
        return interaction.showModal(createBotModal());
      }
      if (interaction.commandName === "mybot" || interaction.commandName === "mybots") {
        return showBots(interaction);
      }
      if (interaction.commandName === "claimbot") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const bot = store.claimBot(interaction.options.getString("cle"), interaction.user.id);
        const startResult = await hostManager.restart(bot);
        return interaction.editReply({
          ...ui.container(
            "Bot récupéré",
            `${bot.displayName} est maintenant visible dans /mybot.\n` +
              (startResult.ok ? "Le bot est en cours de mise en ligne." : `Le bot reste hors ligne : ${startResult.error}`),
            [
              new (require("discord.js").ActionRowBuilder)().addComponents(
                ui.button(`bot:manage:${bot.id}`, "Gérer le bot", 1)
              ),
            ]
          ),
        });
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("modal:createkey:")) {
        const type = interaction.customId.split(":")[2];
        if (!getBotType(type)) throw new Error("Type de bot inconnu.");
        const maxUses = parseUses(getModalValue(interaction, "uses"));
        const durationMs = parseDuration(getModalValue(interaction, "duration"));
        const license = store.createLicense({
          ownerId: interaction.user.id,
          maxUses,
          durationMs,
          type,
        });
        return interaction.reply({
          ...ui.container(
            "Clé de licence créée",
            `Votre clé est prête.\n\n` +
              `Clé : ||\`${license.code}\`||\n` +
              `Type : ${getBotType(license.type).label}\n` +
              `Utilisations : ${license.maxUses}\n` +
              `Durée par bot : ${require("./format").formatDuration(license.durationMs)}\n\n` +
              "Copiez-la maintenant et gardez-la en lieu sûr.",
            [],
            0x22c55e
          ),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      if (interaction.customId === "modal:createbot") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const name = getModalValue(interaction, "name").slice(0, 80);
        const token = getModalValue(interaction, "token");
        const licenseCode = getModalValue(interaction, "license");
        const license = store.consumeLicense(licenseCode, interaction.user.id);
        const bot = store.createBot({
          ownerId: interaction.user.id,
          displayName: name,
          token,
          license,
        });
        const result = await hostManager.start(bot);
        if (!result.ok) {
          return interaction.editReply({
            ...ui.container(
              "Bot enregistré",
              `Le bot ${bot.displayName} a été enregistré, mais n'a pas pu démarrer.\n\n` +
                `${result.error}\n` +
                "Vérifiez le token depuis le bouton **Modifier token**.",
              [
                new (require("discord.js").ActionRowBuilder)().addComponents(
                  ui.button(`bot:manage:${bot.id}`, "Gérer le bot", 1)
                ),
              ],
              0xf59e0b
            ),
          });
        }
        return interaction.editReply({
          ...ui.container(
            "Bot enregistré",
            `${bot.displayName} est rattaché au type ${getBotType(bot.botType).label}.\n` +
              "Le processus démarre et apparaîtra dans /mybot.",
            [
              new (require("discord.js").ActionRowBuilder)().addComponents(
                ui.button(`bot:manage:${bot.id}`, "Gérer le bot", 1)
              ),
            ],
            0x22c55e
          ),
        });
      }

      const [kind, action, botId] = interaction.customId.split(":");
      const bot = store.getBot(botId);
      if (!bot || bot.ownerId !== interaction.user.id) {
        return replyError(interaction, "Bot introuvable ou accès refusé.");
      }
      if (kind === "modal" && action === "token") {
        const token = getModalValue(interaction, "token");
        await hostManager.stop(bot.id);
        const updatedBot = store.updateBotToken(bot.id, token);
        const result = await hostManager.start(updatedBot);
        return interaction.reply({
          ...ui.container(
            result.ok ? "Token modifié" : "Token enregistré",
            result.ok
              ? `Le token de ${bot.displayName} a été remplacé et le bot est de nouveau en ligne.`
              : `Le nouveau token a été enregistré, mais le bot n'a pas pu démarrer.\n\n${result.error}`,
            [
              new (require("discord.js").ActionRowBuilder)().addComponents(
                ui.button(`bot:manage:${bot.id}`, "Retour à la gestion", 2)
              ),
            ],
            result.ok ? 0x22c55e : 0xf59e0b
          ),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
      if (kind === "modal" && action === "renew") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const renewed = store.renewBot(bot.id, interaction.user.id, getModalValue(interaction, "license"));
        const result = await hostManager.start(renewed);
        return interaction.editReply({
          ...ui.container(
            "Bot renouvelé",
            `La licence de ${renewed.displayName} est valide jusqu'au ${require("./format").formatDate(renewed.expiresAt)}.\n` +
              (result.ok ? "Le bot est en ligne." : result.error),
            [
              new (require("discord.js").ActionRowBuilder)().addComponents(
                ui.button(`bot:manage:${bot.id}`, "Retour à la gestion", 2)
              ),
            ],
            0x22c55e
          ),
        });
      }
      if (kind === "modal" && action === "transfer") {
        const targetId = getModalValue(interaction, "user");
        if (!/^\d{17,20}$/.test(targetId)) throw new Error("L'identifiant Discord est invalide.");
        const transferred = store.updateBot(bot.id, { ownerId: targetId });
        await hostManager.restart(transferred);
        return interaction.reply({
          ...ui.container(
            "Propriété transférée",
            `Le bot ${bot.displayName} appartient maintenant à <@${targetId}>.\n` +
              "Il apparaîtra dans son `/mybot`.",
            [],
            0x22c55e
          ),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (interaction.isButton()) {
      const [kind, action, value, extra] = interaction.customId.split(":");
      if (kind === "bots" && action === "page") {
        return interaction.update(
          ui.buildBotsPage(store.listBotsForUser(interaction.user.id), Number(value), 3, hostManager, getBotType)
        );
      }
      if (kind === "bot" && action === "manage") return showBot(interaction, value);

      const bot = store.getBot(value);
      if (!bot || bot.ownerId !== interaction.user.id) {
        return replyError(interaction, "Bot introuvable ou accès refusé.");
      }
      if (kind === "bot" && action === "type-change") {
        if (bot.expiresAt <= Date.now()) {
          return replyError(interaction, "La licence de ce bot est expirée.");
        }
        const availableAt = getBotTypeChangeAvailableAt(bot);
        if (availableAt > Date.now()) {
          return replyError(interaction, `Vous pourrez changer de type à partir du ${formatDate(availableAt)}.`);
        }
        return interaction.reply({
          ...ui.buildBotTypePicker(bot, listBotTypes(), getBotType),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
      if (kind === "bot" && action === "type-confirm") {
        const previousType = bot.botType || "gestion";
        const previousTypeChangedAt = bot.lastTypeChangedAt;
        const wasRunning = hostManager.status(bot) !== "offline";
        await interaction.deferUpdate();
        const updatedBot = store.changeBotType(bot.id, interaction.user.id, extra);
        let result = await hostManager.restart(updatedBot);
        if (result.ok) result = await hostManager.waitForReady(bot.id);
        if (!result.ok) {
          await hostManager.stop(bot.id);
          const restoredBot = store.updateBot(bot.id, {
            botType: previousType,
            lastTypeChangedAt: previousTypeChangedAt,
          });
          let restoreStatus = "Le bot était hors ligne et reste arrêté.";
          if (wasRunning) {
            const restoreStart = await hostManager.start(restoredBot);
            const restoredReady = restoreStart.ok
              ? await hostManager.waitForReady(bot.id)
              : restoreStart;
            restoreStatus = restoredReady.ok
              ? `Le type ${getBotType(previousType)?.label || previousType} a été remis en marche.`
              : `Le type d'origine a été restauré, mais son redémarrage a échoué : ${restoredReady.error}`;
          }
          return interaction.editReply({
            ...ui.container(
              "Changement annulé",
              `Le nouveau type n'a pas démarré : ${result.error}\n${restoreStatus} Aucun délai de 7 jours n'a été appliqué.`,
              [
                new (require("discord.js").ActionRowBuilder)().addComponents(
                  ui.button(`bot:manage:${bot.id}`, "Retour à la gestion")
                ),
              ],
              0xef4444
            ),
          });
        }
        const nextChangeAt = getBotTypeChangeAvailableAt(updatedBot);
        const nextTypeLabel = getBotType(updatedBot.botType).label;
        return interaction.editReply({
          ...ui.container(
            "Type modifié",
            `${updatedBot.displayName} utilise maintenant le type ${nextTypeLabel} et le bot est en ligne.\n` +
              `Prochain changement possible le ${formatDate(nextChangeAt)}.`,
            [
              new (require("discord.js").ActionRowBuilder)().addComponents(
                ui.button(`bot:manage:${bot.id}`, "Retour à la gestion")
              ),
            ],
            0x22c55e
          ),
        });
      }
      if (kind === "recovery" && action === "view") {
        return interaction.reply({
          ...ui.buildPrivateKey(bot),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
      if (kind === "recovery" && action === "regen") {
        store.updateBot(bot.id, { recoveryKey: store.randomKey("REC") });
        return interaction.reply({
          ...ui.buildPrivateKey(store.getBot(bot.id), true),
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
      if (kind === "bot" && ["start", "restart", "stop"].includes(action)) {
        await interaction.deferUpdate();
        const result =
          action === "start"
            ? await hostManager.start(bot)
            : action === "restart"
              ? await hostManager.restart(bot)
              : { ok: await hostManager.stop(bot.id) };
        if (!result.ok) {
          return interaction.followUp({
            ...ui.container("Action impossible", result.error || "Le bot n'est pas démarré.", [], 0xef4444),
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }
        return interaction.editReply(ui.buildBotPanel(bot, hostManager.status(bot), getBotType));
      }
      if (kind === "bot" && action === "token") {
        return interaction.showModal(
          simpleModal(`modal:token:${bot.id}`, "Modifier le token", [
            { id: "token", label: "Nouveau token", placeholder: "Collez le nouveau token Discord ici" },
          ])
        );
      }
      if (kind === "bot" && action === "renew") {
        return interaction.showModal(
          simpleModal(`modal:renew:${bot.id}`, "Renouveler le bot", [
            { id: "license", label: "Clé de licence", placeholder: "MOZ-..." },
          ])
        );
      }
      if (kind === "bot" && action === "transfer") {
        return interaction.showModal(
          simpleModal(`modal:transfer:${bot.id}`, "Transférer la propriété", [
            { id: "user", label: "ID du nouveau propriétaire", placeholder: "123456789012345678" },
          ])
        );
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "keytype:select") {
      const type = interaction.values[0];
      if (!getBotType(type)) return replyError(interaction, "Type de bot inconnu.");
      return interaction.showModal(createKeyModal(type));
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("bot:type-select:")) {
      const botId = interaction.customId.split(":")[2];
      const bot = store.getBot(botId);
      if (!bot || bot.ownerId !== interaction.user.id) {
        return replyError(interaction, "Bot introuvable ou accès refusé.");
      }
      if (bot.expiresAt <= Date.now()) {
        return replyError(interaction, "La licence de ce bot est expirée.");
      }
      const nextType = interaction.values[0];
      if (!getBotType(nextType) || nextType === (bot.botType || "gestion")) {
        return replyError(interaction, "Choisissez un type différent et valide.");
      }
      const availableAt = getBotTypeChangeAvailableAt(bot);
      if (availableAt > Date.now()) {
        return replyError(interaction, `Vous pourrez changer de type à partir du ${formatDate(availableAt)}.`);
      }
      return interaction.update(ui.buildBotTypeConfirm(bot, nextType, getBotType));
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("bots:select:")) {
      return showBot(interaction, interaction.values[0]);
    }
  } catch (error) {
    console.error("[interaction]", error);
    return replyError(interaction, error);
  }
});

process.on("SIGINT", async () => {
  await hostManager.stopAll();
  client.destroy();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await hostManager.stopAll();
  client.destroy();
  process.exit(0);
});

const expiryTimer = setInterval(() => {
  hostManager.stopExpired().catch((error) => {
    console.error("[host] impossible d'arrêter les bots expirés :", error.message);
  });
}, 60_000);
expiryTimer.unref();

client.login(config.managerToken).catch((error) => {
  console.error("[manager] Connexion impossible :", error.message);
  process.exitCode = 1;
});
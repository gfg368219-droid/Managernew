const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} = require("discord.js");
const { managerColor } = require("./config");
const { formatDate, formatRemaining } = require("./format");

function text(content) {
  return new TextDisplayBuilder().setContent(content);
}

function button(customId, label, style = ButtonStyle.Secondary) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style);
}

function container(title, body, rows = [], accent = managerColor) {
  const box = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(text(title));
  if (body) box.addTextDisplayComponents(text(body));
  if (rows.length) box.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  for (const row of rows) box.addActionRowComponents(row);
  return {
    components: [box],
    flags: MessageFlags.IsComponentsV2,
  };
}

function buildLicenseTypePicker(types) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("keytype:select")
    .setPlaceholder("Choisir le type de bot")
    .addOptions(
      types.map((type) => ({
        label: type.label,
        value: type.id,
        description: type.description.slice(0, 100),
      }))
    );

  return container(
    "Créer une clé de licence",
    "Choisissez le type de bot associé à cette clé. Le type sera appliqué automatiquement lors de la création du bot.",
    [new ActionRowBuilder().addComponents(select)]
  );
}

function statusLabel(status) {
  return {
    online: "En ligne",
    starting: "Démarrage",
    offline: "Hors ligne",
    expired: "Expiré",
  }[status] || "Inconnu";
}

function botInvite(bot) {
  if (!bot.discordId) return null;
  return `https://discord.com/oauth2/authorize?client_id=${bot.discordId}&scope=bot%20applications.commands&permissions=0`;
}

function buildBotsPage(bots, page, pageSize, hostManager, getType) {
  const totalPages = Math.max(1, Math.ceil(bots.length / pageSize));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const visible = bots.slice(safePage * pageSize, safePage * pageSize + pageSize);
  let body = `Page ${safePage + 1}/${totalPages} · ${bots.length} bot(s)\n\n`;

  if (!visible.length) {
    body += "Vous n'avez encore aucun bot hébergé.\nUtilisez /createbot pour commencer.";
  } else {
    body += visible
      .map((bot, index) => {
        const type = getType(bot.botType)?.label || bot.botType || "Gestion";
        return (
          `${safePage * pageSize + index + 1}. ${bot.displayName} · ${type} · ${formatRemaining(bot.expiresAt)}\n` +
          `Statut : ${statusLabel(hostManager.status(bot))}\n` +
          "Rôle : Propriétaire"
        );
      })
      .join("\n\n");
  }

  const rows = [];
  if (visible.length) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(`bots:select:${safePage}`)
      .setPlaceholder("Sélectionner un bot")
      .addOptions(
        visible.map((bot) => ({
          label: bot.displayName.slice(0, 100),
          value: bot.id,
          description: `${statusLabel(hostManager.status(bot))} · ${formatRemaining(bot.expiresAt)}`.slice(0, 100),
        }))
      );
    rows.push(new ActionRowBuilder().addComponents(select));

    const firstBot = visible[0];
    const invite = botInvite(firstBot);
    const quickRow = new ActionRowBuilder().addComponents(
      button(`bot:manage:${firstBot.id}`, "Gérer", ButtonStyle.Primary)
    );
    if (invite) {
      quickRow.addComponents(
        new ButtonBuilder().setLabel("Inviter").setStyle(ButtonStyle.Link).setURL(invite)
      );
    }
    rows.push(quickRow);
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      button(`bots:page:${safePage - 1}`, "Précédent").setDisabled(safePage === 0),
      button(`bots:page:${safePage + 1}`, "Suivant").setDisabled(safePage >= totalPages - 1)
    )
  );
  return container("Mes bots", body, rows);
}

function buildBotPanel(bot, status, getType) {
  const invite = botInvite(bot);
  const type = getType(bot.botType)?.label || bot.botType || "Gestion";
  const rows = [
    new ActionRowBuilder().addComponents(
      button(`bot:start:${bot.id}`, "Démarrer", ButtonStyle.Success).setDisabled(status === "online" || status === "expired"),
      button(`bot:restart:${bot.id}`, "Redémarrer", ButtonStyle.Primary).setDisabled(status === "expired"),
      button(`bot:stop:${bot.id}`, "Arrêter", ButtonStyle.Danger).setDisabled(status === "offline")
    ),
    new ActionRowBuilder().addComponents(
      button(`bot:token:${bot.id}`, "Modifier le token"),
      button(`bot:transfer:${bot.id}`, "Transférer la propriété")
    ),
    new ActionRowBuilder().addComponents(
      button(`bot:renew:${bot.id}`, "Renouveler"),
      button(`recovery:view:${bot.id}`, "Voir la clé de récupération"),
      button(`recovery:regen:${bot.id}`, "Régénérer la clé", ButtonStyle.Danger)
    ),
  ];
  if (invite) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Inviter").setStyle(ButtonStyle.Link).setURL(invite)
      )
    );
  }

  return container(
    "Mybot",
    `Bot sélectionné : ${bot.displayName}\n` +
      `Type : ${type}\n` +
      `Statut : ${statusLabel(status)}\n` +
      "Rôle : Propriétaire\n" +
      `Licence : ${formatRemaining(bot.expiresAt)}\n` +
      `Expire le : ${formatDate(bot.expiresAt)}`,
    rows,
    status === "expired" ? 0x64748b : managerColor
  );
}

function buildPrivateKey(bot, regenerated = false) {
  return container(
    regenerated ? "Nouvelle clé de récupération" : "Clé de récupération",
    "Cette clé permet à un autre compte d'utiliser /claimbot pour rattacher ce bot.\n\n" +
      `||\`${bot.recoveryKey}\`||`,
    [
      new ActionRowBuilder().addComponents(
        button(`bot:manage:${bot.id}`, "Retour à la gestion")
      ),
    ],
    0xf59e0b
  );
}

module.exports = {
  button,
  container,
  buildLicenseTypePicker,
  buildBotsPage,
  buildBotPanel,
  buildPrivateKey,
  statusLabel,
};
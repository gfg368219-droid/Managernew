const Discord = require("discord.js");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  ModalBuilder,
  RoleSelectMenuBuilder,
  SectionBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThumbnailBuilder,
} = Discord;

const DEFAULT_OPENING_MESSAGE =
  "> *Notre équipe de support vous assistera sous peu.*\n" +
  "*Pour clôturer ce ticket, cliquez sur le bouton ci-dessous.*";

const DEFAULT_CHANNEL_NAME = "{ticketNumber}-{memberUserName}";

function settingsKeys(guildId) {
  return {
    type: `ticket_type_${guildId}`,
    claim: `ticket_claim_${guildId}`,
    transcript: `ticket_transcript_${guildId}`,
    requiredRoles: `ticket_required_roles_${guildId}`,
    deniedRoles: `ticket_denied_roles_${guildId}`,
    mentionRoles: `ticket_mention_roles_${guildId}`,
    accessRoles: `ticket_access_roles_${guildId}`,
    logChannel: `ticket_log_channel_${guildId}`,
    category: `ticket_category_${guildId}`,
    emoji: `ticket_emoji_${guildId}`,
    text: `ticket_text_${guildId}`,
    channelName: `ticket_channel_name_${guildId}`,
    openingMessage: `ticket_bvn_${guildId}`,
    options: `ticket_options_${guildId}`,
    selectedOption: `ticket_selected_option_${guildId}`,
    panelMessage: `ticket_panel_${guildId}`,
    settingsMessage: `ticket_settings_message_${guildId}`,
    settingsChannel: `ticket_settings_channel_${guildId}`,
    title: `ticket_title_${guildId}`,
    description: `ticket_description_${guildId}`,
    reaction: `ticket_react_${guildId}`,
    legacyPanel: `ticket_${guildId}`,
    legacyAccessRoles: `perm_ticket.${guildId}`,
  };
}

function stringArray(value) {
  return Array.isArray(value)
    ? [...new Set(value.filter(item => typeof item === "string" && item.length > 0))]
    : [];
}

function normalizeOptions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(option => option && typeof option === "object" && typeof option.id === "string")
    .slice(0, 25)
    .map(option => ({
      id: option.id.slice(0, 100),
      label: String(option.label || "Support").slice(0, 100),
      description: String(option.description || "").slice(0, 100),
      emoji: typeof option.emoji === "string" ? option.emoji.slice(0, 100) : "",
    }));
}

function readTicketSettings(client, guildId) {
  const keys = settingsKeys(guildId);
  const accessRoles = client.db.get(keys.accessRoles);
  return {
    type: client.db.get(keys.type) === "Button" ? "Button" : "Select",
    claim: client.db.get(keys.claim) === true,
    transcript: client.db.get(keys.transcript) === true,
    requiredRoles: stringArray(client.db.get(keys.requiredRoles)),
    deniedRoles: stringArray(client.db.get(keys.deniedRoles)),
    mentionRoles: stringArray(client.db.get(keys.mentionRoles)),
    accessRoles: stringArray(accessRoles === undefined
      ? client.db.get(keys.legacyAccessRoles)
      : accessRoles),
    logChannel: client.db.get(keys.logChannel) || null,
    category: client.db.get(keys.category) || null,
    emoji: typeof client.db.get(keys.emoji) === "string" ? client.db.get(keys.emoji) : "",
    text: String(client.db.get(keys.text) || "Support"),
    channelName: String(client.db.get(keys.channelName) || DEFAULT_CHANNEL_NAME),
    openingMessage: String(client.db.get(keys.openingMessage) || DEFAULT_OPENING_MESSAGE),
    options: normalizeOptions(client.db.get(keys.options)),
    selectedOption: String(client.db.get(keys.selectedOption) || ""),
    title: String(client.db.get(keys.title) || "Ouvrir un ticket"),
    description: String(client.db.get(keys.description) || "Cliquez ci-dessous pour contacter le support."),
  };
}

function resetTicketSettings(client, guildId) {
  const keys = settingsKeys(guildId);
  const keysToDelete = [
    keys.type,
    keys.claim,
    keys.transcript,
    keys.requiredRoles,
    keys.deniedRoles,
    keys.mentionRoles,
    keys.accessRoles,
    keys.logChannel,
    keys.category,
    keys.emoji,
    keys.text,
    keys.channelName,
    keys.openingMessage,
    keys.options,
    keys.selectedOption,
    keys.panelMessage,
    keys.title,
    keys.description,
    keys.reaction,
    keys.legacyPanel,
  ];
  for (const key of keysToDelete) client.db.delete(key);
  // Keep the command-permission key intact while clearing legacy access-role fallbacks.
  client.db.set(keys.accessRoles, []);
}

function safeEmoji(value) {
  const emoji = typeof value === "string" ? value.trim() : "";
  if (!emoji) return undefined;
  const customEmoji = emoji.match(/^<(a?):([^:]+):(\d+)>$/);
  if (customEmoji) {
    return {
      name: customEmoji[2],
      id: customEmoji[3],
      animated: customEmoji[1] === "a",
    };
  }
  return { name: emoji };
}

function roleSummary(client, guildId, roleIds) {
  const guild = client.guilds.cache.get(guildId);
  return roleIds
    .map(roleId => guild?.roles.cache.get(roleId)?.name)
    .filter(Boolean)
    .map(name => `@${name}`)
    .join(", ");
}

function channelSummary(client, guildId, channelId) {
  const channel = client.guilds.cache.get(guildId)?.channels.cache.get(channelId);
  return channel ? `#${channel.name}` : "";
}

function settingsButton(customId, emoji, style = ButtonStyle.Secondary, disabled = false) {
  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setStyle(style)
    .setDisabled(disabled);
  const parsedEmoji = safeEmoji(emoji);
  if (parsedEmoji) button.setEmoji(parsedEmoji);
  return button;
}

function addSeparator(container) {
  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
}

function addSectionField(container, content, accessory) {
  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
  if (accessory) section.setButtonAccessory(accessory);
  container.addSectionComponents(section);
  addSeparator(container);
}

function roleSelect(client, guildId, key, placeholder, selected) {
  const menu = new RoleSelectMenuBuilder()
    .setCustomId(`ticket-settings:${guildId}:${key}`)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(25);
  const validRoles = selected.filter(id => client.guilds.cache.get(guildId)?.roles.cache.has(id));
  if (validRoles.length) menu.setDefaultRoles(validRoles);
  return menu;
}

function channelSelect(client, guildId, key, placeholder, selected, channelTypes) {
  const menu = new ChannelSelectMenuBuilder()
    .setCustomId(`ticket-settings:${guildId}:${key}`)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(1)
    .setChannelTypes(channelTypes);
  if (selected && client.guilds.cache.get(guildId)?.channels.cache.has(selected)) {
    menu.setDefaultChannels(selected);
  }
  return menu;
}

function buildTicketSettingsMessage(client, guildId, prefix = client.prefix || "!") {
  const settings = readTicketSettings(client, guildId);
  const keys = settingsKeys(guildId);
  const box = new ContainerBuilder().setAccentColor(0x26262c);
  const header = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## ProalsG3n #BACK\n— Ticket Settings"),
      new TextDisplayBuilder().setContent("Permet de gérer le système de ticket.")
    );
  const avatar = client.user?.displayAvatarURL?.({ extension: "png", size: 128 });
  if (avatar) {
    header.setThumbnailAccessory(new ThumbnailBuilder({
      media: { url: avatar },
      description: "ProalsG3n",
    }));
  }
  box.addSectionComponents(header);
  addSeparator(box);

  addSectionField(
    box,
    `**Type:** ${settings.type}`,
    settingsButton(`ticket-settings:${guildId}:cycle-type`, "🔄")
  );
  addSectionField(
    box,
    `**Bouton réclamer:** ${settings.claim ? "Activé ✅" : "Désactivé ❌"}`,
    settingsButton(`ticket-settings:${guildId}:toggle-claim`, "👥", settings.claim ? ButtonStyle.Success : ButtonStyle.Danger)
  );
  addSectionField(
    box,
    `**Transcript Mp:** ${settings.transcript ? "Activé ✅" : "Désactivé ❌"}`,
    settingsButton(`ticket-settings:${guildId}:toggle-transcript`, "📨", settings.transcript ? ButtonStyle.Success : ButtonStyle.Danger)
  );

  box.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Rôles requis:** ${roleSummary(client, guildId, settings.requiredRoles) || "Aucun ❌"}`
  ));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    roleSelect(client, guildId, "required-roles", "Sélectionnez des rôles requis.", settings.requiredRoles)
  ));
  addSeparator(box);

  box.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Rôles interdits:** ${roleSummary(client, guildId, settings.deniedRoles) || "Aucun ❌"}`
  ));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    roleSelect(client, guildId, "denied-roles", "Sélectionnez des rôles qui ne sont pas autorisés.", settings.deniedRoles)
  ));
  addSeparator(box);

  const selectedOption = settings.options.find(option => option.id === settings.selectedOption);
  const optionMenu = new StringSelectMenuBuilder()
    .setCustomId(`ticket-settings:${guildId}:select-option`)
    .setPlaceholder("Sélectionnez une option.")
    .setMinValues(0)
    .setMaxValues(1)
    .setDisabled(settings.type !== "Select" || settings.options.length === 0);
  if (settings.options.length) {
    optionMenu.addOptions(settings.options.map(option => {
      const emoji = safeEmoji(option.emoji);
      const description = option.description || "";
      return {
        label: option.label,
        value: option.id,
        default: option.id === settings.selectedOption,
        ...(description ? { description } : {}),
        ...(emoji ? { emoji } : {}),
      };
    }));
  }
  box.addActionRowComponents(new ActionRowBuilder().addComponents(optionMenu));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    settingsButton(
      `ticket-settings:${guildId}:edit-option`,
      "✏️",
      ButtonStyle.Primary,
      settings.type !== "Select" || !selectedOption
    ),
    settingsButton(`ticket-settings:${guildId}:add-option`, "➕", ButtonStyle.Success, settings.options.length >= 25),
    settingsButton(
      `ticket-settings:${guildId}:delete-option`,
      "🗑️",
      ButtonStyle.Secondary,
      settings.type !== "Select" || !selectedOption
    )
  ));
  addSeparator(box);

  box.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Salon de logs:** ${settings.logChannel ? channelSummary(client, guildId, settings.logChannel) || "Aucun ❌" : "Aucun ❌"}`
  ));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    channelSelect(client, guildId, "log-channel", "Salon de logs", settings.logChannel, [
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement,
    ])
  ));
  addSeparator(box);

  box.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Catégorie:** ${settings.category ? channelSummary(client, guildId, settings.category) || "Aucun ❌" : "Aucun ❌"}`
  ));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    channelSelect(client, guildId, "category", "Sélectionnez une catégorie.", settings.category, [
      ChannelType.GuildCategory,
    ])
  ));
  addSeparator(box);

  addSectionField(
    box,
    `**Émoji:** ${settings.emoji || "Aucun ❌"}`,
    settingsButton(`ticket-settings:${guildId}:edit-emoji`, "😀")
  );
  addSectionField(
    box,
    `**Texte:** ${settings.text}`,
    settingsButton(`ticket-settings:${guildId}:edit-text`, "📋")
  );
  addSectionField(
    box,
    `**Nom du salon:**\n\`${settings.channelName}\``,
    settingsButton(`ticket-settings:${guildId}:edit-channel-name`, "🪶")
  );
  addSectionField(
    box,
    `**Texte d'ouverture:** > ${settings.openingMessage.slice(0, 220).replace(/\n/g, "\n> ")}`,
    settingsButton(`ticket-settings:${guildId}:edit-opening-message`, "✏️")
  );

  box.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Rôles mentionnés:** ${roleSummary(client, guildId, settings.mentionRoles) || "Aucun ❌"}`
  ));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    roleSelect(client, guildId, "mention-roles", "Sélectionnez des rôles à mentionner.", settings.mentionRoles)
  ));
  addSeparator(box);

  box.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Rôles d'accès:** ${roleSummary(client, guildId, settings.accessRoles) || "Aucun ❌"}`
  ));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    roleSelect(client, guildId, "access-roles", "Sélectionnez des rôles d'accès.", settings.accessRoles)
  ));
  addSeparator(box);

  box.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `*Pour afficher la liste des variables, utilisez la commande \`${prefix}variables ticket\`.*`
  ));
  box.addActionRowComponents(new ActionRowBuilder().addComponents(
    settingsButton(`ticket-settings:${guildId}:publish`, "📄", ButtonStyle.Success),
    settingsButton(`ticket-settings:${guildId}:reset`, "🔄", ButtonStyle.Danger)
  ));

  return {
    components: [box],
    flags: MessageFlags.IsComponentsV2,
  };
}

function buildTicketPublishMessage(client, guildId) {
  const settings = readTicketSettings(client, guildId);
  const box = new ContainerBuilder().setAccentColor(0x26262c);
  const header = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${settings.title}`),
      new TextDisplayBuilder().setContent(settings.description)
    );
  const avatar = client.user?.displayAvatarURL?.({ extension: "png", size: 128 });
  if (avatar) {
    header.setThumbnailAccessory(new ThumbnailBuilder({
      media: { url: avatar },
      description: "Ticket",
    }));
  }
  box.addSectionComponents(header);
  addSeparator(box);

  const options = settings.options.length
    ? settings.options
    : [{
      id: "support",
      label: settings.text,
      description: "Ouvrir un ticket de support",
      emoji: settings.emoji,
    }];

  if (settings.type === "Select") {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`ticket:open:${guildId}`)
      .setPlaceholder(settings.text.slice(0, 150))
      .addOptions(options.slice(0, 25).map(option => {
        const emoji = safeEmoji(option.emoji || settings.emoji);
        const description = option.description || "";
        return {
          label: option.label,
          value: option.id,
          ...(description ? { description } : {}),
          ...(emoji ? { emoji } : {}),
        };
      }));
    box.addActionRowComponents(new ActionRowBuilder().addComponents(menu));
  } else {
    for (let i = 0; i < options.length; i += 5) {
      const row = new ActionRowBuilder();
      for (const option of options.slice(i, i + 5)) {
        const button = new ButtonBuilder()
          .setCustomId(`ticket:open:${guildId}:${option.id}`)
          .setLabel(option.label.slice(0, 80))
          .setStyle(ButtonStyle.Primary);
        const emoji = safeEmoji(option.emoji || settings.emoji);
        if (emoji) button.setEmoji(emoji);
        row.addComponents(button);
      }
      box.addActionRowComponents(row);
    }
  }

  return {
    components: [box],
    flags: MessageFlags.IsComponentsV2,
  };
}

function makeInput(customId, label, value, style = TextInputStyle.Short, required = true, maxLength = 1000) {
  const input = new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setRequired(required)
    .setMaxLength(maxLength);
  if (typeof value === "string" && value.length) input.setValue(value.slice(0, maxLength));
  return new ActionRowBuilder().addComponents(input);
}

function buildTicketSettingsModal(guildId, action, settings, option = null) {
  const modal = new ModalBuilder();
  if (action === "edit-text") {
    modal.setCustomId(`ticket-settings-modal:${guildId}:text`).setTitle("Modifier le texte du ticket")
      .addComponents(makeInput("value", "Texte du bouton ou du menu", settings.text, TextInputStyle.Short, true, 80));
  } else if (action === "edit-emoji") {
    modal.setCustomId(`ticket-settings-modal:${guildId}:emoji`).setTitle("Modifier l'émoji")
      .addComponents(makeInput("value", "Émoji (laisser vide pour supprimer)", settings.emoji, TextInputStyle.Short, false, 100));
  } else if (action === "edit-channel-name") {
    modal.setCustomId(`ticket-settings-modal:${guildId}:channel-name`).setTitle("Nom du salon ticket")
      .addComponents(makeInput("value", "Modèle du nom du salon", settings.channelName, TextInputStyle.Short, true, 100));
  } else if (action === "edit-opening-message") {
    modal.setCustomId(`ticket-settings-modal:${guildId}:opening-message`).setTitle("Texte d'ouverture")
      .addComponents(makeInput("value", "Message affiché dans le ticket", settings.openingMessage, TextInputStyle.Paragraph, true, 4000));
  } else if (action === "add-option" || action.startsWith("edit-option:")) {
    const isEdit = action.startsWith("edit-option:");
    const optionId = isEdit ? action.slice("edit-option:".length) : "";
    modal
      .setCustomId(`ticket-settings-modal:${guildId}:${isEdit ? `option-edit:${optionId}` : "option-add"}`)
      .setTitle(isEdit ? "Modifier une option" : "Ajouter une option")
      .addComponents(
        makeInput("label", "Texte affiché", option?.label || "", TextInputStyle.Short, true, 80),
        makeInput("description", "Description de l'option", option?.description || "", TextInputStyle.Short, false, 100),
        makeInput("emoji", "Émoji (facultatif)", option?.emoji || "", TextInputStyle.Short, false, 100)
      );
  }
  return modal;
}

function canManageTicketSettings(client, interaction) {
  const guildId = interaction.guildId || interaction.guild?.id;
  const userId = interaction.user?.id;
  if (!guildId || !userId) return false;
  if (client.staff?.includes(userId) || client.config?.buyers?.includes(userId)) return true;
  if (client.db.get(`owner_${userId}`) === true) return true;

  const permission = client.db.get(`perm_ticket.${guildId}`);
  if (permission === "public") return true;
  if (!["1", "2", "3", "4", "5"].includes(permission)) return false;

  const roleIds = interaction.member?.roles?.cache
    ? [...interaction.member.roles.cache.keys()]
    : Array.isArray(interaction.member?.roles)
      ? interaction.member.roles
      : [];
  const allowedRoleIds = client.db.get(`perm${permission}.${guildId}`) || [];
  return roleIds.some(roleId => allowedRoleIds.includes(roleId));
}

module.exports = {
  DEFAULT_CHANNEL_NAME,
  DEFAULT_OPENING_MESSAGE,
  buildTicketPublishMessage,
  buildTicketSettingsMessage,
  buildTicketSettingsModal,
  canManageTicketSettings,
  normalizeOptions,
  readTicketSettings,
  resetTicketSettings,
  safeEmoji,
  settingsKeys,
};
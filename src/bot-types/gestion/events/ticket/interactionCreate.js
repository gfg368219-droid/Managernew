const crypto = require("node:crypto");
const Discord = require("discord.js");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    TextDisplayBuilder,
} = Discord;
const {
    buildTicketPublishMessage,
    buildTicketSettingsMessage,
    buildTicketSettingsModal,
    canManageTicketSettings,
    readTicketSettings,
    resetTicketSettings,
    settingsKeys,
} = require("../../utils/ticket-settings");
const {
    closeTicketChannel,
    createTicketForMember,
    isTicketChannel,
    sendTicketLog,
} = require("../../utils/ticket-runtime");

function ephemeral(interaction, content) {
    if (interaction.deferred || interaction.replied) {
        return interaction.followUp({ content, ephemeral: true });
    }
    return interaction.reply({ content, ephemeral: true });
}

function confirmPanel(title, description, confirmId, cancelId, danger = false) {
    const box = new ContainerBuilder()
        .setAccentColor(danger ? 0xef4444 : 0x5865f2)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${title}`),
            new TextDisplayBuilder().setContent(description)
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(confirmId)
                    .setLabel("Confirmer")
                    .setStyle(danger ? ButtonStyle.Danger : ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(cancelId)
                    .setLabel("Annuler")
                    .setStyle(ButtonStyle.Secondary)
            )
        );
    return {
        components: [box],
        flags: MessageFlags.IsComponentsV2,
    };
}

async function updateSettingsMessage(interaction, client, guildId) {
    return interaction.update(
        buildTicketSettingsMessage(client, guildId, client.prefix || "!")
    );
}

async function refreshSettingsSourceMessage(client, session) {
    const channel = await client.channels.fetch(session.channelId).catch(() => null);
    if (!channel?.messages) return false;
    const message = await channel.messages.fetch(session.messageId).catch(() => null);
    if (!message) return false;
    await message.edit(
        buildTicketSettingsMessage(client, session.guildId, client.prefix || "!")
    );
    return true;
}

async function showSettingsModal(interaction, client, guildId, action, settings, option) {
    const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const customId = `ticket-settings-modal:${guildId}:${nonce}`;
    const modal = buildTicketSettingsModal(guildId, action, settings, option)
        .setCustomId(customId);
    client.db.set(`ticket_settings_modal_${nonce}`, {
        guildId,
        action,
        optionId: option?.id || null,
        channelId: interaction.channelId,
        messageId: interaction.message?.id,
    });
    return interaction.showModal(modal);
}

async function handleSettingsInteraction(client, interaction) {
    const [, guildId, ...actionParts] = interaction.customId.split(":");
    const action = actionParts.join(":");
    if (guildId !== interaction.guildId || !canManageTicketSettings(client, interaction)) {
        return ephemeral(interaction, "Vous n'avez pas la permission de modifier ces réglages.");
    }

    const keys = settingsKeys(guildId);
    const settings = readTicketSettings(client, guildId);

    if (interaction.isRoleSelectMenu()) {
        const roleKey = {
            "required-roles": keys.requiredRoles,
            "denied-roles": keys.deniedRoles,
            "mention-roles": keys.mentionRoles,
            "access-roles": keys.accessRoles,
        }[action];
        if (!roleKey) return;
        if (interaction.values.length) client.db.set(roleKey, interaction.values);
        else if (action === "access-roles") client.db.set(roleKey, []);
        else client.db.delete(roleKey);
        return updateSettingsMessage(interaction, client, guildId);
    }

    if (interaction.isChannelSelectMenu()) {
        const channelKey = {
            "log-channel": keys.logChannel,
            category: keys.category,
        }[action];
        if (!channelKey) return;
        if (interaction.values[0]) client.db.set(channelKey, interaction.values[0]);
        else client.db.delete(channelKey);
        return updateSettingsMessage(interaction, client, guildId);
    }

    if (interaction.isStringSelectMenu()) {
        if (action !== "select-option") return;
        const optionId = interaction.values[0];
        if (optionId) client.db.set(keys.selectedOption, optionId);
        else client.db.delete(keys.selectedOption);
        return updateSettingsMessage(interaction, client, guildId);
    }

    if (!interaction.isButton()) return;

    if (action === "cycle-type") {
        client.db.set(keys.type, settings.type === "Select" ? "Button" : "Select");
        return updateSettingsMessage(interaction, client, guildId);
    }
    if (action === "toggle-claim") {
        client.db.set(keys.claim, !settings.claim);
        return updateSettingsMessage(interaction, client, guildId);
    }
    if (action === "toggle-transcript") {
        client.db.set(keys.transcript, !settings.transcript);
        return updateSettingsMessage(interaction, client, guildId);
    }

    if (["edit-text", "edit-emoji", "edit-channel-name", "edit-opening-message", "add-option"].includes(action)) {
        return showSettingsModal(interaction, client, guildId, action, settings);
    }
    if (action === "edit-option") {
        const option = settings.options.find(item => item.id === settings.selectedOption);
        if (!option) return ephemeral(interaction, "Sélectionnez d'abord une option à modifier.");
        return showSettingsModal(interaction, client, guildId, `edit-option:${option.id}`, settings, option);
    }
    if (action === "delete-option") {
        const option = settings.options.find(item => item.id === settings.selectedOption);
        if (!option) return ephemeral(interaction, "Sélectionnez d'abord une option à supprimer.");
        return interaction.update(confirmPanel(
            "Supprimer cette option ?",
            `L'option **${option.label}** sera retirée du panneau ticket.`,
            `ticket-settings:${guildId}:delete-option-confirm:${option.id}`,
            `ticket-settings:${guildId}:delete-option-cancel`,
            true
        ));
    }
    if (action.startsWith("delete-option-confirm:")) {
        const optionId = action.slice("delete-option-confirm:".length);
        const options = settings.options.filter(option => option.id !== optionId);
        client.db.set(keys.options, options);
        if (settings.selectedOption === optionId) {
            if (options.length) client.db.set(keys.selectedOption, options[0].id);
            else client.db.delete(keys.selectedOption);
        }
        return updateSettingsMessage(interaction, client, guildId);
    }
    if (action === "delete-option-cancel" || action === "reset-cancel") {
        return updateSettingsMessage(interaction, client, guildId);
    }
    if (action === "reset") {
        return interaction.update(confirmPanel(
            "Réinitialiser les réglages ticket ?",
            "Les réglages, options et rôles configurés pour les tickets seront supprimés.",
            `ticket-settings:${guildId}:reset-confirm`,
            `ticket-settings:${guildId}:reset-cancel`,
            true
        ));
    }
    if (action === "reset-confirm") {
        resetTicketSettings(client, guildId);
        return updateSettingsMessage(interaction, client, guildId);
    }
    if (action === "publish") {
        const panel = await interaction.channel.send(
            buildTicketPublishMessage(client, guildId)
        );
        client.db.set(keys.panelMessage, panel.id);
        return ephemeral(interaction, "Le panneau de tickets a été publié dans ce salon.");
    }
}

async function handleSettingsModal(client, interaction) {
    const [, guildId, nonce] = interaction.customId.split(":");
    const sessionKey = `ticket_settings_modal_${nonce}`;
    const session = client.db.get(sessionKey);
    if (
        !session ||
        session.guildId !== guildId ||
        guildId !== interaction.guildId ||
        !canManageTicketSettings(client, interaction)
    ) {
        return ephemeral(interaction, "Cette session de réglages a expiré ou vous n'avez pas la permission.");
    }

    const keys = settingsKeys(guildId);
    if (session.action === "edit-text") {
        const value = interaction.fields.getTextInputValue("value");
        client.db.set(keys.text, value.trim());
    } else if (session.action === "edit-emoji") {
        const value = interaction.fields.getTextInputValue("value");
        if (value.trim()) client.db.set(keys.emoji, value.trim());
        else client.db.delete(keys.emoji);
    } else if (session.action === "edit-channel-name") {
        const value = interaction.fields.getTextInputValue("value");
        client.db.set(keys.channelName, value.trim());
    } else if (session.action === "edit-opening-message") {
        const value = interaction.fields.getTextInputValue("value");
        client.db.set(keys.openingMessage, value);
    } else if (session.action === "add-option" || session.action.startsWith("edit-option:")) {
        const label = interaction.fields.getTextInputValue("label").trim();
        const description = interaction.fields.getTextInputValue("description").trim();
        const emoji = interaction.fields.getTextInputValue("emoji").trim();
        const options = [...readTicketSettings(client, guildId).options];
        if (session.action === "add-option") {
            if (options.length >= 25) {
                client.db.delete(sessionKey);
                return ephemeral(interaction, "Le menu contient déjà le maximum de 25 options.");
            }
            const option = {
                id: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
                label,
                description,
                emoji,
            };
            options.push(option);
            client.db.set(keys.selectedOption, option.id);
        } else {
            const option = options.find(item => item.id === session.optionId);
            if (!option) {
                client.db.delete(sessionKey);
                return ephemeral(interaction, "Cette option n'existe plus.");
            }
            option.label = label;
            option.description = description;
            option.emoji = emoji;
        }
        client.db.set(keys.options, options);
    } else {
        client.db.delete(sessionKey);
        return ephemeral(interaction, "Action de réglage inconnue.");
    }

    client.db.delete(sessionKey);
    await interaction.reply({ content: "Réglage enregistré.", ephemeral: true });
    await refreshSettingsSourceMessage(client, session).catch(error => {
        console.error(`[gestion] impossible d'actualiser le panneau ticket (${guildId}) :`, error);
    });
}

async function handleTicketOpen(client, interaction) {
    const [, , guildId, buttonOptionId] = interaction.customId.split(":");
    if (guildId !== interaction.guildId) {
        return ephemeral(interaction, "Ce panneau ne correspond pas à ce serveur.");
    }
    const panelId = client.db.get(settingsKeys(guildId).panelMessage);
    if (!panelId || interaction.message?.id !== panelId) {
        return ephemeral(interaction, "Ce panneau n'est plus actif. Demandez à l'équipe d'en publier un nouveau.");
    }

    await interaction.deferReply({ ephemeral: true });
    try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const optionId = buttonOptionId || interaction.values?.[0] || "support";
        const result = await createTicketForMember(client, interaction.guild, member, optionId);
        if (result.error) return interaction.editReply({ content: result.error });
        return interaction.editReply({
            content: `Votre ticket a été créé : ${result.channel}`,
        });
    } catch (error) {
        console.error(`[gestion] impossible d'ouvrir un ticket (${guildId}) :`, error);
        return interaction.editReply({
            content: "Impossible de créer le ticket. Vérifiez les permissions du bot et réessayez.",
        });
    }
}

function isTicketSupport(client, guildId, member) {
    const roles = readTicketSettings(client, guildId).accessRoles;
    if (roles.some(roleId => member.roles.cache.has(roleId))) return true;
    return client.staff?.includes(member.id) ||
        client.config?.buyers?.includes(member.id) ||
        client.db.get(`owner_${member.id}`) === true;
}

async function handleClaim(client, interaction) {
    const channel = interaction.channel;
    const guild = interaction.guild;
    if (!guild || !isTicketChannel(channel)) {
        return ephemeral(interaction, "Ce bouton ne se trouve pas dans un ticket.");
    }
    const settings = readTicketSettings(client, guild.id);
    if (!settings.claim) {
        return ephemeral(interaction, "Le bouton réclamer est désactivé.");
    }
    const member = await guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member || !isTicketSupport(client, guild.id, member)) {
        return ephemeral(interaction, "Seule l'équipe de support peut réclamer ce ticket.");
    }
    const claimedBy = client.db.get(`ticket_claimed_${channel.id}`);
    if (claimedBy) {
        return ephemeral(interaction, `Ce ticket est déjà réclamé par <@${claimedBy}>.`);
    }
    client.db.set(`ticket_claimed_${channel.id}`, member.id);
    await channel.send(`🎫 Ticket pris en charge par ${member}.`);
    await sendTicketLog(client, guild, `🎫 Ticket ${channel} réclamé par <@${member.id}>.`);
    return ephemeral(interaction, "Vous avez réclamé ce ticket.");
}

async function handleClose(client, interaction) {
    const channel = interaction.channel;
    const guild = interaction.guild;
    if (!guild || !isTicketChannel(channel)) {
        return ephemeral(interaction, "Ce bouton ne se trouve pas dans un ticket.");
    }

    const ownerId = channel.topic?.match(/^Ticket de (\d+)$/)?.[1];
    const member = await guild.members.fetch(interaction.user.id).catch(() => null);
    const isSupport = member && isTicketSupport(client, guild.id, member);
    const isOwner = ownerId === interaction.user.id;
    const isBuyer = client.config?.buyers?.includes(interaction.user.id) ||
        client.db.get(`owner_${interaction.user.id}`) === true;
    if (!isOwner && !isSupport && !isBuyer) {
        return ephemeral(interaction, "Seul l'auteur du ticket ou l'équipe autorisée peut le fermer.");
    }

    await interaction.deferReply({ ephemeral: true });
    try {
        const result = await closeTicketChannel(
            client,
            guild,
            channel,
            `<@${interaction.user.id}>`,
            {
                beforeDelete: ({ transcriptSent }) => interaction.editReply({
                    content: transcriptSent
                        ? "Fermeture du ticket… Le transcript a été envoyé en message privé."
                        : "Fermeture du ticket…",
                }),
            }
        );
        if (result.error) return interaction.editReply({ content: result.error });
        return result;
    } catch (error) {
        console.error(`[gestion] impossible de fermer le ticket (${channel.id}) :`, error);
        return interaction.editReply({ content: "Impossible de fermer ce ticket." });
    }
}

module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        const customId = interaction?.customId || "";
        if (customId.startsWith("ticket-settings-modal:") && interaction.isModalSubmit()) {
            return handleSettingsModal(client, interaction);
        }
        if (customId.startsWith("ticket-settings:")) {
            return handleSettingsInteraction(client, interaction);
        }
        if (customId.startsWith("ticket:open:") && (interaction.isButton() || interaction.isStringSelectMenu())) {
            return handleTicketOpen(client, interaction);
        }
        if (!interaction.isButton()) return;
        if (customId === "ticket:claim") return handleClaim(client, interaction);
        if (customId === "ticket:close") return handleClose(client, interaction);
    },
};
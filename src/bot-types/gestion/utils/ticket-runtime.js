const Discord = require("discord.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  AttachmentBuilder,
  PermissionFlagsBits,
} = Discord;
const { readTicketSettings } = require("./ticket-settings");

function isTicketChannel(channel) {
  return Boolean(
    channel &&
    (
      channel.name?.startsWith("ticket-") ||
      /^Ticket de \d+$/.test(channel.topic || "")
    )
  );
}

function validRoleIds(guild, roleIds) {
  return roleIds.filter(roleId => {
    const role = guild.roles.cache.get(roleId);
    return role && role.id !== guild.roles.everyone.id;
  });
}

function formatChannelName(template, member, ticketNumber) {
  const username = member.user.username || member.displayName || "membre";
  const formatted = String(template || "{ticketNumber}-{memberUserName}")
    .replace(/\{ticketNumber\}/gi, String(ticketNumber))
    .replace(/\{memberUserName\}/gi, username)
    .replace(/\{memberUsername\}/gi, username)
    .replace(/\{username\}/gi, username)
    .replace(/\{user\}/gi, username)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 100);
  return formatted || `ticket-${member.id}`;
}

function fillTicketVariables(value, member, ticketNumber, optionLabel) {
  return String(value || "")
    .replace(/\{ticketNumber\}/gi, String(ticketNumber))
    .replace(/\{memberUserName\}/gi, member.user.username || member.displayName || "membre")
    .replace(/\{memberUsername\}/gi, member.user.username || member.displayName || "membre")
    .replace(/\{memberMention\}/gi, `<@${member.id}>`)
    .replace(/\{ticketName\}/gi, optionLabel || "Support");
}

async function sendTicketLog(client, guild, content) {
  const settings = readTicketSettings(client, guild.id);
  if (!settings.logChannel) return;
  const logChannel = guild.channels.cache.get(settings.logChannel);
  if (!logChannel?.isTextBased?.()) return;
  await logChannel.send({ content, allowedMentions: { parse: [] } }).catch(error => {
    console.error(`[gestion] impossible d'envoyer le log ticket (${guild.id}) :`, error);
  });
}

async function createTicketForMember(client, guild, member, optionId) {
  const settings = readTicketSettings(client, guild.id);
  const options = settings.options;
  let option = options.find(item => item.id === optionId);
  if (options.length && !option) {
    return { error: "Cette option n'existe plus. Demandez à l'équipe de republier le panneau." };
  }
  if (!option) {
    option = {
      id: "support",
      label: settings.text,
      description: "Ouvrir un ticket de support",
      emoji: settings.emoji,
    };
  }

  const requiredRoles = validRoleIds(guild, settings.requiredRoles);
  const deniedRoles = validRoleIds(guild, settings.deniedRoles);
  if (requiredRoles.length && !requiredRoles.some(roleId => member.roles.cache.has(roleId))) {
    return { error: "Vous n'avez pas le rôle requis pour ouvrir un ticket." };
  }
  if (deniedRoles.some(roleId => member.roles.cache.has(roleId))) {
    return { error: "Vos rôles ne vous permettent pas d'ouvrir un ticket." };
  }

  const existing = guild.channels.cache.find(channel =>
    isTicketChannel(channel) && channel.topic === `Ticket de ${member.id}`
  );
  if (existing) {
    return { error: `Vous avez déjà un ticket ouvert : ${existing}` };
  }

  const ticketNumber = Number(client.db.get(`ticket_counter_${guild.id}`) || 0) + 1;
  client.db.set(`ticket_counter_${guild.id}`, ticketNumber);
  const category = settings.category
    ? guild.channels.cache.get(settings.category)
    : null;
  const parent = category?.type === ChannelType.GuildCategory ? category.id : undefined;
  const accessRoles = validRoleIds(guild, settings.accessRoles);
  const allow = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.AddReactions,
  ];
  const permissionOverwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: member.id, allow },
    ...accessRoles.map(roleId => ({ id: roleId, allow })),
  ];
  const channel = await guild.channels.create({
    name: formatChannelName(settings.channelName, member, ticketNumber),
    type: ChannelType.GuildText,
    topic: `Ticket de ${member.id}`,
    ...(parent ? { parent } : {}),
    permissionOverwrites,
  });

  const mentionRoles = validRoleIds(guild, settings.mentionRoles);
  const openingMessage = fillTicketVariables(
    settings.openingMessage,
    member,
    ticketNumber,
    option.label
  );
  const embed = new Discord.MessageEmbed()
    .setColor(client.db.get(`color.${guild.id}`) || client.color)
    .setTitle(option.label)
    .setDescription(openingMessage);
  const ticketButtons = [];
  if (settings.claim) {
    ticketButtons.push(
      new ButtonBuilder()
        .setCustomId("ticket:claim")
        .setLabel("Réclamer")
        .setStyle(ButtonStyle.Primary)
    );
  }
  ticketButtons.push(
    new ButtonBuilder()
      .setCustomId("ticket:close")
      .setLabel("Fermer le ticket")
      .setStyle(ButtonStyle.Danger)
  );
  const row = new ActionRowBuilder().addComponents(ticketButtons);
  const pingContent = mentionRoles.map(roleId => `<@&${roleId}>`).join(" ");
  await channel.send({
    ...(pingContent ? { content: pingContent } : {}),
    embeds: [embed],
    components: [row],
    allowedMentions: { roles: mentionRoles },
  });

  client.db.set(`ticket_owner_${channel.id}`, member.id);
  client.db.set(`ticket_option_${channel.id}`, option.label);
  await sendTicketLog(
    client,
    guild,
    `🎫 Ticket ouvert par <@${member.id}> : ${channel}`
  );
  return { channel, option, ticketNumber };
}

function makeTranscript(messages, channel) {
  const ordered = [...messages.values()].sort((left, right) => left.createdTimestamp - right.createdTimestamp);
  const transcript = ordered.map(message => {
    const attachments = [...message.attachments.values()].map(item => item.url).join(" ");
    const content = message.cleanContent || message.content || "";
    return `[${message.createdAt.toISOString()}] ${message.author.tag}: ${content}${attachments ? `\nPièces jointes: ${attachments}` : ""}`;
  }).join("\n");
  return Buffer.from(
    `Transcript de #${channel.name}\nMessages récupérés : ${ordered.length}\n\n${transcript || "(aucun message)"}`,
    "utf8"
  );
}

async function closeTicketChannel(client, guild, channel, closer, options = {}) {
  if (!guild || !isTicketChannel(channel)) {
    return { error: "Ce salon n'est pas un ticket." };
  }

  const ownerId = channel.topic?.match(/^Ticket de (\d+)$/)?.[1];
  const settings = readTicketSettings(client, guild.id);
  let transcriptSent = false;
  if (settings.transcript && ownerId) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const owner = await guild.members.fetch(ownerId).catch(() => null);
      if (owner?.user?.send) {
        await owner.user.send({
          content: `Transcript du ticket **#${channel.name}**`,
          files: [
            new AttachmentBuilder(makeTranscript(messages, channel), {
              name: `transcript-${channel.name}.txt`,
            }),
          ],
        });
        transcriptSent = true;
      }
    } catch (error) {
      console.error(`[gestion] impossible d'envoyer le transcript (${channel.id}) :`, error);
    }
  }

  await sendTicketLog(
    client,
    guild,
    `🔒 Ticket ${channel.name} fermé par ${closer}.`
  );
  if (typeof options.beforeDelete === "function") {
    await Promise.resolve(options.beforeDelete({ transcriptSent })).catch(error => {
      console.error(`[gestion] impossible d'afficher la confirmation de fermeture (${channel.id}) :`, error);
    });
  }
  await channel.delete(`Ticket fermé par ${closer}`);
  client.db.delete(`ticket_claimed_${channel.id}`);
  client.db.delete(`ticket_owner_${channel.id}`);
  client.db.delete(`ticket_option_${channel.id}`);
  return { transcriptSent };
}

module.exports = {
  closeTicketChannel,
  createTicketForMember,
  fillTicketVariables,
  formatChannelName,
  isTicketChannel,
  sendTicketLog,
  validRoleIds,
};
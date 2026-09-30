const { Bot } = require('../../structures/client')
const Discord = require('discord.js')
const fs = require('fs')
const { exec } = require('child_process')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = Discord
module.exports = {
    name: 'messageReactionAdd',

    /**
     * @param {Bot} client 
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.GuildMember} user
     */
    run: async (client, reaction, user) => {
        if (!reaction || !user || user.bot) return;
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch {
                return;
            }
        }
        const message = reaction.message;
        if (message.partial) {
            try {
                await message.fetch();
            } catch {
                return;
            }
        }
        const guild = message.guild;
        if (!guild) return;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;
        const panelMessageId = client.db.get(`ticket_${guild.id}`);
        const configuredEmoji = client.db.get(`ticket_react_${guild.id}`);
        if (!panelMessageId || message.id !== panelMessageId || !configuredEmoji) return;
        const matchesEmoji = reaction.emoji.id
            ? String(configuredEmoji).includes(reaction.emoji.id)
            : String(configuredEmoji).trim() === reaction.emoji.name;
        if (!matchesEmoji) return;
        await reaction.users.remove(member.user.id).catch(() => null);

        let ticket_perm = client.db.get(`perm_ticket.${guild.id}`) || []
        let bvn_ticket = client.db.get(`ticket_bvn_${guild.id}`) || "Non défini"

        let roles = ticket_perm?.filter(r => guild.roles.cache.get(r)) || []

        let alreadyOpenned = false;
        guild.channels.cache.filter(c => c.name.startsWith("ticket-")).forEach(c => {
            if (c.topic === `Ticket de ${user.id}`) alreadyOpenned = true
        })
        if(alreadyOpenned) return reaction.message.channel.send(`Vous avez déjà un ticket ouvert.`).then(m => m.delete({timeout: 8000}))

        const channel = await guild.channels.create({
            name: `ticket-${user.username}`.slice(0, 100),
            type: ChannelType.GuildText,
            topic: `Ticket de ${user.id}`,
        });
            const everyone = guild.roles.everyone
            await channel.permissionOverwrites.edit(everyone, {
                ViewChannel: false,
            })

            await channel.permissionOverwrites.edit(member, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                EmbedLinks: true,
                AttachFiles: true,
                AddReactions: true,
            })

            for (const roleId of roles) {
                const role = guild.roles.cache.get(roleId);
                if (!role) continue;
                await channel.permissionOverwrites.edit(role, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    EmbedLinks: true,
                    AttachFiles: true,
                    AddReactions: true,
                });
            }



            let Embed = new Discord.MessageEmbed()
            .setColor(client.db.get(`color.${guild.id}`) || client.color)
                .setDescription(bvn_ticket)
            const closeButton = new ButtonBuilder()
                .setCustomId("ticket:close")
                .setLabel("Fermer le ticket")
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(closeButton);
            await channel.send({ embeds: [Embed], components: [row] });
            await reaction.users.remove(member.id).catch(() => null);
    }
}

const { Bot } = require('../../structures/client')
const Discord = require('discord.js')

module.exports = {
    name: 'channelDelete',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client, channel) => {
        let guild = channel.guild

        let antichannel = client.db.get(`antichannel.${guild.id}`)
        if(!antichannel) return;
        

        let action = await guild.fetchAuditLogs({ limit: 5, type: Discord.AuditLogEvent.ChannelDelete })
            .then(audit => audit.entries.find(entry =>
                entry.target?.id === channel.id && Date.now() - entry.createdTimestamp < 10_000
            ));
        if (!action?.executor) return;
        let executor = action.executor
        let sanction = await client.db.get(`sanction.antichannel.${guild.id}`)
        if (executor.id === client.user.id) return;

        let perm;
        if (antichannel === "on") perm = client.config.buyers.includes(executor.id) || client.staff.includes(executor.id) || client.db.get(`owner_${executor.id}`) === true || client.db.get(`wlmd_${guild.id}_${executor.id}`) === true || executor.id === client.user.id
        if (antichannel === "max") perm = client.config.buyers.includes(executor.id) || client.staff.includes(executor.id) || client.db.get(`owner_${executor.id}`) === true || executor.id === client.user.id

        if (perm) return;

        const member = await guild.members.fetch(executor.id).catch(() => null);

        const options = {
            name: channel.name,
            type: channel.type,
            parent: channel.parentId || undefined,
            permissionOverwrites: [...channel.permissionOverwrites.cache.values()].map(overwrite => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow.bitfield,
                deny: overwrite.deny.bitfield,
            })),
            position: channel.rawPosition,
            reason: "Antichannel - restauration du salon supprimé",
        };
        if (typeof channel.topic === "string") options.topic = channel.topic;
        if (typeof channel.nsfw === "boolean") options.nsfw = channel.nsfw;
        if (typeof channel.rateLimitPerUser === "number") options.rateLimitPerUser = channel.rateLimitPerUser;
        if (typeof channel.bitrate === "number") options.bitrate = channel.bitrate;
        if (typeof channel.userLimit === "number") options.userLimit = channel.userLimit;
        try {
            await channel.clone(options);
        } catch (error) {
            console.error(`[gestion] restauration du salon ${channel.id} impossible :`, error);
        }


        if (member && (!sanction || sanction === "derank")) {
            if (executor.bot) {
                await member.roles.botRole?.setPermissions([], "Antichannel").catch(() => null);
            } else {
                await member.roles.set([], "Antichannel");
            }
        } else if (member && sanction === "kick") {
            await member.kick("Antichannel");
        } else if (member && sanction === "ban") {
            await member.ban({ reason: "Antichannel" });
        }



        let logsEmbed = new Discord.EmbedBuilder()
        .setColor(client.db.get(`color_${guild.id}`) || client.color)
        .setTitle(`Antiraid : Antichannel (${guild.name})`)
        .setDescription(`${executor} a tenté de supprimer un channel nommé \`${channel.name}\`
Il a été sanctionné d'un \`${sanction || "derank"}\``)
        .setTimestamp()
        .setFooter({ text: `${client.user.username}#${client.user.discriminator}`, iconURL: client.user.displayAvatarURL() })
        .setAuthor({ name: `${executor.tag} (${executor.id})`, iconURL: executor.displayAvatarURL() })
        let pingraid = client.db.get(`pingraid_${guild.id}`)
        let pingraid_role = client.db.get(`pingraid_role_${guild.id}`)
        if (!pingraid) pingraid = "Aucune mention"
        if (pingraid === "everyone") pingraid = "@everyone"
        if (pingraid === "here") pingraid = "@here"
        if (pingraid === "role") pingraid = `<@&${pingraid_role}>`
        if (pingraid === "buyers") pingraid = `<@${client.config.buyers.join(", ")}>`
if (pingraid === "owners") pingraid = `${client.db.get(`${client.user.id}.owner`)?.length > 0 ? client.db.get(`${client.user.id}.owner`).map(o => `<@${o}>`).join(", ") : "Aucun owner"}`        
        guild.channels.cache.get(client.db.get(`raidlogs_${guild.id}`))?.send({ embeds: [logsEmbed], content: `${pingraid}` })



        

    }
}
const { Bot } = require('../../structures/client')
const Discord = require('discord.js')


module.exports = {
    name: 'webhookUpdate',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client, channel) => {
    let guild = channel.guild
    let antiwebhook = client.db.get(`antiwebhook.${guild.id}`)

    if (!antiwebhook) return;

    let modeaction;
    if (client.db.get(`antiwebhook_action_${guild.id}`) === "renew") modeaction = "renew"
    if (!client.db.get(`antiwebhook_action_${guild.id}`)) modeaction = "delete"
    


    let action = await guild.fetchAuditLogs({ limit: 5, type: Discord.AuditLogEvent.WebhookCreate })
        .then(audit => audit.entries.find(entry =>
            entry.target?.id &&
            (entry.extra?.channel?.id === channel.id || entry.target?.channelId === channel.id) &&
            Date.now() - entry.createdTimestamp < 10_000
        ));
    if (!action?.executor) return;
    let executor = action.executor
    let sanction = await client.db.get(`sanction.antiwebhook.${guild.id}`)
    if (executor.id === client.user.id) return;

    let perm;
    if (antiwebhook === "on") perm = client.config.buyers.includes(executor.id) || client.staff.includes(executor.id) || client.db.get(`owner_${executor.id}`) === true || client.db.get(`wlmd_${guild.id}_${executor.id}`) === true
    if (antiwebhook === "max") perm = client.config.buyers.includes(executor.id) || client.staff.includes(executor.id) || client.db.get(`owner_${executor.id}`) === true

    if (perm) return;

    const webhookId = action.target?.id;
    const webhooks = await guild.fetchWebhooks();
    const webhook = webhookId ? webhooks.get(webhookId) : null;
    if (webhook && webhook.channelId === channel.id) {
        await webhook.delete(`Antiwebhook - ${modeaction || "delete"}`);
    }

    const member = await guild.members.fetch(executor.id).catch(() => null);
    if (member && (!sanction || sanction === "derank")) {
        await member.roles.set([], "Antiwebhook");
    } else if (member && sanction === "kick") {
        await member.kick({ reason: "antiwebhook" });
    } else if (member && sanction === "ban") {
        await member.ban({ reason: "antiwebhook" });
    }

    let logsEmbed = new Discord.MessageEmbed()
    .setColor(client.db.get(`color.${guild.id}`) || client.color)
    .setTitle(`Antiraid : Antiwebhook (${guild.name})`)
    .setDescription(`${executor} a créer un webhook
Il a été sanctionné d'un \`${sanction || "derank"}\``)
    .setTimestamp()
    .setFooter(client.footer)
    .setAuthor(`${executor.tag} (${executor.id})`, executor.displayAvatarURL())


    let pingraid = client.db.get(`pingraid_${guild.id}`)
    let pingraid_role = client.db.get(`pingraid_role_${guild.id}`)
    if (!pingraid) pingraid = "Aucune mention"
    if (pingraid === "everyone") pingraid = "@everyone"
    if (pingraid === "here") pingraid = "@here"
    if (pingraid === "role") pingraid = `<@&${pingraid_role}>`
    if (pingraid === "buyers") pingraid = `<@${client.config.buyers.join(", ")}>`
    if (pingraid === "owners") pingraid = `${client.db.get(`${client.user.id}.owner`)?.length > 0 ? client.db.get(`${client.user.id}.owner`).map(o => `<@${o}>`).join(", ") : "Aucun owner"}`        
    guild.channels.cache.get(client.db.get(`raidlogs_${guild.id}`))?.send({ embeds: [logsEmbed], content: `**${pingraid}**` })            
            
    
    }
}
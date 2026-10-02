const Discord = require("discord.js");
const { updateServerCountActivity } = require('../../utils/server-count-activity');

async function notifyBuyers(client, message) {
    const owners = client.db.get(`${client.user.id}.owner`) || [];
    const recipients = [...new Set([...(client.config.buyers || []), ...owners])];
    await Promise.all(recipients.map(async id => {
        try {
            const user = await client.users.fetch(id);
            await user.send(message);
        } catch (error) {
            console.warn(`[gestion] notification privée impossible pour ${id} :`, error.message);
        }
    }));
}

module.exports = {
    name: 'guildCreate',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client, guild) => {
        updateServerCountActivity(client);

        const owner = guild.members.cache.get(guild.ownerId)?.user;
        let inviter = null;
        try {
            const audit = await guild.fetchAuditLogs({
                limit: 5,
                type: Discord.AuditLogEvent.BotAdd,
            });
            inviter = audit.entries.find(entry =>
                entry.target?.id === client.user.id && Date.now() - entry.createdTimestamp < 15_000
            )?.executor || null;
        } catch {
            // The bot may not have permission to view audit logs.
        }

        const message =
            `J'ai rejoint le serveur \`${guild.name}\` (\`${guild.memberCount}\` membres, propriétaire : ` +
            `\`${owner?.tag || `<@${guild.ownerId}>`}\`)` +
            (inviter ? `\nInvité par \`${inviter.tag}\` (\`${inviter.id}\`).` : "");
        await notifyBuyers(client, message);

    }
}
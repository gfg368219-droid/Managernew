const Discord = require('discord.js')
const { queueMessageLog } = require('../../utils/message-log-queue')
module.exports = {
    name: 'messageDelete',

    /**
     * 
     * @param {Bot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {

        const guild = message?.guild;
        if (!guild || !message.author) return;
        if (message.author.bot) return;

        const logChannelId = client.db.get(`msglogs_${guild.id}`);
        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel?.isTextBased()) return;
        if (message.channel.id === logChannel.id) return;
        if (client.db.get(`msglogs_ignore_${message.channel.id}`) === true) return;

        let action = null;
        try {
            const audit = await guild.fetchAuditLogs({
                limit: 5,
                type: Discord.AuditLogEvent.MessageDelete,
            });
            action = audit.entries.find(entry =>
                entry.target?.id === message.author.id &&
                entry.extra?.channel?.id === message.channel.id &&
                Date.now() - entry.createdTimestamp < 5_000
            ) || null;
        } catch (error) {
            console.warn(`[gestion] lecture du journal de suppression impossible (${guild.id}) :`, error.message);
        }

        const executor = action?.executor;
        const content = message.content?.trim() || "(message sans texte)";
        const author = message.author.tag || message.author.username;
        const description = executor
            ? `Message supprimé par ${executor} dans ${message.channel} (auteur : ${author}).\n${content}`
            : `Message supprimé dans ${message.channel} (auteur : ${author}).\n${content}`;
        queueMessageLog(
            client,
            guild.id,
            logChannel,
            client.db.get(`color_${guild.id}`) || client.color,
            description,
            `delete:${message.id}`
        );
    }
}
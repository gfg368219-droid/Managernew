const Discord = require('discord.js')
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

        const logChannelId = client.db.get(`msglogs_${guild.id}`);
        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel?.isTextBased()) return;
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
        const description = executor
            ? `Message supprimé par ${executor} dans ${message.channel}.\n\n${content}`
            : `Message supprimé dans ${message.channel}.\n\n${content}`;
        const embed = new Discord.MessageEmbed()
            .setColor(client.db.get(`color_${guild.id}`) || client.color)
            .setAuthor({
                name: message.author.tag || message.author.username,
                iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(description.slice(0, 4096))
            .setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(error => {
            console.error(`[gestion] envoi du journal de suppression impossible (${guild.id}) :`, error.message);
        });
    }
}
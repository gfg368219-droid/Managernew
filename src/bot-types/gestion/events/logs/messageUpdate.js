const { Bot } = require('../../structures/client')
const { queueMessageLog } = require('../../utils/message-log-queue')
module.exports = {
    name: 'messageUpdate',

    /**
     * 
     * @param {Bot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, oldMessage, newMessage) => {

        const resolveMessage = message =>
            message?.partial && typeof message.fetch === "function"
                ? message.fetch().catch(() => null)
                : Promise.resolve(message);
        const [previousMessage, currentMessage] = await Promise.all([
            resolveMessage(oldMessage),
            resolveMessage(newMessage),
        ]);
        if (!previousMessage || !currentMessage?.guild || !currentMessage.author) return;

        const guild = currentMessage.guild;
        const logChannelId = client.db.get(`msglogs_${guild.id}`);
        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel?.isTextBased() || typeof logChannel.send !== "function") return;
        if (client.db.get(`msglogs_ignore_${currentMessage.channel.id}`) === true) return;

        const preview = value => (String(value || "").trim() || "(aucun texte)").slice(0, 300);
        const author = currentMessage.author.tag || currentMessage.author.username;
        const description =
            `Message modifié par ${author} dans ${currentMessage.channel}.\n` +
            `Avant : ${preview(previousMessage.content)}\n` +
            `Après : ${preview(currentMessage.content)}`;
        queueMessageLog(
            client,
            guild.id,
            logChannel,
            client.db.get(`color_${guild.id}`) || client.color,
            description
        );
    }
}
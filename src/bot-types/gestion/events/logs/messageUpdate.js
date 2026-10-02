const { Bot } = require('../../structures/client')
const Discord = require('discord.js')
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

        const truncate = value => (String(value || "").trim() || "(aucun texte)").slice(0, 1024);
        const embed = new Discord.EmbedBuilder()
            .setColor(client.db.get(`color_${guild.id}`) || client.color)
            .setAuthor({
                name: currentMessage.author.tag || currentMessage.author.username,
                iconURL: currentMessage.author.displayAvatarURL(),
            })
            .setDescription(`Message modifié dans ${currentMessage.channel}`)
            .addFields(
                { name: "Ancien message", value: truncate(previousMessage.content) },
                { name: "Nouveau message", value: truncate(currentMessage.content) }
            )
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(error => {
            console.error(`[gestion] envoi du journal de modification impossible (${guild.id}) :`, error.message);
        });
    }
}
const { Bot } = require('../../structures/client')
const Discord = require('discord.js')
module.exports = {
    name: 'voiceStateUpdate',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client, oldMember, newMember) => {

        const guild = newMember.guild || oldMember.guild;
        if (!guild) return;

        const logChannelId = client.db.get(`voicelogs_${guild.id}`);
        const logChannel = guild.channels.cache.get(logChannelId);
        if (!logChannel?.isTextBased() || typeof logChannel.send !== "function") return;

        const oldChannelId = oldMember.channelId || null;
        const newChannelId = newMember.channelId || null;
        if (oldChannelId === newChannelId) return;

        const member = newMember.member || guild.members.cache.get(newMember.id);
        if (!member?.user) return;

        let description;
        if (!oldChannelId && newChannelId) {
            description = `<@${member.id}> a rejoint le salon <#${newChannelId}>.`;
        } else if (oldChannelId && !newChannelId) {
            description = `<@${member.id}> a quitté le salon <#${oldChannelId}>.`;
        } else {
            description = `<@${member.id}> a quitté le salon <#${oldChannelId}> et a rejoint le salon <#${newChannelId}>.`;
        }

        const embed = new Discord.EmbedBuilder()
            .setColor(client.db.get(`color_${guild.id}`) || client.color)
            .setAuthor({
                name: member.user.tag || member.user.username,
                iconURL: member.displayAvatarURL(),
            })
            .setDescription(description)
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(error => {
            console.error(`[gestion] envoi du journal vocal impossible (${guild.id}) :`, error.message);
        });
    }
}
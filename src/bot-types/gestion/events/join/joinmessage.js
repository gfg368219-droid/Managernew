const { Bot } = require('../../structures/client')
const Discord = require('discord.js')
const fs = require('fs')
module.exports = {
    name: 'guildMemberAdd',

    /**
     * 
     * @param {Bot} client 
     * @param {Discord.GuildMember} member
     */
    run: async (client, member) => {
       
    let guild = member.guild
    if (!guild) return;

    const template = client.db.get(`joinmessage_${guild.id}`);
    const joinChannelId = client.db.get(`joinchannel_${guild.id}`);
    if (typeof template !== "string" || !template.trim() || !joinChannelId) return;
    const joinChannel = guild.channels.cache.get(joinChannelId);
    if (!joinChannel?.isTextBased()) return;

    const joinmessage = template
        .replaceAll("{user.username}", member.user.username)
        .replaceAll("{user.tag}", member.user.tag)
        .replaceAll("{user.id}", member.user.id)
        .replaceAll("{user.mention}", member.user.toString())
        .replaceAll("{guild.name}", guild.name)
        .replaceAll("{guild.memberCount}", String(guild.memberCount))
        .replaceAll("{vanity.usesCount}", String(guild.vanityURLUses || 0))
        .replaceAll("{vanity.Url}", guild.vanityURLCode || "none");
    await joinChannel.send(joinmessage).catch(error => {
        console.error(`[gestion] impossible d'envoyer le message de bienvenue (${guild.id}) :`, error.message);
    });
 
    }
}
const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 

module.exports = {
    name: "unwl",
    aliases: ["unwhitelist"],
    description: "Permet d'enlever un utilisateur de la whitelist",
    category: "botcontrol",
    usage: ["unwl <utilisateur>"],
    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */

    run: async (client, message, args, color, prefix, footer, commandName) => {

let pass = false

let staff = client.staff
if(!staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true){
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "1" && message.member.roles.cache.some(r => client.db.get(`perm1.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "2" && message.member.roles.cache.some(r => client.db.get(`perm2.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "3" && message.member.roles.cache.some(r => client.db.get(`perm3.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "4" && message.member.roles.cache.some(r => client.db.get(`perm4.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "5" && message.member.roles.cache.some(r => client.db.get(`perm5.${message.guild.id}`)?.includes(r.id))) pass = true; 
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = "oui";   
} else pass = true;

if (pass === false) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`)



    const targetId = message.mentions.members.first()?.id || args[0];
    if (!/^\d{17,20}$/.test(targetId || "")) {
        return message.reply("Mentionnez un utilisateur ou fournissez son identifiant Discord.");
    }
    const whitelist = client.db.get(`wl.${message.guild.id}`) || [];
    if (!whitelist.includes(targetId)) return message.reply("Cet utilisateur n'est pas dans la whitelist.");
    client.db.delete(`wlmd_${message.guild.id}_${targetId}`);
    const remaining = whitelist.filter(id => id !== targetId);
    if (remaining.length) client.db.set(`wl.${message.guild.id}`, remaining);
    else client.db.delete(`wl.${message.guild.id}`);
    return message.channel.send(`<@${targetId}> a été retiré de la whitelist.`);
    

    }
}
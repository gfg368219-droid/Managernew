const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 

module.exports = {
    name: "unblrank",
    aliases: [],
    description: "Permet d'enlever un utilisateur du blrank",
    category: "antiraid",
    usage: ["unblrank <utilisateur>"],
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
    const blockedRanks = client.db.get(`blranks.${message.guild.id}`) || [];
    if (!blockedRanks.includes(targetId)) return message.reply("Cet utilisateur n'est pas blrank.");
    client.db.delete(`blrankmd_${message.guild.id}_${targetId}`);
    const remaining = blockedRanks.filter(id => id !== targetId);
    if (remaining.length) client.db.set(`blranks.${message.guild.id}`, remaining);
    else client.db.delete(`blranks.${message.guild.id}`);
    return message.channel.send(`<@${targetId}> n'est plus blrank.`);
    

    }
}
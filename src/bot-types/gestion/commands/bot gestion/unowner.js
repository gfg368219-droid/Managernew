const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 

module.exports = {
    name: "unowner",
    aliases: [],
    description: "Permet d'enlever un owner",
    category: "buyers",
    usage: ["unowner <utilisateur>"],

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */

    run: async (client, message, args, color, prefix, footer, commandName) => {

        if(!client.config.buyers.includes(message.author.id)) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`)



const targetId = message.mentions.members.first()?.id || args[0];
if (!/^\d{17,20}$/.test(targetId || "")) {
    return message.reply("Mentionnez un utilisateur ou fournissez son identifiant Discord.");
}
const ownerKey = `${client.user.id}.owner`;
const owners = client.db.get(ownerKey) || [];
if (!owners.includes(targetId)) return message.reply("Cet utilisateur n'est pas owner.");

client.db.delete(`owner_${targetId}`);
const remainingOwners = owners.filter(id => id !== targetId);
if (remainingOwners.length) client.db.set(ownerKey, remainingOwners);
else client.db.delete(ownerKey);
return message.channel.send(`<@${targetId}> n'est plus owner.`);

    }
}
const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const { resolveLogChannel, isLogChannel } = require('../../utils/log-channels');

module.exports = {
    name: "raidlogs",
    aliases: [],
    description: "Permet de gérer les logs de raid",
    category: "logs",
    usage: ["raidlogs on [channel]", "raidlogs off"],

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


        const action = String(args[0] || "").toLowerCase();
        const permissionKey = `raidlogs_${message.guild.id}`;
        if (action === "off") {
            client.db.delete(permissionKey);
            return message.reply(`Les logs de raid sont désormais désactivés.`);
        }
        if (action !== "on") {
            return message.reply(`Utilisation : \`${prefix}raidlogs on [salon]\` ou \`${prefix}raidlogs off\``);
        }

        const channel = resolveLogChannel(message, args[1]);
        if (!isLogChannel(channel)) {
            return message.reply("Salon invalide. Mentionnez un salon textuel ou indiquez son ID.");
        }

        client.db.set(permissionKey, channel.id);
        return message.reply(`Les logs de raid seront désormais envoyés dans ${channel}.`);

    }
}
const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const { resolveLogChannel, isLogChannel } = require('../../utils/log-channels');

module.exports = {
    name: "msglogs",
    aliases: ["messagelogs"],
    description: "Permet de gérer les logs de messages",
    category: "logs",
    usage: ["msglogs on [channel]", "msglogs off", "msglogs ignore on [channel]", "msglogs ignore off [channel]"],
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
        const permissionKey = `msglogs_${message.guild.id}`;
        if (action === "on") {
            const channel = resolveLogChannel(message, args[1]);
            if (!isLogChannel(channel)) return;
            client.db.set(permissionKey, channel.id);
            return message.reply(`Les logs de messages seront désormais envoyés dans ${channel}.`);
        }

        if (action === "off") {
            client.db.delete(permissionKey);
            return message.reply("Les logs de messages sont désormais désactivés.");
        }

        if (action === "ignore") {
            const ignoreAction = String(args[1] || "").toLowerCase();
            const channel = resolveLogChannel(message, args[2]);
            if (!["on", "off"].includes(ignoreAction)) return;
            if (!isLogChannel(channel)) return;

            const ignoreKey = `msglogs_ignore_${channel.id}`;
            if (ignoreAction === "on") {
                client.db.set(ignoreKey, true);
                return message.reply(`Les logs de messages dans ${channel} seront désormais ignorés.`);
            }
            if (!client.db.get(ignoreKey)) {
                return;
            }
            client.db.delete(ignoreKey);
            return message.reply(`Les logs de messages dans ${channel} ne seront plus ignorés.`);
        }

        return;

    }
}
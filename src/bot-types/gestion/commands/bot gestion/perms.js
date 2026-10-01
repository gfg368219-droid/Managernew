const Discord = require('discord.js');
const {bot} = require('../../structures/client');

module.exports = {
    name: "perms",
    aliases: [],
    description: "Affiche les rôles configurés pour les niveaux de permission 1 à 9.",
    category: "botcontrol",
    usage: ["perms"],
    /**
     * 
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {*} color 
     * @param {*} prefix 
     * @param {*} footer 
     * @param {string} commandName 
     */
    run: async(client, message, args, color, prefix, footer, commandName) => {

        if(!client.config.buyers.includes(message.author.id)) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`)

        let embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("Permissions")
        .setFooter(footer)

        for (let level = 1; level <= 9; level += 1) {
            const configuredRoles = client.db.get(`perm${level}.${message.guild.id}`)
            const roles = Array.isArray(configuredRoles)
                ? configuredRoles.filter(roleId => message.guild.roles.cache.has(roleId))
                : []
            embed.addField(
                `Permission ${level}`,
                roles.length > 0 ? roles.map(roleId => `<@&${roleId}>`).join("\n") : "Aucune"
            )
        }

        message.channel.send({embeds : [embed]});

    }
}
const { Bot } = require('../../structures/client')
const Discord = require('discord.js')
const fs = require('fs')
module.exports = {
    name: 'messageCreate',

    /**
     * 
     * @param {Bot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {
        let commandName = "<non reconnue>"
        try {
            if (!message) return 
            if (!message.guild || !message.author) return
            if(message.author.bot) return
            let color = client.db.get(`color_${message.guildId}`) || client.color
            const prefix = client.db.get(`prefix_${message.guildId}`) || client.prefix
            let footer = client.footer
            const content = message.content || ""
            const mentionPrefixes = [`<@${client.user.id}>`, `<@!${client.user.id}>`]
            if (mentionPrefixes.includes(content.trim())) {
                return message.reply(`Mon prefix est \`${prefix}\``).catch(() => {})
            }

            let commandText
            const mentionPrefix = mentionPrefixes.find(candidate => content.startsWith(candidate))
            if (mentionPrefix) {
                commandText = content.slice(mentionPrefix.length).trimStart()
            } else if (prefix && content.startsWith(prefix)) {
                commandText = content.slice(prefix.length).trimStart()
            } else {
                return
            }

            if (!commandText) return
            const args = commandText.trim().split(/\s+/g)
            commandName = args[0].toLowerCase().normalize()
            const cmd = client.commands.get(commandName) || client.aliases.get(commandName)
            args.shift()
            if (!cmd) return
            await cmd.run(client, message, args, color, prefix, footer, cmd.name)
        } catch (err) {
            console.error(
                `[gestion] erreur dans la commande "${commandName}" (serveur ${message?.guildId || "inconnu"}) :`,
                err
            )
        }
    }
}
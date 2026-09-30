const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const ms = require('enhanced-ms')
module.exports = {
    name: "prune",
    aliases: [],
    description: "Permet de supprimer entre 0 et 100 messages d'une personne.",
    category: "moderation",
    usage: ["prune <utilisateur> <messages>"],
    run: async (client, message, args, prefix) => {
        if (message.member.permissions.has(Discord.PermissionFlagsBits.ManageMessages)){
            let member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
            if (!member) return message.reply(` Aucune personne trouvée !`).catch(() => false)
            if (!args[1]) return message.reply(" Veuillez indiquer un nombre entre `1` et `100` inclus !")
            const amount = Number.parseInt(args[1], 10);
            if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
                return message.reply("Le nombre doit être compris entre `1` et `100`.");
            }
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const filtered = messages
                .filter(m => m.author.id === member.user.id && m.id !== message.id)
                .first(amount);
            const deleted = await message.channel.bulkDelete(filtered, true);
            const confirmation = await message.channel.send(
                `Le bot a supprimé \`${deleted.size}\` message(s) de ${member}.`
            );
            setTimeout(() => confirmation.delete().catch(() => false), 5000);
        } else {
            return message.reply("Vous n'avez pas la permission de gérer les messages.");
        }
    }
}
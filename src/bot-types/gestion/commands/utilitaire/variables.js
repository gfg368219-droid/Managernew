const Discord = require("discord.js");

module.exports = {
    name: "variables",
    aliases: [],
    description: "Affiche les variables disponibles pour les tickets",
    category: "utilitaire",
    usage: ["variables ticket"],
    run: async (client, message, args, color, prefix) => {
        if (String(args[0] || "").toLowerCase() !== "ticket") {
            return message.reply(`Utilisation : \`${prefix}variables ticket\``);
        }

        const embed = new Discord.MessageEmbed()
            .setTitle("Variables des tickets")
            .setDescription(
                "**Dans le nom du salon :**\n" +
                "`{ticketNumber}` — numéro du ticket\n" +
                "`{memberUserName}` — nom Discord de la personne\n\n" +
                "**Dans le texte d'ouverture :**\n" +
                "`{ticketNumber}` — numéro du ticket\n" +
                "`{memberUserName}` — nom Discord de la personne\n" +
                "`{memberMention}` — mention de la personne\n" +
                "`{ticketName}` — nom de l'option sélectionnée"
            )
            .setColor(color || client.color);

        return message.channel.send({ embeds: [embed] });
    },
};
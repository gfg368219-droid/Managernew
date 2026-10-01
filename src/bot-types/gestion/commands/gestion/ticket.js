const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const {
    buildTicketPublishMessage,
    buildTicketSettingsMessage,
    resetTicketSettings,
    settingsKeys,
} = require('../../utils/ticket-settings');
const { closeTicketChannel, isTicketChannel } = require('../../utils/ticket-runtime');

module.exports = {
    name: "ticket",
    aliases: [],
    description: "Permet de gérer les tickets",
    category: "gestion",
    usage: ["ticket", "ticket publish", "ticket title <texte>", "ticket reset_title", "ticket bvn <texte>", "ticket description <texte>", "ticket reset_description", "ticket react", "ticket reset_react", "ticket close", "ticket add", "ticket remove"],

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

        const guildId = message.guild.id;
        const subcommand = String(args[0] || "").toLowerCase();
        if (!subcommand || subcommand === "settings") {
            const settingsMessage = await message.reply(
                buildTicketSettingsMessage(client, guildId, prefix)
            );
            const keys = settingsKeys(guildId);
            client.db.set(keys.settingsMessage, settingsMessage.id);
            client.db.set(keys.settingsChannel, message.channel.id);
            return settingsMessage;
        }
        if (subcommand === "publish" || subcommand === "send") {
            const panelMessage = await message.channel.send(
                buildTicketPublishMessage(client, guildId)
            );
            client.db.set(settingsKeys(guildId).panelMessage, panelMessage.id);
            return panelMessage;
        }


        let ticket_title = client.db.get(`ticket_title_${message.guild.id}`)
        let ticket_description = client.db.get(`ticket_description_${message.guild.id}`)
        let title = args[0] === "title"
        let description = args[0] === "description"
        let react = args[0] === "react"
        let bvn = args[0] === "bvn"
        let close = args[0] === "close"

        let reset = args[0] === "reset"
        let reset_title = args[0] === "reset_title"
        let reset_description = args[0] === "reset_description"
        let reset_react = args[0] === "reset_react"
        let reset_bvn = args[0] === "reset_bvn"

        let add = args[0] === "add"
        let remove = args[0] === "remove"
        if (!title && !description && !react && !bvn && !close && !reset && !reset_title && !reset_description && !reset_react && !reset_bvn && !add && !remove) return message.reply("Sous-commande invalide. Consultez l'aide de `ticket`.");


        if (title) {
            if (!args.slice(1).join(" ")) return message.reply("Veuillez indiquer un titre.");
            client.db.set(`ticket_title_${message.guild.id}`, args.slice(1).join(" "))
            let Embed = new Discord.MessageEmbed()
            .setTitle(`${args.slice(1).join(" ")}`)
            .setDescription(`${ticket_description || "Non défini"}`)
            .setFooter(footer)
            .setColor(color)
            await message.channel.send({ embeds: [Embed], content: `Voici comment le ticket sera affiché :`})
        } else if (description) {
            if (!args.slice(1).join(" ")) return message.reply("Veuillez indiquer une description.");
            client.db.set(`ticket_description_${message.guild.id}`, args.slice(1).join(" "))
            let Embed = new Discord.MessageEmbed()
            .setTitle(`${ticket_title || "Non défini"}`)
            .setDescription(`${args.slice(1).join(" ")}`)
            .setFooter(footer)
            .setColor(color)
            await message.channel.send({ embeds: [Embed], content: `Voici comment le ticket sera affiché :`})
        } else if (react) {
            if (!args.slice(1).join(" ")) return message.reply("Veuillez indiquer une réaction.");
            client.db.set(`ticket_react_${message.guild.id}`, args.slice(1).join(" "))
            let Embed = new Discord.MessageEmbed()
            .setTitle(`${ticket_title || "Non défini"}`)
            .setDescription(`${ticket_description || "Non défini"}`)
            .setFooter(footer)
            .setColor(color)

            let mm = await message.channel.send({ embeds: [Embed], content: `Voici comment le ticket sera affiché :`})
            await mm.react(args.slice(1).join(" "))
    } else if (bvn) {
        if (!args.slice(1).join(" ")) return message.reply("Veuillez indiquer un message.");
        client.db.set(`ticket_bvn_${message.guild.id}`, args.slice(1).join(" "))
        message.channel.send(`Le message de bienvenue (afficher en embed) des tickets a été modifié.`)
     } else if (reset) {
            resetTicketSettings(client, message.guild.id)
            let Embed = new Discord.MessageEmbed()
            .setTitle(`Non défini`)
            .setDescription(`Non défini`)
            .setFooter(footer)
            .setColor(color)
            await message.channel.send({ embeds: [Embed], content: `Voici comment le ticket sera affiché :`})
        } else if (reset_title) {
            client.db.delete(`ticket_title_${message.guild.id}`)
            let Embed = new Discord.MessageEmbed()
            .setTitle(`"Non défini`)
            .setDescription(`${ticket_description || "Non défini"}`)
            .setFooter(footer)
            .setColor(color)
            await message.channel.send({ embeds: [Embed], content: `Voici comment le ticket sera affiché :`})
        } else if (reset_description) {
            client.db.delete(`ticket_description_${message.guild.id}`)
            let Embed = new Discord.MessageEmbed()
            .setTitle(`${ticket_title || "Non défini"}`)
            .setDescription(`Non défini`)
            .setFooter(footer)
            .setColor(color)
            await message.channel.send({ embeds: [Embed], content: `Voici comment le ticket sera affiché :`})
        } else if (reset_react) {
            client.db.delete(`ticket_react_${message.guild.id}`)
            let Embed = new Discord.MessageEmbed()
            .setTitle(`${ticket_title || "Non défini"}`)
            .setDescription(`${ticket_description || "Non défini"}`)
            .setFooter(footer)
            .setColor(color)
            let mm = await message.channel.send({ embeds: [Embed], content: `Voici comment le ticket sera affiché :`})
            message.channel.send("La réaction du panneau de tickets a été réinitialisée.");
        } else if (reset_bvn) {
            client.db.delete(`ticket_bvn_${message.guild.id}`)
            message.reply("Le message de bienvenue des tickets a été réinitialisé.")
        } else if (add) {
            // if channel don't start with ticket- return;
            let channel = message.channel
            if (!args[1] && !message.mentions.members.first()) return message.reply("Veuillez indiquer un utilisateur.");
            let user = message.mentions.members.first() || message.guild.members.cache.get(args[1]) || message.guild.members.cache.find(m => m.displayName.toLowerCase().includes(args[1].toLowerCase())) || message.guild.members.cache.find(m => m.user.username.toLowerCase().includes(args[1].toLowerCase())) || message.guild.members.cache.find(m => m.user.tag.toLowerCase().includes(args[1].toLowerCase()))
            if (!user) return message.reply("Utilisateur introuvable.");
            if (!isTicketChannel(channel)) return message.channel.send(`Ce n'est pas un ticket.`)

            // change chanel permissions and add permission to user to see it and write in it
            await channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                AddReactions: true,
            })
            await channel.send(`${user} a été ajouté au ticket.`)
        } else if (remove) {
            // if channel don't start with ticket- return;
            let channel = message.channel
            if (!args[1] && !message.mentions.members.first()) return message.reply("Veuillez indiquer un utilisateur.");
            let user = message.mentions.members.first() || message.guild.members.cache.get(args[1]) || message.guild.members.cache.find(m => m.displayName.toLowerCase().includes(args[1].toLowerCase())) || message.guild.members.cache.find(m => m.user.username.toLowerCase().includes(args[1].toLowerCase())) || message.guild.members.cache.find(m => m.user.tag.toLowerCase().includes(args[1].toLowerCase()))
            if (!user) return message.reply("Utilisateur introuvable.");
            if (!isTicketChannel(channel)) return message.channel.send(`Ce n'est pas un ticket.`)

            // change chanel permissions and add permission to user to see it and write in it
            await channel.permissionOverwrites.edit(user.id, {
                ViewChannel: false,
                SendMessages: false,
                AddReactions: false,
            })
            await channel.send(`${user} a été retiré du ticket.`)
        } else if (close) {
            const channel = message.channel;
            if (!isTicketChannel(channel)) return message.channel.send(`Ce n'est pas un ticket.`);

            const confirmation = await message.reply(
                `Êtes-vous sûr de vouloir fermer ce ticket ? Tapez \`${prefix}confirm\` pour confirmer.`
            );
            let collected;
            try {
                collected = await message.channel.awaitMessages({
                    filter: response => response.author.id === message.author.id,
                    max: 1,
                    time: 60000,
                    errors: ["time"],
                });
            } catch {
                return confirmation.edit("La commande a été annulée.");
            }
            if (collected.first()?.content !== `${prefix}confirm`) {
                return confirmation.edit("La commande a été annulée.");
            }
            try {
                await closeTicketChannel(
                    client,
                    message.guild,
                    channel,
                    message.author.tag,
                    {
                        beforeDelete: ({ transcriptSent }) => confirmation.edit(
                            transcriptSent
                                ? "Fermeture du ticket… Le transcript a été envoyé en message privé."
                                : "Fermeture du ticket…"
                        ),
                    }
                );
            } catch (error) {
                console.error(`[gestion] impossible de fermer le ticket (${channel.id}) :`, error);
                await confirmation.edit("Impossible de fermer ce ticket.").catch(() => null);
            }
        }
             

    }
}

const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "rolereact",
    aliases: ["rr", "reactrole", "rolemenu"],
    description: "Permet de gérer les rôles react",
    category: "gestion",
    usage: ["rolereact", "rolereact <channel> <messageID> <role> <react> react/button"],

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



let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
if (!channel.isTextBased() || !channel.messages) return message.reply("Veuillez indiquer un salon textuel.");
if (!args[1]) return message.reply("Veuillez indiquer l'identifiant du message.");
let messagez = await channel.messages.fetch(args[1]).catch(() => null);
if (!messagez) return message.channel.send("Message non trouvé");
let messageID = messagez.id;
    let role = message.guild.roles.cache.get(args[2]) || message.mentions.roles.first()
    let reaction = message.guild.emojis.cache.get(args[3]) || args[3]
    let type = args[4]
    if (!role) return message.reply("Veuillez indiquer un rôle.");
    if (!reaction) return message.reply("Veuillez indiquer une réaction.");
    if (type !== "react" && type !== "button") return message.reply("Le type doit être `react` ou `button`.");

    const emojiValue = typeof reaction === "string" ? reaction : reaction.toString();
    if (!role.editable) return message.reply("Le bot ne peut pas attribuer ce rôle : vérifiez sa position dans la hiérarchie.");

    let Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`Rôle ajouté`)
        .setDescription(`Cliquez sur l'émoji ou le bouton pour obtenir ou retirer le rôle ${role}.`)
        .setFooter(footer)

    if(type === "react"){
        client.db.set(`rolereact_${message.guild.id}_${messageID}`, {
            role: role.id,
            emoji: emojiValue,
            type: "react",
        });
        await messagez.react(emojiValue);
        return message.channel.send({
            embeds: [
                Embed.setDescription(`Le rôle ${role} a été associé à la réaction ${emojiValue} sur [ce message](https://discord.com/channels/${message.guild.id}/${channel.id}/${messageID}).`),
            ],
        });
    } else if(type === "button"){
        const button = new ButtonBuilder()
            .setCustomId(`rolereact:${role.id}`)
            .setLabel(role.name.slice(0, 80))
            .setStyle(ButtonStyle.Primary);
        if (emojiValue) button.setEmoji(emojiValue);
        const row = new ActionRowBuilder().addComponents(button);
        const buttonMessage = await channel.send({ embeds: [Embed], components: [row] });
        client.db.set(`rolereact_${message.guild.id}_${buttonMessage.id}`, {
            role: role.id,
            type: "button",
        });
    }

    
    }
}

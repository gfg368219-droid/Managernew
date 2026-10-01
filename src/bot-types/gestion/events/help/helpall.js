const { Bot } = require('../../structures/client')
const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    name: 'interactionCreate',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client, interaction) => {

    if (!interaction.isStringSelectMenu()) return

    if (interaction.customId !== 'selecthelpall') return

    let color = client.db.get(`color_${interaction.guildId}`) || client.color
    let prefix = client.db.get(`prefix_${interaction.guildId}`) || client.prefix
    let footer = client.footer


    if (client.db.get(`helpall_${interaction.guildId}_${interaction.message.id}_author`) !== interaction.user.id) return interaction.reply({ content: `Vous ne pouvez pas utiliser ce menu.`, flags: Discord.MessageFlags.Ephemeral })
    
        let perm_public = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "public") {
                perm_public.push(m.name)
            }
        })

        let perm_1 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "1") {
                perm_1.push(m.name)
            }
        })
    
        let perm_2 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "2") {
                perm_2.push(m.name)
            }
        })

        let perm_3 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "3") {
                perm_3.push(m.name)
            }
        })

        let perm_4 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "4") {
                perm_4.push(m.name)
            }
        })

        let perm_5 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "5") {
                perm_5.push(m.name)
            }
        })

        let perm_6 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "6") {
                perm_6.push(m.name)
            }
        })

        let perm_7 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "7") {
                perm_7.push(m.name)
            }
        })

        let perm_8 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "8") {
                perm_8.push(m.name)
            }
        })

        let perm_9 = []
        client.commands.forEach(async (m) => {
            if (client.db.get(`perm_${m.name}.${interaction.guildId}`) === "9") {
                perm_9.push(m.name)
            }
        })

        let perm_public_embed = new Discord.MessageEmbed()
        .setTitle(`Permission publique`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_public.length > 0 ? perm_public.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)
       
        let perm_1_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 1`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_1.length > 0 ? perm_1.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)
       
        let perm_2_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 2`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_2.length > 0 ? perm_2.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)
       
        let perm_3_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 3`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_3.length > 0 ? perm_3.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)
       
        let perm_4_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 4`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_4.length > 0 ? perm_4.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)
       
        let perm_5_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 5`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_5.length > 0 ? perm_5.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)

        let perm_6_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 6`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_6.length > 0 ? perm_6.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)

        let perm_7_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 7`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_7.length > 0 ? perm_7.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)

        let perm_8_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 8`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_8.length > 0 ? perm_8.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)

        let perm_9_embed = new Discord.MessageEmbed()
        .setTitle(`Permission 9`)
        .setColor(color)
        .setFooter(footer)
        .setDescription(`${perm_9.length > 0 ? perm_9.map(ziak => `\`${prefix}${ziak}\``).join("\n") : "Aucune commande"}`)


        let row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('selecthelpall')
                    .setPlaceholder('Séléctionnez une page du help')
                    .addOptions([
                        {
                            label: 'Permission publique',
                            description: 'Affiche les commandes associés à la permission publique',
                            value: 'perm_help_public',
                        },
                        {
                            label: 'Permission 1',
                            description: 'Affiche les commandes associés à la permission 1',
                            value: 'perm_help_1',
                        },
                        {
                            label: 'Permission 2',
                            description: 'Affiche les commandes associés à la permission 2',
                            value: 'perm_help_2',
                        },
                        {
                            label: 'Permission 3',
                            description: 'Affiche les commandes associés à la permission 3',
                            value: 'perm_help_3',
                        },
                        {
                            label: 'Permission 4',
                            description: 'Affiche les commandes associés à la permission 4',
                            value: 'perm_help_4',
                        },
                        {
                            label: 'Permission 5',
                            description: 'Affiche les commandes associés à la permission 5',
                            value: 'perm_help_5',
                        },
                        {
                            label: 'Permission 6',
                            description: 'Affiche les commandes associés à la permission 6',
                            value: 'perm_help_6',
                        },
                        {
                            label: 'Permission 7',
                            description: 'Affiche les commandes associés à la permission 7',
                            value: 'perm_help_7',
                        },
                        {
                            label: 'Permission 8',
                            description: 'Affiche les commandes associés à la permission 8',
                            value: 'perm_help_8',
                        },
                        {
                            label: 'Permission 9',
                            description: 'Affiche les commandes associés à la permission 9',
                            value: 'perm_help_9',
                        },
                    ]),
            );

        switch (interaction.values[0]) {
            case 'perm_help_public':
                 interaction.update({embeds: [perm_public_embed]})
                break;
            case 'perm_help_1':
                 interaction.update({embeds: [perm_1_embed]})
                break;
            case 'perm_help_2':
                 interaction.update({embeds: [perm_2_embed]})
                break;
            case 'perm_help_3':
                 interaction.update({embeds: [perm_3_embed]})
                break;
            case 'perm_help_4':
                 interaction.update({embeds: [perm_4_embed]})
                break;
            case 'perm_help_5':
                 interaction.update({embeds: [perm_5_embed]})
                break;
            case 'perm_help_6':
                 interaction.update({embeds: [perm_6_embed]})
                break;
            case 'perm_help_7':
                 interaction.update({embeds: [perm_7_embed]})
                break;
            case 'perm_help_8':
                 interaction.update({embeds: [perm_8_embed]})
                break;
            case 'perm_help_9':
                 interaction.update({embeds: [perm_9_embed]})
                break;
            default:
                return;
        }
                
        
    

    }
} 
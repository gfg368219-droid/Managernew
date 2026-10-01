const Discord = require('discord.js'); 
const {bot} = require('../../structures/client');

module.exports = {
    name: "embed",
    aliases: ["embedbuilder"],
    description: "Permet de créer un embed personnalisé",
    usage: ["embed"],
    run: async(client, message, args, color, prefix, footer, commandName) => {

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


        const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageSelectMenu()
            .setCustomId("embedselect")
            .setPlaceholder("Clique ici pour modifier l'embed")
            .addOptions([
                {
                    label: "Titre", 
                    description: "Clique ici pour changer le titre de l'embed", 
                    value: "title", 
                }, 
                {
                    label: "Description", 
                    description: "Clique ici pour changer la description de l'embed", 
                    value: "description", 
                }, 
                {
                    label: "Ajouter un Field", 
                    description:"Clique ici pour ajouter un field à l'embed", 
                    value: "fields", 
                }, 
                {
                    label: "Retirer un Field", 
                    description: "Clique ici pour retirer un field à l'embed", 
                    value: "delfields", 
                },
                {
                    label: "Thumbnail", 
                    description: "Clique ici pour changer le thumbnail de l'embed", 
                    value: "thumbnail", 
                }, 
                {
                    label: "Image", 
                    description: "Clique ici pour changer l'image de l'embed",
                    value: "image", 
                }, 
                {
                    label: "Couleur", 
                    description: "Clique ici pour changer la couleur de l'embed",
                    value: "couleur", 
                }, 
                {
                    label: "Footer",
                    description: "Clique ici pour changer le footer de l'embed", 
                    value: "footer", 
                }, 
                {
                    label: "Auteur", 
                    description: "Clique ici pour changer l'auteur de l'embed", 
                    value: "auteur", 
                }, 
                {
                    label: "URL",
                    description: "Clique ici pour changer l'url du titre de l'embed", 
                    value: "url", 
                }, 
                {
                    label: "Timestamp", 
                    description: "Clique ici pour ajouter un timestamp à l'embed", 
                    value: "timestamp", 
                }
            ])
        ); 
        const row2 = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
            .setCustomId("buttonenable")
            .setLabel("Activer")
            .setStyle("SUCCESS"), 
            new Discord.MessageButton()
            .setCustomId("buttondisable")
            .setLabel("Désactiver")
            .setStyle("SECONDARY")
        );

        let embed = new Discord.MessageEmbed()
        .setTitle("** **") 

        message.reply({embeds: [embed], components: [row, row2]}).then((msgembed) => {

        const collector = message.channel.createMessageComponentCollector({filter: m => m.user.id === message.author.id, time: 0, componentType: Discord.ComponentType.StringSelect});

        collector.on("collect", async(c) => {
            if(c.user.id !== message.author.id) return;
            const value = c.values[0]; 

            if(value === "title"){
                c.reply("Quel **titre** voulez vous ajouter à votre embed ?"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    collected.first().delete(); 
                    c.deleteReply(); 
                    embed.setTitle(collected.first().content)
                    msgembed.edit({embeds: [embed]});
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "description"){
                c.reply("Quelle **description** voulez-vous ajouter à votre embed ?"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    collected.first().delete(); 
                    c.deleteReply(); 
                    embed.setDescription(`${collected.first().content}`)
                    msgembed.edit({embeds: [embed]});
                }).catch(err => {
                    c.reply("Vous avez pris trop de temps pour répondre"); 
                    c.deleteReply(); 
            }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "thumbnail"){
                c.reply("Quel **thumbnail** voulez-vous ajouter à votre embed ?");
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    let image = collected.first().attachments.first()?.url; 
                    if(!image){
                        c.deleteReply(); 
                        collected.first().delete();
                        return message.channel.send("Image ou lien invalide"); 
                    }
                    collected.first().delete(); 
                    c.deleteReply(); 
                    embed.setThumbnail(image)
                    msgembed.edit({embeds: [embed]}); 
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "image"){
                c.reply("Quelle **image** voulez-vous ajouter à votre embed ?"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    let image = collected.first().attachments.first()?.url; 
                    if(!image) {
                        message.channel.send("Image ou lien invalide"); 
                        message.delete(); 
                    }
                    c.deleteReply(); 
                    collected.first().delete(); 
                    embed.setImage(image)
                    msgembed.edit({embeds: [embed]}); 
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "couleur"){
                c.reply("Quelle **couleur** voulez-vous ajouter à votre embed ?"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    c.deleteReply(); 
                    collected.first().delete(); 
                    if(collected.first().content === "noir"){
                        embed.setColor("BLACK")
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "blanc"){
                        embed.setColor("#ffffff")
                        msgembed.edit({embeds: [embed]}); 
                    }  
                    else if(collected.first().content === "jaune"){
                        embed.setColor("YELLOW")
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "bleu"){
                        embed.setColor("BLUE")
                        msgembed.edit({embeds: [embed]});
                    }
                    else if(collected.first().content === "violet"){
                        embed.setColor("PURPLE")
                        msgembed.edi({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "blurple"){
                        embed.setColor("BLURPLE")
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "gris"){
                        embed.setColor("GREY")
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "orange"){
                        embed.setColor("ORANGE")
                        msgembed.edit({embeds: [embed]});
                    }
                    else if(collected.first().content === "vert"){
                        embed.setColor("GREEN")
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "rouge"){
                        embed.setColor("RED")
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "maron"){
                        embed.setColor("#582900")
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "rose"){
                        embed.setColor("DARK_VIVID_PINK")
                        msgembed.edit({embeds: [embed]});
                    }
                    else if(collected.first().content === "beige"){
                        embed.setColor("#c8ad7f")
                        msgembed.edit({embeds: [embed]}); 
                    } else {
                        embed.setColor(collected.first().content)
                        msgembed.edit({embeds: [embed]});
                    }
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "footer"){
                c.reply("Quel **footer** voulez-vous ajouter à votre embed ?"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    c.deleteReply(); 
                    collected.first().delete(); 
                    message.channel.send("Maintenant voulez-vous ajouter une **image de footer** à votre embed ? si vous ne voulez pas envoyez `aucun`")
                    message.channel.awaitMessages({filter: m => m.author.id === message.author.id, time: 60000, errors: ["time"], max: 1}).then((collected2) => {
                        message.delete();
                        collected2.first().delete(); 
                        if(collected2.first().content === "aucun"){
                            message.delete(); 
                            embed.setFooter(`${collected.first().content}`)
                            msgembed.edit({embeds: [embed]}); 
                        } else {
                            let image = collected2.first().attachments.first()?.url; 
                            if(!image){
                                message.channel.send("Image ou lien invalide"); 
                                message.delete(); 
                            }
                            embed.setFooter(`${collected.first().content}`, image)
                            msgembed.edit({embeds: [embed]}); 
                        }
                    }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "auteur"){
                c.reply("Quel **auteur** voulez-vous ajouter à votre embed ?"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    c.deleteReply(); 
                    collected.first().delete(); 
                    message.channel.send("Maintenant voulez-vous ajouter **une image d'auteur** à votre embed ? Si vous ne voulez pas envoyez `aucun`"); 
                    message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected2) => {
                        message.delete(); 
                        collected2.first().delete();
                        if(collected2.first().content === "aucun"){
                            embed.setAuthor(`${collected.first().content}`)
                            msgembed.edit({embeds: [embed]}); 
                        } else {
                        let image = collected2.first().attachments.first()?.url; 
                        if(!image){
                            message.channel.send("Image invalide"); 
                            message.delete(); 
                        }
                        embed.setFooter(`${collected.first().content}`, image)
                        msgembed.edit({embeds: [embed]}); 
                    }
                    }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "url"){
                c.reply("Quel **url** voulez-vous ajouter à votre embed ?"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    c.deleteReply(); 
                    collected.first().delete(); 
                    let image = collected.first().url
                    if(!image){
                        message.channel.send("Image invalide"); 
                        message.delete(); 
                    }
                    embed.setURL(image)
                    msgembed.edit({embeds: [embed]}); 
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }
            if(value === "fields"){
                c.reply("Donnez moi **le titre** du field que vous voulez ajouter à l'embed"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    if(collected.first().content.length > 28) return message.channel.send("Nom trop long"); 
                    c.deleteReply(); 
                    collected.first().delete(); 
                message.channel.send("Maintenant donnez moi **la description** du field que vous voulez ajouter à l'embed"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collect2) => {
                    message.delete();
                    collect2.first().delete();
                    embed.addField(`${collected.first().content}`, `${collect2.first().content}`)
                    msgembed.edit({embeds: [embed]}); 
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
                }).catch(err => message.channel.send("Vous avez pris trop de temps pour répondre"))
            }

            if(value === "delfields"){
                if(embed.fields.length < 1) return message.channel.send("Il n'y a aucun field à retiré");
                c.reply(`Quel est le numéro du field que vous voulez retiré ?`); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((co) => {
                    co.first().delete();
                    c.deleteReply(); 

                    if(isNaN(co.first().content)) return message.channel.send("Veuillez me donner un nombre valide"); 
                    if(co.first().content > embed.fields.length) return message.channel.send("Il n'y a pas autant de fields dans cet embed"); 
                    var indexField = Number(co.first().content) - 1;
                    embed.spliceFields(indexField, 1);
                    msgembed.edit({embeds: [embed]});
                })
            }

            if(value === "timestamp"){
                c.reply("Êtes-vous sûr de vouloir ajouter un timestamp à votre embed ?")
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    c.deleteReply(); 
                    collected.first().delete(); 

                    if(collected.first().content === "oui" && collected.first().content === "Oui"){
                        embed.setTimestamp(new Date())
                        msgembed.edit({embeds: [embed]}); 
                    }
                    else if(collected.first().content === "non" && collected.first().content === "Non"){
                        return;
                    }
                })
            }
        }); 
    }); 

    const collector2 = message.channel.createMessageComponentCollector({componentType: "BUTTON",time: 0});
        collector2.on("collect", async(c) => {
            const value = c.customId;

            if(value === "buttonenable"){
                c.reply("Veuillez m'indiquer un salon où je dois envoyer l'embed"); 
                message.channel.awaitMessages({filter: m => m.author.id === message.author.id, max: 1, time: 60000, errors: ["time"]}).then((collected) => {
                    c.deleteReply(); 
                    collected.first().delete(); 
                    let channel = collected.first().mentions.channels.first() || collected.first().guild.channels.cache.get(collected.first().content); 
                    if(!channel) {
                        message.channel.send("Salon introuvable"); 
                        message.delete(); 
                    } else {
                        channel.send({embeds: [embed]}); 
                        message.channel.send(`L'embed a bien été envoyé dans <#${channel.id}>`); 
                    }
                    
                })
            }
            if(value === "buttondisable"){
                msgembed.delete();
                
            }
        })
    }
}
const { Bot } = require('../../structures/client')
const fetch = require('node-fetch')
const Discord = require('discord.js')


module.exports = {
    name: 'guildUpdate',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client, oldGuild, newGuild) => {

    let antiupdate = client.db.get(`antiupdate.${newGuild.id}`)
    let guild = newGuild
    if (!antiupdate) return;

    if (oldGuild === newGuild) return;
    if (oldGuild !== newGuild) {

    let action = await guild.fetchAuditLogs({ limit: 5, type: Discord.AuditLogEvent.GuildUpdate })
        .then(audit => audit.entries.find(entry =>
            entry.target?.id === guild.id && Date.now() - entry.createdTimestamp < 10_000
        ));
    if (!action?.executor) return;
    let executor = action.executor
    let sanction = await client.db.get(`sanction.antiupdate.${guild.id}`)
    if (executor.id === client.user.id) return;

    let perm;
    if (antiupdate === "on") perm = client.config.buyers.includes(executor.id) || client.staff.includes(executor.id) || client.db.get(`owner_${executor.id}`) === true || client.db.get(`wlmd_${guild.id}_${executor.id}`) === true
    if (antiupdate === "max") perm = client.config.buyers.includes(executor.id) || client.staff.includes(executor.id) || client.db.get(`owner_${executor.id}`) === true

    if (perm) return;


    if(oldGuild.name === newGuild.name){
    } else {
    await newGuild.setName(oldGuild.name)
    }
    if(oldGuild.iconURL({dynamic:true}) === newGuild.iconURL({dynamic:true})){
    } else {
    await newGuild.setIcon(oldGuild.iconURL({dynamic:true}))      
    }
    if(oldGuild.bannerURL() === newGuild.bannerURL()
    ){
    } else {
        await newGuild.setBanner(oldGuild.bannerURL())    
    }
    if(oldGuild.systemChannel  === newGuild.systemChannel) {
    } else {
    await newGuild.setSystemChannel(oldGuild.systemChannel)      
    }
    if(oldGuild.systemChannelFlags  === newGuild.systemChannelFlags){ 
    } else {
    await newGuild.setSystemChannelFlags(oldGuild.systemChannelFlags )
    }
    if(oldGuild.verificationLevel  === newGuild.verificationLevel) {
    } else {
    await newGuild.setVerificationLevel(oldGuild.verificationLevel ) 
    }
    if (oldGuild.widgetEnabled !== newGuild.widgetEnabled ||
        oldGuild.widgetChannelId !== newGuild.widgetChannelId) {
        await newGuild.setWidgetSettings({
            enabled: oldGuild.widgetEnabled ?? false,
            channel: oldGuild.widgetChannelId,
        });
    }
    if(oldGuild.splashURL  === newGuild.splashURL) {
    } else {
    await newGuild.setSplash(oldGuild.splashURL )
    }
    if(oldGuild.rulesChannel  === newGuild.rulesChannel 
    ){
    } else {
    await newGuild.setRulesChannel(oldGuild.rulesChannel ) 
    }
    if(oldGuild.publicUpdatesChannel  === newGuild.publicUpdatesChannel 
    ){
    } else {
    await newGuild.setPublicUpdatesChannel(oldGuild.publicUpdatesChannel )  
    }
    if(oldGuild.defaultMessageNotifications  === newGuild.defaultMessageNotifications 
    ){
    
    } else {
    await newGuild.setDefaultMessageNotifications(oldGuild.defaultMessageNotifications )
    }
    if(oldGuild.afkChannel  === newGuild.afkChannel 
    ){
    } else {
    await newGuild.setAFKChannel(oldGuild.afkChannel )
    }
    if(oldGuild.afkTimeout  === newGuild.afkTimeout 
    ){
    } else {
    await newGuild.setAFKTimeout(oldGuild.afkTimeout)         
    }


    const executorMember = await guild.members.fetch(executor.id).catch(() => null);
    if (executorMember && (!sanction || sanction === "derank")) {
        await executorMember.roles.set([], "Anti-update");
    } else if (executorMember && sanction === "kick") {
        await executorMember.kick({ reason: "antiupdate" });
    } else if (executorMember && sanction === "ban") {
        await executorMember.ban({ reason: "antiupdate" });
    }

    let logsEmbed = new Discord.MessageEmbed()
    .setColor(client.db.get(`color.${guild.id}`) || client.color)
    .setTitle(`Antiraid : Antiupdate (${guild.name})`)
    .setDescription(`${executor} a tenté de modifier le serveur 
Il a été sanctionné d'un \`${sanction || "derank"}\``)
    .setTimestamp()
    .setFooter(client.footer)
    .setAuthor(`${executor.tag} (${executor.id})`, executor.displayAvatarURL())


    let pingraid = client.db.get(`pingraid_${guild.id}`)
    let pingraid_role = client.db.get(`pingraid_role_${guild.id}`)
    if (!pingraid) pingraid = "Aucune mention"
    if (pingraid === "everyone") pingraid = "@everyone"
    if (pingraid === "here") pingraid = "@here"
    if (pingraid === "role") pingraid = `<@&${pingraid_role}>`
    if (pingraid === "buyers") pingraid = `<@${client.config.buyers.join(", ")}>`
    if (pingraid === "owners") pingraid = `${client.db.get(`${client.user.id}.owner`)?.length > 0 ? client.db.get(`${client.user.id}.owner`).map(o => `<@${o}>`).join(", ") : "Aucun owner"}`        
    guild.channels.cache.get(client.db.get(`raidlogs_${guild.id}`))?.send({ embeds: [logsEmbed], content: `**${pingraid}**` })            
            
    }
    }
}
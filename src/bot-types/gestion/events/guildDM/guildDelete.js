async function notifyBuyers(client, message) {
    const owners = client.db.get(`${client.user.id}.owner`) || [];
    const recipients = [...new Set([...(client.config.buyers || []), ...owners])];
    await Promise.all(recipients.map(async id => {
        try {
            const user = await client.users.fetch(id);
            await user.send(message);
        } catch (error) {
            console.warn(`[gestion] notification privée impossible pour ${id} :`, error.message);
        }
    }));
}

module.exports = {
    name: 'guildDelete',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client, guild) => {
       

        const owner = guild.members.cache.get(guild.ownerId)?.user;
        const message = `J'ai quitté le serveur \`${guild.name}\` (\`${guild.memberCount}\` membres, propriétaire : \`${owner?.tag || `<@${guild.ownerId}>`}\`).`;
        await notifyBuyers(client, message);

    }
}
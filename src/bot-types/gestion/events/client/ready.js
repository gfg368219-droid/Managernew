module.exports = {
    name: 'clientReady',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client) => {
        if (process.send) {
            process.send({
                type: "ready",
                user: {
                    id: client.user.id,
                    tag: client.user.tag,
                    avatarUrl: client.user.displayAvatarURL({ size: 128 }),
                },
            });
        }
        console.log(`[gestion] ${client.user.tag} prêt avec ${client.commands.size} commandes`)
    }
}
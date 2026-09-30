const { AuditLogEvent } = require("discord.js");

module.exports = {
    name: "guildCreate",
    run: async (client, guild) => {
        const mode = client.db.get("blockinvite");
        if (mode !== true && mode !== "max") return;

        let executor;
        try {
            const audit = await guild.fetchAuditLogs({
                limit: 5,
                type: AuditLogEvent.BotAdd,
            });
            const entry = audit.entries.find(
                (candidate) => candidate.target?.id === client.user.id
            );
            executor = entry?.executor;
        } catch (error) {
            console.warn(`[gestion] audit d'ajout indisponible pour ${guild.id}: ${error.message}`);
            return;
        }

        if (!executor) {
            console.warn(`[gestion] auteur d'ajout introuvable pour ${guild.id}; le bot reste dans le serveur`);
            return;
        }

        const isTrusted = (userId) =>
            client.config.buyers.includes(userId) ||
            client.db.get(`owner_${userId}`) === true;

        let canJoin = isTrusted(executor.id);
        if (!canJoin && mode === true) {
            try {
                const members = await guild.members.fetch();
                canJoin = members.some((member) => isTrusted(member.id));
            } catch (error) {
                console.warn(`[gestion] membres non vérifiés pour ${guild.id}: ${error.message}`);
            }
        }

        if (!canJoin) {
            await guild.leave().catch((error) => {
                console.error(`[gestion] impossible de quitter ${guild.id}: ${error.message}`);
            });
        }
    },
};
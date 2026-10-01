module.exports = {
    name: "setperm",
    aliases: [],
    description: "Gerer les permissions du bot.",
    category: "moderation",
    usage: ["setperm <1-9> <rôle>"],

    run: async (client, message, args, color, prefix) => {
        if (!client.config.buyers.includes(message.author.id)) {
            return message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        const level = String(args[0] || "");
        if (!/^[1-9]$/.test(level)) {
            return message.reply(`Utilisation : \`${prefix}setperm <1-9> <rôle>\``);
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
            return message.reply("Rôle invalide. Mentionnez un rôle ou indiquez son ID.");
        }

        client.db.set(`perm${level}.${message.guild.id}`, [role.id]);
        return message.channel.send(
            `Le niveau de permission ${level} est maintenant attribué à ${role}.`
        );
    },
};
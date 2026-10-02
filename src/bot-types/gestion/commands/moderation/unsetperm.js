module.exports = {
    name: "unsetperm",
    aliases: [],
    description: "Retire un rôle d'un niveau de permission.",
    category: "moderation",
    usage: ["unsetperm <1-9> <rôle>"],

    run: async (client, message, args, color, prefix) => {
        if (!client.config.buyers.includes(message.author.id)) {
            return message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        const level = String(args[0] || "");
        if (!/^[1-9]$/.test(level)) {
            return message.reply(`Utilisation : \`${prefix}unsetperm <1-9> <rôle>\``);
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
            return message.reply("Rôle invalide. Mentionnez un rôle ou indiquez son ID.");
        }

        const permissionKey = `perm${level}.${message.guild.id}`;
        const configuredRoles = client.db.get(permissionKey);
        const roleIds = Array.isArray(configuredRoles)
            ? configuredRoles
            : configuredRoles
                ? [configuredRoles]
                : [];
        const remainingRoles = roleIds.filter(roleId => String(roleId) !== role.id);

        if (remainingRoles.length === roleIds.length) {
            return message.reply(`${role} n'est pas configuré pour le niveau de permission ${level}.`);
        }

        client.db.set(permissionKey, remainingRoles);
        return message.channel.send(
            `${role} a été retiré du niveau de permission ${level}.`
        );
    },
};
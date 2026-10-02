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
            return;
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
            return;
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
            return;
        }

        client.db.set(permissionKey, remainingRoles);
        return message.channel.send(
            `${role} a été retiré du niveau de permission ${level}.`
        );
    },
};
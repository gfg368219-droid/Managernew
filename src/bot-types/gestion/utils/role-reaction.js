async function toggleReactionRole(client, reaction, user, shouldHaveRole) {
    if (!reaction || !user || user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch {
            return;
        }
    }
    const message = reaction.message;
    if (message?.partial) {
        try {
            await message.fetch();
        } catch {
            return;
        }
    }

    const guild = message?.guild;
    if (!guild) return;

    const config = client.db.get(`rolereact_${guild.id}_${message.id}`);
    if (!config?.role || config.type === "button") return;

    const expectedEmoji = typeof config.emoji === "string"
        ? config.emoji
        : config.emoji?.id || config.emoji?.name;
    const actualEmoji = reaction.emoji.id
        ? [reaction.emoji.id, reaction.emoji.toString()]
        : [reaction.emoji.name, reaction.emoji.toString()];
    if (!expectedEmoji || !actualEmoji.includes(expectedEmoji)) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    const role = guild.roles.cache.get(config.role);
    if (!member || !role?.editable) return;

    if (shouldHaveRole && !member.roles.cache.has(role.id)) {
        await member.roles.add(role, "Rôle attribué via une réaction");
    } else if (!shouldHaveRole && member.roles.cache.has(role.id)) {
        await member.roles.remove(role, "Rôle retiré via une réaction");
    }
}

module.exports = { toggleReactionRole };
const { Bot } = require('../../structures/client')
const { readTicketSettings } = require("../../utils/ticket-settings")
const { createTicketForMember } = require("../../utils/ticket-runtime")
module.exports = {
    name: 'messageReactionAdd',

    /**
     * @param {Bot} client 
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.GuildMember} user
     */
    run: async (client, reaction, user) => {
        if (!reaction || !user || user.bot) return;
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch {
                return;
            }
        }
        const message = reaction.message;
        if (message.partial) {
            try {
                await message.fetch();
            } catch {
                return;
            }
        }
        const guild = message.guild;
        if (!guild) return;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;
        const panelMessageId = client.db.get(`ticket_${guild.id}`);
        const configuredEmoji = client.db.get(`ticket_react_${guild.id}`);
        if (!panelMessageId || message.id !== panelMessageId || !configuredEmoji) return;
        const matchesEmoji = reaction.emoji.id
            ? String(configuredEmoji).includes(reaction.emoji.id)
            : String(configuredEmoji).trim() === reaction.emoji.name;
        if (!matchesEmoji) return;
        await reaction.users.remove(member.user.id).catch(() => null);

        const settings = readTicketSettings(client, guild.id);
        const optionId = settings.options[0]?.id || "support";
        const result = await createTicketForMember(client, guild, member, optionId);
        if (result.error) {
            return reaction.message.channel
                .send(result.error)
                .then(m => m.delete({ timeout: 8000 }))
                .catch(() => null);
        }
    }
}

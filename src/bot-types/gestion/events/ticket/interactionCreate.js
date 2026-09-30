module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        if (!interaction.isButton() || interaction.customId !== "ticket:close") return;
        const channel = interaction.channel;
        const guild = interaction.guild;
        if (!guild || !channel?.name.startsWith("ticket-")) {
            return interaction.reply({ content: "Ce bouton ne se trouve pas dans un ticket.", ephemeral: true });
        }

        const ownerId = channel.topic?.match(/^Ticket de (\d+)$/)?.[1];
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        const supportRoles = client.db.get(`perm_ticket.${guild.id}`) || [];
        const isSupport = member && supportRoles.some(roleId => member.roles.cache.has(roleId));
        const isOwner = ownerId === interaction.user.id;
        const isBuyer = client.config.buyers.includes(interaction.user.id) ||
            client.db.get(`owner_${interaction.user.id}`) === true;
        if (!isOwner && !isSupport && !isBuyer) {
            return interaction.reply({ content: "Seul l'auteur du ticket ou l'équipe autorisée peut le fermer.", ephemeral: true });
        }

        await interaction.reply({ content: "Fermeture du ticket…", ephemeral: true });
        await channel.delete(`Ticket fermé par ${interaction.user.tag}`);
    },
};
module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        if (!interaction.isButton() || !interaction.customId.startsWith("rolereact:")) return;
        if (!interaction.guild) {
            return interaction.reply({ content: "Ce bouton fonctionne uniquement sur un serveur.", ephemeral: true });
        }

        const [, roleId] = interaction.customId.split(":");
        const config = client.db.get(`rolereact_${interaction.guild.id}_${interaction.message.id}`);
        if (!config || config.type !== "button" || config.role !== roleId) {
            return interaction.reply({ content: "Ce bouton de rôle n'est plus valide.", ephemeral: true });
        }

        const role = interaction.guild.roles.cache.get(roleId);
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member || !role || !role.editable) {
            return interaction.reply({ content: "Le bot ne peut pas gérer ce rôle.", ephemeral: true });
        }

        const hadRole = member.roles.cache.has(role.id);
        if (hadRole) {
            await member.roles.remove(role, "Rôle retiré via le menu de rôles");
        } else {
            await member.roles.add(role, "Rôle attribué via le menu de rôles");
        }
        return interaction.reply({
            content: hadRole ? `Le rôle ${role.name} a été retiré.` : `Le rôle ${role.name} a été attribué.`,
            ephemeral: true,
        });
    },
};
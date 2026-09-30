const Discord = require("discord.js");
const { buildHelpPages } = require("../../utils/help-pages");

module.exports = {
  name: "interactionCreate",

  run: async (client, interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== "select") return;

    const authorId = client.db.get(
      `${interaction.guildId}_${interaction.message.id}_author`
    );
    if (authorId !== interaction.user.id) {
      return interaction.reply({
        content: "Vous ne pouvez pas utiliser ce menu.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    const color =
      client.db.get(`color_${interaction.guildId}`) || client.color;
    const prefix =
      client.db.get(`prefix_${interaction.guildId}`) || client.prefix;
    const { pages, row } = buildHelpPages(client, {
      prefix,
      color,
      footer: client.footer,
    });
    const embed = pages.get(interaction.values[0]);

    if (!embed) {
      return interaction.reply({
        content: "Cette page d'aide n'existe plus. Relancez la commande help.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }

    return interaction.update({ embeds: [embed], components: [row] });
  },
};
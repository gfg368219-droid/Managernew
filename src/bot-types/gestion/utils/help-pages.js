const Discord = require("discord.js");

const COMMAND_GROUPS = [
  { category: "utilitaire", label: "Utilitaires", title: "Utilitaire" },
  { category: "moderation", label: "Modération", title: "Modération" },
  { category: "logs", label: "Logs", title: "Logs" },
  { category: "gestion", label: "Gestion", title: "Gestion" },
  { category: "antiraid", label: "Anti-Raid", title: "Anti-Raid" },
  { category: "backup", label: "Backup", title: "Backup" },
  { category: "botcontrol", label: "Bot Control", title: "Bot Control" },
  { category: "proprio", label: "Propriétaire", title: "Propriétaire" },
  { category: "buyers", label: "Buyer", title: "Buyer" },
];

const COMMANDS_PER_PAGE = 25;
const HELP_DESCRIPTION =
  "*Les paramètres mis entre <> sont obligatoires contrairement aux paramètres mis entre [] qui sont facultatifs.*";

function buildHelpPages(client, { prefix, color, footer }) {
  const pages = new Map();
  const options = [];

  for (const group of COMMAND_GROUPS) {
    const commands = Array.from(client.commands.values()).filter(
      (command) => command.category === group.category
    );
    const pageCount = Math.max(1, Math.ceil(commands.length / COMMANDS_PER_PAGE));

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const value = `${group.category}:${pageIndex}`;
      const pageLabel =
        pageCount > 1 ? `${group.label} · ${pageIndex + 1}/${pageCount}` : group.label;
      const embedTitle =
        pageCount > 1 ? `${group.title} — Page ${pageIndex + 1}/${pageCount}` : group.title;
      const embed = new Discord.MessageEmbed()
        .setTitle(embedTitle)
        .setDescription(HELP_DESCRIPTION)
        .setColor(color)
        .setFooter(footer);
      const pageCommands = commands.slice(
        pageIndex * COMMANDS_PER_PAGE,
        (pageIndex + 1) * COMMANDS_PER_PAGE
      );

      for (const command of pageCommands) {
        const usages = Array.isArray(command.usage) ? command.usage : [];
        const details = `${command.description || "Aucune description"}\nUsages : ${
          usages.length
            ? usages.map((usage) => `\`${prefix}${usage}\``).join(", ")
            : "Aucun usage indiqué"
        }`;
        embed.addField(`\`${prefix}${command.name}\``, details);
      }

      pages.set(value, embed);
      options.push({
        label: pageLabel,
        description:
          pageCount > 1
            ? `Commandes ${pageIndex * COMMANDS_PER_PAGE + 1} à ${Math.min(
                (pageIndex + 1) * COMMANDS_PER_PAGE,
                commands.length
              )}`
            : `Affiche les commandes ${group.label.toLowerCase()}`,
        value,
      });
    }
  }

  if (options.length > 25) {
    throw new Error("Le menu d'aide dépasse la limite de 25 pages Discord.");
  }

  const row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageSelectMenu()
      .setCustomId("select")
      .setPlaceholder("Sélectionnez une page du help")
      .addOptions(options)
  );

  return {
    pages,
    row,
    initialValue: pages.has("utilitaire:0") ? "utilitaire:0" : pages.keys().next().value,
  };
}

module.exports = { buildHelpPages };
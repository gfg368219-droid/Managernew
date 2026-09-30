const Discord = require("discord.js");
const { buildHelpPages } = require("../../utils/help-pages");

module.exports = {
  name: "help",
  aliases: [],
  description: "Permet de voir la liste des commandes du bot",
  category: "utilitaire",
  usage: ["help", "help [commande]", "help var welcome"],

  run: async (client, message, args, color, prefix, footer, commandName) => {
    let pass = false;
    const staff = client.staff;

    if (
      !staff.includes(message.author.id) &&
      !client.config.buyers.includes(message.author.id) &&
      client.db.get(`owner_${message.author.id}`) !== true
    ) {
      if (
        client.db.get(`perm_${commandName}.${message.guild.id}`) === "1" &&
        message.member.roles.cache.some((role) =>
          client.db.get(`perm1.${message.guild.id}`)?.includes(role.id)
        )
      ) {
        pass = true;
      }
      if (
        client.db.get(`perm_${commandName}.${message.guild.id}`) === "2" &&
        message.member.roles.cache.some((role) =>
          client.db.get(`perm2.${message.guild.id}`)?.includes(role.id)
        )
      ) {
        pass = true;
      }
      if (
        client.db.get(`perm_${commandName}.${message.guild.id}`) === "3" &&
        message.member.roles.cache.some((role) =>
          client.db.get(`perm3.${message.guild.id}`)?.includes(role.id)
        )
      ) {
        pass = true;
      }
      if (
        client.db.get(`perm_${commandName}.${message.guild.id}`) === "4" &&
        message.member.roles.cache.some((role) =>
          client.db.get(`perm4.${message.guild.id}`)?.includes(role.id)
        )
      ) {
        pass = true;
      }
      if (
        client.db.get(`perm_${commandName}.${message.guild.id}`) === "5" &&
        message.member.roles.cache.some((role) =>
          client.db.get(`perm5.${message.guild.id}`)?.includes(role.id)
        )
      ) {
        pass = true;
      }
      if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") {
        pass = "oui";
      }
    } else {
      pass = true;
    }

    if (pass === false) {
      return message.channel.send(
        "Vous n'avez pas la permission d'utiliser cette commande."
      );
    }

    if (!args[0]) {
      const help = buildHelpPages(client, { prefix, color, footer });
      const embed = help.pages.get(help.initialValue);
      const sentMessage = await message.channel.send({
        embeds: [embed],
        components: [help.row],
      });
      client.db.set(
        `${sentMessage.guild.id}_${sentMessage.id}_author`,
        message.author.id
      );
      return sentMessage;
    }

    if (args[0] !== "var") {
      const command =
        client.commands.get(args[0].toLowerCase()) ||
        client.commands.find(
          (entry) =>
            entry.aliases && entry.aliases.includes(args[0].toLowerCase())
        );
      if (!command) return message.reply("Cette commande n'existe pas");

      const aliases =
        command.aliases?.length > 0
          ? command.aliases.map((alias) => `\`${prefix}${alias}\``).join("\n")
          : "Aucun";
      const usages = Array.isArray(command.usage) ? command.usage : [];
      const embed = new Discord.MessageEmbed()
        .setTitle(`Commande ${command.name}`)
        .setDescription(command.description || "Aucune description")
        .setColor(color)
        .setFooter(footer)
        .addField(
          "Utilisation(s)",
          usages.map((usage) => `\`${prefix}${usage}\``).join("\n") || "Aucun usage indiqué"
        )
        .addField("Aliases", aliases);
      return message.reply({ embeds: [embed] });
    }

    if (args[0] === "var" && args[1] === "welcome") {
      const embed = new Discord.MessageEmbed()
        .setTitle("Variables")
        .setDescription("Compatible avec : Messages de bienvenue")
        .setColor(color)
        .setFooter(footer)
        .addField(
          "**{user.username}**",
          `Affiche le pseudo du membre invité\n\`Exemple :\` ${message.author}`,
          true
        )
        .addField(
          "**{user.id}**",
          `Affiche l'ID du membre invité\n\`Exemple : ${message.author.id}\``,
          true
        )
        .addField(
          "**{user.tag}**",
          `Affiche le tag du membre invité\n\`Exemple : ${message.author.tag}\``,
          true
        )
        .addField(
          "**{user.mention}**",
          `Affiche la mention du membre invité\n\`Exemple :\` ${message.author}`
        )
        .addField(
          "**{guild.name}**",
          `Affiche le nom du serveur\n\`Exemple : ${message.guild.name}\``,
          true
        )
        .addField(
          "**{guild.memberCount}**",
          `Affiche le nombre de membres du serveur\n\`Exemple : ${message.guild.memberCount}\``,
          true
        )
        .addField(
          "**{vanity.usesCount}**",
          `Affiche le nombre d'utilisations du vanity du serveur\n\`Exemple : ${
            message.guild.vanityURLUses || 0
          }\``,
          true
        )
        .addField(
          "**{vanity.Url}**",
          `Affiche le code vanity du serveur\n\`Exemple : ${
            message.guild.vanityURLCode || "none"
          }\``,
          true
        );
      return message.channel.send({ embeds: [embed] });
    }
  },
};
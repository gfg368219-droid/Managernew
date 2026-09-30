module.exports = {
    name: "buyer",
    aliases: [],
    description: "Permet de lister, d'ajouter ou de supprimer des buyers",
    category: "proprio",
    usage: ["buyer", "buyer add <utilisateur>", "buyer remove <utilisateur>"],

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */

    run: async (client, message, args) => {
        if (!client.config.buyers.includes(message.author.id)) {
            return message.channel.send("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        const extras = client.db.get("extra_buyers") || [];
        const action = (args[0] || "list").toLowerCase();
        if (action === "list") {
            const buyers = client.config.buyers.map(id => `<@${id}>`).join("\n");
            return message.channel.send(buyers ? `**Buyers autorisés**\n${buyers}` : "Aucun buyer configuré.");
        }
        if (action !== "add" && action !== "remove") {
            return message.reply(`Utilisation : \`${prefix}buyer add|remove <utilisateur>\``);
        }

        const targetId = message.mentions.users.first()?.id || args[1];
        if (!/^\d{17,20}$/.test(targetId || "")) {
            return message.reply("Mentionnez un utilisateur ou fournissez son identifiant Discord.");
        }

        if (action === "add") {
            if (client.config.buyers.includes(targetId)) return message.reply("Cet utilisateur est déjà buyer.");
            client.db.set("extra_buyers", [...new Set([...extras, targetId])]);
            client.config.buyers.push(targetId);
            return message.channel.send(`<@${targetId}> a été ajouté à la liste des buyers.`);
        }

        if (client.config.rootBuyers.includes(targetId)) {
            return message.reply("Le propriétaire initial ne peut pas être retiré de la liste.");
        }
        if (!extras.includes(targetId)) return message.reply("Cet utilisateur n'est pas un buyer ajouté.");
        client.db.set("extra_buyers", extras.filter(id => id !== targetId));
        client.config.buyers = client.config.buyers.filter(id => id !== targetId);
        return message.channel.send(`<@${targetId}> a été retiré de la liste des buyers.`);
    },
};

function updateServerCountActivity(client) {
  if (!client?.user || !client.guilds?.cache) return;

  const serverCount = client.guilds.cache.size;
  const serverLabel = serverCount === 1 ? "serveur" : "serveurs";
  client.user.setActivity(`Présent sur ${serverCount} ${serverLabel}`, {
    type: "PLAYING",
  });
}

module.exports = { updateServerCountActivity };
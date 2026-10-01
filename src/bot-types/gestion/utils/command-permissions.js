function getCommandClientWithPermissionCompatibility(client, message, commandName) {
  const guildId = message.guildId || message.guild?.id;
  const userId = message.author?.id;
  if (!guildId || !userId) return client;
  if (
    client.staff?.includes(userId) ||
    client.config?.buyers?.includes(userId) ||
    client.db.get(`owner_${userId}`) === true
  ) {
    return client;
  }

  const permissionKey = `perm_${commandName}.${guildId}`;
  const permissionLevel = String(client.db.get(permissionKey) ?? "");
  if (!/^[6-9]$/.test(permissionLevel)) return client;

  // Existing command handlers check levels 1–5 inline. Present a private,
  // per-invocation DB view so their first check maps level 6–9 to that level's
  // role list without changing the shared database or rewriting each handler.
  const originalDb = client.db;
  const originalGet = originalDb.get;
  const levelRoleKey = `perm${permissionLevel}.${guildId}`;
  const levelOneRoleKey = `perm1.${guildId}`;
  const dbView = new Proxy(originalDb, {
    get(target, property) {
      if (property === "get") {
        return (key, ...args) => {
          if (key === permissionKey) return "1";
          if (key === levelOneRoleKey) {
            return originalGet.call(target, levelRoleKey, ...args);
          }
          return originalGet.call(target, key, ...args);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  return new Proxy(client, {
    get(target, property) {
      if (property === "db") return dbView;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

module.exports = { getCommandClientWithPermissionCompatibility };
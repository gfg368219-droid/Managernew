const { toggleReactionRole } = require("../../utils/role-reaction");

module.exports = {
    name: "messageReactionRemove",
    run: async (client, reaction, user) => {
        await toggleReactionRole(client, reaction, user, false);
    },
};
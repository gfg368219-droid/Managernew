const { toggleReactionRole } = require("../../utils/role-reaction");

module.exports = {
    name: "messageReactionAdd",
    run: async (client, reaction, user) => {
        await toggleReactionRole(client, reaction, user, true);
    },
};
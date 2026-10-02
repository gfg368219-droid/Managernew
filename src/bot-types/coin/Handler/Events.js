const config = require('../config.js');
const fs = require('fs');

module.exports = (bot) => {
  const eventFiles = fs.readdirSync('./Events/').filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const event = require(`../Events/${file}`);

    const eventName = event.name === 'ready' ? 'clientReady' : event.name;
    if (event.once) {
      bot.once(eventName, (...args) => event.execute(...args, bot, config));
    } else {
      bot.on(eventName, (...args) => event.execute(...args, bot, config));
    }
        //console.log(`[EVENT] ▸ ${file}`);
  }

  const eventSubFolders = fs.readdirSync('./Events/').filter((folder) => !folder.endsWith('.js'));

  for (const folder of eventSubFolders) {
    const subEventFiles = fs.readdirSync(`./Events/${folder}/`).filter((file) => file.endsWith('.js'));

    for (const file of subEventFiles) {
      const event = require(`../Events/${folder}/${file}`);

      const eventName = event.name === 'ready' ? 'clientReady' : event.name;
      if (event.once) {
        bot.once(eventName, (...args) => event.execute(...args, bot, config));
      } else {
        bot.on(eventName, (...args) => event.execute(...args, bot, config));
      }
            //console.log(`[EVENT] ▸ ${file} - ${folder}`);
    }
  }
};
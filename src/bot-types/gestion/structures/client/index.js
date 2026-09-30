const { Client, Collection, Intents } = require('discord.js')
const db = require('quick.db')
const fs = require('fs')
global.print = console.log

class bot extends Client {
    constructor(options = {
        intents: [Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.MESSAGE_CONTENT]
    }) {
        super(options);
        this.setMaxListeners(15)
        this.db = db
        this.color = "#1519f0"
        this.footer = ""
        this.link = "https://discord.gg/Rq6mnAtuMc"
        this.prefix = db.get(`mainprefix`) || "&"
        this.dev = "BNT Feujjj"
        this.staff = []
        this.version = require('../../version.json').version
        this.snipe = new Collection()
        this.config = require('../../config')
        this.commands = new Collection()
        this.aliases = new Collection()
        this.loadCommands()
        this.loadEvents()
        this.login(this.config.token).catch((error) => {
            if (process.send) {
                process.send({ type: "error", message: error.message })
            }
            setTimeout(() => process.exit(1), 100)
        })
    }

    loadCommands() {
        const categories = fs.readdirSync('./commands', { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .sort()
        for (const category of categories) {
            const commandsFiles = fs.readdirSync(`./commands/${category}`)
                .filter(file => file.endsWith('.js'))
                .sort()
            for (const commandFile of commandsFiles) {
                const command = require(`../../commands/${category}/${commandFile}`)
                if (!command || typeof command.name !== 'string' || typeof command.run !== 'function') {
                    console.warn(`[gestion] commande ignorée (métadonnées manquantes) : ${category}/${commandFile}`)
                    continue
                }
                if (this.commands.has(command.name)) {
                    throw new Error(`Nom de commande en double : ${command.name}`)
                }
                this.commands.set(command.name, command)
                if (command.aliases && command.aliases.length > 0) {
                    command.aliases.forEach(alias => {
                        if (this.commands.has(alias) || this.aliases.has(alias)) {
                            console.warn(`[gestion] alias en double ignoré : ${alias}`)
                            return
                        }
                        this.aliases.set(alias, command)
                    })
                }
            }
        }
        console.log(`[gestion] ${this.commands.size} commandes chargées`)
    }

    loadEvents() {
        const categories = fs.readdirSync('./events', { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .sort()
        let loadedEvents = 0
        for (const category of categories) {
            const eventsFiles = fs.readdirSync(`./events/${category}`)
                .filter(file => file.endsWith(".js"))
                .sort()
            for (const eventFile of eventsFiles) {
                const event = require(`../../events/${category}/${eventFile}`)
                if (!event || typeof event.name !== 'string' || typeof event.run !== 'function') {
                    console.warn(`[gestion] événement ignoré (métadonnées manquantes) : ${category}/${eventFile}`)
                    continue
                }
                if (event.enabled === false) {
                    console.warn(`[gestion] événement désactivé pour compatibilité : ${category}/${eventFile}`)
                    continue
                }
                const eventName = event.name === 'ready' ? 'clientReady' : event.name
                this.on(eventName, (...args) => event.run(this, ...args))
                loadedEvents += 1
            }
        }
        console.log(`[gestion] ${loadedEvents} événements chargés`)
    }
}

exports.bot = bot
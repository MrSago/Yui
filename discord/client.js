/**
 * @file Discord client initialization
 * @description Discord bot client with command and event handlers
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  GatewayIntentBits,
  REST,
  Collection,
  Routes,
  Partials,
} = require("discord.js");
const logger = require("../logger.js");

/**
 * Initializes and configures Discord client
 * @param {Object} config - Discord configuration object
 * @param {string} config.token - Discord bot token
 * @param {string} config.client_id - Discord application client ID
 * @returns {Promise<Client>} Configured Discord client
 */
async function initializeClient(config) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Reaction],
    disableEveryone: false,
  });

  const rest = new REST({ version: "10" }).setToken(config.token);

  const commands = [];
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (!("data" in command) || !("execute" in command)) {
      logger.warn(
        `The command at "${file}" is missing a required "data" or "execute" property`
      );
      continue;
    }

    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
    logger.info(`The command at "${file}" is registered`);
  }

  const eventsPath = path.join(__dirname, "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!("name" in event) || !("once" in event)) {
      logger.warn(
        `The event at "${file}" is missing a "name" or "once" property`
      );
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    logger.info(`The event at "${file}" is registered`);
  }

  try {
    logger.info(
      `Started refreshing ${commands.length} application (/) commands`
    );

    const data = await rest.put(Routes.applicationCommands(config.client_id), {
      body: commands,
    });

    logger.info(
      `Successfully reloaded ${data.length} application (/) commands`
    );
  } catch (error) {
    logger.error(error);
  }

  return client;
}

module.exports = {
  initializeClient,
};

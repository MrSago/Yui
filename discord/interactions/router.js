/**
 * @file Interaction Router
 * @description Routes component/modal interactions to dedicated handlers
 */

const logger = require("../../logger.js").child({
  module: "discord/interactions/router",
});
const { MessageFlags } = require("discord.js");
const { lootFilterInteractionHandler } = require("./lootFilter.js");
const { configPanelInteractionHandler } = require("./configPanel.js");

const handlers = [configPanelInteractionHandler, lootFilterInteractionHandler];

function isComponentOrModalInteraction(interaction) {
  return (
    interaction.isButton?.() ||
    interaction.isStringSelectMenu?.() ||
    interaction.isChannelSelectMenu?.() ||
    interaction.isModalSubmit?.()
  );
}

async function routeInteraction(interaction) {
  if (!isComponentOrModalInteraction(interaction)) {
    return false;
  }

  for (const handler of handlers) {
    if (!handler.canHandle(interaction)) {
      continue;
    }

    try {
      await handler.handle(interaction);
      return true;
    } catch (error) {
      logger.error(
        { err: error, handler: handler.name, custom_id: interaction.customId },
        "Interaction handler failed",
      );

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Произошла ошибка при обработке взаимодействия.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return true;
    }
  }

  return false;
}

module.exports = {
  routeInteraction,
};

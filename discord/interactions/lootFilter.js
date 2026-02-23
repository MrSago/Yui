/**
 * @file Loot filter interaction handlers
 * @description Builds UI for loot filter selection and handles updates
 */

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");

const { loot: config } = require("../../config/index.js");
const sirusApi = require("../../api/sirusApi.js");
const {
  getLootSettingsForGuild,
  clearLootFilters,
  toggleLootFilter,
  setLootFilterForMap,
} = require("../../db/database.js");
const logger = require("../../logger.js").child({ module: "discord/interactions/lootFilter" });

const LOOTFILTER_DUNGEON_SELECT_ID = "lootfilter:dungeon";
const LOOTFILTER_BOSS_SELECT_ID = "lootfilter:boss";
const LOOTFILTER_CLEAR_BUTTON_ID = "lootfilter:clear";

const MAX_SELECT_OPTIONS = 25;

function normalizeFilterMap(filter) {
  if (!filter) {
    return new Map();
  }

  if (filter instanceof Map) {
    return filter;
  }

  return new Map(Object.entries(filter));
}

function buildDungeonIndex(instances) {
  const dungeons = new Map();

  instances.forEach((instance) => {
    const mapId = instance.mapId ?? instance.map_id ?? instance.map;

    if (mapId === undefined || mapId === null) {
      return;
    }

    const normalizedMapId = String(mapId);
    const mapName = instance.name ?? `Подземелье ${normalizedMapId}`;

    if (!dungeons.has(normalizedMapId)) {
      dungeons.set(normalizedMapId, {
        mapId: normalizedMapId,
        name: mapName,
        bosses: new Map(),
      });
    }

    const encounters = Array.isArray(instance.encounters)
      ? instance.encounters
      : [];

    encounters.forEach((encounter) => {
      const encounterOrder = encounter.order ?? encounter.encounter_id;
      if (encounterOrder === undefined || encounterOrder === null) {
        return;
      }

      const normalizedEncounterId = Number(encounterOrder);
      if (Number.isNaN(normalizedEncounterId)) {
        return;
      }

      const bossName = encounter.name ?? `Босс ${normalizedEncounterId}`;
      dungeons.get(normalizedMapId).bosses.set(normalizedEncounterId, bossName);
    });
  });

  return dungeons;
}

function buildDungeonSelect(userId, dungeons, selectedMapId) {
  const options = Array.from(dungeons.values())
    .slice(0, MAX_SELECT_OPTIONS)
    .map((dungeon) => ({
      label: String(dungeon.name).slice(0, 100),
      description: `ID: ${dungeon.mapId}`.slice(0, 100),
      value: dungeon.mapId,
      default: selectedMapId === dungeon.mapId,
    }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`${LOOTFILTER_DUNGEON_SELECT_ID}:${userId}`)
    .setPlaceholder("Выберите подземелье")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

function buildBossSelect(userId, mapId, dungeon) {
  const options = [
    {
      label: "Все боссы",
      description: "Отслеживать все энкаунтеры подземелья",
      value: "all",
    },
    ...Array.from(dungeon?.bosses?.entries() ?? [])
      .slice(0, MAX_SELECT_OPTIONS - 1)
      .map(([encounterId, name]) => ({
        label: String(name).slice(0, 100),
        description: `ID: ${encounterId}`.slice(0, 100),
        value: String(encounterId),
      })),
  ];

  const select = new StringSelectMenuBuilder()
    .setCustomId(`${LOOTFILTER_BOSS_SELECT_ID}:${userId}:${mapId}`)
    .setPlaceholder("Выберите босса для добавления/удаления")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

function buildClearButton(userId) {
  const button = new ButtonBuilder()
    .setCustomId(`${LOOTFILTER_CLEAR_BUTTON_ID}:${userId}`)
    .setLabel("Сбросить все фильтры")
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(button);
}

async function buildLootFilterMessage({ guildId, userId, selectedMapId } = {}) {
  const lootSettings = await getLootSettingsForGuild(guildId);
  const filterMap = normalizeFilterMap(lootSettings.filter);
  const data = await sirusApi.getLatestBossKills(
    lootSettings.realm_id,
    lootSettings.guild_sirus_id,
  );
  const instances = data?.instances ?? [];

  const dungeons = buildDungeonIndex(instances);

  for (const mapId of filterMap.keys()) {
    if (!dungeons.has(String(mapId))) {
      dungeons.set(String(mapId), {
        mapId: String(mapId),
        name: `Подземелье ${mapId}`,
        bosses: new Map(),
      });
    }
  }

  if (dungeons.size === 0) {
    return {
      content:
        "⚠️ **Нет данных по подземельям.**\n" +
        "Проверьте, что настроены вывод лута и доступны последние киллы.",
      components: [],
    };
  }

  const dungeonSelect = buildDungeonSelect(userId, dungeons, selectedMapId);
  const components = [buildClearButton(userId), dungeonSelect];

  if (selectedMapId && dungeons.has(String(selectedMapId))) {
    components.push(
      buildBossSelect(
        userId,
        String(selectedMapId),
        dungeons.get(String(selectedMapId)),
      ),
    );
  }

  const embed = new EmbedBuilder()
    .setTitle("Настройка фильтров лута")
    .setColor(config.embed.color);

  if (!filterMap || filterMap.size === 0) {
    embed.setDescription("Фильтры пока не установлены.");
  } else {
    for (const [mapId, encounterIds] of filterMap.entries()) {
      const dungeon = dungeons.get(String(mapId));
      const dungeonName = dungeon?.name ?? `Подземелье ${mapId}`;
      let value = "Все боссы";

      if (encounterIds && encounterIds.length > 0) {
        const bossNames = encounterIds.map((encounterId) => {
          const name = dungeon?.bosses?.get(Number(encounterId));
          return name ? `• ${name} (${encounterId})` : `• ${encounterId}`;
        });
        value = bossNames.join("\n");
      }

      embed.addFields({ name: dungeonName, value });
    }
  }

  return {
    content:
      "1) Выберите подземелье.\n" +
      "2) Затем выберите босса для добавления или удаления.\n",
    embeds: [embed],
    components,
  };
}

function isLootFilterInteraction(interaction) {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) {
    return false;
  }

  return (
    interaction.customId.startsWith(LOOTFILTER_DUNGEON_SELECT_ID) ||
    interaction.customId.startsWith(LOOTFILTER_BOSS_SELECT_ID) ||
    interaction.customId.startsWith(LOOTFILTER_CLEAR_BUTTON_ID)
  );
}

async function handleLootFilterInteraction(interaction) {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) {
    return false;
  }

  const [prefix, type, userId, mapId] = interaction.customId.split(":");
  if (!prefix || !type || !userId) {
    return false;
  }

  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "Эта панель настроек принадлежит другому пользователю.",
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  try {
    if (interaction.customId.startsWith(LOOTFILTER_CLEAR_BUTTON_ID)) {
      await clearLootFilters(interaction.guildId);
      const message = await buildLootFilterMessage({
        guildId: interaction.guildId,
        userId,
      });

      await interaction.update(message);
      return true;
    }

    if (interaction.customId.startsWith(LOOTFILTER_DUNGEON_SELECT_ID)) {
      const selectedMapId = interaction.values[0];
      const message = await buildLootFilterMessage({
        guildId: interaction.guildId,
        userId,
        selectedMapId,
      });

      await interaction.update(message);
      return true;
    }

    if (interaction.customId.startsWith(LOOTFILTER_BOSS_SELECT_ID)) {
      const selectedValue = interaction.values[0];
      const targetMapId = mapId ?? interaction.values[0];

      if (selectedValue === "all") {
        const lootSettings = await getLootSettingsForGuild(interaction.guildId);
        const filterMap = normalizeFilterMap(lootSettings.filter);
        const existingEncounters = filterMap.get(String(targetMapId)) ?? null;

        if (
          Array.isArray(existingEncounters) &&
          existingEncounters.length === 0
        ) {
          await setLootFilterForMap(interaction.guildId, targetMapId, null);
        } else {
          await setLootFilterForMap(interaction.guildId, targetMapId, []);
        }
      } else {
        const encounterId = Number(selectedValue);
        if (!Number.isNaN(encounterId)) {
          await toggleLootFilter(interaction.guildId, targetMapId, encounterId);
        }
      }

      const message = await buildLootFilterMessage({
        guildId: interaction.guildId,
        userId,
        selectedMapId: targetMapId,
      });

      await interaction.update(message);
      return true;
    }
  } catch (error) {
    logger.error({ err: error }, "Loot filter interaction failed:");
    if (error.name === "LootSettingsNotFoundError") {
      await interaction.reply({
        content:
          "Настройки лута не найдены для этого сервера. Пожалуйста, настройте вывод лута с помощью команды /setloot.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "Произошла внутренняя ошибка при настройке фильтров.",
        flags: MessageFlags.Ephemeral,
      });
    }
    return true;
  }

  logger.warn({ custom_id: interaction.customId }, "Unhandled loot filter interaction");
  return false;
}

module.exports = {
  buildLootFilterMessage,
  handleLootFilterInteraction,
  isLootFilterInteraction,
};

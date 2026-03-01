/**
 * @file Config panel interaction handlers
 * @description UI builders and handlers for /config panel
 */

const { randomBytes } = require("node:crypto");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const {
  clearLootFilters,
  deleteChangelogChannel,
  deleteLootChannel,
  getChangelogSettings,
  getLootSettingsForGuild,
  getSettingsArray,
  setLootFilterForMap,
  setChangelogChannel,
  setLootChannel,
  toggleLootFilter,
} = require("../../db/database.js");
const sirusApi = require("../../api/sirusApi.js");

const SESSION_TTL_MS = 10 * 60 * 1000;
const sessions = new Map();

const SECTION_CHANGELOG = "changelog";
const SECTION_LOOT = "loot";
const SECTION_LOOT_FILTERS = "lootfilters";

const LOOT_GUILD_INPUT_ID = "guild_sirus_id";
const MAX_SELECT_OPTIONS = 25;

const VALID_REALMS = new Map([
  [9, "Scourge x2"],
  [22, "Neverest x3"],
  [42, "Soulseeker x1"],
  [57, "Sirus x5"],
]);

function generateSessionId() {
  return randomBytes(6).toString("hex");
}

function nowTs() {
  return Date.now();
}

function touchSession(session) {
  session.updatedAt = nowTs();
}

function cleanupExpiredSessions() {
  const now = nowTs();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

function createSession(data) {
  cleanupExpiredSessions();

  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    ...data,
    updatedAt: nowTs(),
  });

  return sessionId;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  if (nowTs() - session.updatedAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

function getCustomId(sessionId, ...parts) {
  return ["config", sessionId, ...parts].join(":");
}

function getChannelSelectCustomId(sessionId, scope, channelId) {
  return getCustomId(
    sessionId,
    scope,
    "channel",
    channelId ? String(channelId) : "none",
  );
}

function parseCustomId(customId = "") {
  if (!customId.startsWith("config:")) {
    return null;
  }

  const parts = customId.split(":");
  if (parts.length < 3) {
    return null;
  }

  const [, sessionId, ...actionParts] = parts;
  return {
    sessionId,
    actionParts,
  };
}

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

function formatLootSettings(lootSettings) {
  if (!lootSettings) {
    return "Не настроено";
  }

  const channelText = lootSettings.channelId
    ? `<#${lootSettings.channelId}>`
    : "не указан";
  const hasRealm = Number.isInteger(lootSettings.realmId);
  const realmName = hasRealm
    ? (VALID_REALMS.get(lootSettings.realmId) ?? "Неизвестный realm")
    : "не указан";
  const realmText = hasRealm
    ? `${realmName} (${lootSettings.realmId})`
    : realmName;
  const guildSirusText = Number.isInteger(lootSettings.guildSirusId)
    ? String(lootSettings.guildSirusId)
    : "не указан";

  return [
    `Канал: ${channelText}`,
    `Реалм: ${realmText}`,
    `ID гильдии Sirus: ${guildSirusText}`,
  ].join("\n");
}

function formatChangelogSettings(channelId) {
  return channelId ? `<#${channelId}>` : "Не настроено";
}

function buildMainEmbed(state) {
  const embed = new EmbedBuilder()
    .setTitle("Конфигурация бота")
    .setColor(0x5865f2)
    .setDescription(
      "Выберите раздел, затем настройте параметры через меню ниже.",
    )
    .setFooter({
      text: `Статус: ${state.notice || "без изменений"}`,
    });

  if (state.section === SECTION_CHANGELOG) {
    embed.addFields(
      {
        name: "Changelog",
        value: formatChangelogSettings(state.current.changelogChannelId),
        inline: false,
      },
      {
        name: "Loot",
        value: formatLootSettings(state.current.loot),
        inline: false,
      },
      {
        name: "Loot Filters",
        value:
          state.lootFilterView?.summary ??
          "Фильтры пока не установлены или не удалось загрузить список подземелий.",
        inline: false,
      },
    );
  } else if (state.section === SECTION_LOOT) {
    embed.addFields(
      {
        name: "Changelog",
        value: formatChangelogSettings(state.current.changelogChannelId),
        inline: false,
      },
      {
        name: "Loot",
        value: formatLootSettings(state.current.loot),
        inline: true,
      },
      {
        name: "Черновик",
        value: formatLootSettings(state.draftLoot),
        inline: true,
      },
      {
        name: "Loot Filters",
        value:
          state.lootFilterView?.summary ??
          "Фильтры пока не установлены или не удалось загрузить список подземелий.",
        inline: false,
      },
    );
  } else {
    embed.addFields(
      {
        name: "Changelog",
        value: formatChangelogSettings(state.current.changelogChannelId),
        inline: false,
      },
      {
        name: "Loot",
        value: formatLootSettings(state.current.loot),
        inline: false,
      },
      {
        name: "Loot Filters",
        value:
          state.lootFilterView?.summary ??
          "Фильтры пока не установлены или не удалось загрузить список подземелий.",
        inline: false,
      },
    );
  }

  return embed;
}

function buildSectionSelect(sessionId, section) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(getCustomId(sessionId, "section"))
    .setPlaceholder("Выберите раздел настроек")
    .addOptions(
      {
        label: "Changelog",
        description: "Канал уведомлений об изменениях",
        value: SECTION_CHANGELOG,
        default: section === SECTION_CHANGELOG,
      },
      {
        label: "Loot",
        description: "Канал и параметры уведомлений о луте",
        value: SECTION_LOOT,
        default: section === SECTION_LOOT,
      },
      {
        label: "Loot Filters",
        description: "Фильтры подземелий и боссов",
        value: SECTION_LOOT_FILTERS,
        default: section === SECTION_LOOT_FILTERS,
      },
    );

  return new ActionRowBuilder().addComponents(select);
}

function buildChangelogControls(sessionId, state) {
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId(
      getChannelSelectCustomId(
        sessionId,
        "changelog",
        state.current?.changelogChannelId,
      ),
    )
    .setPlaceholder("Выберите канал для changelog")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    .setMinValues(1)
    .setMaxValues(1);

  if (state.current?.changelogChannelId) {
    channelSelect.setDefaultChannels(state.current.changelogChannelId);
  }

  return [
    new ActionRowBuilder().addComponents(channelSelect),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(getCustomId(sessionId, "changelog", "clear"))
        .setStyle(ButtonStyle.Danger)
        .setLabel("Сбросить changelog"),
    ),
  ];
}

function buildLootControls(sessionId, state, options = {}) {
  const { includeCloseButton = false } = options;
  const hasLootDraft = Boolean(
    state.draftLoot?.channelId &&
    Number.isInteger(state.draftLoot?.realmId) &&
    Number.isInteger(state.draftLoot?.guildSirusId),
  );

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId(
      getChannelSelectCustomId(sessionId, "loot", state.draftLoot?.channelId),
    )
    .setPlaceholder("Выберите канал для loot")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    .setMinValues(1)
    .setMaxValues(1);

  if (state.draftLoot?.channelId) {
    channelSelect.setDefaultChannels(state.draftLoot.channelId);
  }

  const realmSelect = new StringSelectMenuBuilder()
    .setCustomId(getCustomId(sessionId, "loot", "realm"))
    .setPlaceholder("Выберите реалм")
    .addOptions(
      ...Array.from(VALID_REALMS.entries()).map(([id, name]) => ({
        label: name,
        description: `Realm ID: ${id}`,
        value: String(id),
        default: id === state.draftLoot?.realmId,
      })),
    );

  return [
    new ActionRowBuilder().addComponents(channelSelect),
    new ActionRowBuilder().addComponents(realmSelect),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(getCustomId(sessionId, "loot", "params"))
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Указать ID гильдии Sirus"),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(getCustomId(sessionId, "loot", "save"))
        .setStyle(ButtonStyle.Success)
        .setLabel("Сохранить loot")
        .setDisabled(!hasLootDraft),
      new ButtonBuilder()
        .setCustomId(getCustomId(sessionId, "loot", "clear"))
        .setStyle(ButtonStyle.Danger)
        .setLabel("Сбросить loot"),
      ...(includeCloseButton
        ? [
            new ButtonBuilder()
              .setCustomId(getCustomId(sessionId, "close"))
              .setLabel("Закрыть")
              .setStyle(ButtonStyle.Secondary),
          ]
        : []),
    ),
  ];
}

function buildLootFilterControls(sessionId, state) {
  if (!state.lootFilterView?.canConfigure) {
    return [];
  }

  const components = [];

  const dungeonOptions = Array.from(state.lootFilterView.dungeons.values())
    .slice(0, MAX_SELECT_OPTIONS)
    .map((dungeon) => ({
      label: String(dungeon.name).slice(0, 100),
      description: `ID: ${dungeon.mapId}`.slice(0, 100),
      value: dungeon.mapId,
      default: state.lootFilterView.selectedMapId === dungeon.mapId,
    }));

  if (dungeonOptions.length > 0) {
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(getCustomId(sessionId, "lootfilters", "dungeon"))
          .setPlaceholder("Выберите подземелье")
          .addOptions(dungeonOptions),
      ),
    );
  }

  const selectedMapId = state.lootFilterView.selectedMapId;
  if (selectedMapId && state.lootFilterView.dungeons.has(selectedMapId)) {
    const dungeon = state.lootFilterView.dungeons.get(selectedMapId);
    const bossOptions = [
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

    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(
            getCustomId(sessionId, "lootfilters", "boss", selectedMapId),
          )
          .setPlaceholder("Выберите босса для добавления/удаления")
          .addOptions(bossOptions),
      ),
    );
  }

  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(getCustomId(sessionId, "lootfilters", "clear"))
        .setStyle(ButtonStyle.Danger)
        .setLabel("Сбросить все фильтры"),
    ),
  );

  return components;
}

async function buildLootFilterView(state) {
  try {
    const lootSettings = await getLootSettingsForGuild(state.guildId);
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

    const selectedMapId =
      state.lootFiltersSelectedMapId &&
      dungeons.has(String(state.lootFiltersSelectedMapId))
        ? String(state.lootFiltersSelectedMapId)
        : (dungeons.keys().next().value ?? null);
    state.lootFiltersSelectedMapId = selectedMapId;

    if (!filterMap || filterMap.size === 0) {
      return {
        canConfigure: true,
        dungeons,
        selectedMapId,
        summary: "Фильтры не установлены, выводятся все анонсы.",
      };
    }

    const lines = [];
    for (const [mapId, encounterIds] of filterMap.entries()) {
      const dungeon = dungeons.get(String(mapId));
      const dungeonName = dungeon?.name ?? `Подземелье ${mapId}`;

      if (!encounterIds || encounterIds.length === 0) {
        lines.push(`• ${dungeonName}: Все боссы`);
        continue;
      }

      const bossNames = encounterIds.map((encounterId) => {
        const name = dungeon?.bosses?.get(Number(encounterId));
        return name ? `${name} (${encounterId})` : String(encounterId);
      });
      lines.push(`• ${dungeonName}: ${bossNames.join(", ")}`);
    }

    return {
      canConfigure: true,
      dungeons,
      selectedMapId,
      summary: lines.join("\n"),
    };
  } catch (error) {
    if (error.name === "LootSettingsNotFoundError") {
      return {
        canConfigure: false,
        dungeons: new Map(),
        selectedMapId: null,
        summary:
          "Настройки лута не найдены для этого сервера. Сначала сохраните настройки в разделе Loot.",
      };
    }

    return {
      canConfigure: false,
      dungeons: new Map(),
      selectedMapId: null,
      summary: "Не удалось загрузить фильтры лута. Попробуйте позже.",
    };
  }
}

async function buildConfigMessage(sessionId, state) {
  state.lootFilterView = await buildLootFilterView(state);

  const components = [buildSectionSelect(sessionId, state.section)];

  if (state.section === SECTION_CHANGELOG) {
    components.push(...buildChangelogControls(sessionId, state));
  }

  if (state.section === SECTION_LOOT) {
    components.push(
      ...buildLootControls(sessionId, state, { includeCloseButton: true }),
    );
  }

  if (state.section === SECTION_LOOT_FILTERS) {
    components.push(...buildLootFilterControls(sessionId, state));
  }

  if (state.section !== SECTION_LOOT) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(getCustomId(sessionId, "close"))
          .setLabel("Закрыть")
          .setStyle(ButtonStyle.Secondary),
      ),
    );
  }

  return {
    embeds: [buildMainEmbed(state)],
    components,
  };
}

function buildLootParamsModal(sessionId, draftLoot) {
  const modal = new ModalBuilder()
    .setCustomId(getCustomId(sessionId, "loot", "modal"))
    .setTitle("Параметры loot");

  const guildInput = new TextInputBuilder()
    .setCustomId(LOOT_GUILD_INPUT_ID)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10);

  if (draftLoot?.guildSirusId) {
    guildInput.setValue(String(draftLoot.guildSirusId));
  }

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("ID гильдии Sirus")
      .setTextInputComponent(guildInput),
  );

  return modal;
}

function hasChannelPermissions(channel, clientUser) {
  const botPermissions = channel.permissionsFor(clientUser);
  return (
    botPermissions?.has(PermissionFlagsBits.ViewChannel) &&
    botPermissions?.has(PermissionFlagsBits.SendMessages) &&
    botPermissions?.has(PermissionFlagsBits.EmbedLinks)
  );
}

function parsePositiveInt(rawValue) {
  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

async function resolveCurrentSettings(guildId) {
  const settingsArray = await getSettingsArray();
  const guildSettings = settingsArray.find((item) => item.guild_id === guildId);

  let changelogChannelId = null;
  if (guildSettings?.changelog_id) {
    const changelogSettings = await getChangelogSettings();
    const match = changelogSettings?.find(
      (item) => String(item._id) === String(guildSettings.changelog_id),
    );

    changelogChannelId = match?.channel_id ?? null;
  }

  let loot = null;
  try {
    const lootSettings = await getLootSettingsForGuild(guildId);
    loot = {
      channelId: lootSettings.channel_id,
      realmId: lootSettings.realm_id,
      guildSirusId: lootSettings.guild_sirus_id,
    };
  } catch (error) {
    if (error.name !== "LootSettingsNotFoundError") {
      throw error;
    }
  }

  return {
    changelogChannelId,
    loot,
  };
}

async function updateConfigPanel(interaction, sessionId, session) {
  touchSession(session);
  await interaction.update(await buildConfigMessage(sessionId, session));
}

async function openConfigPanel(interaction) {
  const guild = interaction.guild;

  if (!guild) {
    return interaction.reply({
      content:
        "Используйте эту команду в текстовом канале Вашего дискорд сервера!",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
    return interaction.reply({
      content: "У вас нет прав на использование этой команды.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const current = await resolveCurrentSettings(guild.id);
  const state = {
    guildId: guild.id,
    userId: interaction.user.id,
    section: SECTION_CHANGELOG,
    current,
    draftLoot: current.loot ? { ...current.loot } : null,
    notice: null,
  };

  const sessionId = createSession(state);

  await interaction.reply({
    ...(await buildConfigMessage(sessionId, state)),
    flags: MessageFlags.Ephemeral,
  });
}

async function handleSectionAction(interaction, sessionId, session) {
  session.section = interaction.values[0];
  session.notice = null;
  await updateConfigPanel(interaction, sessionId, session);
}

async function handleChangelogAction(
  interaction,
  sessionId,
  session,
  subAction,
) {
  if (subAction === "clear") {
    await deleteChangelogChannel(session.guildId);
    session.current = await resolveCurrentSettings(session.guildId);
    session.notice = "Настройки changelog сброшены.";

    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "channel") {
    const channelId = interaction.values[0];
    const channel = await interaction.guild.channels.fetch(channelId);

    if (!channel?.isTextBased?.()) {
      session.notice =
        "Выбранный канал не подходит для отправки сообщений. Укажите текстовый канал.";
    } else if (!hasChannelPermissions(channel, interaction.client.user)) {
      session.notice =
        "У бота нет прав на выбранный канал (View/Send/Embed). Выберите другой канал.";
    } else {
      await setChangelogChannel(session.guildId, channel.id);
      session.current = await resolveCurrentSettings(session.guildId);
      session.notice = `Changelog канал установлен: #${channel.name}`;
    }

    await updateConfigPanel(interaction, sessionId, session);
  }
}

async function handleLootAction(interaction, sessionId, session, subAction) {
  if (subAction === "channel") {
    const channelId = interaction.values[0];
    const channel = await interaction.guild.channels.fetch(channelId);

    if (!channel?.isTextBased?.()) {
      session.notice =
        "Выбранный канал не подходит для отправки сообщений. Укажите текстовый канал.";
    } else if (!hasChannelPermissions(channel, interaction.client.user)) {
      session.notice =
        "У бота нет прав на выбранный канал (View/Send/Embed). Выберите другой канал.";
    } else {
      session.draftLoot = {
        ...(session.draftLoot ?? {}),
        channelId: channel.id,
      };
      session.notice = `Черновик loot обновлен: канал #${channel.name}`;
    }

    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "realm") {
    const realmId = Number(interaction.values[0]);

    if (!VALID_REALMS.has(realmId)) {
      session.notice = "Выбран неизвестный realm. Повторите выбор.";
    } else {
      session.draftLoot = {
        ...(session.draftLoot ?? {}),
        realmId,
      };
      session.notice = `Черновик loot обновлен: реалм ${VALID_REALMS.get(realmId)} (${realmId}).`;
    }

    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "params") {
    await interaction.showModal(
      buildLootParamsModal(sessionId, session.draftLoot),
    );
    touchSession(session);
    return;
  }

  if (subAction === "save") {
    const draft = session.draftLoot;

    if (
      !draft?.channelId ||
      !Number.isInteger(draft?.realmId) ||
      !Number.isInteger(draft?.guildSirusId)
    ) {
      session.notice =
        "Заполните все параметры loot: канал, realm_id и guild_sirus_id.";
      await updateConfigPanel(interaction, sessionId, session);
      return;
    }

    const channel = await interaction.guild.channels.fetch(draft.channelId);
    if (!channel?.isTextBased?.()) {
      session.notice = "Канал из черновика недоступен. Выберите канал заново.";
    } else if (!hasChannelPermissions(channel, interaction.client.user)) {
      session.notice =
        "У бота больше нет нужных прав в выбранном канале. Выберите другой канал.";
    } else {
      await setLootChannel(
        session.guildId,
        draft.channelId,
        draft.realmId,
        draft.guildSirusId,
      );

      session.current = await resolveCurrentSettings(session.guildId);
      session.draftLoot = session.current.loot
        ? { ...session.current.loot }
        : null;
      session.notice = `Loot настройки сохранены: #${channel.name}`;
    }

    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "clear") {
    await deleteLootChannel(session.guildId);
    session.current = await resolveCurrentSettings(session.guildId);
    session.draftLoot = session.current.loot
      ? { ...session.current.loot }
      : null;
    session.notice = "Настройки loot сброшены.";

    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "filters") {
    session.section = SECTION_LOOT_FILTERS;
    session.notice = null;
    await updateConfigPanel(interaction, sessionId, session);
  }
}

async function handleLootFiltersAction(
  interaction,
  sessionId,
  session,
  subAction,
  extra,
) {
  if (subAction === "open") {
    session.notice = null;
    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "clear") {
    await clearLootFilters(session.guildId);
    session.notice = "Фильтры лута сброшены.";
    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "dungeon") {
    session.lootFiltersSelectedMapId = interaction.values[0];
    session.notice = null;
    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (subAction === "boss") {
    const selectedValue = interaction.values[0];
    const targetMapId = extra ?? session.lootFiltersSelectedMapId;

    if (!targetMapId) {
      session.notice = "Сначала выберите подземелье.";
      await updateConfigPanel(interaction, sessionId, session);
      return;
    }

    if (selectedValue === "all") {
      const lootSettings = await getLootSettingsForGuild(session.guildId);
      const filterMap = normalizeFilterMap(lootSettings.filter);
      const existingEncounters = filterMap.get(String(targetMapId)) ?? null;

      if (
        Array.isArray(existingEncounters) &&
        existingEncounters.length === 0
      ) {
        await setLootFilterForMap(session.guildId, targetMapId, null);
      } else {
        await setLootFilterForMap(session.guildId, targetMapId, []);
      }
    } else {
      const encounterId = Number(selectedValue);
      if (!Number.isNaN(encounterId)) {
        await toggleLootFilter(session.guildId, targetMapId, encounterId);
      }
    }

    session.lootFiltersSelectedMapId = String(targetMapId);
    session.notice = null;
    await updateConfigPanel(interaction, sessionId, session);
    return;
  }

  if (!interaction.replied && !interaction.deferred) {
    await interaction.deferUpdate();
  }
}

async function handleLootModalSubmit(interaction, sessionId, session) {
  const guildSirusId = parsePositiveInt(
    interaction.fields.getTextInputValue(LOOT_GUILD_INPUT_ID),
  );

  if (!guildSirusId) {
    session.notice = "ID гильдии Sirus должен быть положительным числом.";
  } else {
    session.draftLoot = {
      ...(session.draftLoot ?? {}),
      guildSirusId,
    };
    session.notice = "Черновик loot обновлен: параметр guild_sirus_id.";
  }

  touchSession(session);
  await interaction.update(await buildConfigMessage(sessionId, session));
}

const configPanelInteractionHandler = {
  name: "configPanel",

  canHandle(interaction) {
    const parsed = parseCustomId(interaction.customId ?? "");
    return Boolean(parsed);
  },

  async handle(interaction) {
    const parsed = parseCustomId(interaction.customId ?? "");
    if (!parsed) {
      return;
    }

    const { sessionId, actionParts } = parsed;
    const session = getSession(sessionId);

    if (!session) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Сессия настроек истекла. Выполните /config снова.",
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    if (interaction.user.id !== session.userId) {
      await interaction.reply({
        content: "Эта панель настроек принадлежит другому пользователю.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.guildId && interaction.guildId !== session.guildId) {
      await interaction.reply({
        content: "Панель настроек недействительна для этого сервера.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const [action, subAction, extra] = actionParts;

    if (action === "close") {
      deleteSession(sessionId);
      await interaction.update({
        content: "Меню конфигурации закрыто.",
        embeds: [],
        components: [],
      });
      return;
    }

    if (interaction.isModalSubmit?.()) {
      if (action === "loot" && subAction === "modal") {
        await handleLootModalSubmit(interaction, sessionId, session);
      }
      return;
    }

    if (action === "section" && interaction.isStringSelectMenu?.()) {
      await handleSectionAction(interaction, sessionId, session);
      return;
    }

    if (action === "changelog") {
      await handleChangelogAction(interaction, sessionId, session, subAction);
      return;
    }

    if (action === "loot") {
      await handleLootAction(interaction, sessionId, session, subAction);
      return;
    }

    if (action === "lootfilters") {
      await handleLootFiltersAction(
        interaction,
        sessionId,
        session,
        subAction,
        extra,
      );
      return;
    }

    await interaction.deferUpdate();
  },
};

module.exports = {
  configPanelInteractionHandler,
  openConfigPanel,
};

export class LootSettingsNotFoundError extends Error {
  constructor(guildId) {
    super("Loot settings not found for this guild");
    this.name = "LootSettingsNotFoundError";
    this.guildId = guildId;
  }
}

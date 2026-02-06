const BaseRepository = require("./BaseRepository.js");
const { LootTooltipCache } = require("../models/index.js");

class LootTooltipCacheRepository extends BaseRepository {
  constructor() {
    super(LootTooltipCache);
  }

  async findByItemAndRealm(itemEntry, realmId) {
    return this.findOne({ item_entry: itemEntry, realm_id: realmId });
  }

  async upsertTooltipCache(itemEntry, realmId, tooltipHtml) {
    return this.model.findOneAndUpdate(
      { item_entry: itemEntry, realm_id: realmId },
      {
        $set: {
          tooltip_html: tooltipHtml,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }
}

module.exports = LootTooltipCacheRepository;

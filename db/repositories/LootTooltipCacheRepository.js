const BaseRepository = require("./BaseRepository.js");
const { LootTooltipCache } = require("../models/index.js");

class LootTooltipCacheRepository extends BaseRepository {
  constructor() {
    super(LootTooltipCache);
  }

  async findByItem(itemEntry) {
    return this.findOne({ item_entry: itemEntry });
  }

  async upsertTooltipCache(itemEntry, tooltipHtml) {
    return this.model.findOneAndUpdate(
      { item_entry: itemEntry },
      {
        $set: {
          tooltip_html: tooltipHtml,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  async clearTooltipCache() {
    return this.model.deleteMany({});
  }
}

module.exports = LootTooltipCacheRepository;

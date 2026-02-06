const BaseRepository = require("./BaseRepository.js");
const { LootTooltipStyle } = require("../models/index.js");

class LootTooltipStyleRepository extends BaseRepository {
  constructor() {
    super(LootTooltipStyle);
  }

  async findByRealm(realmId) {
    return this.findOne({ realm_id: realmId });
  }

  async upsertStyles(realmId, styles) {
    return this.model.findOneAndUpdate(
      { realm_id: realmId },
      {
        $set: {
          styles: styles || [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }
}

module.exports = LootTooltipStyleRepository;

require("dotenv").config();

module.exports = {
  discord: {
    token: process.env.discord_token,
    client_id: process.env.discord_client_id,
    log_guild_id: process.env.discord_log_guild_id,
    log_channel_id: process.env.discord_log_channel_id,
  },
  db: {
    cluster_url: process.env.db_cluster_url,
    port: process.env.db_port,
    user: process.env.db_user,
    pwd: process.env.db_pwd,
    auth_mechanism: process.env.db_auth_mechanism,
    auth_source: process.env.db_auth_source,
  },
};

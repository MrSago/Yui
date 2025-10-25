# Конфигурация проекта

Проект использует два типа конфигурации:

1. **`environment.js`** - Конфигурация окружения (Discord, MongoDB)
2. **`config`** - Конфигурация модулей приложения (changelog, loot)

## Environment (environment.js)

Конфигурация окружения для подключения к внешним сервисам.

### Discord

```js
discord: {
  token: process.env.discord_token,
  client_id: process.env.discord_client_id,
  log_guild_id: process.env.discord_log_guild_id,
  log_channel_id: process.env.discord_log_channel_id,
}
```

Настройки для подключения к Discord Bot API.

- `token` - токен бота Discord
- `client_id` - ID клиента Discord
- `log_guild_id` - ID сервера для логирования
- `log_channel_id` - ID канала для логирования

---

### Database (MongoDB)

```js
db: {
  cluster_url: process.env.db_cluster_url,
  port: process.env.db_port,
  user: process.env.db_user,
  pwd: process.env.db_pwd,
  auth_mechanism: process.env.db_auth_mechanism,
  auth_source: process.env.db_auth_source,
}
```

Настройки для подключения к базе данных MongoDB.

- `cluster_url` - URL кластера MongoDB
- `port` - порт подключения
- `user` - имя пользователя
- `pwd` - пароль
- `auth_mechanism` - механизм аутентификации
- `auth_source` - источник аутентификации

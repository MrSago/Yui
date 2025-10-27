# Юи - дискорд бот для сервера Sirus.su

Бот назван в честь искусственного интелекта по имени [Юи](https://sword-art-online.fandom.com/ru/wiki/%D0%AE%D0%B8) из тайтла [Sword Art Online](https://sword-art-online.fandom.com/ru/wiki/Sword_Art_Online_%D0%92%D0%B8%D0%BA%D0%B8).

## Основные возможности

1. Вывод гильдейских убийств боссов с отображением списка топ ДПС, топ ХПС и с̶к̶р̶и̶н̶ш̶о̶т̶о̶м̶ ̶л̶у̶т̶а списком лута

   ![first](./readme-files/first.png)

2. Мониторинг [списка изменений](https://sirus.su/statistic/changelog) Sirus.su

   ![second](./readme-files/second.png)

## Установка бота

1. [Инвайт ссылка](https://discord.com/api/oauth2/authorize?client_id=1048561255989919795&permissions=8&scope=bot%20applications.commands) (необходимы права администратора)

2. Установить необходимые каналы

   Для использования этих команд необходима роль с правами бана.

   2.1. `/setloot [channel] [realm_id] [guild_sirus_id]` - устанавливает канал для вывода убийства боссов

   - channel - канал для вывода сообщений
   - realm_id - реалм (выбирается из списка)
   - guild_sirus_id - ID гильдии

   ID гильдии можно узнать зайдя на страницу гильдии. Например, ссылка на гильдию _North Mythology-x4_: <https://sirus.su/base/guilds/33/247/>. Тогда ID это последнее число в ссылке, в данном случае **247**.

   2.2. `/setchangelog [channel]` - устанавливает канал для вывода списка изменений

   - channel - канал для вывода сообщений

## Для связи и дополнительной инфой

- Discord: `MrS4g0#1337`

---

## Для разработчиков

### Установка и запуск

Проект использует Docker для быстрого развертывания с MongoDB.

1. Создайте `.env` файл в корне проекта (см. [`.env.example`](.env.example)) со следующими параметрами:

   **Discord настройки:**

   - `DISCORD_TOKEN` - токен _вашего_ дискорд бота
   - `DISCORD_CLIENT_ID` - ID клиента _вашего_ дискорд бота
   - `DISCORD_LOG_GUILD_ID` - ID сервера для логирования (опционально)
   - `DISCORD_LOG_CHANNEL_ID` - ID канала для логирования (опционально)

   **База данных (MongoDB):**

   - `DB_CLUSTER_URL` - URL кластера MongoDB
   - `DB_PORT` - порт подключения (по умолчанию 27017)
   - `DB_USER` - имя пользователя
   - `DB_PWD` - пароль
   - `DB_AUTH_MECHANISM` - механизм аутентификации
   - `DB_AUTH_SOURCE` - источник аутентификации

   **Логирование:**

   - `LOG_LEVEL` - уровень логирования: `error`, `warn`, `info`, `debug` (по умолчанию: `debug` для development, `info` для production)

2. Для отображения кастомных смайлов напротив ников необходимо прописать их ID в файле [`loot/classEmoji.json`](loot/classEmoji.json) параметра `emoji_id`

3. Запуск проекта:

**Готовые скрипты для управления контейнерами:**

1. Windows (PowerShell): [`docker.ps1`](docker.ps1)

2. Linux/macOS: [`docker.sh`](docker.sh)

Для вызовы справки: `docker.ps1 help` либо `docker.sh help`.

**Запуск напрямую через Docker Compose:**

```bash
docker compose up -d    # Запуск
docker compose logs -f  # Логи
docker compose down     # Остановка
```

MongoDB будет доступна на порту `27017` с дефолтными учетными данными (см. [`docker-compose.yml`](docker-compose.yml)).

### Структура конфигурации

Проект использует два типа конфигурации:

1. **[`environment.js`](environment.js)** - конфигурация окружения (Discord, MongoDB)
2. **[`config/`](config/README.md)** - конфигурация модулей приложения (changelog, loot)

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

   - `discord_token` - токен _вашего_ дискорд бота
   - `discord_client_id` - ID клиента _вашего_ дискорд бота
   - `discord_log_guild_id` - ID сервера для логирования (опционально)
   - `discord_log_channel_id` - ID канала для логирования (опционально)

   **База данных (MongoDB):**

   - `db_cluster_url` - URL кластера MongoDB
   - `db_port` - порт подключения (по умолчанию 27017)
   - `db_user` - имя пользователя
   - `db_pwd` - пароль
   - `db_auth_mechanism` - механизм аутентификации
   - `db_auth_source` - источник аутентификации

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

1. **[`environment.js`](environment.js)** - Конфигурация окружения (Discord, MongoDB)
2. **[`config/`](config/README.md)** - Конфигурация модулей приложения (changelog, loot)

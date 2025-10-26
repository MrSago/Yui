# Database Module

Модуль для работы с базой данных MongoDB через Mongoose. Использует Repository pattern для организации доступа к данным.

## Структура

- `models/` - Mongoose схемы и модели
- `repositories/` - слой доступа к данным (CRUD операции)
- `services/` - слой бизнес-логики
- `database.js` - основной фасад (единый API)
- `mongoose.connection.js` - подключение к базе данных

## Функции

### Инициализация

#### `init()`

Инициализирует подключение к базе данных.

---

### Changelog операции

#### `setChangelogChannel(guildId, channelId)`

Устанавливает канал для публикации изменений.

**Параметры:**

- `guildId` (string) - ID гильдии Discord
- `channelId` (string) - ID канала Discord

---

#### `deleteChangelogChannel(guildId)`

Удаляет настройки канала изменений.

**Параметры:**

- `guildId` (string) - ID гильдии Discord

---

#### `getChangelogSettings()`

Получает все настройки каналов изменений.

**Возвращает:** `Promise<Array|null>` - массив настроек или null

---

### Changelog Data операции

#### `getChangelogData()`

Получает данные изменений.

**Возвращает:** `Promise<Object|null>` - данные изменений или null

---

#### `saveChangelogData(data)`

Сохраняет данные изменений.

**Параметры:**

- `data` (Object) - данные для сохранения

---

#### `appendChangelogData(newData)`

Добавляет данные к существующим изменениям.

**Параметры:**

- `newData` (Object) - новые данные для добавления

---

### Loot операции

#### `setLootChannel(guildId, channelId, realmId, guildSirusId)`

Устанавливает канал для публикации лута.

**Параметры:**

- `guildId` (string) - ID гильдии Discord
- `channelId` (string) - ID канала Discord
- `realmId` (number) - ID сервера Sirus
- `guildSirusId` (number) - ID гильдии на Sirus

---

#### `deleteLootChannel(guildId)`

Удаляет настройки канала лута.

**Параметры:**

- `guildId` (string) - ID гильдии Discord

---

#### `getLootSettings()`

Получает все настройки каналов лута.

**Возвращает:** `Promise<Array|null>` - массив настроек лута или null

---

#### `getGuildIdByLootId(lootId)`

Получает ID гильдии по ID лута.

**Параметры:**

- `lootId` (string) - ID лута

**Возвращает:** `Promise<string|null>` - ID гильдии или null

---

### Records операции

#### `initRecords(guildId)`

Инициализирует записи для отслеживания убийств боссов.

**Параметры:**

- `guildId` (string) - ID гильдии Discord

---

#### `deleteRecords(guildId)`

Удаляет записи об убийствах боссов.

**Параметры:**

- `guildId` (string) - ID гильдии Discord

---

#### `pushRecords(guildId, record)`

Добавляет запись об убийстве босса.

**Параметры:**

- `guildId` (string) - ID гильдии Discord
- `record` (string) - запись для добавления

---

#### `checkRecord(guildId, record)`

Проверяет наличие записи об убийстве босса.

**Параметры:**

- `guildId` (string) - ID гильдии Discord
- `record` (string) - запись для проверки

**Возвращает:** `Promise<boolean>` - true если запись существует

---

### Settings операции

#### `getSettingsArray()`

Получает массив всех настроек гильдий.

**Возвращает:** `Promise<Array>` - массив настроек

---

#### `clearInactiveGuildsFromDb(client)`

Удаляет настройки неактивных гильдий из базы данных.

**Параметры:**

- `client` (Discord.Client) - экземпляр Discord клиента

**Возвращает:** `Promise<number>` - количество удалённых гильдий

---

#### `clearGuildSettings(guildId)`

Полностью удаляет все настройки гильдии.

**Параметры:**

- `guildId` (string) - ID гильдии Discord

---

#### `getGuildsCount()`

Получает количество гильдий в базе данных.

**Возвращает:** `Promise<number>` - количество гильдий

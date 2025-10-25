# Sirus API Module

Модуль для работы с API Sirus.su. Изолирует всю логику взаимодействия с внешним API.

## Функции

### `getChangelog()`

Получает список изменений с сервера Sirus.su.

**Возвращает:** `Promise<Array|null>` - Массив изменений или null при ошибке

---

### `getLatestBossKills(realmId, guildSirusId)`

Получает последние убийства боссов для указанной гильдии.

**Параметры:**

- `realmId` (number) - ID сервера
- `guildSirusId` (number) - ID гильдии на Sirus

**Возвращает:** `Promise<Array|null>` - Массив убийств боссов или null при ошибке

---

### `getBossKillDetails(realmId, recordId)`

Получает детальную информацию об убийстве босса.

**Параметры:**

- `realmId` (number) - ID сервера
- `recordId` (number) - ID записи об убийстве босса

**Возвращает:** `Promise<Object|null>` - Данные об убийстве босса или null при ошибке

---

### `getGuildUrl(realmId, guildId)`

Формирует URL для страницы гильдии.

**Параметры:**

- `realmId` (number) - ID сервера
- `guildId` (number) - ID гильдии

**Возвращает:** `string` - URL страницы гильдии

---

### `getPveProgressUrl(realmId, recordId)`

Формирует URL для страницы PVE прогресса босса.

**Параметры:**

- `realmId` (number) - ID сервера
- `recordId` (number) - ID записи об убийстве босса

**Возвращает:** `string` - URL страницы PVE прогресса

---

### `getChangelogUrl()`

Возвращает URL страницы изменений.

**Возвращает:** `string` - URL страницы изменений

## Использование

```js
const sirusApi = require("../api/sirusApi.js");

// Получить список изменений
const changelog = await sirusApi.getChangelog();

// Получить последние убийства боссов
const bossKills = await sirusApi.getLatestBossKills(33, 247);

// Получить детальную информацию об убийстве босса
const details = await sirusApi.getBossKillDetails(33, 12345);

// Получить URL гильдии
const guildUrl = sirusApi.getGuildUrl(33, 247);
```

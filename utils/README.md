# Utils - Утилиты проекта

Директория содержит переиспользуемые утилитные функции, разделённые по функциональности.

## Модули

### formatters.js

Функции для форматирования данных.

**Функции:**

- `intToShortFormat(value)` - Преобразует число в короткий формат с 'k' (12345 → 12.3)
- `formatNumber(value)` - Форматирует число с разделителем тысяч (1234567 → "1,234,567")
- `formatDpsValue(value)` - Форматирует DPS/HPS значение (12345 → "12.3k")

```javascript
const { intToShortFormat } = require("../utils");

console.log(intToShortFormat(12345)); // 12.3
```

---

### playerParsers.js

Парсинг и обработка данных игроков из API Sirus.

**Функции:**

- `getPlayerEmoji(player, classEmoji, client, easterEggConfig)` - Получает emoji для игрока
- `parseDpsPlayers(data, classEmoji, client, easterEggConfig)` - Парсит DPS игроков
- `parseHealPlayers(data, classEmoji, client)` - Парсит HPS хилеров

```javascript
const { parseDpsPlayers } = require("../utils");

const [places, players, dps, summaryDps] = parseDpsPlayers(
  playersData,
  classEmoji,
  discordClient,
  easterEggConfig
);
```

---

### fileLoader.js

Утилиты для работы с файловой системой и JSON файлами.

**Функции:**

- `loadJsonFile(filePath, description)` - Загружает JSON файл
- `loadJsonFileWithDefault(filePath, defaultValue, description)` - Загружает JSON с fallback значением
- `saveJsonFile(filePath, data, description)` - Сохраняет данные в JSON
- `fileExists(filePath)` - Проверяет существование файла
- `ensureDirectoryExists(dirPath)` - Создаёт директорию если не существует

```javascript
const { loadJsonFileWithDefault, saveJsonFile } = require("../utils");

// Загрузка с дефолтным значением
const config = loadJsonFileWithDefault("./config.json", {}, "configuration");

// Сохранение
saveJsonFile("./data.json", myData, "user data");
```

---

### embedHelpers.js

Помощники для создания Discord Embed сообщений.

**Функции:**

- `addEmptyField(embed)` - Добавляет пустое поле (разделитель)
- `addEmptyInlineFields(embed)` - Добавляет три пустых inline поля
- `addDpsSection(embed, places, players, dps, summaryDps)` - Добавляет секцию DPS
- `addHpsSection(embed, places, players, hps, summaryHps)` - Добавляет секцию HPS
- `addLootSection(embed, lootString)` - Добавляет секцию лута

```javascript
const { addDpsSection, addLootSection } = require("../utils");

let embed = new EmbedBuilder().setTitle("Boss Kill");

// Добавляем секции
addDpsSection(embed, places, players, dps, totalDps);
addLootSection(embed, lootItems);
```

# Utils - Утилиты проекта

Директория содержит переиспользуемые утилитные функции, разделённые по функциональности.

## Модули

### formatters.js

Функции для форматирования данных.

**Функции:**

- `intToShortFormat(value)` - Преобразует число в короткий формат с 'k' (12345 → 12.3)
- `formatNumber(value)` - Форматирует число с разделителем тысяч (1234567 → "1,234,567")
- `formatDpsValue(value)` - Форматирует DPS/HPS значение (12345 → "12.3k")

---

### playerParsers.js

Парсинг и обработка данных игроков из API Sirus.

**Функции:**

- `getPlayerEmoji(player, classEmoji, client, easterEggConfig)` - Получает emoji для игрока
- `parseDpsPlayers(data, classEmoji, client, easterEggConfig)` - Парсит DPS игроков
- `parseHealPlayers(data, classEmoji, client)` - Парсит HPS хилеров

---

### fileLoader.js

Утилиты для работы с файловой системой и JSON файлами.

**Функции:**

- `loadJsonFile(filePath, description)` - Загружает JSON файл
- `loadJsonFileWithDefault(filePath, defaultValue, description)` - Загружает JSON с fallback значением
- `saveJsonFile(filePath, data, description)` - Сохраняет данные в JSON
- `fileExists(filePath)` - Проверяет существование файла
- `ensureDirectoryExists(dirPath)` - Создаёт директорию если не существует

---

### discordUtils.js

Утилиты для работы с Discord API.

**Функции:**

- `setVoiceStatus(channel_id, status)` - Устанавливает статус голосового канала

---

### randomUtils.js

Утилиты для генерации случайных чисел.

**Функции:**

- `randInt(max)` - Генерирует случайное целое число от 0 до max (не включая max)

---

### timeUtils.js

Утилиты для работы со временем и форматирования длительности.

**Функции:**

- `dayInterval(hours, minutes, seconds, milliseconds)` - Вычисляет интервал от времени запуска до указанного времени суток
- `getDurationString(duration_ms)` - Преобразует длительность в миллисекундах в формат HH:MM:SS

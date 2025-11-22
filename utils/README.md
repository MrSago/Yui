# Utils - Утилиты проекта

Директория содержит переиспользуемые утилитные функции, разделённые по функциональности.

## Модули

### formatters.js

Функции для форматирования данных.

**Функции:**

- `formatNumber(value)` - Форматирует число с разделителем тысяч (1234567 → "1,234,567")
- `formatShortValue(value)` - Форматирует значение в короткий формат с 'k' или 'm' (12345 → "12.3k", 1234567 → "1.2m")

---

### playerParsers.js

Парсинг и обработка данных игроков из API Sirus.

**Функции:**

- `getPlayerEmoji(player, client)` - Получает emoji для игрока
- `parseDpsPlayers(data, client)` - Парсит DPS игроков
- `parseHealPlayers(data, client)` - Парсит HPS хилеров

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

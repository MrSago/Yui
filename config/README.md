# Конфигурация модулей

Директория `config` содержит конфигурационные файлы для различных модулей бота.

## bossThumbnails.js

Конфигурация маппинга имён боссов на URL их миниатюр для Discord Embed сообщений.

Экспортирует объект, где ключ — имя босса, значение — URL изображения.

---

## changelog.js

Конфигурация для модуля отслеживания изменений на Sirus.su.

### Параметры changelog.js

- **`updateIntervalMs`** - интервал обновления в миллисекундах
- **`embed`** - настройки для Discord Embed сообщений:
  - `color` - цвет боковой линии embed (hex-код)
  - `authorName` - имя автора
  - `authorIconUrl` - URL иконки автора
  - `authorUrl` - URL ссылки автора
  - `title` - заголовок сообщения
  - `footerText` - текст в футере
  - `footerIconUrl` - URL иконки в футере

---

## classEmoji.js

Конфигурация маппинга классов и специализаций на Discord emoji ID.

Экспортирует объект с данными о классах, их специализациях, типе (heal/dps) и соответствующих emoji ID.

---

## loot.js

Конфигурация для модуля отслеживания убийств боссов.

### Параметры loot.js

- **`dataPath`** - путь к директории с данными (по умолчанию: "./loot")
- **`updateIntervalMs`** - интервал обновления в миллисекундах
- **`files`** - пути к файлам с данными:
  - `bossThumbnails` - файл с thumbnails боссов
  - `classEmoji` - файл с emoji классов
  - `blacklist` - файл с blacklist предметов
- **`embed`** - настройки для Discord Embed сообщений:
  - `color` - цвет боковой линии embed (hex-код)
  - `footerText` - текст в футере
  - `footerIconUrl` - URL иконки в футере
- **`activity`** - настройки Discord активности бота:
  - `processingStatus` - статус во время обработки:
    - `name` - название статуса
    - `type` - тип активности
    - `status` - статус (dnd, online, idle, offline)
  - `idleStatus` - статус в режиме ожидания:
    - `name` - название статуса
    - `type` - тип активности
    - `status` - статус (dnd, online, idle, offline)
  - `devStatus` - статус при NODE_ENV=development
    - `name` - название статус
    - `type` - тип активности
    - `status` - статус (dnd, online, idle, offline)

---

## sirus.js

Конфигурация для модуля запросов к API Sirus.

### Параметры sirus.js

- **`apiLimiter`** - настройки Bottleneck
  - minTime - минимальное время между запросами
  - maxConcurrent - максимальное кол-во одновременных запросов

- **`axios`** - настройки axios
  - timeoutMs - тайм-айт запроса
  - maxRetries - кол-во повторных попыток

- **`backoff`** - настройка backoff задержки после неудачной попытки
  - baseMs - начальное время ожидания после запроса
  - maxMs - максимальное время ожидания после запроса

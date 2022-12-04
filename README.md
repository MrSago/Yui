
# Юи - дискорд бот для сервера Sirus.su

## Основные возможности

- Мониторинг цен аукциона
- Пока что всё, а чё вы хотели за день кодинга

## Установка бота

1) [Инвайт](https://discord.com/api/oauth2/authorize?client_id=1048561255989919795&permissions=8&scope=bot%20applications.commands) (необходимы права администратора)
2) Выбрать канал для уведомлений командой **/setaucchannel *[channel]***
3) Добавить необходимые предметы для мониторинга командой **/additem *[realm_id]* *[item_id]***

## Для разработчиков

Установка пакетов: `npm install`

Содержимое .env файла

- token - токен *вашего* дискорд бота
- client_id - Id клиента *вашего* дискорд бота

Запуск: `node ./index.js`

---

P.S: Сделайте нормальный фронтэнд пж, там всё готово, нужно только оформить красивое сообщение.
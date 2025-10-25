#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_help() {
    cat << EOF
Использование: ./docker.sh [команда]

Доступные команды:
  start       - Запустить бота и MongoDB в Docker
  stop        - Остановить контейнеры
  restart     - Перезапустить контейнеры
  logs        - Показать логи всех контейнеров
  logs-bot    - Показать только логи бота
  logs-mongo  - Показать только логи MongoDB
  build       - Пересобрать Docker образ
  status      - Показать статус контейнеров
  shell       - Войти в shell контейнера бота
  mongo-shell - Войти в MongoDB shell (mongosh)
  clean       - Остановить и удалить контейнеры с образами
  help        - Показать эту справку

Примеры:
  ./docker.sh start
  ./docker.sh logs-bot
  ./docker.sh mongo-shell
EOF
}

start_bot() {
    echo -e "${GREEN}🚀 Запуск бота и MongoDB...${NC}"
    echo -e "${CYAN}ℹ️  MongoDB будет доступна на порту 27017${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Бот и MongoDB успешно запущены!${NC}"
    echo -e "${CYAN}Для просмотра логов используйте: ./docker.sh logs${NC}"
}

stop_bot() {
    echo -e "${YELLOW}🛑 Остановка бота и MongoDB...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Бот и MongoDB остановлены!${NC}"
}

restart_bot() {
    echo -e "${YELLOW}🔄 Перезапуск бота и MongoDB...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Бот и MongoDB перезапущены!${NC}"
}

show_logs() {
    echo -e "${CYAN}📋 Логи всех контейнеров (Ctrl+C для выхода):${NC}"
    docker-compose logs -f --tail=100
}

show_bot_logs() {
    echo -e "${CYAN}🤖 Логи бота (Ctrl+C для выхода):${NC}"
    docker-compose logs -f --tail=100 yui-bot
}

show_mongo_logs() {
    echo -e "${CYAN}🍃 Логи MongoDB (Ctrl+C для выхода):${NC}"
    docker-compose logs -f --tail=100 mongodb
}

build_image() {
    echo -e "${YELLOW}🔨 Пересборка Docker образа...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Образ успешно пересобран!${NC}"
    echo -e "${CYAN}Для запуска используйте: ./docker.sh start${NC}"
}

show_status() {
    echo -e "${CYAN}📊 Статус контейнера:${NC}"
    docker-compose ps
}

enter_shell() {
    echo -e "${CYAN}💻 Вход в shell контейнера бота...${NC}"
    docker-compose exec yui-bot sh
}

enter_mongo_shell() {
    echo -e "${CYAN}🍃 Вход в MongoDB shell...${NC}"
    echo -e "${YELLOW}Используйте команды MongoDB. Для выхода: exit${NC}"
    docker-compose exec mongodb mongosh -u admin -p password --authenticationDatabase admin
}

clean_all() {
    echo -e "${YELLOW}🧹 Очистка контейнеров и образов...${NC}"
    docker-compose down -v
    docker rmi yui-yui-bot 2>/dev/null || true
    echo -e "${GREEN}✅ Очистка завершена!${NC}"
}

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен! Установите Docker.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose не установлен!${NC}"
    exit 1
fi

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Файл .env не найден!${NC}"
    echo -e "${CYAN}Скопируйте .env.example в .env и заполните необходимые параметры:${NC}"
    echo -e "  cp .env.example .env"
    echo ""
    echo -e "${YELLOW}💡 Для подключения к MongoDB в Docker используйте:${NC}"
    echo -e "   db_cluster_url=mongodb"
    echo -e "   db_user=admin"
    echo -e "   db_pwd=password"
    exit 1
fi

case "$1" in
    start)
        start_bot
        ;;
    stop)
        stop_bot
        ;;
    restart)
        restart_bot
        ;;
    logs)
        show_logs
        ;;
    logs-bot)
        show_bot_logs
        ;;
    logs-mongo)
        show_mongo_logs
        ;;
    build)
        build_image
        ;;
    status)
        show_status
        ;;
    shell)
        enter_shell
        ;;
    mongo-shell)
        enter_mongo_shell
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Неизвестная команда: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

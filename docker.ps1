param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "logs", "logs-bot", "logs-mongo", "build", "status", "shell", "mongo-shell", "clean", "help")]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host @"
Использование: .\docker.ps1 [команда]

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
  .\docker.ps1 start
  .\docker.ps1 logs-bot
  .\docker.ps1 mongo-shell
"@
}

function Start-Bot {
    Write-Host "🚀 Запуск бота и MongoDB..." -ForegroundColor Green
    Write-Host "ℹ️  MongoDB будет доступна на порту 27017" -ForegroundColor Cyan
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Бот и MongoDB успешно запущены!" -ForegroundColor Green
        Write-Host "Для просмотра логов используйте: .\docker.ps1 logs" -ForegroundColor Cyan
    }
}

function Stop-Bot {
    Write-Host "🛑 Остановка бота и MongoDB..." -ForegroundColor Yellow
    docker-compose down
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Бот и MongoDB остановлены!" -ForegroundColor Green
    }
}

function Restart-Bot {
    Write-Host "🔄 Перезапуск бота и MongoDB..." -ForegroundColor Yellow
    docker-compose restart
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Бот и MongoDB перезапущены!" -ForegroundColor Green
    }
}

function Show-Logs {
    Write-Host "📋 Логи всех контейнеров (Ctrl+C для выхода):" -ForegroundColor Cyan
    docker-compose logs -f --tail=100
}

function Show-BotLogs {
    Write-Host "🤖 Логи бота (Ctrl+C для выхода):" -ForegroundColor Cyan
    docker-compose logs -f --tail=100 yui-bot
}

function Show-MongoLogs {
    Write-Host "🍃 Логи MongoDB (Ctrl+C для выхода):" -ForegroundColor Cyan
    docker-compose logs -f --tail=100 mongodb
}

function Build-Image {
    Write-Host "🔨 Пересборка Docker образа..." -ForegroundColor Yellow
    docker-compose build --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Образ успешно пересобран!" -ForegroundColor Green
        Write-Host "Для запуска используйте: .\docker.ps1 start" -ForegroundColor Cyan
    }
}

function Show-Status {
    Write-Host "📊 Статус контейнера:" -ForegroundColor Cyan
    docker-compose ps
}

function Enter-Shell {
    Write-Host "💻 Вход в shell контейнера бота..." -ForegroundColor Cyan
    docker-compose exec yui-bot sh
}

function Enter-MongoShell {
    Write-Host "🍃 Вход в MongoDB shell..." -ForegroundColor Cyan
    Write-Host "Используйте команды MongoDB. Для выхода: exit" -ForegroundColor Yellow
    docker-compose exec mongodb mongosh -u admin -p password --authenticationDatabase admin
}

function Clean-All {
    Write-Host "🧹 Очистка контейнеров и образов..." -ForegroundColor Yellow
    docker-compose down -v
    docker rmi yui-yui-bot 2>$null
    Write-Host "✅ Очистка завершена!" -ForegroundColor Green
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен! Установите Docker Desktop." -ForegroundColor Red
    exit 1
}

if ($Command -ne "help" -and -not (Test-Path .env)) {
    Write-Host "⚠️  Файл .env не найден!" -ForegroundColor Yellow
    Write-Host "Скопируйте .env.example в .env и заполните необходимые параметры:" -ForegroundColor Cyan
    Write-Host "  cp .env.example .env" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "💡 Для подключения к MongoDB в Docker используйте:" -ForegroundColor Yellow
    Write-Host "   db_cluster_url=mongodb" -ForegroundColor White
    Write-Host "   db_user=admin" -ForegroundColor White
    Write-Host "   db_pwd=password" -ForegroundColor White
    exit 1
}

switch ($Command) {
    "start"       { Start-Bot }
    "stop"        { Stop-Bot }
    "restart"     { Restart-Bot }
    "logs"        { Show-Logs }
    "logs-bot"    { Show-BotLogs }
    "logs-mongo"  { Show-MongoLogs }
    "build"       { Build-Image }
    "status"      { Show-Status }
    "shell"       { Enter-Shell }
    "mongo-shell" { Enter-MongoShell }
    "clean"       { Clean-All }
    "help"        { Show-Help }
    default       { Show-Help }
}

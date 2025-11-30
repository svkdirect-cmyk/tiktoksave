# Telegram Video Downloader Bot

Бот для скачивания видео из YouTube, TikTok и Instagram.

## Функции
- 📥 Скачивание видео с YouTube
- 🎵 Скачивание видео с TikTok
- 📷 Скачивание видео с Instagram
- ⚡ Быстрая отправка в Telegram

## Установка

1. Клонируйте репозиторий
2. Установите зависимости: `pip install -r requirements.txt`
3. Установите переменную окружения `TELEGRAM_BOT_TOKEN`
4. Запустите бота: `python bot.py`

## Переменные окружения
- `TELEGRAM_BOT_TOKEN` - Токен вашего Telegram бота

## Развертывание

### На Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### На VPS
```bash
git clone https://github.com/ваш-username/telegram-video-bot.git
cd telegram-video-bot
pip install -r requirements.txt
TELEGRAM_BOT_TOKEN=your_token python bot.py

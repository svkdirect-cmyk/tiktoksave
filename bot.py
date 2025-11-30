import os
import logging
import re
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from urllib.parse import urlparse
import yt_dlp

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Токен берется из переменных окружения
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
DOWNLOAD_FOLDER = "downloads"

if not TOKEN:
    raise ValueError("❌ TELEGRAM_BOT_TOKEN не установлен!")

# Создаем папку для загрузок
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

class VideoDownloader:
    def __init__(self):
        self.ydl_opts = {
            'outtmpl': f'{DOWNLOAD_FOLDER}/%(title)s.%(ext)s',
            'format': 'best[height<=720]',
            'quiet': True,
        }

    def download_video(self, url, platform):
        """Универсальный метод загрузки видео"""
        try:
            # Специальные настройки для разных платформ
            if platform == 'tiktok':
                self.ydl_opts['outtmpl'] = f'{DOWNLOAD_FOLDER}/tiktok_%(id)s.%(ext)s'
            elif platform == 'instagram':
                self.ydl_opts['outtmpl'] = f'{DOWNLOAD_FOLDER}/instagram_%(id)s.%(ext)s'
            else:
                self.ydl_opts['outtmpl'] = f'{DOWNLOAD_FOLDER}/%(title)s.%(ext)s'
            
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                return filename, info.get('title', 'video')
        except Exception as e:
            raise Exception(f"Ошибка загрузки: {str(e)}")

def detect_platform(url):
    """Определение платформы по URL"""
    domain = urlparse(url).netloc.lower()
    
    if 'youtube.com' in domain or 'youtu.be' in domain:
        return 'youtube'
    elif 'tiktok.com' in domain:
        return 'tiktok'
    elif 'instagram.com' in domain:
        return 'instagram'
    else:
        return 'unknown'

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    welcome_text = """
🤖 **Video Downloader Bot**

Отправьте мне ссылку на видео с:
• YouTube 📺
• TikTok 🎵
• Instagram 📷

Я скачаю и отправлю вам видео!

⚠️ *Внимание:* Соблюдайте авторские права!
    """
    await update.message.reply_text(welcome_text, parse_mode='Markdown')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    help_text = """
📖 **Как использовать бота:**

1. Скопируйте ссылку на видео из:
   - YouTube: поделитесь видео и скопируйте ссылку
   - TikTok: нажмите "Поделиться" и скопируйте ссылку
   - Instagram: скопируйте ссылку из поста с видео

2. Отправьте ссылку этому боту

3. Дождитесь загрузки и получения видео

🔧 *Поддерживаемые форматы:* MP4, WEBM
    """
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик текстовых сообщений"""
    url = update.message.text.strip()
    
    # Проверка на валидность URL
    if not re.match(r'^https?://', url):
        await update.message.reply_text("❌ Пожалуйста, отправьте валидную ссылку на видео.")
        return
    
    # Определение платформы
    platform = detect_platform(url)
    
    if platform == 'unknown':
        await update.message.reply_text("❌ Неподдерживаемая платформа. Используйте YouTube, TikTok или Instagram.")
        return
    
    # Отправка сообщения о начале загрузки
    status_msg = await update.message.reply_text(f"⏳ Загружаю видео с {platform.capitalize()}...")
    
    downloader = VideoDownloader()
    
    try:
        # Загрузка видео
        filename, title = downloader.download_video(url, platform)
        
        # Проверяем размер файла (Telegram ограничение 50MB)
        file_size = os.path.getsize(filename)
        if file_size > 50 * 1024 * 1024:  # 50MB в байтах
            await status_msg.edit_text("❌ Файл слишком большой для отправки в Telegram (максимум 50MB)")
            os.remove(filename)
            return
        
        # Отправка видео пользователю
        with open(filename, 'rb') as video_file:
            await update.message.reply_video(
                video=video_file,
                caption=f"🎥 {title}\n\n✅ Скачано с {platform.capitalize()}",
                supports_streaming=True
            )
        
        # Удаление статусного сообщения
        await status_msg.delete()
        
        # Удаление файла после отправки
        os.remove(filename)
        
    except Exception as e:
        await status_msg.edit_text(f"❌ Ошибка при загрузке видео: {str(e)}")
        logging.error(f"Error downloading video: {str(e)}")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок"""
    logging.error(f"Update {update} caused error {context.error}")
    if update and update.message:
        await update.message.reply_text("❌ Произошла ошибка. Попробуйте еще раз.")

def main():
    """Основная функция"""
    # Создание приложения
    application = Application.builder().token(TOKEN).build()
    
    # Добавление обработчиков
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Обработчик ошибок
    application.add_error_handler(error_handler)
    
    # Запуск бота
    print("🤖 Бот запущен...")
    application.run_polling()

if __name__ == '__main__':
    main()

class VideoDownloader {
    constructor() {
        this.telegram = window.Telegram.WebApp;
        this.init();
    }

    init() {
        this.initializeTelegram();
        this.bindEvents();
        this.loadHistory();
        this.applyTheme();
    }

    initializeTelegram() {
        this.telegram.expand();
        this.telegram.enableClosingConfirmation();
        this.telegram.setHeaderColor('#000000');
        this.telegram.setBackgroundColor('#000000');
        
        console.log('Telegram Web App initialized');
    }

    bindEvents() {
        // Platform tabs
        document.querySelectorAll('.platform-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPlatform(e.target);
            });
        });

        // Paste button
        document.getElementById('pasteButton').addEventListener('click', () => {
            this.pasteFromClipboard();
        });

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.processVideo();
        });

        // Final download button
        document.getElementById('finalDownloadBtn').addEventListener('click', () => {
            this.downloadVideo();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Clear history
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        // URL input enter key
        document.getElementById('videoUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processVideo();
            }
        });
    }

    switchPlatform(tab) {
        document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const platform = tab.dataset.platform;
        const input = document.getElementById('videoUrl');
        
        if (platform !== 'all') {
            input.placeholder = `Вставьте ссылку ${this.getPlatformName(platform)}...`;
        } else {
            input.placeholder = 'Вставьте ссылку на видео...';
        }
    }

    getPlatformName(platform) {
        const names = {
            'tiktok': 'TikTok',
            'youtube': 'YouTube',
            'instagram': 'Instagram'
        };
        return names[platform] || '';
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('videoUrl').value = text;
            this.showNotification('Ссылка вставлена из буфера');
        } catch (error) {
            this.showNotification('Не удалось получить доступ к буферу', 'error');
        }
    }

    async processVideo() {
        const url = document.getElementById('videoUrl').value.trim();
        
        if (!url) {
            this.showNotification('Введите ссылку на видео', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showNotification('Неверный формат ссылки', 'error');
            return;
        }

        this.setLoading(true);

        try {
            const videoInfo = await this.fetchVideoInfo(url);
            this.displayResults(videoInfo);
            this.showNotification('Видео готово к скачиванию');
        } catch (error) {
            this.showNotification('Ошибка при обработке видео', 'error');
            console.error('Error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    isValidUrl(url) {
        const patterns = {
            tiktok: /tiktok\.com/,
            youtube: /(youtube\.com|youtu\.be)/,
            instagram: /instagram\.com/
        };
        
        return Object.values(patterns).some(pattern => pattern.test(url));
    }

    async fetchVideoInfo(url) {
        // В реальном приложении здесь будет запрос к вашему бэкенду
        // Для демонстрации используем заглушку
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockData = {
                    title: this.generateMockTitle(url),
                    duration: this.generateMockDuration(),
                    quality: ['720p', '480p', '360p'],
                    size: Math.floor(Math.random() * 50) + 10,
                    thumbnail: this.generateMockThumbnail(url),
                    url: url
                };
                resolve(mockData);
            }, 2000);
        });
    }

    generateMockTitle(url) {
        if (url.includes('tiktok')) return 'Трендовое видео TikTok';
        if (url.includes('youtube')) return 'Интересный YouTube ролик';
        if (url.includes('instagram')) return 'Крутой Instagram Reel';
        return 'Видео для скачивания';
    }

    generateMockDuration() {
        const minutes = Math.floor(Math.random() * 3) + 1;
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    generateMockThumbnail(url) {
        // Заглушка для превью
        return null;
    }

    displayResults(videoInfo) {
        document.getElementById('videoTitle').textContent = videoInfo.title;
        document.getElementById('videoDuration').textContent = videoInfo.duration;
        document.getElementById('videoSize').textContent = `${videoInfo.size} MB`;
        
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        resultsSection.classList.add('fade-in');
        
        // Прокрутка к результатам
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Сохраняем информацию о видео для скачивания
        this.currentVideo = videoInfo;
    }

    async downloadVideo() {
        if (!this.currentVideo) return;

        const quality = document.querySelector('input[name="quality"]:checked').value;
        
        try {
            // В реальном приложении здесь будет запрос к API для скачивания
            this.showNotification('Начинаем скачивание...');
            
            // Имитация скачивания
            await this.simulateDownload();
            
            this.saveToHistory(this.currentVideo);
            this.showNotification('Видео успешно скачано!');
            
        } catch (error) {
            this.showNotification('Ошибка при скачивании', 'error');
        }
    }

    async simulateDownload() {
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
        });
    }

    saveToHistory(videoInfo) {
        const history = this.getHistory();
        const historyItem = {
            id: Date.now(),
            title: videoInfo.title,
            url: videoInfo.url,
            date: new Date().toISOString(),
            size: videoInfo.size
        };
        
        history.unshift(historyItem);
        if (history.length > 10) history.pop(); // Ограничиваем историю
        
        localStorage.setItem('videoDownloadHistory', JSON.stringify(history));
        this.loadHistory();
    }

    getHistory() {
        return JSON.parse(localStorage.getItem('videoDownloadHistory') || '[]');
    }

    loadHistory() {
        const history = this.getHistory();
        const historyList = document.getElementById('historyList');
        
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">История пуста</p>';
            return;
        }
        
        historyList.innerHTML = history.map(item => `
            <div class="history-item fade-in">
                <div class="history-info">
                    <div class="history-title">${item.title}</div>
                    <div class="history-meta">
                        ${new Date(item.date).toLocaleDateString()} • ${item.size} MB
                    </div>
                </div>
                <button class="history-download" onclick="app.redownload('${item.url}')">
                    📥
                </button>
            </div>
        `).join('');
    }

    redownload(url) {
        document.getElementById('videoUrl').value = url;
        this.processVideo();
    }

    clearHistory() {
        localStorage.removeItem('videoDownloadHistory');
        this.loadHistory();
        this.showNotification('История очищена');
    }

    setLoading(loading) {
        const btn = document.getElementById('downloadBtn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');
        
        if (loading) {
            btn.disabled = true;
            btnText.textContent = 'Обработка...';
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            btnText.textContent = 'Скачать видео';
            spinner.classList.add('hidden');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notificationText');
        
        text.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const toggleBtn = document.getElementById('themeToggle');
        
        document.documentElement.setAttribute('data-theme', newTheme);
        toggleBtn.textContent = newTheme === 'light' ? '🌙' : '☀️';
        
        localStorage.setItem('theme', newTheme);
    }

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const toggleBtn = document.getElementById('themeToggle');
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        toggleBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    }
}

// Инициализация приложения
const app = new VideoDownloader();

// Обработчики для глобальных событий
window.addEventListener('load', () => {
    console.log('Video Downloader Web App loaded');
});

// Service Worker для оффлайн работы (опционально)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
}

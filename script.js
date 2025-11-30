class VideoDownloader {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.currentVideo = null;
        this.isProcessing = false;
        
        // API endpoints (замените на ваши)
        this.apiEndpoints = {
            youtube: 'https://your-youtube-api.com/download',
            tiktok: 'https://your-tiktok-api.com/download',
            instagram: 'https://your-instagram-api.com/download'
        };
        
        this.init();
    }

    init() {
        this.initializeTelegram();
        this.bindEvents();
        this.loadHistory();
        this.applyTheme();
        this.checkUrlParams();
        
        console.log('🎬 VideoGet initialized');
    }

    initializeTelegram() {
        if (!this.telegram) {
            console.log('ℹ️ Running outside Telegram');
            return;
        }

        try {
            this.telegram.expand();
            this.telegram.enableClosingConfirmation();
            this.telegram.setHeaderColor('#000000');
            this.telegram.setBackgroundColor('#000000');
            
            // Показываем основную кнопку
            this.telegram.MainButton.setText('Скачать видео');
            this.telegram.MainButton.show();
            
            console.log('✅ Telegram Web App initialized');
        } catch (error) {
            console.error('❌ Telegram init error:', error);
        }
    }

    bindEvents() {
        // Platform tabs
        document.querySelectorAll('.platform-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPlatform(e.currentTarget);
            });
        });

        // Paste button
        document.getElementById('pasteButton').addEventListener('click', () => {
            this.pasteFromClipboard();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearInput();
        });

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.processVideo();
        });

        // Final download button
        document.getElementById('finalDownloadBtn').addEventListener('click', () => {
            this.downloadVideo();
        });

        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareVideo();
        });

        // Close results
        document.getElementById('closeResults').addEventListener('click', () => {
            this.hideResults();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Info button
        document.getElementById('infoBtn').addEventListener('click', () => {
            this.showInfoModal();
        });

        // Format help
        document.getElementById('formatHelp').addEventListener('click', () => {
            this.showFormatModal();
        });

        // Clear history
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        // Support button
        document.getElementById('supportBtn').addEventListener('click', () => {
            this.contactSupport();
        });

        // Modal close buttons
        document.getElementById('closeInfoModal').addEventListener('click', () => {
            this.hideModals();
        });

        document.getElementById('closeFormatModal').addEventListener('click', () => {
            this.hideModals();
        });

        // Notification close
        document.getElementById('closeNotification').addEventListener('click', () => {
            this.hideNotification();
        });

        // URL input events
        const urlInput = document.getElementById('videoUrl');
        urlInput.addEventListener('input', () => {
            this.validateUrl();
        });

        urlInput.addEventListener('paste', (e) => {
            setTimeout(() => this.validateUrl(), 100);
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModals();
                }
            });
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModals();
                this.hideNotification();
            }
        });

        console.log('✅ All events bound');
    }

    switchPlatform(tab) {
        document.querySelectorAll('.platform-tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        
        const platform = tab.dataset.platform;
        const input = document.getElementById('videoUrl');
        
        this.updatePlaceholder(platform);
        this.validateUrl();
    }

    updatePlaceholder(platform) {
        const input = document.getElementById('videoUrl');
        const placeholders = {
            'all': 'https://www.tiktok.com/... или https://youtube.com/...',
            'tiktok': 'https://www.tiktok.com/@username/video/123456789',
            'youtube': 'https://www.youtube.com/watch?v=ABCDEFGHIJK',
            'instagram': 'https://www.instagram.com/reel/ABC123DEF/'
        };
        
        input.placeholder = placeholders[platform] || placeholders.all;
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('videoUrl').value = text;
            this.showNotification('📋 Ссылка вставлена из буфера');
            this.validateUrl();
        } catch (error) {
            this.showNotification('❌ Не удалось получить доступ к буферу', 'error');
            // Fallback: focus and let user paste manually
            document.getElementById('videoUrl').focus();
        }
    }

    clearInput() {
        document.getElementById('videoUrl').value = '';
        this.validateUrl();
    }

    validateUrl() {
        const url = document.getElementById('videoUrl').value.trim();
        const btn = document.getElementById('downloadBtn');
        
        if (!url) {
            btn.disabled = true;
            return false;
        }

        const isValid = this.isValidUrl(url);
        btn.disabled = !isValid;
        
        return isValid;
    }

    isValidUrl(url) {
        const patterns = {
            tiktok: /tiktok\.com\/.*\/video\/\d+/,
            youtube: /(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
            instagram: /instagram\.com\/(p|reel|tv)\/[\w-]+/
        };
        
        return Object.values(patterns).some(pattern => pattern.test(url));
    }

    detectPlatform(url) {
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('instagram.com')) return 'instagram';
        return 'unknown';
    }

    async processVideo() {
        if (this.isProcessing) return;
        
        const url = document.getElementById('videoUrl').value.trim();
        
        if (!url) {
            this.showNotification('❌ Введите ссылку на видео', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showNotification('❌ Неверный формат ссылки', 'error');
            return;
        }

        this.isProcessing = true;
        this.setLoading(true);

        try {
            const videoInfo = await this.fetchVideoInfo(url);
            this.displayResults(videoInfo);
            this.showNotification('✅ Видео готово к скачиванию');
        } catch (error) {
            console.error('Process error:', error);
            this.showNotification(`❌ Ошибка: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.setLoading(false);
        }
    }

    async fetchVideoInfo(url) {
        // Эмуляция получения информации о видео
        // В реальном приложении здесь будет запрос к вашему API
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const platform = this.detectPlatform(url);
                    const mockData = this.generateMockVideoInfo(url, platform);
                    resolve(mockData);
                } catch (error) {
                    reject(error);
                }
            }, 2000);
        });
    }

    generateMockVideoInfo(url, platform) {
        const titles = {
            tiktok: ['Трендовый танец TikTok', 'Смешное видео с котиком', 'Лайфхак который изменит всё'],
            youtube: ['Обзор нового смартфона', 'Музыкальный клип 2024', 'Обучение программированию'],
            instagram: ['Красивый Reel с отпуска', 'Рецепт вкусного блюда', 'Тренды моды 2024']
        };

        const authors = {
            tiktok: ['@tiktok_user', '@dance_queen', '@funny_cats'],
            youtube: ['TechReview', 'MusicChannel', 'LearnWithMe'],
            instagram: ['travel_blogger', 'chef_cooking', 'fashion_guru']
        };

        const platformTitles = titles[platform] || titles.tiktok;
        const platformAuthors = authors[platform] || authors.tiktok;

        return {
            title: platformTitles[Math.floor(Math.random() * platformTitles.length)],
            author: platformAuthors[Math.floor(Math.random() * platformAuthors.length)],
            duration: this.generateMockDuration(),
            quality: ['720p', '480p', '360p'],
            size: Math.floor(Math.random() * 50) + 10,
            thumbnail: null,
            url: url,
            platform: platform,
            no_watermark: true
        };
    }

    generateMockDuration() {
        const minutes = Math.floor(Math.random() * 3) + 1;
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    displayResults(videoInfo) {
        this.currentVideo = videoInfo;

        // Update UI with video info
        document.getElementById('videoTitle').textContent = videoInfo.title;
        document.getElementById('videoDuration').textContent = videoInfo.duration;
        document.getElementById('videoSize').textContent = `${videoInfo.size} MB`;
        document.getElementById('videoQuality').textContent = 'HD 720p';

        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    hideResults() {
        document.getElementById('resultsSection').classList.add('hidden');
    }

    async downloadVideo() {
        if (!this.currentVideo) return;

        const quality = document.querySelector('input[name="quality"]:checked').value;
        
        try {
            this.showNotification('⏳ Начинаем скачивание...');
            
            // В реальном приложении здесь будет запрос к API
            const downloadUrl = await this.getDownloadUrl(this.currentVideo.url, quality);
            
            // Создаем временную ссылку для скачивания
            this.triggerDownload(downloadUrl, this.currentVideo.title);
            
            // Сохраняем в историю
            this.saveToHistory(this.currentVideo);
            
            this.showNotification('✅ Видео успешно скачано!');
            
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('❌ Ошибка при скачивании', 'error');
        }
    }

    async getDownloadUrl(videoUrl, quality) {
        // Эмуляция получения ссылки для скачивания
        // В реальном приложении здесь будет запрос к вашему API
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Создаем blob URL для демонстрации
                const blob = new Blob(['Demo video content'], { type: 'video/mp4' });
                const url = URL.createObjectURL(blob);
                resolve(url);
            }, 1000);
        });
    }

    triggerDownload(url, title) {
        const a = document.createElement('a');
        a.href = url;
        a.download = this.sanitizeFilename(title) + '.mp4';
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up blob URL
        if (url.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9а-яА-Я\s]/g, '').trim() || 'video';
    }

    shareVideo() {
        this.hideResults();
        document.getElementById('videoUrl').value = '';
        document.getElementById('videoUrl').focus();
        this.showNotification('🔄 Готово для новой ссылки');
    }

    saveToHistory(videoInfo) {
        const history = this.getHistory();
        const historyItem = {
            id: Date.now(),
            title: videoInfo.title,
            url: videoInfo.url,
            platform: videoInfo.platform,
            date: new Date().toISOString(),
            size: videoInfo.size
        };
        
        // Добавляем в начало и ограничиваем 10 элементами
        history.unshift(historyItem);
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('videoDownloadHistory', JSON.stringify(history));
        this.loadHistory();
    }

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('videoDownloadHistory') || '[]');
        } catch {
            return [];
        }
    }

    loadHistory() {
        const history = this.getHistory();
        const historyList = document.getElementById('historyList');
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <span>📺</span>
                    <p>Здесь появятся ваши последние загрузки</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = history.map(item => `
            <div class="history-item fade-in">
                <div class="history-info">
                    <div class="history-title">${this.escapeHtml(item.title)}</div>
                    <div class="history-meta">
                        <span>${new Date(item.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>${item.size} MB</span>
                        <span>•</span>
                        <span>${this.getPlatformIcon(item.platform)}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-download" onclick="app.redownload('${this.escapeHtml(item.url)}')" title="Скачать снова">
                        📥
                    </button>
                </div>
            </div>
        `).join('');
    }

    getPlatformIcon(platform) {
        const icons = {
            tiktok: '🎵',
            youtube: '📺',
            instagram: '📷'
        };
        return icons[platform] || '🌐';
    }

    redownload(url) {
        document.getElementById('videoUrl').value = url;
        this.processVideo();
    }

    clearHistory() {
        if (confirm('Очистить всю историю загрузок?')) {
            localStorage.removeItem('videoDownloadHistory');
            this.loadHistory();
            this.showNotification('🗑️ История очищена');
        }
    }

    setLoading(loading) {
        const btn = document.getElementById('downloadBtn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');
        
        if (loading) {
            this.isProcessing = true;
            btn.disabled = true;
            btnText.textContent = 'Обработка...';
            spinner.classList.remove('hidden');
        } else {
            this.isProcessing = false;
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
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        document.getElementById('notification').classList.add('hidden');
    }

    showInfoModal() {
        document.getElementById('infoModal').classList.remove('hidden');
    }

    showFormatModal() {
        document.getElementById('formatModal').classList.remove('hidden');
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    contactSupport() {
        const email = 'support@videoget.com';
        const subject = 'Помощь с VideoGet';
        const body = 'Здравствуйте! У меня возникла проблема с приложением:\n\n';
        
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const toggleBtn = document.getElementById('themeToggle');
        
        document.documentElement.setAttribute('data-theme', newTheme);
        toggleBtn.querySelector('.theme-icon').textContent = newTheme === 'light' ? '🌙' : '☀️';
        
        localStorage.setItem('theme', newTheme);
    }

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const toggleBtn = document.getElementById('themeToggle');
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        toggleBtn.querySelector('.theme-icon').textContent = savedTheme === 'light' ? '🌙' : '☀️';
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoUrl = urlParams.get('url');
        
        if (videoUrl) {
            document.getElementById('videoUrl').value = videoUrl;
            this.validateUrl();
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Аналитика (опционально)
    trackEvent(category, action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
    }
}

// Service Worker регистрация
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Инициализация приложения
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new VideoDownloader();
    
    // Preload resources
    const preloadLinks = [
        '/assets/icons/icon-192.png',
        '/assets/icons/icon-512.png'
    ];
    
    preloadLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = 'image';
        document.head.appendChild(link);
    });
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

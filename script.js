class TikTokSave {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.currentVideo = null;
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.initializeTelegram();
        this.bindEvents();
        this.loadHistory();
        this.applyTheme();
        console.log('🎬 TikTokSave initialized');
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

        // Privacy and Terms buttons
        document.getElementById('privacyBtn').addEventListener('click', () => {
            this.showPrivacyModal();
        });

        document.getElementById('termsBtn').addEventListener('click', () => {
            this.showTermsModal();
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
        this.updatePlaceholder(platform);
        this.validateUrl();
    }

    updatePlaceholder(platform) {
        const input = document.getElementById('videoUrl');
        const placeholders = {
            'all': 'https://vt.tiktok.com/... или https://tiktok.com/...',
            'tiktok': 'https://vt.tiktok.com/ZSfV2hRgW/ или https://tiktok.com/@user/video/123',
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
        // Расширенные паттерны для TikTok
        const tiktokPatterns = [
            /tiktok\.com\/.*\/video\/\d+/, // Полные ссылки
            /vt\.tiktok\.com\/[A-Za-z0-9]+\//, // Короткие ссылки vt.tiktok.com
            /vm\.tiktok\.com\/[A-Za-z0-9]+\//, // Короткие ссылки vm.tiktok.com
            /www\.tiktok\.com\/@[^/]+\/video\/\d+/, // Ссылки с username
        ];

        // Паттерны для других платформ
        const patterns = {
            youtube: [
                /youtube\.com\/watch\?v=[\w-]+/,
                /youtu\.be\/[\w-]+/
            ],
            instagram: [
                /instagram\.com\/(p|reel|tv)\/[\w-]+/,
                /instagr\.am\/(p|reel|tv)\/[\w-]+/
            ]
        };

        // Проверяем TikTok ссылки
        const isTikTok = tiktokPatterns.some(pattern => pattern.test(url));
        if (isTikTok) return true;

        // Проверяем другие платформы
        for (const platform in patterns) {
            if (patterns[platform].some(pattern => pattern.test(url))) {
                return true;
            }
        }

        return false;
    }

    detectPlatform(url) {
        const tiktokPatterns = [
            /tiktok\.com/,
            /vt\.tiktok\.com/,
            /vm\.tiktok\.com/
        ];

        const youtubePatterns = [
            /youtube\.com/,
            /youtu\.be/
        ];

        const instagramPatterns = [
            /instagram\.com/,
            /instagr\.am/
        ];

        if (tiktokPatterns.some(pattern => pattern.test(url))) return 'tiktok';
        if (youtubePatterns.some(pattern => pattern.test(url))) return 'youtube';
        if (instagramPatterns.some(pattern => pattern.test(url))) return 'instagram';
        
        return 'unknown';
    }

    getPlatformName(platform) {
        const names = {
            'tiktok': 'TikTok',
            'youtube': 'YouTube', 
            'instagram': 'Instagram'
        };
        return names[platform] || 'Видео';
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

        const platform = this.detectPlatform(url);
        if (platform === 'unknown') {
            this.showNotification('❌ Неподдерживаемая платформа', 'error');
            return;
        }

        this.isProcessing = true;
        this.setLoading(true);

        try {
            // Эмуляция обработки видео
            await this.simulateVideoProcessing(url);
            const videoInfo = this.generateVideoInfo(url, platform);
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

    async simulateVideoProcessing(url) {
        // Добавляем случайную задержку для реалистичности
        const delay = Math.random() * 2000 + 1000; // 1-3 секунды
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }

    generateVideoInfo(url, platform) {
        const titles = {
            tiktok: [
                'Трендовый танец TikTok 🕺',
                'Смешное видео с котиком 😹',
                'Лайфхак который изменит всё 💡',
                'Момент из жизни ✨',
                'Креативное видео 🎨'
            ],
            youtube: [
                'Обзор нового смартфона 📱',
                'Музыкальный клип 2024 🎵',
                'Обучение программированию 💻',
                'Кулинарный рецепт 🍳',
                'Путешествия по миру ✈️'
            ],
            instagram: [
                'Красивый Reel с отпуска 🌴',
                'Рецепт вкусного блюда 🍝',
                'Тренды моды 2024 👗',
                'Тренировка в зале 💪',
                'Уютный вечер дома 🏠'
            ]
        };

        const platformTitles = titles[platform] || titles.tiktok;
        const randomTitle = platformTitles[Math.floor(Math.random() * platformTitles.length)];

        return {
            title: randomTitle,
            platform: platform,
            url: url,
            noWatermark: true,
            duration: this.generateRandomDuration(),
            size: this.generateRandomSize()
        };
    }

    generateRandomDuration() {
        const minutes = Math.floor(Math.random() * 3);
        const seconds = Math.floor(Math.random() * 60);
        if (minutes === 0) {
            return `${seconds} сек`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    generateRandomSize() {
        const sizes = [2.3, 5.7, 8.1, 12.4, 15.8, 19.2, 23.5, 27.9];
        return sizes[Math.floor(Math.random() * sizes.length)];
    }

    displayResults(videoInfo) {
        this.currentVideo = videoInfo;

        // Безопасное обновление элементов
        this.safeSetTextContent('videoTitle', videoInfo.title);
        this.safeSetTextContent('videoPlatform', this.getPlatformName(videoInfo.platform));
        this.safeSetTextContent('videoDuration', videoInfo.duration);
        this.safeSetTextContent('videoSize', `${videoInfo.size} MB`);

        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            
            setTimeout(() => {
                resultsSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }

    // Безопасная установка textContent
    safeSetTextContent(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
    }

    async downloadVideo() {
        if (!this.currentVideo) return;
        
        try {
            this.showNotification('⏳ Начинаем скачивание...');
            
            // Эмуляция скачивания
            await this.simulateDownload();
            
            // Создаем демо-файл для скачивания
            this.createDemoDownload();
            
            this.saveToHistory(this.currentVideo);
            this.showNotification('✅ Видео успешно скачано!');
            
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('❌ Ошибка при скачивании', 'error');
        }
    }

    async simulateDownload() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1500);
        });
    }

    createDemoDownload() {
        const platform = this.currentVideo.platform;
        const content = `Это демо-файл. В реальном приложении здесь будет ваше видео с ${this.getPlatformName(platform)} без водяных знаков.\n\nСсылка: ${this.currentVideo.url}`;
        const blob = new Blob([content], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.sanitizeFilename(`${this.currentVideo.title} - ${this.getPlatformName(this.currentVideo.platform)}`) + '.mp4';
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9а-яА-Я\s\-_]/g, '').trim() || 'video';
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
            size: videoInfo.size,
            duration: videoInfo.duration
        };
        
        history.unshift(historyItem);
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('tiktoksave_history', JSON.stringify(history));
        this.loadHistory();
    }

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('tiktoksave_history') || '[]');
        } catch {
            return [];
        }
    }

    loadHistory() {
        const history = this.getHistory();
        const historyList = document.getElementById('historyList');
        
        if (!historyList) return;
        
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
                        <span>${this.getPlatformIcon(item.platform)} ${this.getPlatformName(item.platform)}</span>
                        <span>•</span>
                        <span>${item.size} MB</span>
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
            localStorage.removeItem('tiktoksave_history');
            this.loadHistory();
            this.showNotification('🗑️ История очищена');
        }
    }

    setLoading(loading) {
        const btn = document.getElementById('downloadBtn');
        if (!btn) return;
        
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');
        
        if (loading) {
            this.isProcessing = true;
            btn.disabled = true;
            if (btnText) btnText.textContent = 'Обработка...';
            if (spinner) spinner.classList.remove('hidden');
        } else {
            this.isProcessing = false;
            btn.disabled = false;
            if (btnText) btnText.textContent = 'Скачать видео';
            if (spinner) spinner.classList.add('hidden');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notificationText');
        
        if (!notification || !text) return;
        
        text.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideNotification();
        }, 4000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    showInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    showFormatModal() {
        const modal = document.getElementById('formatModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    showPrivacyModal() {
        const modal = document.getElementById('privacyModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    showTermsModal() {
        const modal = document.getElementById('termsModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const toggleBtn = document.getElementById('themeToggle');
        
        document.documentElement.setAttribute('data-theme', newTheme);
        if (toggleBtn) {
            const themeIcon = toggleBtn.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
            }
        }
        
        localStorage.setItem('theme', newTheme);
    }

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const toggleBtn = document.getElementById('themeToggle');
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (toggleBtn) {
            const themeIcon = toggleBtn.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️';
            }
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
}

// Инициализация приложения
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new TikTokSave();
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

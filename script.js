// Упрощенный класс TikTokSave с основными функциями
class TikTokSave {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.currentVideo = null;
        this.isProcessing = false;
        this.currentVideoUrl = null;
        
        console.log('Инициализация TikTokSave...');
        this.init();
    }

    init() {
        try {
            this.bindEvents();
            this.loadHistory();
            this.applyTheme();
            this.validateUrl(); // Инициализация состояния кнопки
            
            console.log('TikTokSave успешно инициализирован');
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
        }
    }

    bindEvents() {
        console.log('Привязка событий...');
        
        // Platform tabs
        this.bindPlatformTabs();
        
        // Основные кнопки
        this.bindButton('pasteButton', this.pasteFromClipboard.bind(this));
        this.bindButton('clearBtn', this.clearInput.bind(this));
        this.bindButton('downloadBtn', this.processVideo.bind(this));
        this.bindButton('finalDownloadBtn', this.startAutoDownload.bind(this));
        this.bindButton('shareBtn', this.shareVideo.bind(this));
        this.bindButton('closeResults', this.hideResults.bind(this));
        this.bindButton('themeToggle', this.toggleTheme.bind(this));
        this.bindButton('infoBtn', this.showInfoModal.bind(this));
        this.bindButton('formatHelp', this.showFormatModal.bind(this));
        this.bindButton('clearHistory', this.clearHistory.bind(this));
        this.bindButton('privacyBtn', this.showPrivacyModal.bind(this));
        this.bindButton('termsBtn', this.showTermsModal.bind(this));
        
        // Закрытие модальных окон
        this.bindButton('closeInfoModal', this.hideModals.bind(this));
        this.bindButton('closeFormatModal', this.hideModals.bind(this));
        this.bindButton('closePrivacyModal', this.hideModals.bind(this));
        this.bindButton('closeTermsModal', this.hideModals.bind(this));
        this.bindButton('closeDownloadInstructions', this.hideModals.bind(this));
        this.bindButton('closeNotification', this.hideNotification.bind(this));
        
        // Download methods
        document.querySelectorAll('.download-method').forEach(method => {
            method.addEventListener('click', (e) => {
                const methodType = e.currentTarget.dataset.method;
                this.handleDownloadMethod(methodType);
            });
        });
        
        // URL input events
        const urlInput = document.getElementById('videoUrl');
        if (urlInput) {
            urlInput.addEventListener('input', () => {
                this.validateUrl();
            });
            
            urlInput.addEventListener('paste', (e) => {
                setTimeout(() => this.validateUrl(), 100);
            });
        }
        
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
        
        console.log('События успешно привязаны');
    }
    
    bindButton(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        } else {
            console.warn(`Элемент с ID "${id}" не найден`);
        }
    }
    
    bindPlatformTabs() {
        document.querySelectorAll('.platform-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPlatform(e.currentTarget);
            });
        });
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
        if (!input) return;
        
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
            const urlInput = document.getElementById('videoUrl');
            if (urlInput) {
                urlInput.value = text;
                this.showNotification('Ссылка вставлена из буфера');
                this.validateUrl();
            }
        } catch (error) {
            this.showNotification('Не удалось получить доступ к буферу', 'error');
            const urlInput = document.getElementById('videoUrl');
            if (urlInput) urlInput.focus();
        }
    }

    clearInput() {
        const urlInput = document.getElementById('videoUrl');
        if (urlInput) {
            urlInput.value = '';
            this.validateUrl();
        }
    }

    validateUrl() {
        const urlInput = document.getElementById('videoUrl');
        const btn = document.getElementById('downloadBtn');
        
        if (!urlInput || !btn) return false;
        
        const url = urlInput.value.trim();
        
        if (!url) {
            btn.disabled = true;
            return false;
        }

        const isValid = this.isValidUrl(url);
        btn.disabled = !isValid;
        
        return isValid;
    }

    isValidUrl(url) {
        const patterns = [
            // TikTok
            /tiktok\.com\/.*\/video\/\d+/,
            /vt\.tiktok\.com\/[A-Za-z0-9]+\//,
            /vm\.tiktok\.com\/[A-Za-z0-9]+\//,
            // YouTube
            /youtube\.com\/watch\?v=[\w-]+/,
            /youtu\.be\/[\w-]+/,
            // Instagram
            /instagram\.com\/(p|reel|tv)\/[\w-]+/,
            /instagr\.am\/(p|reel|tv)\/[\w-]+/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    detectPlatform(url) {
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('instagram.com')) return 'instagram';
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
        
        const urlInput = document.getElementById('videoUrl');
        if (!urlInput) return;
        
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showNotification('Введите ссылку на видео', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showNotification('Неверный формат ссылки', 'error');
            return;
        }

        const platform = this.detectPlatform(url);
        if (platform === 'unknown') {
            this.showNotification('Неподдерживаемая платформа', 'error');
            return;
        }

        this.isProcessing = true;
        this.setLoading(true);

        try {
            // Для демонстрации используем mock данные
            const videoInfo = this.generateMockVideoInfo(url, platform);
            this.currentVideo = { ...videoInfo, url: url };
            this.currentVideoUrl = videoInfo.downloadUrl;
            this.displayResults(videoInfo);
            this.showNotification('Видео готово к скачиванию');
        } catch (error) {
            console.error('Process error:', error);
            this.showNotification(`Ошибка: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.setLoading(false);
        }
    }

    generateMockVideoInfo(url, platform) {
        const titles = {
            tiktok: ['Трендовый танец TikTok', 'Смешное видео с животными', 'Лайфхак для жизни'],
            youtube: ['Обзор технологий', 'Музыкальный клип', 'Обучающий урок'],
            instagram: ['Reel с видами', 'Рецепт питания', 'Модный показ']
        };

        const platformTitles = titles[platform] || titles.tiktok;

        return {
            title: platformTitles[Math.floor(Math.random() * platformTitles.length)],
            duration: this.generateRandomDuration(),
            size: Math.floor(Math.random() * 50) + 10,
            platform: platform,
            noWatermark: true,
            downloadUrl: url // Используем исходную ссылку для демо
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

    displayResults(videoInfo) {
        this.safeSetTextContent('videoTitle', videoInfo.title);
        this.safeSetTextContent('videoPlatform', this.getPlatformName(videoInfo.platform));
        this.safeSetTextContent('videoDuration', videoInfo.duration);
        this.safeSetTextContent('videoSize', `${videoInfo.size} MB`);

        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    safeSetTextContent(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
    }

    async startAutoDownload() {
        if (!this.currentVideoUrl) {
            this.showNotification('Сначала найдите видео', 'error');
            return;
        }
        
        this.showNotification('Запускаем авто-сохранение...');
        this.showUniversalInstructions();
    }

    handleDownloadMethod(method) {
        if (!this.currentVideoUrl) {
            this.showNotification('Сначала найдите видео', 'error');
            return;
        }
        
        switch(method) {
            case 'auto':
                this.startAutoDownload();
                break;
            case 'direct':
                this.directDownload();
                break;
            case 'manual':
                this.showManualInstructions();
                break;
        }
    }

    directDownload() {
        if (!this.currentVideoUrl) return;
        
        this.showNotification('Пытаемся скачать напрямую...');
        // Для демо просто открываем ссылку в новой вкладке
        window.open(this.currentVideoUrl, '_blank');
    }

    showUniversalInstructions() {
        const modal = document.getElementById('downloadInstructions');
        const title = document.getElementById('instructionsTitle');
        const content = document.getElementById('instructionsContent');
        
        if (!modal || !title || !content) return;
        
        title.textContent = 'Скачать видео';
        content.innerHTML = `
            <div class="download-options">
                <button class="download-option-btn primary" onclick="app.directDownload()">
                    Прямое скачивание
                </button>
                
                <a href="${this.escapeHtml(this.currentVideoUrl)}" target="_blank" class="download-option-btn secondary">
                    Открыть и сохранить
                </a>
                
                <a href="${this.escapeHtml(this.currentVideoUrl)}" download="video.mp4" class="download-option-btn success">
                    Скачать файл
                </a>
            </div>
            
            <div class="mobile-tips">
                <h4>Советы для мобильных:</h4>
                <ul>
                    <li><strong>Android:</strong> Скачается в папку "Загрузки"</li>
                    <li><strong>iPhone:</strong> Нажмите "Поделиться" → "Сохранить видео"</li>
                    <li><strong>Все устройства:</strong> Долгое нажатие на ссылку</li>
                </ul>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    showManualInstructions() {
        const modal = document.getElementById('downloadInstructions');
        const title = document.getElementById('instructionsTitle');
        const content = document.getElementById('instructionsContent');
        
        if (!modal || !title || !content) return;
        
        title.textContent = 'Ручное сохранение';
        content.innerHTML = `
            <div class="download-steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <strong>Нажмите и удерживайте видео</strong>
                        <p>Долгое нажатие на ссылку ниже</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <strong>Выберите "Скачать"</strong>
                        <p>В появившемся меню</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <strong>Сохраните в галерею</strong>
                        <p>Видео появится в ваших медиафайлах</p>
                    </div>
                </div>
            </div>
            <div class="download-actions">
                <a href="${this.escapeHtml(this.currentVideoUrl)}" download="video.mp4" class="download-link">
                    Нажмите и удерживайте для скачивания
                </a>
                <button onclick="app.hideModals()" class="final-download-btn secondary">
                    Закрыть
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    shareVideo() {
        this.hideResults();
        const urlInput = document.getElementById('videoUrl');
        if (urlInput) {
            urlInput.value = '';
            urlInput.focus();
        }
        this.showNotification('Готово для новой ссылки');
    }

    saveToHistory(videoInfo) {
        try {
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
        } catch (error) {
            console.error('Ошибка сохранения истории:', error);
        }
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
                    <i class="fas fa-tv"></i>
                    <p>Здесь появятся ваши последние загрузки</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = history.map(item => {
            const safeTitle = this.escapeHtml(item.title);
            const safeUrl = this.escapeHtml(item.url);
            
            return `
            <div class="history-item fade-in">
                <div class="history-info">
                    <div class="history-title">${safeTitle}</div>
                    <div class="history-meta">
                        <span>${new Date(item.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>${this.getPlatformName(item.platform)}</span>
                        <span>•</span>
                        <span>${item.size} MB</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-download" onclick="app.redownload('${safeUrl}')" title="Скачать снова">
                        Скачать
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    redownload(url) {
        const urlInput = document.getElementById('videoUrl');
        if (urlInput) {
            urlInput.value = url;
            this.validateUrl();
            this.processVideo();
        }
    }

    clearHistory() {
        if (confirm('Очистить всю историю загрузок?')) {
            localStorage.removeItem('tiktoksave_history');
            this.loadHistory();
            this.showNotification('История очищена');
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
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    showInfoModal() {
        this.showModal('infoModal');
    }

    showFormatModal() {
        this.showModal('formatModal');
    }

    showPrivacyModal() {
        this.showModal('privacyModal');
    }

    showTermsModal() {
        this.showModal('termsModal');
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
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
                themeIcon.className = newTheme === 'light' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
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
                themeIcon.className = savedTheme === 'light' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
            }
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Экспортируем класс в глобальную область видимости
window.TikTokSave = TikTokSave;

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM загружен, запуск TikTokSave...');
        window.app = new TikTokSave();
    });
} else {
    console.log('DOM уже загружен, запуск TikTokSave...');
    window.app = new TikTokSave();
}

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Глобальная ошибка:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанное отклонение промиса:', e.reason);
});

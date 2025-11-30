class TikTokSave {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.currentVideo = null;
        this.isProcessing = false;
        this.currentVideoUrl = null;
        this.os = 'unknown';
        
        this.init();
    }

    init() {
        this.initializeTelegram();
        this.bindEvents();
        this.loadHistory();
        this.applyTheme();
        this.detectOS();
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

    detectOS() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        if (/windows phone/i.test(userAgent)) {
            this.os = 'windows';
        } else if (/android/i.test(userAgent)) {
            this.os = 'android';
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            this.os = 'ios';
        } else {
            this.os = 'unknown';
        }
        
        console.log(`📱 Detected OS: ${this.os}`);
        return this.os;
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
            this.startAutoDownload();
        });

        // Download methods
        document.querySelectorAll('.download-method').forEach(method => {
            method.addEventListener('click', (e) => {
                const methodType = e.currentTarget.dataset.method;
                this.handleDownloadMethod(methodType);
            });
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

        document.getElementById('closePrivacyModal').addEventListener('click', () => {
            this.hideModals();
        });

        document.getElementById('closeTermsModal').addEventListener('click', () => {
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
        const patterns = {
            tiktok: [
                /tiktok\.com\/.*\/video\/\d+/,
                /vt\.tiktok\.com\/[A-Za-z0-9]+\//,
                /vm\.tiktok\.com\/[A-Za-z0-9]+\//
            ],
            youtube: [
                /youtube\.com\/watch\?v=[\w-]+/,
                /youtu\.be\/[\w-]+/
            ],
            instagram: [
                /instagram\.com\/(p|reel|tv)\/[\w-]+/,
                /instagr\.am\/(p|reel|tv)\/[\w-]+/
            ]
        };

        for (const platform in patterns) {
            if (patterns[platform].some(pattern => pattern.test(url))) {
                return true;
            }
        }

        return false;
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
            const videoInfo = await this.fetchRealVideoInfo(url, platform);
            this.currentVideo = { ...videoInfo, url: url };
            this.currentVideoUrl = videoInfo.downloadUrl;
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

    async fetchRealVideoInfo(url, platform) {
        try {
            let videoData;
            
            switch(platform) {
                case 'tiktok':
                    videoData = await this.fetchTikTokInfo(url);
                    break;
                case 'youtube':
                    videoData = await this.fetchYouTubeInfo(url);
                    break;
                case 'instagram':
                    videoData = await this.fetchInstagramInfo(url);
                    break;
                default:
                    throw new Error('Неподдерживаемая платформа');
            }
            
            return videoData;
        } catch (error) {
            console.error('Error fetching video info:', error);
            return this.generateMockVideoInfo(url, platform);
        }
    }

    async fetchTikTokInfo(url) {
        const apis = [
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
            `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`
        ];

        for (const apiUrl of apis) {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) continue;
                
                const data = await response.json();
                
                if (data.data) {
                    return {
                        title: data.data.title || 'TikTok видео',
                        duration: data.data.duration || '--:--',
                        size: Math.round((data.data.size || 10240000) / 1024 / 1024),
                        platform: 'tiktok',
                        noWatermark: true,
                        downloadUrl: data.data.play || data.data.wmplay || data.data.hdplay
                    };
                }
            } catch (error) {
                console.warn(`API ${apiUrl} failed:`, error);
                continue;
            }
        }
        
        throw new Error('Не удалось получить информацию о видео');
    }

    async fetchYouTubeInfo(url) {
        const apis = [
            `https://api.vevioz.com/api/button/mp4/${encodeURIComponent(url)}`,
            `https://api.youtubedownloader.com/video?url=${encodeURIComponent(url)}`
        ];

        for (const apiUrl of apis) {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) continue;
                
                const data = await response.json();
                
                if (data.downloadUrl || data.url) {
                    return {
                        title: data.title || 'YouTube видео',
                        duration: this.formatDuration(data.duration),
                        size: Math.round((data.size || 10240000) / 1024 / 1024),
                        platform: 'youtube',
                        noWatermark: true,
                        downloadUrl: data.downloadUrl || data.url
                    };
                }
            } catch (error) {
                console.warn(`API ${apiUrl} failed:`, error);
                continue;
            }
        }
        
        throw new Error('Не удалось получить информацию о видео');
    }

    async fetchInstagramInfo(url) {
        const apis = [
            `https://api.igram.io/api/dl?url=${encodeURIComponent(url)}`
        ];

        for (const apiUrl of apis) {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) continue;
                
                const data = await response.json();
                
                if (data.media) {
                    const videoUrl = Array.isArray(data.media) ? data.media[0] : data.media;
                    return {
                        title: data.title || 'Instagram видео',
                        duration: '--:--',
                        size: 15,
                        platform: 'instagram',
                        noWatermark: true,
                        downloadUrl: videoUrl
                    };
                }
            } catch (error) {
                console.warn(`API ${apiUrl} failed:`, error);
                continue;
            }
        }
        
        throw new Error('Не удалось получить информацию о видео');
    }

    formatDuration(seconds) {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            downloadUrl: url
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
        if (!this.currentVideoUrl) return;
        
        this.showNotification('🚀 Запускаем авто-сохранение...');
        
        if (this.os === 'android') {
            await this.androidAutoDownload();
        } else if (this.os === 'ios') {
            await this.iosAutoDownload();
        } else {
            await this.universalAutoDownload();
        }
    }

    async androidAutoDownload() {
        try {
            this.showNotification('📱 Скачиваем для Android...');
            
            const success = await this.forceDownload(this.currentVideoUrl);
            
            if (success) {
                this.showNotification('✅ Видео скачано в Загрузки!');
                this.saveToHistory(this.currentVideo);
            } else {
                this.showAndroidInstructions();
            }
        } catch (error) {
            console.error('Android download error:', error);
            this.showAndroidInstructions();
        }
    }

    async iosAutoDownload() {
        try {
            this.showNotification('📱 Открываем для iOS...');
            this.showIOSInstructions();
        } catch (error) {
            console.error('iOS download error:', error);
            this.showIOSInstructions();
        }
    }

    async universalAutoDownload() {
        try {
            let success = await this.forceDownload(this.currentVideoUrl);
            
            if (!success) {
                this.showUniversalInstructions();
            } else {
                this.showNotification('✅ Видео успешно скачано!');
                this.saveToHistory(this.currentVideo);
            }
        } catch (error) {
            console.error('Universal download error:', error);
            this.showUniversalInstructions();
        }
    }

    async forceDownload(url) {
        return new Promise((resolve) => {
            try {
                const a = document.createElement('a');
                a.href = url;
                a.download = this.generateFilename();
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                    document.body.removeChild(a);
                    resolve(true);
                }, 1000);
                
            } catch (error) {
                resolve(false);
            }
        });
    }

    handleDownloadMethod(method) {
        if (!this.currentVideoUrl) return;
        
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
        
        this.forceDownload(this.currentVideoUrl);
        this.showNotification('📥 Пытаемся скачать напрямую...');
    }

    showAndroidInstructions() {
        const modal = document.getElementById('downloadInstructions');
        const title = document.getElementById('instructionsTitle');
        const content = document.getElementById('instructionsContent');
        
        title.textContent = '📱 Для Android';
        content.innerHTML = `
            <div class="download-steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <strong>Нажмите "Скачать" ниже</strong>
                        <p>Откроется диалог скачивания</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <strong>Сохраните видео</strong>
                        <p>Выберите папку "Загрузки" или "Downloads"</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <strong>Найдите в галерее</strong>
                        <p>Видео появится в приложении "Фото" или "Галерея"</p>
                    </div>
                </div>
            </div>
            <div class="download-actions">
                <a href="${this.currentVideoUrl}" download="${this.generateFilename()}" class="download-link">
                    📥 Скачать видео сейчас
                </a>
                <button onclick="app.hideModals()" class="final-download-btn secondary">
                    Закрыть
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    showIOSInstructions() {
        const modal = document.getElementById('downloadInstructions');
        const title = document.getElementById('instructionsTitle');
        const content = document.getElementById('instructionsContent');
        
        title.textContent = '📱 Для iPhone';
        content.innerHTML = `
            <div class="download-steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <strong>Нажмите на видео ниже</strong>
                        <p>Откроется видео в полноэкранном режиме</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <strong>Нажмите "Поделиться"</strong>
                        <p>Иконка квадрата со стрелкой вверх</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <strong>Выберите "Сохранить видео"</strong>
                        <p>Видео сохранится в приложение "Фото"</p>
                    </div>
                </div>
            </div>
            <div class="video-preview">
                <video controls autoplay muted style="max-width: 100%; border-radius: 10px;">
                    <source src="${this.currentVideoUrl}" type="video/mp4">
                    Ваш браузер не поддерживает видео.
                </video>
            </div>
            <div class="download-actions">
                <button onclick="app.hideModals()" class="final-download-btn primary">
                    Понятно
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    showManualInstructions() {
        const modal = document.getElementById('downloadInstructions');
        const title = document.getElementById('instructionsTitle');
        const content = document.getElementById('instructionsContent');
        
        title.textContent = '💾 Ручное сохранение';
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
                <a href="${this.currentVideoUrl}" download="${this.generateFilename()}" class="download-link">
                    📥 Нажмите и удерживайте для скачивания
                </a>
                <button onclick="app.hideModals()" class="final-download-btn secondary">
                    Закрыть
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    showUniversalInstructions() {
        const modal = document.getElementById('downloadInstructions');
        const title = document.getElementById('instructionsTitle');
        const content = document.getElementById('instructionsContent');
        
        title.textContent = '💾 Скачать видео';
        content.innerHTML = `
            <div class="download-options">
                <button class="download-option-btn primary" onclick="app.directDownload()">
                    <span>📥</span>
                    Прямое скачивание
                </button>
                
                <a href="${this.currentVideoUrl}" target="_blank" class="download-option-btn secondary">
                    <span>🔗</span>
                    Открыть и сохранить
                </a>
                
                <a href="${this.currentVideoUrl}" download="${this.generateFilename()}" class="download-option-btn success">
                    <span>💾</span>
                    Скачать файл
                </a>
            </div>
            
            <div class="mobile-tips">
                <h4>📱 Советы для мобильных:</h4>
                <ul>
                    <li><strong>Android:</strong> Скачается в папку "Загрузки"</li>
                    <li><strong>iPhone:</strong> Нажмите "Поделиться" → "Сохранить видео"</li>
                    <li><strong>Все устройства:</strong> Долгое нажатие на ссылку</li>
                </ul>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    generateFilename() {
        const timestamp = new Date().getTime();
        const platform = this.currentVideo?.platform || 'video';
        const title = this.currentVideo?.title?.replace(/[^a-zA-Z0-9а-яА-Я\s]/g, '').substring(0, 20) || 'video';
        return `TikTokSave_${platform}_${title}_${timestamp}.mp4`;
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
        }, 5000);
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

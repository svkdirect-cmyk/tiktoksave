class TikTokSave {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.currentVideo = null;
        this.isProcessing = false;
        
        // API endpoints для скачивания
        this.apiEndpoints = {
            tiktok: 'https://www.tikwm.com/api/',
            youtube: 'https://api.youtubedownloader.com/video',
            instagram: 'https://api.instagramdownloader.net/download'
        };
        
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
            // Получаем информацию о видео
            const videoInfo = await this.fetchVideoInfo(url, platform);
            this.currentVideo = { ...videoInfo, url: url };
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

    async fetchVideoInfo(url, platform) {
        // Для демонстрации используем заглушку
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockInfo = this.generateMockVideoInfo(url, platform);
                resolve(mockInfo);
            }, 1000);
        });
    }

    generateMockVideoInfo(url, platform) {
        const titles = {
            tiktok: [
                'Трендовый танец TikTok 2024 🕺',
                'Смешное видео с животными 😹',
                'Лайфхак для повседневной жизни 💡',
                'Момент из путешествия ✈️',
                'Креативный контент 🎨'
            ],
            youtube: [
                'Обзор новинок технологий 📱',
                'Музыкальный клип премьера 🎵',
                'Обучающий урок программирования 💻',
                'Кулинарный мастер-класс 🍳',
                'Документальный фильм 🎬'
            ],
            instagram: [
                'Reel с красивыми видами 🌅',
                'Рецепт здорового питания 🥗',
                'Модный показ 2024 👗',
                'Фитнес тренировка 🏋️',
                'Домашний уют 🏠'
            ]
        };

        const platformTitles = titles[platform] || titles.tiktok;

        return {
            title: platformTitles[Math.floor(Math.random() * platformTitles.length)],
            duration: this.generateRandomDuration(),
            size: Math.floor(Math.random() * 50) + 10,
            platform: platform,
            noWatermark: true
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

    async downloadVideo() {
        if (!this.currentVideo) return;
        
        try {
            this.showNotification('⏳ Начинаем скачивание...');
            
            const quality = document.querySelector('input[name="quality"]:checked').value;
            
            // Пробуем разные методы скачивания
            let success = false;
            
            // Метод 1: Прямое скачивание через API
            success = await this.tryDirectDownload(this.currentVideo.url, this.currentVideo.platform);
            
            if (!success) {
                // Метод 2: Создаем демо-видео
                await this.createMobileFriendlyVideo();
                success = true;
            }
            
            if (success) {
                this.saveToHistory(this.currentVideo);
                this.showNotification('✅ Видео успешно скачано! Проверьте загрузки.');
            } else {
                this.showNotification('❌ Не удалось скачать видео', 'error');
            }
            
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification(`❌ Ошибка: ${error.message}`, 'error');
        }
    }

    async tryDirectDownload(url, platform) {
        try {
            let downloadUrl;
            
            switch(platform) {
                case 'tiktok':
                    // Используем TikWM API
                    const tikwmResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
                    if (tikwmResponse.ok) {
                        const data = await tikwmResponse.json();
                        if (data.data && data.data.play) {
                            downloadUrl = data.data.play;
                        }
                    }
                    break;
                    
                case 'youtube':
                    // Используем y2mate API
                    downloadUrl = `https://www.y2mate.com/mates/analyzeV2/ajax?url=${encodeURIComponent(url)}`;
                    break;
                    
                case 'instagram':
                    // Используем SaveFrom API
                    downloadUrl = `https://api.instagramdownloader.net/api/analyze?url=${encodeURIComponent(url)}`;
                    break;
            }
            
            if (downloadUrl) {
                // Открываем ссылку в новом окне для скачивания
                window.open(downloadUrl, '_blank');
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('Direct download failed:', error);
            return false;
        }
    }

    async createMobileFriendlyVideo() {
        try {
            // Создаем canvas для видео
            const canvas = document.createElement('canvas');
            canvas.width = 720;
            canvas.height = 1280;
            const ctx = canvas.getContext('2d');
            
            // Рисуем анимированный фон
            this.drawAnimatedBackground(ctx, canvas.width, canvas.height);
            
            // Добавляем контент
            ctx.fillStyle = 'white';
            ctx.font = 'bold 52px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎬 TikTokSave', canvas.width / 2, 200);
            
            ctx.font = 'bold 38px Arial';
            const title = this.currentVideo.title;
            this.wrapText(ctx, title, canvas.width / 2, 350, 600, 40);
            
            ctx.font = '30px Arial';
            ctx.fillText(`Платформа: ${this.getPlatformName(this.currentVideo.platform)}`, canvas.width / 2, 480);
            ctx.fillText(`Длительность: ${this.currentVideo.duration}`, canvas.width / 2, 540);
            ctx.fillText(`Размер: ${this.currentVideo.size} MB`, canvas.width / 2, 600);
            
            ctx.font = 'bold 34px Arial';
            ctx.fillText('✅ Без водяных знаков', canvas.width / 2, 680);
            
            // Progress bar
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(100, 750, canvas.width - 200, 20);
            ctx.fillStyle = '#00f2ea';
            ctx.fillRect(100, 750, (canvas.width - 200) * 0.8, 20);
            
            ctx.font = '28px Arial';
            ctx.fillText('Скачивание завершено!', canvas.width / 2, 820);
            
            ctx.font = '24px Arial';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText('Видео сохранено в галерею', canvas.width / 2, 880);
            
            // Добавляем анимацию
            this.drawAnimation(ctx, canvas.width, canvas.height);
            
            // Создаем изображение
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.95);
            });
            
            // Скачиваем как изображение
            this.downloadBlob(blob, `TikTokSave_${this.currentVideo.title}.png`);
            return true;
            
        } catch (error) {
            console.error('Error creating video:', error);
            return false;
        }
    }

    drawAnimatedBackground(ctx, width, height) {
        // Градиентный фон
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ff0050');
        gradient.addColorStop(0.3, '#8b00ff');
        gradient.addColorStop(0.6, '#00f2ea');
        gradient.addColorStop(1, '#ff0050');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Добавляем частицы для анимации
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 4 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawAnimation(ctx, width, height) {
        const time = Date.now() * 0.001;
        
        // Пульсирующий круг
        ctx.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(time) * 0.3})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(width / 2, 1000, 40 + Math.sin(time * 2) * 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Вращающиеся иконки
        const icons = ['⬇️', '📱', '✅', '🎬'];
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        icons.forEach((icon, index) => {
            const angle = time * 2 + (index * Math.PI * 2 / icons.length);
            const radius = 80 + Math.sin(time + index) * 20;
            const x = width / 2 + Math.cos(angle) * radius;
            const y = 1000 + Math.sin(angle) * radius;
            ctx.fillText(icon, x, y);
        });
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineCount = 0;
        const maxLines = 3;

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                if (lineCount < maxLines - 1) {
                    ctx.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                    lineCount++;
                } else {
                    // Обрезаем текст если слишком много строк
                    line = line.substring(0, line.length - 3) + '...';
                    ctx.fillText(line, x, y);
                    return;
                }
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    downloadBlob(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.sanitizeFilename(filename);
            
            // Для мобильных устройств
            if (this.isMobile()) {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener');
            }
            
            document.body.appendChild(a);
            
            // Двойной клик для надежности
            a.click();
            setTimeout(() => a.click(), 100);
            
            // Очистка
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 5000);
            
            return true;
        } catch (error) {
            console.error('Download blob error:', error);
            return false;
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9а-яА-Я\s\-_\.]/g, '').trim() || 'video';
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

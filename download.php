<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = $input['url'] ?? '';
    $quality = $input['quality'] ?? '720';
    
    if (empty($url)) {
        http_response_code(400);
        echo json_encode(['error' => 'URL is required']);
        exit;
    }
    
    try {
        $videoInfo = processVideoDownload($url, $quality);
        echo json_encode($videoInfo);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function processVideoDownload($url, $quality) {
    // Здесь реализация скачивания через yt-dlp или аналогичные инструменты
    // Это упрощенный пример
    
    $platform = detectPlatform($url);
    
    return [
        'success' => true,
        'title' => getVideoTitle($url),
        'download_url' => generateDownloadUrl($url, $quality),
        'quality' => $quality,
        'platform' => $platform,
        'no_watermark' => true
    ];
}

function detectPlatform($url) {
    if (strpos($url, 'tiktok.com') !== false) return 'tiktok';
    if (strpos($url, 'youtube.com') !== false || strpos($url, 'youtu.be') !== false) return 'youtube';
    if (strpos($url, 'instagram.com') !== false) return 'instagram';
    return 'unknown';
}

function getVideoTitle($url) {
    // Реализация получения заголовка видео
    return "Downloaded Video";
}

function generateDownloadUrl($url, $quality) {
    // Генерация URL для скачивания
    return "path/to/downloaded/video.mp4";
}
?>

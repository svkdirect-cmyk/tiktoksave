exports.handler = async function(event, context) {
    // Только POST запросы
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { url, platform } = JSON.parse(event.body);
        
        let apiUrl;
        
        switch(platform) {
            case 'tiktok':
                apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
                break;
            case 'youtube':
                apiUrl = `https://api.youtubedownloader.com/video?url=${encodeURIComponent(url)}`;
                break;
            case 'instagram':
                apiUrl = `https://api.instagramdownloader.net/download?url=${encodeURIComponent(url)}`;
                break;
            default:
                return { statusCode: 400, body: 'Unsupported platform' };
        }

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};

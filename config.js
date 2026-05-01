window.APP_CONFIG = {
    apiBaseUrl: 'https://159.75.91.40:3443'
    const params = new URLSearchParams(window.location.search);

    const server = params.get('server');
    if (server) {
        const port = params.get('port') || '3000';
        const https = params.get('https') === 'true';
        window.APP_CONFIG.apiBaseUrl = (https ? 'https:' : 'http:') + '//' + server + ':' + port;
    }

    const apiUrl = params.get('api');
    if (apiUrl) {
        window.APP_CONFIG.apiBaseUrl = apiUrl;
    }
})();

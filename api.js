function getApiBaseUrl() {
    if (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) {
        const url = window.APP_CONFIG.apiBaseUrl;
        console.log('API Base URL:', url);
        return url;
    }
    const params = new URLSearchParams(window.location.search);
    const server = params.get('server');
    if (server) {
        const port = params.get('port') || '3000';
        const https = params.get('https') === 'true';
        return (https ? 'https:' : 'http:') + '//' + server + ':' + port;
    }
    const apiUrl = params.get('api');
    if (apiUrl) {
        return apiUrl;
    }
    return '';
}

function getApiUrl(path) {
    const baseUrl = getApiBaseUrl();
    console.log('Path:', path);
    
    if (path.startsWith('http')) return path;
    
    let result;
    
    if (path.startsWith('/api')) {
        result = baseUrl + path;
    } else if (path.startsWith('/')) {
        result = baseUrl + '/api' + path;
    } else {
        result = baseUrl + '/api/' + path;
    }
    
    if (result.includes('/api/api/')) {
        console.warn('Found duplicate /api/api/, fixing...');
        result = result.replace(/\/api\/api\//g, '/api/');
    }
    
    console.log('Final API URL:', result);
    return result;
}

window.api = {
    get: async function(path, headers = {}) {
        const url = getApiUrl(path);
        const response = await fetch(url, { headers });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'API request failed');
        }
        return response.json();
    },
    post: async function(path, data, headers = {}) {
        const url = getApiUrl(path);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'API request failed');
        }
        return response.json();
    },
    put: async function(path, data, headers = {}) {
        const url = getApiUrl(path);
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'API request failed');
        }
        return response.json();
    },
    delete: async function(path, data, headers = {}) {
        const url = getApiUrl(path);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: data ? JSON.stringify(data) : undefined
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'API request failed');
        }
        return response.json();
    }
};

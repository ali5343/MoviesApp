// api.jsx
console.log("BASE_URL is:", import.meta.env.VITE_API_URL);
const BASE_URL = import.meta.env.VITE_API_URL;


// A helper function to perform fetch requests
const request = async (url, method = 'GET', body = null, isFormData = false) => {
    const token = localStorage.getItem('accessToken');
    const headers = new Headers();

    if (!isFormData) {
        headers.append('Content-Type', 'application/json');
    }

    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    // 👇 Add this log
    console.log("Fetching from:", `${BASE_URL}${url}`);

    try {
        const response = await fetch(`${BASE_URL}${url}`, config);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'An unknown error occurred.');
        }
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};


// --- API Methods ---
const api = {
    // Admin Data
    getDashboardStats: () => request('/api/admin_data/dashboard_stats'),
    getRecentVideos: () => request('/api/admin_data/recent_videos'),
    getWatchedSeriesInfo: () => request('/api/admin_data/watched_series_info'),
    getRegionalAnalyticsSummary: () => request('/api/admin_data/regional_analytics_summary'),
    getTopPerformingVideos: () => request('/api/admin_data/top_performing_videos'),

    // Playlists
    getPlaylists: (region = '') => request(`/api/playlists?region=${region}`),
    createPlaylist: (formData) => request('/api/playlists/', 'POST', formData, true),
    deletePlaylist: (playlistId) => request(`/api/playlists/${playlistId}`, 'DELETE'),

    // Videos
    addVideo: (videoData) => request('/api/videos/', 'POST', videoData),
    deleteVideo: (videoId) => request(`/api/videos/${videoId}`, 'DELETE'),

    // Advertisements
    getAdvertisements: () => request('/api/advertisements/'),
    createAdvertisement: (formData) => request('/api/advertisements/', 'POST', formData, true),
    deleteAdvertisement: (adId) => request(`/api/advertisements/${adId}`, 'DELETE'),

    // Channel Groups
    getChannelGroups: () => request('/api/channel_groups/'),
    createChannelGroup: (groupData) => request('/api/channel_groups/', 'POST', groupData),
    updateChannelGroup: (groupId, groupData) => request(`/api/channel_groups/${groupId}`, 'PUT', groupData),
    deleteChannelGroup: (groupId) => request(`/api/channel_groups/${groupId}`, 'DELETE'),
};

export default api;

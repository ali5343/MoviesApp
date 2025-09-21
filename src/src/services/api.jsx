// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL;


// Generic request function
export const request = async (endpoint, method, body = null, isFormData = false) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('access_token');

  // auto-detect formdata
  const bodyIsFormData = isFormData || (typeof FormData !== 'undefined' && body instanceof FormData);

  const headers = {};
  if (!bodyIsFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };

  if (body) {
    config.body = bodyIsFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (err) {
        // ignore parse error
      }
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const contentType = response.headers.get("content-type");
    if (text && contentType && contentType.includes("application/json")) {
      return JSON.parse(text);
    }
    return {};
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};



// --- Playlists API ---
export const getPlaylists = async () => {
  return request(`/playlists`, "GET");
};

export const getPlaylist = async (playlistId) => {
  return request(`/playlists/${playlistId}`, "GET");
};

export const getPlaylistVideos = async (playlistId) => {
  return request(`/videos?playlist_id=${playlistId}`, "GET");
};

export const createVideo = async (videoData) => {
    return request(`/videos`, "POST", videoData);
};

export const updateVideo = async (id, videoData) => {
    return request(`/videos/${id}`, "PUT", videoData);
};

export const deleteVideo = async (id) => {
    return request(`/videos/${id}`, "DELETE");
};

export const getRecommendedPlaylists = async () => {
  return request(`/playlists/recommended`, "GET");
};

export const createPlaylist = async (formData) => {
  const data = await request(`/playlists`, "POST", formData, true);
  // If the response was empty (data is {}), return a default object
  return data || { id: null, name: formData.get('name') || '' };
};

export const updatePlaylist = async (id, payload) => {
  // If caller passed a FormData (from the admin UI), extract non-file fields and send JSON,
  // then caller should call uploadPlaylistThumbnail separately with the FormData/file.
  const isForm = (typeof FormData !== 'undefined' && payload instanceof FormData);
  if (isForm) {
    const jsonPayload = {};
    for (const [key, value] of payload.entries()) {
      if (key === 'thumbnail') continue;
      jsonPayload[key] = value;
    }
    return request(`/playlists/${id}`, "PUT", jsonPayload, false);
  }
  return request(`/playlists/${id}`, "PUT", payload, false);
};

export const uploadPlaylistThumbnail = async (playlistId, file) => {
  if (!file) throw new Error("No file provided");
  const fd = new FormData();
  fd.append('thumbnail', file);
  return request(`/playlists/${playlistId}/thumbnail`, "POST", fd, true);
};

export const deletePlaylist = async (id) => {
  return request(`/playlists/${id}`, "DELETE");
};

export const getPlaylistDetails = async (id) => {
  return request(`/playlists/${id}`, "GET");
};

// --- Admin API ---
export const getDashboardStats = async () => {
  return request("/admin/dashboard-stats", "GET");
};

export const getRecentVideos = async () => {
  return request("/admin/recent-videos", "GET");
};

export const getWatchedSeriesInfo = async () => {
  return request("/admin/watched-series", "GET");
};

export const uploadSubtitle = async (videoId, formData) => {
  return request(`/videos/${videoId}/subtitles`, "POST", formData, true);
};

export const getRegionalAnalytics = async () => {
  // backend route should return region analytics
  return request('/admin/analytics/regions', 'GET');
};

export const getAdvertisements = async () => {
  return request('/advertisements', 'GET');
};

export const createAdvertisement = async (formData) => {
  // formData expected (multipart) containing ad_file and data JSON
  return request('/advertisements', 'POST', formData, true);
};

export const deleteAdvertisement = async (id) => {
  return request(`/advertisements/${id}`, 'DELETE');
};

// ensure these are exported in default export (add if missing)
export default {
  request,
  getPlaylists,
  getPlaylist,
  getPlaylistVideos,
  getRecommendedPlaylists,
  getDashboardStats,
  getRecentVideos,
  getWatchedSeriesInfo,
  createPlaylist,
  updatePlaylist,
  uploadPlaylistThumbnail,
  deletePlaylist,
  getPlaylistDetails,
  createVideo,
  updateVideo,
  deleteVideo,
  uploadSubtitle,
  getRegionalAnalytics,
  getAdvertisements,
  createAdvertisement,
  deleteAdvertisement
};
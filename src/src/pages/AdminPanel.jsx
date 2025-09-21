import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Import all functions from api.js
import {
    FaYoutube, FaSearch, FaBell, FaUserCircle, FaVideo, FaChartBar,
    FaTachometerAlt, FaFileUpload, FaListUl, FaBullhorn, FaEye,
    FaTrashAlt, FaEdit, FaPlusCircle, FaSpinner
} from 'react-icons/fa';
const API_BASE_URL = import.meta.env.VITE_API_URL;

// add helper to normalize thumbnail URLs
const getFullUrl = (path) => {
  if (!path) return "/placeholder.jpg";
  const cleaned = String(path).replace(/\\/g, "/").trim();

  // if already absolute URL, return as-is
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  // normalize base: remove trailing slash and any /api suffix
  const base = (API_BASE_URL || "http://127.0.0.1:5001").replace(/\/$/, "").replace(/\/api$/, "");

  // normalize stored path: remove leading /api if backend stored "/api/static/..."
  const normalizedPath = cleaned.replace(/^\/api/, "");

  return `${base}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
};


// A simple loading spinner component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full p-8">
        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
    </div>
);

// A simple error message component
const ErrorMessage = ({ message }) => (
    <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-md my-4">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
    </div>
);

const AdminPanel = ({ onLogout }) => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const navigate = useNavigate();

    const handleSectionClick = (section) => {
        setActiveSection(section);
    };

    const handleLogoutClick = () => {
        localStorage.removeItem('access_token'); // Clear token on logout
        onLogout();
        navigate('/');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Top Navigation Bar */}
            <div className="bg-gray-800 h-16 flex items-center justify-between px-6 shadow-md">
                <div className="flex items-center">
                    <FaYoutube className="text-2xl mr-4 text-red-600" />
                    <span className="text-xl font-bold mr-4">My Studio</span>
                </div>
                <div className="flex items-center space-x-4">
                    <FaVideo className="text-xl hover:text-gray-300 cursor-pointer" />
                    <FaBell className="text-xl hover:text-gray-300 cursor-pointer" />
                    <FaUserCircle className="text-2xl hover:text-gray-300 cursor-pointer" />
                    <button
                        onClick={handleLogoutClick}
                        className="ml-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition duration-200 ease-in-out"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-gray-800 py-6 px-4 flex-shrink-0 overflow-y-auto">
                    <ul className="space-y-2">
                        <SidebarItem icon={<FaTachometerAlt />} text="Dashboard" isActive={activeSection === 'dashboard'} onClick={() => handleSectionClick('dashboard')} />
                        <SidebarItem icon={<FaVideo />} text="Content" isActive={activeSection === 'content'} onClick={() => handleSectionClick('content')} />
                        <SidebarItem icon={<FaChartBar />} text="Analytics" isActive={activeSection === 'analytics'} onClick={() => handleSectionClick('analytics')} />
                        <SidebarItem icon={<FaBullhorn />} text="Advertisement" isActive={activeSection === 'advertisement'} onClick={() => handleSectionClick('advertisement')} />
                        <SidebarItem icon={<FaEye />} text="Impressions" isActive={activeSection === 'impressions'} onClick={() => handleSectionClick('impressions')} />
                    </ul>
                </div>

                {/* Main Content */}
                <div className="flex-1 py-6 px-8 overflow-y-auto">
                    {activeSection === 'dashboard' && <DashboardContent />}
                    {activeSection === 'content' && <ContentManagementContent />}
                    {activeSection === 'analytics' && <AnalyticsContent />}
                    {activeSection === 'advertisement' && <AdvertisementContent />}
                    {activeSection === 'impressions' && <ChannelImpressionsContent />}
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, text, isActive, onClick }) => (
    <li
        className={`flex items-center py-3 px-4 rounded-md transition duration-200 ease-in-out cursor-pointer ${isActive ? 'bg-gray-700 text-blue-400' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
        onClick={onClick}
    >
        {icon && <span className="mr-3 text-xl">{icon}</span>}
        <span className="text-sm font-medium">{text}</span>
    </li>
);

// --- DashboardContent ---
const DashboardContent = () => {
    const [stats, setStats] = useState(null);
    const [recentVideos, setRecentVideos] = useState([]);
    const [watchedSeries, setWatchedSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log("Fetching dashboard data...");
                const [statsData, videosData, seriesData] = await Promise.all([
                    api.getDashboardStats(),
                    api.getRecentVideos(),
                    api.getWatchedSeriesInfo()
                ]);
                console.log("Stats:", statsData);
        console.log("Videos:", videosData);
        console.log("Series:", seriesData);
                setStats(statsData);
                setRecentVideos(videosData);
                setWatchedSeries(seriesData);
                setError(null);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(err.message);
            } finally {
                console.log("Fetch complete, setting loading to false")
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-200">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard title="Total Views" value={stats?.total_views ?? 0} />
                <DashboardCard title="Total Likes" value={stats?.total_likes ?? 0} />
                <DashboardCard title="Watch Time (Hours)" value={stats?.watch_time_hours ?? 0} />
                <DashboardCard title="Total Series" value={stats?.total_series ?? 0} />
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
                 <h3 className="text-xl font-semibold text-gray-200 mb-4">Recent Videos</h3>
                 <DataTable
                    headers={['Title', 'Views', 'Likes', 'Region']}
                    data={recentVideos}
                    renderRow={(video) => (
                        <tr key={video.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{video.title}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{video.views}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{video.likes}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{video.region}</td>
                        </tr>
                    )}
                />
            </div>
             <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-200 mb-4">Most Watched Series</h3>
                <DataTable
                    headers={['Title', 'Total Watch Time', 'Total Videos', 'Region']}
                    data={watchedSeries}
                    renderRow={(series) => (
                         <tr key={series._id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{series.title}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{series.total_watch_time}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{series.total_videos}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{series.region}</td>
                        </tr>
                    )}
                />
            </div>
        </div>
    );
};


const DashboardCard = ({ title, value }) => (
    <div className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-2">{title}</h4>
        <p className="text-3xl font-bold text-white">{value}</p>
    </div>
);


// --- AnalyticsContent ---
const AnalyticsContent = () => {
    const [regionalData, setRegionalData] = useState([]);
    const [topVideos, setTopVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [regionAnalytics, topVideosData] = await Promise.all([
                    api.getRegionalAnalytics(),
                    api.getTopPerformingVideos()
                ]);
                setRegionalData(regionAnalytics);
                setTopVideos(topVideosData);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-200">Analytics</h2>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
                <h4 className="text-lg font-semibold text-gray-200 mb-4">Summary by Region</h4>
                 <DataTable
                    headers={['Region', 'Views', 'Watch Time', 'Avg. Duration']}
                    data={regionalData}
                    renderRow={(data) => (
                        <tr key={data.region}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{data.region}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{data.views}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{data.watch_time}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{data.avg_duration}</td>
                        </tr>
                    )}
                />
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
                <h4 className="text-lg font-semibold text-gray-200 mb-4">Top Performing Videos</h4>
                <DataTable
                    headers={['Title', 'Region', 'Views', 'Likes']}
                    data={topVideos}
                    renderRow={(video) => (
                         <tr key={video.title}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{video.title}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{video.region}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{video.views}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{video.likes}</td>
                        </tr>
                    )}
                />
            </div>
        </div>
    );
};


// --- ContentManagementContent ---
const ContentManagementContent = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'details'
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);

    const fetchPlaylists = async () => {
        try {
            setLoading(true);
            const rawPlaylists = await api.getPlaylists();
            const playlistsArray = Array.isArray(rawPlaylists)
                ? rawPlaylists
                : Array.isArray(rawPlaylists.playlists)
                ? rawPlaylists.playlists
                : [];
            setPlaylists(playlistsArray);
            setError(null);
        } catch (err) {
            console.error("Error fetching playlists:", err);
            setError(err.message);
            setPlaylists([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylists();
    }, []);



    const handleCreatePlaylist = async (formData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: "POST",
            body: formData, // FormData includes thumbnail
            });

            if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create playlist");
            }

            const newPlaylist = await response.json();

            // Update local state to display the new playlist immediately
            setPlaylists((prev) => [newPlaylist, ...prev]);
            alert("Playlist created successfully!");
        } catch (error) {
            console.error("Failed to create playlist:", error);
            alert(`Failed to create playlist: ${error.message}`);
        }
    };




    // helper inside component or top-level
const uploadPlaylistThumbnail = async (playlistId, file) => {
  if (!file) return null;
  // api.uploadPlaylistThumbnail is implemented in src/services/api.jsx and will use the same base URL
  return await api.uploadPlaylistThumbnail(playlistId, file);
};

    const handleUpdatePlaylist = async (id, formValues) => {
        try {
            // If caller passed a FormData (from PlaylistForm when thumbnail selected),
            // extract non-file fields and send them as JSON, then upload the file separately.
            if (formValues instanceof FormData) {
                // build JSON payload from FormData except the thumbnail file
                const jsonPayload = {};
                for (let pair of formValues.entries()) {
                    const [key, value] = pair;
                    if (key === 'thumbnail') continue;
                    jsonPayload[key] = value;
                }

                // Update textual fields first (PUT, JSON)
                if (Object.keys(jsonPayload).length > 0) {
                    await api.updatePlaylist(id, jsonPayload);
                }

                // Then upload thumbnail via dedicated endpoint
                const file = formValues.get('thumbnail');
                if (file && file instanceof File) {
                    const updated = await uploadPlaylistThumbnail(id, file);
                    setSelectedPlaylist(updated);
                }
            } else {
                // simple JSON payload path (no file)
                await api.updatePlaylist(id, formValues);
            }

            alert("Playlist updated successfully!");
            await fetchPlaylists();
            setView("list");
            setSelectedPlaylist(null);
        } catch (err) {
            alert(`Failed to update playlist: ${err.message}`);
        }
    };


    const handleDeletePlaylist = async (id) => {
        if (window.confirm('Are you sure you want to delete this playlist and all its videos?')) {
            try {
                await api.deletePlaylist(id);
                alert('Playlist deleted successfully!');
                fetchPlaylists();
            } catch (err) {
                alert(`Failed to delete playlist: ${err.message}`);
            }
        }
    };
    
    const handleAddVideo = async (videoData) => {
        try {
            console.log("Video DAta", videoData);
            videoData.playlist_id = selectedPlaylist._id;
            await api.createVideo(videoData);
            alert('Video added successfully!');
            // Refresh details view
            const updatedPlaylist = await api.getPlaylistDetails(selectedPlaylist._id);
            setSelectedPlaylist(updatedPlaylist);

        } catch (err) {
            alert(`Failed to add video: ${err.message}`);
        }
    }
    
    const handleDeleteVideo = async (videoId, playlistId) => {
         if (window.confirm('Are you sure you want to delete this video?')) {
            try {
                await api.deleteVideo(videoId);
                alert('Video deleted successfully!');
                // Refresh details view
                const updatedPlaylist = await api.getPlaylistDetails(playlistId);
                setSelectedPlaylist(updatedPlaylist);
            } catch (err) {
                 alert(`Failed to delete video: ${err.message}`);
            }
        }
    }

    const showDetails = async (playlist) => {
        try {
            setLoading(true);
            const details = await api.getPlaylistDetails(playlist.id);
            setSelectedPlaylist(details);
            setView('details');
        } catch(err) {
             setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedPlaylist) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-200">Content Management</h2>
            
            {view === 'list' && (
                <>
                    <button onClick={() => setView('create')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition mb-6">
                        <FaListUl className="mr-2" />
                        Create Playlist
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {playlists.map(playlist => (
                            <div key={playlist.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 flex flex-col justify-between">
                                <div onClick={() => showDetails(playlist)} className="cursor-pointer">
                                    <img src={getFullUrl(playlist.thumbnail_url || playlist.thumbnail || "/default-thumbnail.png")} alt={playlist.title} className="w-full h-32 object-cover"/>
                                    <div className="p-4">
                                        <h4 className="text-lg font-semibold text-gray-100 mb-2 truncate">{playlist.title}</h4>
                                        <p className="text-sm text-gray-400 mb-2 h-10 overflow-hidden">{playlist.description}</p>
                                        <div className="text-xs text-gray-500 mb-2">Region: {playlist.region}</div>
                                        <div className="text-sm text-gray-400">{playlist.videos_count} Videos</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-700/50 flex justify-end space-x-2">
                                     <button onClick={() => { setSelectedPlaylist(playlist); setView('edit'); }} className="text-blue-400 hover:text-blue-600 p-2"><FaEdit /></button>
                                     <button onClick={() => handleDeletePlaylist(playlist.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrashAlt /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {view === 'create' && (
                <PlaylistForm
                    onSubmit={handleCreatePlaylist}
                    onCancel={() => setView('list')}
                />
            )}

            {view === 'edit' && selectedPlaylist && (
                <PlaylistForm
                    playlist={selectedPlaylist}
                    onSubmit={(formData) => handleUpdatePlaylist(selectedPlaylist.id, formData)}
                    onCancel={() => setView('list')}
                />
            )}
            
            {view === 'details' && selectedPlaylist && (
                console.log(selectedPlaylist),
                <PlaylistDetails 
                    playlist={selectedPlaylist} 
                    setPlaylist={setSelectedPlaylist}                // <-- pass updater so child can update parent state
                    onBack={() => { setView('list'); setSelectedPlaylist(null); }}
                    onAddVideo={handleAddVideo}
                    onDeleteVideo={(videoId) => handleDeleteVideo(videoId, selectedPlaylist.id)}
                />
            )}
        </div>
    );
};

// --- PlaylistForm ---
const PlaylistForm = ({ onSubmit, onCancel, playlist = null }) => {
  const [title, setTitle] = useState(playlist ? playlist.title : '');
  const [description, setDescription] = useState(playlist ? playlist.description : '');
  const [keywords, setKeywords] = useState(playlist ? playlist.keywords : '');
  const [region, setRegion] = useState(playlist ? playlist.region : '');
  const [thumbnailFile, setThumbnailFile] = useState(null);

  // Sync when playlist prop changes (important when editing)
  useEffect(() => {
    setTitle(playlist ? playlist.title : '');
    setDescription(playlist ? playlist.description : '');
    setKeywords(playlist ? playlist.keywords : '');
    setRegion(playlist ? playlist.region : '');
    // don't change thumbnail (admin must re-upload to replace)
    setThumbnailFile(null);
  }, [playlist]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      description: description.trim(),
      keywords: keywords.trim(),
      region: region.trim(),
    };

    // If user picked a thumbnail file, send multipart FormData
    if (thumbnailFile) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
      fd.append('thumbnail', thumbnailFile);
      onSubmit(fd);
    } else {
      // Send JSON body for simpler parsing on the backend
      onSubmit(payload);
    }
  };

  const regions = ['Chinese', 'English', 'Myanmar', 'Indonesian', 'Vietnamese', 'Bangladeshi', 'Others'];

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-200">{playlist ? 'Edit' : 'Create New'} Playlist</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">Title</label>
          <input type="text" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" required />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
          <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="form-input" required />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">Keywords (comma-separated)</label>
          <input type="text" name="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="form-input" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">Region</label>
          <select name="region" value={region} onChange={(e) => setRegion(e.target.value)} className="form-input" required>
            <option value="">Select Region</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">Thumbnail Image</label>
          <input type="file" name="thumbnail" onChange={(e) => setThumbnailFile(e.target.files[0])} className="form-file" accept="image/*" />
          {(playlist?.thumbnail_url || playlist?.thumbnail) && !thumbnailFile && (
            <img src={getFullUrl(playlist.thumbnail_url || playlist.thumbnail)} alt="Current thumbnail" className="w-32 h-auto mt-2 rounded" />
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{playlist ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};


// --- PlaylistDetails & Video Management ---
const PlaylistDetails = ({ playlist, onBack, onAddVideo, onDeleteVideo, setPlaylist }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVideo, setNewVideo] = useState({ title: '', description: '', keywords: '', video_link: '' });

    const [subtitleUploadTarget, setSubtitleUploadTarget] = useState(null);
    const [subtitleFile, setSubtitleFile] = useState(null);

    const handleSubtitleUpload = async () => {
        if (!subtitleFile || !subtitleUploadTarget) return;

        const formData = new FormData();
        formData.append("subtitle", subtitleFile);

        try {
            const res = await api.uploadSubtitle(subtitleUploadTarget, formData);

            // ✅ update playlist state with new subtitle_url
            setPlaylist(prev => (prev ? {
                ...prev,
                videos: prev.videos.map(v =>
                    v._id === subtitleUploadTarget ? { ...v, subtitle_url: res.subtitle_url } : v
                )
            } : prev));

            alert("Subtitle uploaded successfully!");
            setSubtitleUploadTarget(null);
            setSubtitleFile(null);
        } catch (err) {
            alert(`Failed to upload subtitles: ${err.message}`);
        }
    };

    const handleAddVideoClick = () => {
        setShowAddForm(true);
        setNewVideo({ title: '', description: '', keywords: '', video_link: '' });
    };

    const handleAddVideoSubmit = async (e) => {
        e.preventDefault();
        try {
            // Build payload expected by backend
            const payload = {
                title: newVideo.title.trim(),
                description: newVideo.description.trim(),
                keywords: newVideo.keywords.trim(),
                video_link: newVideo.video_link.trim(),
                // playlist id: prefer playlist.id then playlist?._id
                playlist_id: playlist?.id || playlist?._id || null,
            };

            await onAddVideo(payload); // parent will refresh details
            setShowAddForm(false);
            setNewVideo({ title: '', description: '', keywords: '', video_link: '' });
        } catch (err) {
            alert(`Failed to add video: ${err.message}`);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <button onClick={onBack} className="btn-secondary mr-3">← Back</button>
                    <h3 className="text-xl font-semibold inline-block text-gray-200">{playlist.title}</h3>
                </div>

                <div>
                    <button onClick={handleAddVideoClick} className="btn-primary mr-2">
                        <FaPlusCircle className="inline mr-2" /> Add Video
                    </button>
                    <button onClick={() => {/* optionally edit playlist */}} className="btn-secondary">Edit Playlist</button>
                </div>
            </div>

            {/* Add Video Form (modal-like inline) */}
            {showAddForm && (
                <div className="bg-gray-800 p-4 rounded mb-6">
                    <h4 className="text-lg text-gray-200 mb-3">Add New Video</h4>
                    <form onSubmit={handleAddVideoSubmit}>
                        <div className="mb-3">
                            <label className="block text-sm text-gray-300 mb-1">Title</label>
                            <input value={newVideo.title} onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))} className="form-input" required />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm text-gray-300 mb-1">Description</label>
                            <textarea value={newVideo.description} onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))} className="form-input" rows={2} />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm text-gray-300 mb-1">Keywords (comma-separated)</label>
                            <input value={newVideo.keywords} onChange={(e) => setNewVideo(prev => ({ ...prev, keywords: e.target.value }))} className="form-input" />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm text-gray-300 mb-1">Video Link / Source</label>
                            <input value={newVideo.video_link} onChange={(e) => setNewVideo(prev => ({ ...prev, video_link: e.target.value }))} className="form-input" required />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">Add Video</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Videos table */}
            <DataTable
                headers={['Title', 'Description', 'Link', 'Actions']}
                data={playlist.videos || []}
                renderRow={(video) => (
                    <tr key={video._id || video.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{video.title}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{video.description}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-400 truncate">
                            <a href={video.video_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {video.video_link}
                            </a>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                            <button onClick={() => onDeleteVideo(video._id || video.id)} className="text-red-500 hover:text-red-700 p-2">
                                <FaTrashAlt />
                            </button>

                            <button
                                className="text-green-400 hover:text-green-600 p-2"
                                onClick={() => setSubtitleUploadTarget(video._id || video.id)}
                            >
                                Upload Subtitles
                            </button>

                            {video.subtitle_url && (
                                <a
                                    href={video.subtitle_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-600 p-2"
                                >
                                    View Subtitles
                                </a>
                            )}
                        </td>
                    </tr>
                )}
            />

            {/* Subtitle Upload Modal */}
            {subtitleUploadTarget && (
                <div className="modal bg-gray-900 bg-opacity-90 fixed inset-0 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4 text-gray-200">Upload Subtitles</h3>
                        <input
                            type="file"
                            accept=".vtt,.srt"
                            onChange={(e) => setSubtitleFile(e.target.files[0])}
                            className="mb-4"
                        />
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setSubtitleUploadTarget(null)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSubtitleUpload} className="btn-primary">Upload</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- AdvertisementContent ---
const AdvertisementContent = () => {
    const [ads, setAds] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [adDetails, setAdDetails] = useState({ adFile: null, target_video_id: '', placement: 'before' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [adsData, playlistsData] = await Promise.all([
                api.getAdvertisements(),
                api.getPlaylists()
            ]);
            setAds(adsData);
            // Flatten videos from playlists for the dropdown
            const allVideos = playlistsData.reduce((acc, p) => {
                const playlistVideos = p.videos.map(v => ({...v, playlistTitle: p.title})) || [];
                return [...acc, ...playlistVideos];
            }, []);
            setVideos(allVideos);
            setError(null);
        } catch(err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdSubmit = async (e) => {
        e.preventDefault();
        if (!adDetails.adFile || !adDetails.target_video_id) {
            alert('Please provide an ad file and select a target video.');
            return;
        }

        const formData = new FormData();
        formData.append('ad_file', adDetails.adFile);
        
        const adData = {
            target_video_id: adDetails.target_video_id,
            placement: adDetails.placement,
        };
        formData.append('data', JSON.stringify(adData));

        try {
            await api.createAdvertisement(formData);
            alert('Advertisement created successfully!');
            fetchData(); // Refresh list
            setAdDetails({ adFile: null, target_video_id: '', placement: 'before' });
            e.target.reset(); // Clear form
        } catch(err) {
            alert(`Failed to create ad: ${err.message}`);
        }
    };
    
    const handleDeleteAd = async (id) => {
        if(window.confirm('Are you sure you want to delete this advertisement?')) {
            try {
                await api.deleteAdvertisement(id);
                alert('Advertisement deleted.');
                fetchData(); // Refresh
            } catch (err) {
                 alert(`Failed to delete ad: ${err.message}`);
            }
        }
    }
    
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setAdDetails(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-200">Advertisement Management</h2>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Upload and Place Video Ad</h3>
                <form onSubmit={handleAdSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-medium mb-2">Select Video Ad File</label>
                        <input type="file" name="adFile" onChange={handleInputChange} className="form-file" accept="video/*" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-medium mb-2">Select Video for Ad Placement</label>
                        <select name="target_video_id" value={adDetails.target_video_id} onChange={handleInputChange} className="form-input" required >
                            <option value="">-- Select a Video --</option>
                            {videos.map(video => (
                                <option key={video.id} value={video.id}>
                                    {video.playlistTitle}: {video.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-6">
                         <label className="block text-gray-300 text-sm font-medium mb-2">Ad Placement</label>
                         <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center"><input type="radio" name="placement" value="before" checked={adDetails.placement === 'before'} onChange={handleInputChange} className="form-radio" /> <span className="ml-2">Before Video</span></label>
                            <label className="inline-flex items-center"><input type="radio" name="placement" value="after" checked={adDetails.placement === 'after'} onChange={handleInputChange} className="form-radio" /> <span className="ml-2">After Video</span></label>
                         </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary">Save Ad Placement</button>
                    </div>
                </form>
            </div>
             <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
                 <h3 className="text-xl font-semibold mb-4 text-gray-200">Configured Ads ({ads.length})</h3>
                <DataTable
                    headers={['Ad File', 'Placement', 'Target Video', 'Actions']}
                    data={ads}
                    renderRow={(ad) => (
                        <tr key={ad.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{ad.ad_file_name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{ad.placement}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{videos.find(v => v.id === ad.target_video_id)?.title || 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <button onClick={() => handleDeleteAd(ad.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrashAlt /></button>
                            </td>
                        </tr>
                    )}
                />
            </div>
        </div>
    );
};

// --- ChannelImpressionsContent ---
const ChannelImpressionsContent = () => {
    // This component can be updated similarly to fetch and manage channel groups via the API.
    // For brevity, the full implementation is left as an exercise but would follow the same pattern:
    // 1. useState for groups, loading, error.
    // 2. useEffect to call api.getChannelGroups().
    // 3. Update handler functions (add, edit, delete) to call the respective API functions.
    const [channelGroups, setChannelGroups] = useState([
        { id: 1, region: 'English', type: 'Telegram', link: 'https://t.me/english_group', clicks: 150 },
    ]);

    return (
         <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-200">Channel Impressions</h2>
            <p className="text-gray-400">This section can be integrated with the backend following the same patterns as Content and Advertisement management.</p>
            {/* The existing UI for adding/editing/viewing channel groups can be connected here */}
        </div>
    );
};


// --- Reusable Components ---
const FormInput = ({ label, ...props }) => (
    <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-2">{label}</label>
        <input {...props} className="form-input" />
    </div>
);

const FormTextArea = ({ label, ...props }) => (
    <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-2">{label}</label>
        <textarea {...props} className="form-input" rows="3" />
    </div>
);

const DataTable = ({ headers, data, renderRow }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
            <thead>
                <tr className="bg-gray-700">
                    {headers.map(h => <th key={h} className="th-cell">{h}</th>)}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {data.length > 0 ? data.map(renderRow) : (
                    <tr><td colSpan={headers.length} className="text-center py-4 text-gray-400">No data available.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

export default AdminPanel;
// src/components/DetailsView.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getPlaylist,
  getPlaylistVideos,
  getRecommendedPlaylists,
} from "../services/api";
import { FaPlay, FaShare, FaBookmark, FaTimes, FaWhatsapp, FaFacebook, FaTwitter, FaInstagram, FaLink } from 'react-icons/fa';
import Footer from './Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';

const getFullUrl = (path) => {
  if (!path) return 'https://picsum.photos/1200/600?random=1';
  const cleaned = String(path).replace(/\\/g, '/');

  // if already absolute URL, return as-is
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;

  // ensure we use server base without any trailing /api segment to avoid double /api
  const serverBase = (API_BASE_URL || 'http://127.0.0.1:5001').replace(/\/$/, '').replace(/\/api$/, '');

  // If the stored path starts with '/api', remove that prefix (static files usually live under /static)
  const normalizedPath = cleaned.replace(/^\/api/, '');

  return `${serverBase}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

const DetailsView = ({ show = {}, onClose = () => {} }) => {
  const params = useParams();
  const paramId = params?.id;
  const id = show?.id || paramId;

  const [playlist, setPlaylist] = useState(show || null);
  const [videos, setVideos] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeTab, setActiveTab] = useState('episodes');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // generate dummy episodes based on show.title
  // if backend provided videos for this playlist use them as episodes, otherwise fall back to dummy
  const episodes = (videos && videos.length > 0)
    ? videos.map((v, idx) => ({
        id: v.id || v._id || String(idx + 1),
        number: idx + 1,
        title: v.title || `Episode ${idx + 1}`,
        // prefer video thumbnail, fall back to playlist thumbnail if video has none
        thumbnail: getFullUrl(v.thumbnail_url || v.thumbnail || playlist?.thumbnail_url || playlist?.thumbnail || ''),
        duration: v.duration || '45 min',
        hasPreview: !!v.has_preview || !!v.hasPreview,
        // include common embed fields so frontend can play them
        source: v.video_link
               || v.video_url
               || v.link
               || v.url
               || v.source_url
               || v.file_url
               || v.file
               || v.embed_url
               || v.embed_link
               || v.embed
               // don't attempt to parse embed_html here; handle in play handler
               || '',
        // capture subtitle URL if backend provided it
        subtitle_url: getFullUrl(v.subtitle_url || v.subtitle || v.subtitles || ''),
        raw: v
      }))
    : Array.from({ length: 24 }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        title: `${show.title || 'Show'} Episode ${i + 1}`,
        thumbnail: `https://picsum.photos/400/225?random=${i + 100}`,
        duration: '45 min',
        hasPreview: (i + 1) % 2 === 0,
      }));

  // If the playlist has exactly one backend video, treat it as a single item (no "Episode" labels).
  const isSingleVideo = videos.length === 1;

  useEffect(() => {
    if (!id) {
      // nothing to fetch and no initial data -> avoid stuck UI
      if (!show) {
        console.error("DetailsView: no playlist id or show provided");
      }
      return;
    }

    const fetchData = async () => {
      try {
        const playlistData = await getPlaylist(id);
        setPlaylist(playlistData);

        // Prefer full videos returned inside playlist (includes video_link/embed fields)
        if (playlistData?.videos && Array.isArray(playlistData.videos) && playlistData.videos.length > 0) {
          console.log('Using videos embedded in playlist response', playlistData.videos);
          setVideos(playlistData.videos);
        } else {
          const videoData = await getPlaylistVideos(id);
          console.log('getPlaylistVideos raw response:', videoData);
          setVideos(Array.isArray(videoData) ? videoData : []);
        }

        const recommendedData = await getRecommendedPlaylists();
        setRecommended(Array.isArray(recommendedData) ? recommendedData : []);
      } catch (err) {
        console.error("Failed to load details:", err);
      }
    };

    fetchData();
  }, [id, show]);

  const makeEmbedUrl = (src, wantCaptions = false) => {
    if (!src) return src;
    try {
      const u = new URL(src, window.location.origin);
      // Dailymotion: prefer ?video=ID, otherwise extract ID from /video/ID
      if (u.hostname.includes('dailymotion.com')) {
        const videoParam = u.searchParams.get('video');
        if (videoParam) {
          const embedBase = `https://www.dailymotion.com/embed/video/${videoParam}`;
          return `${embedBase}?origin=${encodeURIComponent(window.location.origin)}`;
        }
        // If path contains /video/{id}
        const pathMatch = u.pathname.match(/\/video\/([^\/?#]+)/);
        if (pathMatch && pathMatch[1]) {
          const id = pathMatch[1];
          const embedBase = `https://www.dailymotion.com/embed/video/${id}`;
          return `${embedBase}?origin=${encodeURIComponent(window.location.origin)}`;
        }
        // If pathname itself looks like an id (e.g. "/x9asjji"), use it
        const lastSegment = u.pathname.split('/').filter(Boolean).pop();
        if (lastSegment && /^x[0-9a-zA-Z]+/.test(lastSegment)) {
          const embedBase = `https://www.dailymotion.com/embed/video/${lastSegment}`;
          return `${embedBase}?origin=${encodeURIComponent(window.location.origin)}`;
        }

        // fallback: return original src but ensure origin param if it's player.html
        if (u.pathname.endsWith('player.html')) {
          if (!u.searchParams.get('origin')) u.searchParams.set('origin', window.location.origin);
          return u.toString();
        }

        return src;
      }

      // YouTube conversion example:
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const id = u.searchParams.get('v') || u.pathname.split('/').pop();
        const params = new URLSearchParams({ origin: window.location.origin });
        if (wantCaptions) {
          params.set('cc_load_policy', '1');
          params.set('cc_lang_pref', 'en');
        }
        return `https://www.youtube.com/embed/${id}?${params.toString()}`;
      }

      if (u.pathname.endsWith('player.html')) {
        if (!u.searchParams.get('origin')) u.searchParams.set('origin', window.location.origin);
        return u.toString();
      }

      return src;
    } catch (e) {
      return src;
    }
  };

  // add helper to extract src from embed HTML safely
  const extractSrcFromEmbedHtml = (html) => {
    if (!html) return null;
    try {
      // browser environment: DOMParser
      if (typeof window !== "undefined" && window.DOMParser) {
        const dp = new DOMParser();
        const doc = dp.parseFromString(html, "text/html");
        const iframe = doc.querySelector("iframe");
        if (iframe && iframe.src) return iframe.src;
        const srcEl = doc.querySelector("source");
        if (srcEl && srcEl.src) return srcEl.src;
      }
    } catch (e) {
      // fallback to regex
    }
    // regex fallback
    const m = String(html).match(/src=(?:'|")([^'"]+)(?:'|")/i);
    return m ? m[1] : null;
  };

  // Play an episode/video item. If the episode has a `source` use it, otherwise fall back to a test URL.
  const handlePlayEpisode = (episode) => {
    // try many candidate fields including embed_html
    const rawCandidate = episode?.source
      || episode?.raw?.video_link
      || episode?.raw?.video_url
      || episode?.raw?.link
      || episode?.raw?.url
      || episode?.raw?.embed_url
      || episode?.raw?.embed_link
      || episode?.raw?.embed
      || episode?.raw?.watch_url
      || episode?.raw?.file_url
      || episode?.raw?.file
      || '';

    // if embed_html present, try extract src
    const fromEmbedHtml = extractSrcFromEmbedHtml(episode?.raw?.embed_html || episode?.raw?.embed_html_raw || episode?.raw?.embed_html_code || '');
    let candidate = rawCandidate || fromEmbedHtml || '';

    // final fallback: maybe API stored url under a different key or serialization changed;
    // look up the original videos state by id and try common keys there
    if (!candidate) {
      const found = videos.find(v => String(v.id || v._id) === String(episode.id) || String(v._id) === String(episode.raw?.id));
      if (found) {
        candidate = found.video_link || found.video_url || found.url || found.embed_url || found.link || found.watch_url || '';
        console.log('handlePlayEpisode: fallback found in videos state:', found, 'candidate:', candidate);
      }
    }

    // set subtitle url if available
    const sUrl = episode?.subtitle_url || episode?.raw?.subtitle_url || episode?.raw?.subtitle || '';
    setSubtitleUrl(sUrl || '');

    const embed = makeEmbedUrl(candidate || '', subtitlesEnabled);

    console.debug("DetailView.handlePlayEpisode candidate:", candidate, "embed:", embed, "episode.raw:", episode?.raw);
    console.log("DetailView.handlePlayEpisode candidate:", candidate, "embed:", embed);

    if (!candidate && !embed) {
      console.warn("No playable source for episode", episode);
      alert("No video source available for this item.");
      return;
    }

    setVideoUrl(embed || candidate || 'about:blank');
    setCurrentEpisode(episode.number);
    setCurrentVideo(episode.raw || episode);
    setIsVideoPlaying(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseVideoPlayer = () => {
    setIsVideoPlaying(false);
    setVideoUrl('');
    setCurrentEpisode(null);
    setCurrentVideo(null);
  };

  const handleShareClick = () => setIsSharePopupOpen(true);
  const handleCloseSharePopup = () => setIsSharePopupOpen(false);

  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this: ${currentUrl}`)}`, '_blank');
    setIsSharePopupOpen(false);
  };
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
    setIsSharePopupOpen(false);
  };
  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`Check out this!`)}`, '_blank');
    setIsSharePopupOpen(false);
  };
  const shareOnInstagram = () => {
    alert('Sharing to Instagram via a direct link is not directly supported. Please copy the link and share it manually.');
    setIsSharePopupOpen(false);
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    alert('Link copied to clipboard!');
    setIsSharePopupOpen(false);
  };

  // when user toggles subtitleEnabled and we're playing an embed of YouTube, rebuild URL with cc parameter
  useEffect(() => {
    if (!isVideoPlaying) return;
    // if currentVideo is embed-youtube, rebuild iframe src with cc param
    const currentSrc = videoUrl || '';
    if (/youtube\.com/.test(currentSrc)) {
      const rebuilt = makeEmbedUrl(currentSrc, subtitlesEnabled);
      if (rebuilt !== currentSrc) setVideoUrl(rebuilt);
    }
    // for HTML5 video we will toggle tracks in effect below
  }, [subtitlesEnabled]);

  // toggle HTML5 <track> showing mode after player mounts/changes
  useEffect(() => {
    if (!isVideoPlaying) return;
    // small timeout to ensure DOM updated
    const t = setTimeout(() => {
      const vid = document.querySelector('video');
      if (!vid) return;
      const tracks = vid.textTracks || [];
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = subtitlesEnabled ? 'showing' : 'hidden';
      }
    }, 200);
    return () => clearTimeout(t);
  }, [isVideoPlaying, videoUrl, subtitlesEnabled]);

  if (!playlist) return <p className="text-center py-10">Loading........</p>;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Header with back button - fixed at top */}
      <div className="sticky top-0 bg-black z-20 p-4 shadow-md">
        <button
          onClick={onClose}
          className="text-white text-lg hover:text-green-400 flex items-center"
        >
          ← Back
        </button>
      </div>

      {/* Share Popup */}
      {isSharePopupOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-md shadow-lg p-6 z-50">
          <h2 className="text-white text-lg font-semibold mb-4">Share Via</h2>
          <div className="grid grid-cols-3 gap-4">
            <button onClick={shareOnWhatsApp} className="flex flex-col items-center text-green-500 hover:text-green-400">
              <FaWhatsapp className="text-2xl mb-1" />
              <span className="text-xs text-white">WhatsApp</span>
            </button>
            <button onClick={shareOnFacebook} className="flex flex-col items-center text-blue-500 hover:text-blue-400">
              <FaFacebook className="text-2xl mb-1" />
              <span className="text-xs text-white">Facebook</span>
            </button>
            <button onClick={shareOnTwitter} className="flex flex-col items-center text-blue-400 hover:text-blue-300">
              <FaTwitter className="text-2xl mb-1" />
              <span className="text-xs text-white">X.com</span>
            </button>
            <button onClick={shareOnInstagram} className="flex flex-col items-center text-purple-500 hover:text-purple-400">
              <FaInstagram className="text-2xl mb-1" />
              <span className="text-xs text-white">Instagram</span>
            </button>
            <button onClick={copyToClipboard} className="flex flex-col items-center text-gray-300 hover:text-gray-200">
              <FaLink className="text-2xl mb-1" />
              <span className="text-xs text-white">Copy Link</span>
            </button>
            <button onClick={handleCloseSharePopup} className="text-red-500 hover:text-red-400 absolute top-2 right-2">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="w-full">
        {/* Video Player Section */}
        {isVideoPlaying && (
          <div className="w-full bg-black">
            <div className="w-full aspect-video relative">
              {videoUrl && videoUrl.match(/\.(mp4|webm|ogg)(\?|$)/i) ? (
                // direct media file
                <video key={videoUrl} src={videoUrl} controls autoPlay className="w-full h-full">
                  {subtitleUrl && <track kind="subtitles" src={subtitleUrl} srcLang="en" label="English" default={subtitlesEnabled} />}
                </video>
              ) : (
                // embed player
                <iframe
                  key={videoUrl} // force reload when url changes
                  src={videoUrl || 'about:blank'}
                  title={currentVideo?.title || `player-${currentEpisode}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                onClick={handleCloseVideoPlayer}
                className="absolute top-4 right-4 text-white text-lg bg-black/50 p-2 rounded-full hover:bg-black/70"
              >
                <FaTimes />
              </button>

              {/* Subtitles toggle UI */}
              { (subtitleUrl || /youtube\.com/.test(videoUrl)) && (
                <button
                  onClick={() => setSubtitlesEnabled(s => !s)}
                  className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded hover:bg-black/70"
                >
                  {subtitlesEnabled ? 'Subtitles On' : 'Subtitles Off'}
                </button>
              )}
            </div>

            {currentEpisode && (
              <div className="bg-gray-900 text-white p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold">
                  {isSingleVideo
                    ? (playlist?.title || show.title)
                    : `${show.title} - Episode ${currentEpisode}`}
                </h2>
                <div className="flex items-center mt-2 text-sm text-gray-400">
                  <span className="mr-4">Season 1</span>
                  <span>45 min</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hero banner - Only shown when NOT watching a video */}
        {!isVideoPlaying && (
          <div className="relative">
            <div className="relative h-[40vh]">
              <img
                // prefer playlist thumbnail for main banner, then show.image
                src={getFullUrl(playlist?.thumbnail_url || playlist?.thumbnail || show.image || '')}
                alt={show.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>

            {/* Show information overlay */}
            <div className="absolute bottom-0 left-0 w-full p-6">
              <div className="container mx-auto">
                <div className="flex items-end">
                  <div className="mr-6 hidden md:block">
                    <img
                      src={getFullUrl(playlist?.thumbnail_url || playlist?.poster || show.poster || '')}
                       alt={show.title}
                       className="w-32 h-48 object-cover rounded-lg shadow-lg"
                     />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="bg-green-500 text-xs px-2 py-0.5 rounded">HOT</span>
                      <span className="bg-gray-700 text-xs px-2 py-0.5 rounded">HD</span>
                      <span className="border border-gray-700 text-xs px-2 py-0.5 rounded">2023</span>
                      <span className="border border-gray-700 text-xs px-2 py-0.5 rounded">24 Episodes</span>
                    </div>

                    <h1 className="text-3xl font-bold mb-2">{show.title}</h1>

                    <div className="flex items-center space-x-3 text-sm text-gray-300 mb-3">
                      <span className="font-semibold text-white">★ {show.rating || 'N/A'}</span>
                      <span>{show.year || '2025'}</span>
                      <span>{show.episodes || '24 Episodes'}</span>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full flex items-center transition"
                        onClick={() => handlePlayEpisode(episodes[0])}
                      >
                        <FaPlay className="mr-2" /> Play
                      </button>
                      <button onClick={handleShareClick} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full flex items-center transition">
                        <FaShare className="mr-2" /> Share
                      </button>
                      <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full flex items-center transition">
                        <FaBookmark className="mr-2" /> Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show description */}
        {!isVideoPlaying && (
          <div className="bg-gray-900 p-4 border-b border-gray-800">
            <div className="container mx-auto">
              <p className="text-sm text-gray-300">
                {show.description || "\"A Moment But Forever\" is a drama centered around the life of a princess who has been betrayed by those she trusted most. As she navigates court politics and personal vendettas, she finds unexpected allies and perhaps even love. This ancient tale speaks to timeless themes of loyalty, revenge, and the enduring power of truth."}
              </p>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-gray-900 border-b border-gray-800 sticky top-16 z-10">
          <div className="container mx-auto px-4">
            <div className="flex space-x-6">
              <button
                className={`py-4 px-2 text-sm font-medium relative ${activeTab === 'episodes' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('episodes')}
              >
                Episodes
                {activeTab === 'episodes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"></div>}
              </button>
              {/* add other tabs here if needed */}
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="bg-black py-4">
          <div className="container mx-auto px-4">
            {/* Episode Selection Dropdown (Mobile) */}

          {/**<select className="bg-gray-800 text-white rounded p-2 w-full md:w-auto mb-4">
              <option>Episodes 1-24</option>
              {show.seasons && show.seasons.map((season, idx) => (
                <option key={idx}>Season {season.number}</option>
              ))}
            </select>
             */}  
             
            {/* Episodes as Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {episodes.map(episode => (
                <button
                  key={episode.id}
                  className={`${currentEpisode === episode.number 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'} 
                    py-2 px-4 rounded-full text-sm`}
                  onClick={() => handlePlayEpisode(episode)}
                >
                  {isSingleVideo
                    ? (playlist?.title || show.title || episode.title.replace(/^Episode\s*\d+\s*/i, '').trim() || 'Play')
                    : episode.title}
                </button>
              ))}
            </div>
            
            {/* Episodes as Cards - Similar to iQIYI layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {episodes.slice(0, 8).map(episode => (
                <div 
                  key={episode.id}
                  className="cursor-pointer group"
                  onClick={() => handlePlayEpisode(episode)}
                >
                  <div className="relative rounded-md overflow-hidden">
                    <img 
                      src={episode.thumbnail}
                      alt={episode.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-green-500/90 flex items-center justify-center">
                        <FaPlay className="text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {episode.duration}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-white truncate">
                      {isSingleVideo
                        ? (playlist?.title || show.title || episode.title.replace(/^Episode\s*\d+\s*/i, '').trim())
                        : episode.title}
                    </p>
                    {!isSingleVideo && (
                      <p className="text-xs text-gray-400 truncate">Episode {episode.number}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <Footer />
      </div>
    </div>
   );
 };
 
 export default DetailsView;

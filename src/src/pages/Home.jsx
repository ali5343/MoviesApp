// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LanguageSelector from "../components/LanguageSelector";
import HeroSection from "../components/HeroSection";
import ContentRow from "../components/ContentRow";
import ThirdPartyJoin from "../components/ThirdPartyJoin";
import Footer from "../components/Footer";
import { getPlaylists, getPlaylistVideos } from "../services/api";


const Home = () => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawPlaylists = await getPlaylists();
        console.log("API response:", rawPlaylists);

        // Normalize API response to always be an array
        const playlistArray = Array.isArray(rawPlaylists)
          ? rawPlaylists
          : rawPlaylists
          ? [rawPlaylists]
          : [];

        setPlaylists(playlistArray);
      } catch (err) {
        console.error("Error fetching playlists:", err);
        setPlaylists([]); // fallback to empty array to avoid rendering issues
      }
    };

    fetchData();
  }, []);


const BASE_URL = "http://127.0.0.1:5001";


   return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <LanguageSelector />
      {/* <HeroSection /> */}

      <div className="container mx-auto px-4 py-4">
        {playlists.map((playlist) => {
          // Normalize thumbnail path
          const thumbnailUrl = playlist.thumbnail_url?.replace(/\\/g, "/") || "/placeholder.jpg";
          const poster = thumbnailUrl.startsWith("http")
            ? thumbnailUrl
            : `${BASE_URL}${thumbnailUrl}`;

          return (
            <ContentRow
              key={playlist.id}
              title={playlist.title}
              items={[
                {
                  id: playlist.id,
                  title: playlist.title,
                  poster,
                  rating: playlist.videos_count ? `${playlist.videos_count} videos` : null,
                },
              ]}
              viewAll={true}
            />
          );
        })}

        <ThirdPartyJoin />
      </div>

      <Footer />
    </div>
);
};

export default Home;
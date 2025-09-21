import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const VideoPlayerPage = () => {
  const { id } = useParams(); // series or playlist id from URL
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(0);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/series/${id}/videos`)
      .then(res => {
        setEpisodes(res.data);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (!episodes.length) return <div>Loading...</div>;

  return (
    <div>
      <iframe
        src={episodes[selectedEpisode].link}  // video link from DB
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; fullscreen"
        allowFullScreen
        title={episodes[selectedEpisode].title}
      ></iframe>

      <div className="episode-list">
        {episodes.map((ep, i) => (
          <button key={i} onClick={() => setSelectedEpisode(i)}>
            {ep.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoPlayerPage;

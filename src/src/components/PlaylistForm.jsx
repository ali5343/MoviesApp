import React, { useState, useEffect } from "react";

const PlaylistForm = ({ playlist = null, onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [region, setRegion] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);

  useEffect(() => {
    if (playlist) {
      setTitle(playlist.title || "");
      setDescription(playlist.description || "");
      setKeywords(playlist.keywords || "");
      setRegion(playlist.region || "");
      setThumbnailFile(null);
    }
  }, [playlist]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !description || !region) {
      alert("Please fill all required fields.");
      return;
    }

    // Require thumbnail for new playlists
    if (!thumbnailFile && !playlist) {
      alert("Please select a thumbnail file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("keywords", keywords);
    formData.append("region", region);

    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-4 rounded">
      <div>
        <label className="block text-gray-200">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-gray-200"
          required
        />
      </div>

      <div>
        <label className="block text-gray-200">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-gray-200"
          required
        />
      </div>

      <div>
        <label className="block text-gray-200">Keywords</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-gray-200"
        />
      </div>

      <div>
        <label className="block text-gray-200">Region</label>
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-gray-200"
          required
        />
      </div>

      <div>
        <label className="block text-gray-200">Thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files[0])}
          className="w-full text-gray-200"
        />
        {playlist && !thumbnailFile && (
          <p className="text-gray-400 text-sm mt-1">Leave empty to keep existing thumbnail</p>
        )}
      </div>

      <div className="flex space-x-2">
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
          {playlist ? "Update Playlist" : "Create Playlist"}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PlaylistForm;

from flask import Blueprint, request, jsonify
from app import mongo
from app.models import PlaylistInDB, VideoInDB, ChannelGroupInDB, PyObjectId
from pymongo.errors import PyMongoError
from pydantic import ValidationError
from bson import ObjectId

public_data_bp = Blueprint('public_data', __name__)

@public_data_bp.route('/playlists', methods=['GET'])
def get_public_playlists():
    """ Publicly accessible basic list of playlists """
    playlists = []
    cursor = mongo.db.playlists.find(
        {},
        {"_id": 1, "title": 1, "description": 1, "thumbnail_url": 1, "region": 1}
    )
    for playlist_doc in cursor:
        try:
            # Serialize just the few public fields
            doc = {
                "id": str(playlist_doc["_id"]),
                "title": playlist_doc.get("title", ""),
                "description": playlist_doc.get("description", ""),
                "thumbnail_url": playlist_doc.get("thumbnail_url", ""),
                "region": playlist_doc.get("region", ""),
            }
            playlists.append(doc)
        except Exception as e:
            print(f"Error validating public playlist {playlist_doc.get('_id')}: {e}")
    return jsonify(playlists), 200

@public_data_bp.route('/playlists/<string:playlist_id>/videos', methods=['GET'])
def get_public_playlist_videos(playlist_id):
    if not ObjectId.is_valid(playlist_id):
        return jsonify({"message": "Invalid Playlist ID"}), 400

    playlist_obj_id = ObjectId(playlist_id)

    # Query videos collection by playlist_id (not embedded)
    video_cursor = mongo.db.videos.find({"playlist_id": playlist_obj_id})
    videos = []
    for video_doc in video_cursor:
        try:
            video_dict = VideoInDB.parse_obj(video_doc).dict(by_alias=True)
            # Optionally exclude fields for public
            video_dict.pop('playlist_id', None)
            videos.append(video_dict)
        except ValidationError as e:
            print(f"Error validating public video {video_doc.get('_id')}: {e}")
    if not videos:
        # Check if playlist even exists, else send accurate error
        playlist = mongo.db.playlists.find_one({"_id": playlist_obj_id})
        if not playlist:
            return jsonify({"message": "Playlist not found"}), 404
        return jsonify({"message": "Playlist has no videos"}), 404

    return jsonify(videos), 200

@public_data_bp.route('/videos/<string:video_id>', methods=['GET'])
def get_public_video(video_id):
    if not ObjectId.is_valid(video_id):
        return jsonify({"message": "Invalid Video ID"}), 400

    video_doc = mongo.db.videos.find_one({"_id": ObjectId(video_id)})
    if not video_doc:
        return jsonify({"message": "Video not found"}), 404

    try:
        # Increment views on access
        mongo.db.videos.update_one({"_id": ObjectId(video_id)}, {"$inc": {"views": 1}})
        video_dict = VideoInDB.parse_obj(video_doc).dict(by_alias=True)
        video_dict.pop("playlist_id", None)
        return jsonify(video_dict), 200
    except ValidationError as e:
        return jsonify({"message": "Validation Error", "details": e.errors()}), 500
    except PyMongoError as e:
        return jsonify({"message": f"Database error: {str(e)}"}), 500

@public_data_bp.route('/channel_groups', methods=['GET'])
def get_public_channel_groups():
    """ Publicly accessible channel groups (links) """
    channel_groups = []
    cg_cursor = mongo.db.channel_groups.find({}, {"_id": 1, "region": 1, "type": 1, "link": 1})
    for cg_doc in cg_cursor:
        try:
            cg_data = {
                "id": str(cg_doc["_id"]),
                "region": cg_doc.get("region", ""),
                "type": cg_doc.get("type", ""),
                "link": cg_doc.get("link", "")
            }
            channel_groups.append(cg_data)
        except Exception as e:
            print(f"Error validating public channel group {cg_doc.get('_id')}: {e}")
    return jsonify(channel_groups), 200

@public_data_bp.route('/channel_groups/<string:cg_id>/click', methods=['POST'])
def public_channel_group_click(cg_id):
    # This endpoint is to track clicks on public channel group links
    if not ObjectId.is_valid(cg_id):
        return jsonify({"message": "Invalid Channel Group ID"}), 400

    try:
        result = mongo.db.channel_groups.update_one(
            {"_id": ObjectId(cg_id)},
            {"$inc": {"clicks": 1}}
        )
        if result.modified_count == 0:
            return jsonify({"message": "Channel Group not found"}), 404
        return jsonify({"message": "Click tracked"}), 200
    except PyMongoError as e:
        return jsonify({"message": f"Database error: {str(e)}"}), 500
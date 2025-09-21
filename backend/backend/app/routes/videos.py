# app/routes/videos.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app import mongo
from app.models import VideoCreate, VideoUpdate, VideoInDB, PyObjectId
from pydantic import ValidationError, parse_obj_as
from bson import ObjectId
import datetime
import os
try:
    import pysubs2  # pip install pysubs2
    _HAS_PYSUBS2 = True
except Exception:
    import re
    _HAS_PYSUBS2 = False

    def _convert_srt_to_vtt(srt_path, vtt_path):
        with open(srt_path, "r", encoding="utf-8", errors="ignore") as f:
            s = f.read().replace("\r\n", "\n")
        # convert timestamps 00:00:00,000 -> 00:00:00.000
        s = re.sub(r"(\d+:\d+:\d+),(\d+)", r"\1.\2", s)
        # prepend WEBVTT header
        vtt = "WEBVTT\n\n" + s.strip() + "\n"
        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write(vtt)

from werkzeug.utils import secure_filename

videos_bp = Blueprint('videos', __name__)

@videos_bp.route('', methods=['POST'])
def add_video_to_playlist():
    try:
        data = request.get_json()
        # Manually add playlist_id to the data for VideoCreate model
        playlist_id_str = data.get('playlist_id')
        if not playlist_id_str:
            return jsonify({"msg": "playlist_id is required"}), 400
        
        playlist_oid = ObjectId(playlist_id_str)

        # Check if playlist exists
        playlist = mongo.db.playlists.find_one({"_id": playlist_oid})
        if not playlist:
            return jsonify({"msg": "Playlist not found"}), 404

        video_data = data # Pydantic validation

        print(type(video_data))
    
    except ValidationError as e:
        return jsonify(e.errors()), 400
    except Exception as e: # Catches invalid ObjectId format too
        return jsonify({"msg": "Invalid data or playlist_id format", "details": str(e)}), 400

    video_doc = video_data
    video_doc['playlist_id'] = playlist_oid
    video_doc['region'] = playlist.get('region') # Inherit region from playlist
    video_doc['views'] = 0
    video_doc['likes'] = 0
    video_doc['created_at'] = datetime.datetime.utcnow()
    video_doc['updated_at'] = datetime.datetime.utcnow()

    result = mongo.db.videos.insert_one(video_doc)
    created_video = mongo.db.videos.find_one({"_id": result.inserted_id})

    if created_video:
        created_video['_id'] = str(created_video['_id'])
        created_video['playlist_id'] = str(created_video['playlist_id'])
        # Also update the playlist's updated_at timestamp
        mongo.db.playlists.update_one(
            {"_id": playlist_oid},
            {"$set": {"updated_at": datetime.datetime.utcnow()}}
        )
        return jsonify(created_video), 201
    else:
        return jsonify({"msg": "Failed to add video"}), 500


@videos_bp.route('', methods=['GET'])
def get_videos():
    playlist_id = request.args.get('playlist_id')
    query = {}
    if playlist_id:
        query['playlist_id'] = ObjectId(playlist_id)

    videos_cursor = mongo.db.videos.find(query).sort("created_at", -1)
    videos_list = []
    for v_data in videos_cursor:
        v_data['_id'] = str(v_data['_id'])
        video_summary = {
            "id": v_data['_id'],
            "title": v_data.get("title"),
            "description": v_data.get("description"),
            "thumbnail_url": v_data.get("thumbnail_url"),
            # include playable link(s)
            "video_link": v_data.get("video_link"),
            "embed_url": v_data.get("embed_url"),
            "playlist_id": str(v_data.get("playlist_id")),
            "rating": v_data.get("rating"),
        }
        videos_list.append(video_summary)

    return jsonify(videos_list), 200



@videos_bp.route('/<string:video_id>', methods=['GET'])
def get_video(video_id):
    try:
        v_id = ObjectId(video_id)
    except Exception:
        return jsonify({"msg": "Invalid video ID format"}), 400

    video = mongo.db.videos.find_one({"_id": v_id})
    if not video:
        return jsonify({"msg": "Video not found"}), 404
    return jsonify(VideoInDB.parse_obj(video).dict(by_alias=True)), 200


@videos_bp.route('/<string:video_id>', methods=['PUT'])
def update_video(video_id):
    try:
        v_id = ObjectId(video_id)
        video_data = VideoUpdate(**request.json) # Pydantic validation
    except ValidationError as e:
        return jsonify(e.errors()), 400
    except Exception:
        return jsonify({"msg": "Invalid video ID format or data"}), 400

    if not mongo.db.videos.find_one({"_id": v_id}):
        return jsonify({"msg": "Video not found"}), 404

    update_fields = video_data.dict(exclude_unset=True)
    if not update_fields:
        return jsonify({"msg": "No fields to update"}), 400
    
    update_fields['updated_at'] = datetime.datetime.utcnow()

    mongo.db.videos.update_one({"_id": v_id}, {"$set": update_fields})
    
    updated_video = mongo.db.videos.find_one({"_id": v_id})

    # If playlist_id is part of update_fields and it changed, update old/new playlist's updated_at
    # This logic can be complex if videos can move between playlists.
    # For now, assuming playlist_id is not changed via this endpoint or handled carefully.
    
    # Update the associated playlist's updated_at timestamp
    if updated_video and updated_video.get('playlist_id'):
        mongo.db.playlists.update_one(
            {"_id": ObjectId(updated_video['playlist_id'])},
            {"$set": {"updated_at": datetime.datetime.utcnow()}}
        )

    return jsonify(VideoInDB.parse_obj(updated_video).dict(by_alias=True)), 200


@videos_bp.route('/<string:video_id>', methods=['DELETE'])
def delete_video(video_id):
    try:
        v_id = ObjectId(video_id)
    except Exception:
        return jsonify({"msg": "Invalid video ID format"}), 400

    video_to_delete = mongo.db.videos.find_one({"_id": v_id})
    if not video_to_delete:
        return jsonify({"msg": "Video not found"}), 404

    playlist_id = video_to_delete.get('playlist_id')

    result = mongo.db.videos.delete_one({"_id": v_id})
    if result.deleted_count == 1:
        # Update the associated playlist's updated_at timestamp
        if playlist_id:
            mongo.db.playlists.update_one(
                {"_id": ObjectId(playlist_id)},
                {"$set": {"updated_at": datetime.datetime.utcnow()}}
            )
        return jsonify({"msg": "Video deleted successfully"}), 200
    else:
        return jsonify({"msg": "Failed to delete video"}), 500

# --- Simple View and Like Incrementors ---
@videos_bp.route('/<string:video_id>/view', methods=['POST'])
def increment_view(video_id):
    try:
        v_id = ObjectId(video_id)
    except Exception:
        return jsonify({"msg": "Invalid video ID format"}), 400

    result = mongo.db.videos.update_one({"_id": v_id}, {"$inc": {"views": 1}})
    if result.matched_count:
        # Update the associated playlist's updated_at as engagement metric changed
        video = mongo.db.videos.find_one({"_id": v_id})
        if video and video.get('playlist_id'):
            mongo.db.playlists.update_one(
                {"_id": ObjectId(video['playlist_id'])},
                {"$set": {"updated_at": datetime.datetime.utcnow()}} # Or a specific engagement_updated_at
            )
        return jsonify({"msg": "View count incremented"}), 200
    return jsonify({"msg": "Video not found"}), 404

@videos_bp.route('/<string:video_id>/like', methods=['POST'])
# @jwt_required() # Optional: if only logged-in users can like
def increment_like(video_id):
    try:
        v_id = ObjectId(video_id)
    except Exception:
        return jsonify({"msg": "Invalid video ID format"}), 400

    result = mongo.db.videos.update_one({"_id": v_id}, {"$inc": {"likes": 1}})
    if result.matched_count:
        # Update the associated playlist's updated_at
        video = mongo.db.videos.find_one({"_id": v_id})
        if video and video.get('playlist_id'):
            mongo.db.playlists.update_one(
                {"_id": ObjectId(video['playlist_id'])},
                {"$set": {"updated_at": datetime.datetime.utcnow()}}
            )
        return jsonify({"msg": "Like count incremented"}), 200
    return jsonify({"msg": "Video not found"}), 404


@videos_bp.route("/<video_id>/subtitles", methods=["POST"])
def upload_subtitles(video_id):
    try:
        if "subtitle" not in request.files:
            return jsonify({"error": "no file"}), 400

        f = request.files["subtitle"]
        filename = secure_filename(f.filename)
        ext = os.path.splitext(filename)[1].lower()

        upload_dir = os.path.join(current_app.root_path, "static", "subtitles")
        os.makedirs(upload_dir, exist_ok=True)

        if ext == ".srt":
            # save temp, convert to .vtt
            tmp_path = os.path.join(upload_dir, filename)
            f.save(tmp_path)
            if _HAS_PYSUBS2:
                subs = pysubs2.load(tmp_path)
                vtt_name = os.path.splitext(filename)[0] + ".vtt"
                vtt_path = os.path.join(upload_dir, vtt_name)
                subs.save(vtt_path, format_="vtt")
                os.remove(tmp_path)
                saved_name = vtt_name
            else:
                vtt_name = os.path.splitext(filename)[0] + ".vtt"
                vtt_path = os.path.join(upload_dir, vtt_name)
                _convert_srt_to_vtt(tmp_path, vtt_path)
                os.remove(tmp_path)
                saved_name = vtt_name
        elif ext == ".vtt":
            saved_name = secure_filename(filename)
            f.save(os.path.join(upload_dir, saved_name))
        else:
            return jsonify({"error": "unsupported subtitle format"}), 400

        subtitle_url = f"/static/subtitles/{saved_name}"

        # update video document with subtitle_url (adjust collection/field names)
        mongo.db.videos.update_one({"_id": ObjectId(video_id)}, {"$set": {"subtitle_url": subtitle_url}})

        return jsonify({"subtitle_url": subtitle_url}), 200

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": str(e)}), 500

@videos_bp.route("/<video_id>/subtitles", methods=["GET"])
def get_subtitles(video_id):
    try:
        v_id = ObjectId(video_id)
    except Exception:
        return jsonify({"msg": "Invalid video ID format"}), 400

    video = mongo.db.videos.find_one({"_id": v_id})
    if not video:
        return jsonify({"msg": "Video not found"}), 404

    subtitle_url = video.get("subtitle_url")
    if not subtitle_url:
        return jsonify({"msg": "No subtitles uploaded for this video"}), 404

    return jsonify({
        "subtitle_url": subtitle_url
    }), 200
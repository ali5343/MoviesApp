from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app import mongo
from app.models import PlaylistCreate, PlaylistUpdate, PlaylistInDB, VideoInDB
from app.utils.file_helpers import save_file
from pydantic import ValidationError
from bson import ObjectId
import datetime
import os
from flask import send_from_directory, make_response

playlists_bp = Blueprint('playlists', __name__)

def _playlist_form_to_dict(form):
    """
    Helper to convert Flask form fields into a dict for PlaylistCreate/Pydantic.
    """
    # All are strings, change as needed for new fields!
    return {
        "title": form.get('title', '').strip(),
        "description": form.get('description', '').strip(),
        "keywords": form.get('keywords', '').strip(),
        "region": form.get('region', '').strip(),
    }

# --- Helper ---
def _playlist_update_form_to_dict(data):
    """
    Accepts either a dict (from request.get_json()) or an ImmutableMultiDict (from request.form).
    Returns a clean dictionary with only allowed playlist fields.
    Keeps empty strings as valid values (so frontend can clear fields).
    """
    # If coming from Flask request.form, convert to dict
    if hasattr(data, "to_dict"):
        data = data.to_dict(flat=True)

    allowed_fields = ["title", "description", "keywords", "region"]
    cleaned = {}
    for field in allowed_fields:
        if field in data:
            val = data.get(field)
            # normalize strings: strip whitespace; keep empty string as valid
            if isinstance(val, str):
                val = val.strip()
            # Only skip if value is None (absent)
            if val is not None:
                cleaned[field] = val

    return cleaned


def serialize_doc(doc):
    """
    Recursively converts ObjectId fields in a dictionary or list to strings.
    """
    if isinstance(doc, dict):
        return {k: serialize_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [serialize_doc(elem) for elem in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

@playlists_bp.route('', methods=['POST'])
def create_playlist():
    # Handle multipart form data
    if 'thumbnail' not in request.files:
        return jsonify({"msg": "Missing thumbnail file"}), 400
    file = request.files['thumbnail']
    if not file or file.filename == '':
        return jsonify({"msg": "No selected thumbnail file"}), 400

    data_dict = _playlist_form_to_dict(request.form)
    form_data = data_dict
    # try:
        # form_data = PlaylistCreate(**data_dict)
    # except ValidationError as e:
    #     return jsonify(e.errors()), 400

    # Save thumbnail file
    thumbnail_url, error = save_file(file, 'UPLOAD_FOLDER_THUMBNAILS', subfolder="playlists")
    if error:
        return jsonify({"msg": "Failed to save thumbnail", "details": error}), 500

    playlist_doc = form_data
    playlist_doc['thumbnail_url'] = thumbnail_url
    playlist_doc['videos'] = []  # You can also omit this for now
    playlist_doc['created_at'] = datetime.datetime.utcnow()
    playlist_doc['updated_at'] = datetime.datetime.utcnow()

    result = mongo.db.playlists.insert_one(playlist_doc)
    created_playlist = mongo.db.playlists.find_one({"_id": result.inserted_id})

    created_playlist['_id'] = str(created_playlist['_id'])
    created_playlist['id'] = created_playlist['_id']

    if created_playlist:
        return jsonify(created_playlist), 201
    else:
        return jsonify({"msg": "Failed to create playlist"}), 500


@playlists_bp.route('', methods=['GET'])
def get_playlists():
    region_filter = request.args.get('region')
    query = {}
    if region_filter and region_filter.lower() != 'all':
        query['region'] = region_filter

    playlists_cursor = mongo.db.playlists.find(query).sort("created_at", -1)
    playlists_list = []
    for p_data in playlists_cursor:
        p_data['_id'] = str(p_data['_id'])
        p_data['videos_count'] = mongo.db.videos.count_documents({"playlist_id": ObjectId(p_data['_id'])})
        playlist_summary = {
            "id": p_data['_id'],
            "title": p_data.get("title"),
            "description": p_data.get("description"),
            "keywords": p_data.get("keywords"),
            "region": p_data.get("region"),
            "thumbnail_url": p_data.get("thumbnail_url"),
            "videos_count": p_data['videos_count'],
            "created_at": p_data.get("created_at"),
            "updated_at": p_data.get("updated_at")
        }
        playlists_list.append(playlist_summary)
    return jsonify(playlists_list), 200


@playlists_bp.route('/<string:playlist_id>', methods=['GET'])
def get_playlist(playlist_id):
    try:
        p_id = ObjectId(playlist_id)
    except Exception:
        return jsonify({"msg": "Invalid playlist ID format"}), 400
    
    playlist_data = mongo.db.playlists.find_one({"_id": p_id})
    
    if not playlist_data:
        return jsonify({"msg": "Playlist not found"}), 404
    
    # Fetch associated videos for this playlist
    videos_cursor = mongo.db.videos.find({"playlist_id": p_id})
    
    # Convert the cursor to a list once
    videos_list = list(videos_cursor)
    
    # Apply serialization to the playlist data and then add videos
    # We apply it to playlist_data first, so any other ObjectIds are converted
    final_playlist_data = serialize_doc(playlist_data)
    
    # Apply serialization to each video in the list
    serialized_videos_list = [serialize_doc(video) for video in videos_list]
    
    final_playlist_data['videos'] = serialized_videos_list

    final_playlist_data['id'] = final_playlist_data['_id']
    
    return jsonify(final_playlist_data), 200


@playlists_bp.route('/<string:playlist_id>', methods=['PUT'])
def update_playlist(playlist_id):
    try:
        try:
            p_id = ObjectId(playlist_id)
        except Exception:
            return jsonify({"msg": "Invalid playlist ID format"}), 400

        # load existing playlist (was missing -> caused NameError)
        existing_playlist = mongo.db.playlists.find_one({"_id": p_id})
        if not existing_playlist:
            current_app.logger.debug("UpdatePlaylist: playlist not found %s", playlist_id)
            return jsonify({"msg": "Playlist not found"}), 404

        # Debug: log incoming request info to backend console
        current_app.logger.debug("UpdatePlaylist: method=%s, content-type=%s, headers=%s",
                                 request.method, request.headers.get("Content-Type"), dict(request.headers))
        
        # Try to parse incoming data robustly for PUT multipart/form-data or JSON
        incoming_data = {}
        files = {}

        if request.is_json:
            incoming_data = request.get_json() or {}
            current_app.logger.debug("UpdatePlaylist: parsed JSON payload: %s", incoming_data)
        else:
            # Flask may not populate request.form/files for PUT multipart in some setups.
            # First try the usual places, then fall back to parse_form_data.
            if request.form:
                incoming_data = request.form.to_dict(flat=True)
                current_app.logger.debug("UpdatePlaylist: request.form found keys: %s", list(request.form.keys()))
            if request.files:
                files = request.files.to_dict(flat=True)
                current_app.logger.debug("UpdatePlaylist: request.files found keys: %s", list(request.files.keys()))

            if not incoming_data and not files:
                # Fallback: parse raw form-data from environ (works for PUT multipart)
                try:
                    from werkzeug.formparser import parse_form_data
                    _stream, parsed_form, parsed_files = parse_form_data(request.environ)
                    if parsed_form:
                        incoming_data = parsed_form.to_dict(flat=True)
                        current_app.logger.debug("UpdatePlaylist: parse_form_data parsed form keys: %s", list(incoming_data.keys()))
                    if parsed_files:
                        files = parsed_files.to_dict(flat=True)
                        current_app.logger.debug("UpdatePlaylist: parse_form_data parsed files keys: %s", list(files.keys()))
                except Exception as e:
                    current_app.logger.exception("parse_form_data fallback failed: %s", e)

        current_app.logger.debug("UpdatePlaylist: incoming_data=%s, files=%s", {k: (v if not k.lower().endswith('thumbnail') else '[file]') for k,v in incoming_data.items()}, list(files.keys()))
        
        update_data_dict = _playlist_update_form_to_dict(incoming_data)

        # Ensure keywords is a string (Pydantic expects string)
        if "keywords" in update_data_dict and isinstance(update_data_dict["keywords"], list):
            update_data_dict["keywords"] = ",".join(str(k) for k in update_data_dict["keywords"])

        # If 'genre' is required by the model but not provided, reuse existing value from DB
        if "genre" not in update_data_dict or update_data_dict.get("genre") in (None, ""):
            existing_genre = existing_playlist.get("genre")
            if existing_genre is not None:
                update_data_dict["genre"] = existing_genre

        # Thumbnail handling
        thumbnail_file = files.get("thumbnail") or request.files.get("thumbnail")
        if thumbnail_file and getattr(thumbnail_file, "filename", "") != "":
            new_thumbnail_url, error = save_file(thumbnail_file, "UPLOAD_FOLDER_THUMBNAILS", subfolder="playlists")
            if error:
                return jsonify({"msg": "Failed to save thumbnail", "details": error}), 500
            update_data_dict["thumbnail_url"] = new_thumbnail_url

        current_app.logger.debug("Computed update_data_dict: %s", update_data_dict)
        current_app.logger.debug("Thumbnail file present: %s", bool(thumbnail_file))

        if not update_data_dict and not thumbnail_file:
            return jsonify({"msg": "No update data or thumbnail provided"}), 400    

        try:
            _ = PlaylistUpdate(**update_data_dict)
        except ValidationError as e:
            current_app.logger.debug("PlaylistUpdate validation errors: %s", e.errors())
            return jsonify({"msg": "Validation failed", "errors": e.errors()}), 400

        update_data_dict["updated_at"] = datetime.datetime.utcnow()
        mongo.db.playlists.update_one({"_id": p_id}, {"$set": update_data_dict})

        updated_playlist = mongo.db.playlists.find_one({"_id": p_id})
        videos_cursor = mongo.db.videos.find({"playlist_id": p_id})
        videos_list = []
        try:
            # Prefer simple serialization to avoid pydantic parsing errors on partial docs
            for video in videos_cursor:
                videos_list.append(serialize_doc(video))
        except Exception as ve:
            current_app.logger.exception("Failed to serialize videos for playlist %s: %s", playlist_id, ve)
            # fallback: empty list instead of failing the whole update
            videos_list = []

        updated_playlist = serialize_doc(updated_playlist)
        updated_playlist["videos"] = videos_list
        updated_playlist["id"] = str(updated_playlist["_id"])

        # Return the already-serialized document directly to avoid Pydantic v2 custom-type issues
        return jsonify(updated_playlist), 200
    except Exception as e:
        current_app.logger.exception("Unhandled error updating playlist")
        # return the error message in JSON for easier debugging (remove in production)
        return jsonify({"msg": "Internal server error", "error": str(e)}), 500


@playlists_bp.route('/<string:playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    try:
        p_id = ObjectId(playlist_id)
    except Exception:
        return jsonify({"msg": "Invalid playlist ID format"}), 400

    playlist_to_delete = mongo.db.playlists.find_one({"_id": p_id})
    if not playlist_to_delete:
        return jsonify({"msg": "Playlist not found"}), 404

    # Optional: Delete associated thumbnail from filesystem
    thumbnail_url = playlist_to_delete.get('thumbnail_url')
    if thumbnail_url:
        try:
            filename = os.path.basename(thumbnail_url)
            subfolder = "playlists"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER_THUMBNAILS'], subfolder, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting thumbnail file {thumbnail_url}: {e}")

    mongo.db.videos.delete_many({"playlist_id": p_id})
    result = mongo.db.playlists.delete_one({"_id": p_id})
    if result.deleted_count == 1:
        return jsonify({"msg": "Playlist and associated videos deleted successfully"}), 200
    else:
        return jsonify({"msg": "Failed to delete playlist"}), 500


@playlists_bp.route('/<string:playlist_id>/thumbnail', methods=['POST'])
def upload_playlist_thumbnail(playlist_id):
    try:
        try:
            p_id = ObjectId(playlist_id)
        except Exception:
            return jsonify({"msg": "Invalid playlist ID format"}), 400

        playlist = mongo.db.playlists.find_one({"_id": p_id})
        if not playlist:
            return jsonify({"msg": "Playlist not found"}), 404

        if 'thumbnail' not in request.files:
            return jsonify({"msg": "Missing thumbnail file"}), 400

        thumbnail_file = request.files['thumbnail']
        if not thumbnail_file or thumbnail_file.filename == '':
            return jsonify({"msg": "No selected thumbnail file"}), 400

        # save_file should return (url, error)
        new_thumbnail_url, error = save_file(thumbnail_file, 'UPLOAD_FOLDER_THUMBNAILS', subfolder="playlists")
        if error:
            current_app.logger.exception("Failed to save playlist thumbnail: %s", error)
            return jsonify({"msg": "Failed to save thumbnail", "details": error}), 500

        mongo.db.playlists.update_one(
            {"_id": p_id},
            {"$set": {"thumbnail_url": new_thumbnail_url, "updated_at": datetime.datetime.utcnow()}}
        )

        updated = mongo.db.playlists.find_one({"_id": p_id})
        # minimal safe serialization
        updated['id'] = str(updated.get('_id'))
        if '_id' in updated:
            del updated['_id']

        return jsonify(updated), 200

    except Exception as e:
        current_app.logger.exception("Unhandled error uploading playlist thumbnail")
        return jsonify({"msg": "Internal server error", "error": str(e)}), 500

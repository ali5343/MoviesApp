# app/routes/advertisements.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app import mongo
from app.models import AdCreate, AdInDB, PyObjectId # Pydantic models
from app.utils.file_helpers import save_file
from pydantic import ValidationError, parse_obj_as
from bson import ObjectId
import datetime
import os

advertisements_bp = Blueprint('advertisements', __name__)

@advertisements_bp.route('/', methods=['POST'])
@jwt_required()
def create_advertisement():
    if 'ad_file' not in request.files:
        return jsonify({"msg": "Missing ad_file part"}), 400
    
    file = request.files['ad_file']
    if file.filename == '':
        return jsonify({"msg": "No selected ad file"}), 400

    try:
        # Form data for ad details (target_video_id, placement)
        ad_data_json = request.form.get('data')
        if not ad_data_json:
            return jsonify({"msg": "Missing advertisement data"}), 400
        
        form_data = AdCreate.parse_raw(ad_data_json)
        
        # Validate target_video_id exists
        target_video_id_obj = ObjectId(form_data.target_video_id) # Already PyObjectId, convert for find_one
        if not mongo.db.videos.find_one({"_id": target_video_id_obj}):
            return jsonify({"msg": "Target video not found"}), 404

    except ValidationError as e:
        return jsonify(e.errors()), 400
    except Exception as e: # Catch ObjectId conversion errors or other parsing issues
        return jsonify({"msg": "Invalid advertisement data format or target_video_id", "details": str(e)}), 400

    # Save ad file
    # You might want a subfolder structure like 'ads/video_id' or based on ad_id after creation
    ad_file_url, error = save_file(file, 'UPLOAD_FOLDER_ADS', subfolder="general_ads")
    if error:
        return jsonify({"msg": "Failed to save ad file", "details": error}), 500

    ad_doc = form_data.dict()
    ad_doc['target_video_id'] = target_video_id_obj # Store as ObjectId
    ad_doc['ad_file_name'] = file.filename # Or secure_filename(file.filename)
    ad_doc['ad_file_url'] = ad_file_url
    ad_doc['created_at'] = datetime.datetime.utcnow()

    result = mongo.db.advertisements.insert_one(ad_doc)
    created_ad = mongo.db.advertisements.find_one({"_id": result.inserted_id})
    
    if created_ad:
        return jsonify(AdInDB.parse_obj(created_ad).dict(by_alias=True)), 201
    else:
        return jsonify({"msg": "Failed to create advertisement"}), 500

@advertisements_bp.route('/', methods=['GET'])
@jwt_required() # Or public if ads info is needed non-authenticated
def get_advertisements():
    """
    Get all advertisements.
    Supports filtering by target_video_id.
    Example: /api/advertisements?target_video_id=<video_id>
    """
    target_video_id_filter = request.args.get('target_video_id')
    query = {}
    if target_video_id_filter:
        try:
            query['target_video_id'] = ObjectId(target_video_id_filter)
        except Exception:
            return jsonify({"msg": "Invalid target_video_id format for filter"}), 400
    
    ads_cursor = mongo.db.advertisements.find(query).sort("created_at", -1)
    ads_list = [AdInDB.parse_obj(ad).dict(by_alias=True) for ad in ads_cursor]
    return jsonify(ads_list), 200

@advertisements_bp.route('/<string:ad_id>', methods=['DELETE'])
@jwt_required()
def delete_advertisement(ad_id):
    try:
        ad_oid = ObjectId(ad_id)
    except Exception:
        return jsonify({"msg": "Invalid advertisement ID format"}), 400

    ad_to_delete = mongo.db.advertisements.find_one({"_id": ad_oid})
    if not ad_to_delete:
        return jsonify({"msg": "Advertisement not found"}), 404

    # Optional: Delete associated ad file from filesystem
    ad_file_url = ad_to_delete.get('ad_file_url')
    if ad_file_url:
        try:
            # This logic is simplified. Real-world scenario needs to map URL back to filesystem path.
            filename = os.path.basename(ad_file_url)
            # Determine subfolder if used; here assuming "general_ads" as in create route
            subfolder = "general_ads"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER_ADS'], subfolder, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting ad file {ad_file_url}: {e}") # Log error


    result = mongo.db.advertisements.delete_one({"_id": ad_oid})
    if result.deleted_count == 1:
        return jsonify({"msg": "Advertisement deleted successfully"}), 200
    else:
        return jsonify({"msg": "Failed to delete advertisement"}), 500
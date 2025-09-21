# app/routes/channel_groups.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import mongo
from app.models import ChannelGroupCreate, ChannelGroupUpdate, ChannelGroupInDB, PyObjectId
from pydantic import ValidationError, parse_obj_as
from bson import ObjectId
import datetime

channel_groups_bp = Blueprint('channel_groups', __name__)

@channel_groups_bp.route('/', methods=['POST'])
@jwt_required()
def create_channel_group():
    try:
        data = ChannelGroupCreate(**request.json)
    except ValidationError as e:
        return jsonify(e.errors()), 400

    group_doc = data.dict()
    group_doc['clicks'] = 0 # Initialize clicks
    group_doc['created_at'] = datetime.datetime.utcnow()

    result = mongo.db.channel_groups.insert_one(group_doc)
    created_group = mongo.db.channel_groups.find_one({"_id": result.inserted_id})

    if created_group:
        return jsonify(ChannelGroupInDB.parse_obj(created_group).dict(by_alias=True)), 201
    else:
        return jsonify({"msg": "Failed to create channel group"}), 500

@channel_groups_bp.route('/', methods=['GET'])
@jwt_required() # Or public if this info is needed without login
def get_channel_groups():
    """
    Get all channel groups.
    Supports filtering by region.
    Example: /api/channel_groups?region=English
    """
    region_filter = request.args.get('region')
    query = {}
    if region_filter and region_filter.lower() != 'all': # Assuming 'all' means no filter
        query['region'] = region_filter
    
    # Add more filters if needed (e.g., type)

    groups_cursor = mongo.db.channel_groups.find(query).sort("created_at", -1)
    groups_list = [ChannelGroupInDB.parse_obj(g).dict(by_alias=True) for g in groups_cursor]
    return jsonify(groups_list), 200

@channel_groups_bp.route('/<string:group_id>', methods=['PUT'])
@jwt_required()
def update_channel_group(group_id):
    try:
        g_oid = ObjectId(group_id)
        update_data = ChannelGroupUpdate(**request.json) # Pydantic validation
    except ValidationError as e:
        return jsonify(e.errors()), 400
    except Exception: # Catches invalid ObjectId
        return jsonify({"msg": "Invalid group ID format or data"}), 400

    if not mongo.db.channel_groups.find_one({"_id": g_oid}):
        return jsonify({"msg": "Channel group not found"}), 404

    update_fields = update_data.dict(exclude_unset=True) # Only include fields that were provided
    if not update_fields:
        return jsonify({"msg": "No fields to update"}), 400
    
    # Add updated_at if you track it for channel groups
    # update_fields['updated_at'] = datetime.datetime.utcnow()

    mongo.db.channel_groups.update_one({"_id": g_oid}, {"$set": update_fields})
    updated_group = mongo.db.channel_groups.find_one({"_id": g_oid})
    return jsonify(ChannelGroupInDB.parse_obj(updated_group).dict(by_alias=True)), 200

@channel_groups_bp.route('/<string:group_id>', methods=['DELETE'])
@jwt_required()
def delete_channel_group(group_id):
    try:
        g_oid = ObjectId(group_id)
    except Exception:
        return jsonify({"msg": "Invalid group ID format"}), 400

    result = mongo.db.channel_groups.delete_one({"_id": g_oid})
    if result.deleted_count == 1:
        return jsonify({"msg": "Channel group deleted successfully"}), 200
    else:
        return jsonify({"msg": "Channel group not found or failed to delete"}), 404 # Or 500

@channel_groups_bp.route('/<string:group_id>/click', methods=['POST'])
# This could be public or require some form of light authentication/rate limiting in production
def increment_channel_group_click(group_id):
    try:
        g_oid = ObjectId(group_id)
    except Exception:
        return jsonify({"msg": "Invalid group ID format"}), 400

    result = mongo.db.channel_groups.update_one({"_id": g_oid}, {"$inc": {"clicks": 1}})
    if result.matched_count:
        return jsonify({"msg": "Click count incremented"}), 200
    return jsonify({"msg": "Channel group not found"}), 404
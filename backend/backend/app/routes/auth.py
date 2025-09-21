# app/routes/auth.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import mongo
from app.utils.security import hash_password, verify_password
from app.models import UserLogin, UserCreate, UserInDB, Token # Pydantic models
from pydantic import ValidationError
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST']) # Optional: For creating admin users initially
def register():
    try:
        user_data = UserCreate(**request.json)
    except ValidationError as e:
        return jsonify(e.errors()), 400

    existing_user = mongo.db.users.find_one({"username": user_data.username})
    if existing_user:
        return jsonify({"msg": "Username already exists"}), 409

    hashed_pwd = hash_password(user_data.password)
    user_to_save = {
        "username": user_data.username,
        "hashed_password": hashed_pwd,
        "role": "admin", # Default role
        "created_at": datetime.datetime.utcnow()
    }
    user_id = mongo.db.users.insert_one(user_to_save).inserted_id
    
    # Retrieve the created user to confirm and return (excluding password)
    created_user = mongo.db.users.find_one({"_id": user_id})
    if created_user:
        # Use Pydantic model for response shaping if desired
        # For now, just basic info
        return jsonify({
            "msg": "User created successfully", 
            "user_id": str(user_id),
            "username": created_user.get("username")
        }), 201
    return jsonify({"msg": "Error creating user"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        login_data = UserLogin(**request.json)
    except ValidationError as e:
        return jsonify(e.errors()), 400

    user_from_db = mongo.db.users.find_one({"username": login_data.username})

    if user_from_db and verify_password(login_data.password, user_from_db["hashed_password"]):
        # Ensure user_from_db has an '_id' before creating token
        user_id = str(user_from_db["_id"])
        access_token = create_access_token(identity=user_id) # Use user's DB ID as identity
        
        # Prepare user info for the response, excluding sensitive data
        user_info = {
            "id": user_id,
            "username": user_from_db["username"],
            "role": user_from_db.get("role", "admin") # Assuming a 'role' field exists
        }
        return jsonify(access_token=access_token, user=user_info), 200
    
    return jsonify({"msg": "Invalid username or password"}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": mongo.db.ObjectId(current_user_id)}, {"_id": 1, "username": 1, "role": 1})
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Convert ObjectId to string for JSON serialization
    user['_id'] = str(user['_id'])
    return jsonify(user), 200

# You might want a logout endpoint if you are using token blocklists
# For simplicity, frontend can just discard the token
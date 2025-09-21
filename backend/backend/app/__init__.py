# app/__init__.py
import os
from flask import Flask, jsonify
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
from .config import Config  # We'll create this next
from bson import ObjectId # Import ObjectId
import json

# Custom JSON Encoder to handle ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

# Load environment variables from .env file
load_dotenv()

mongo = PyMongo()
jwt = JWTManager()

def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), '..', 'static'),
        static_url_path="/static"
        )
    app.config.from_object(Config)
    app.json_encoder = MongoJSONEncoder # Use the custom encoder

    # Initialize extensions
    try:
        mongo.init_app(app)
        print("MongoDB initialized successfully.")
        # Attempt a simple operation to confirm connection
        mongo.db.command('ping')
        print("Successfully pinged MongoDB.")
    except ConnectionFailure:
        print("MongoDB server not available.")
    except Exception as e:
        print(f"An error occurred during MongoDB initialization: {e}")


    jwt.init_app(app)
    CORS(app, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True) # Enable CORS for all routes

    # Create upload folders if they don't exist
    if not os.path.exists(app.config['UPLOAD_FOLDER_THUMBNAILS']):
        os.makedirs(app.config['UPLOAD_FOLDER_THUMBNAILS'])
    if not os.path.exists(app.config['UPLOAD_FOLDER_ADS']):
        os.makedirs(app.config['UPLOAD_FOLDER_ADS'])

    # Register Blueprints (routes)
    from .routes.auth import auth_bp
    from .routes.playlists import playlists_bp
    from .routes.videos import videos_bp
    from .routes.advertisements import advertisements_bp
    from .routes.channel_groups import channel_groups_bp
    from .routes.admin_data import admin_data_bp
    from .routes.public_data import public_data_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(playlists_bp, url_prefix='/api/playlists')
    app.register_blueprint(videos_bp, url_prefix='/api/videos') # Or nested if preferred
    app.register_blueprint(advertisements_bp, url_prefix='/api/advertisements')
    app.register_blueprint(channel_groups_bp, url_prefix='/api/channel_groups')
    app.register_blueprint(admin_data_bp, url_prefix='/api/admin')
    app.register_blueprint(public_data_bp, url_prefix='/api/public_data')

    # Basic route for testing
    @app.route('/')
    def index():
        return jsonify({"message": "Welcome to My Video App Backend API!"})

    # JWT error handlers (optional, for custom responses)
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"msg": "Missing Authorization Header"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"msg": "Invalid token"}), 422

    @jwt.expired_token_loader
    def expired_token_response(callback): # Corrected parameter name
        return jsonify({"msg": "Token has expired"}), 401

    return app
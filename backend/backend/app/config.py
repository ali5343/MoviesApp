# app/config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    MONGO_URI = os.environ.get('MONGO_URI')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    UPLOAD_FOLDER_THUMBNAILS = os.environ.get('UPLOAD_FOLDER_THUMBNAILS', 'static/thumbnails')
    UPLOAD_FOLDER_ADS = os.environ.get('UPLOAD_FOLDER_ADS', 'static/ads')
    # Ensure UPLOAD_FOLDER is absolute or relative to app instance path if needed
    # For simplicity, we're assuming 'static' is at the same level as run.py
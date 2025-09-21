# app/utils/file_helpers.py
import os
from werkzeug.utils import secure_filename
from flask import current_app, request, url_for

ALLOWED_EXTENSIONS_IMAGES = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_EXTENSIONS_VIDEOS = {'mp4', 'mov', 'avi', 'mkv'} # Add more as needed

def allowed_file(filename, allowed_extensions):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_file(file, upload_folder_key, subfolder=""):
    """
    Saves a file to the specified upload folder and returns its URL.
    upload_folder_key should be 'UPLOAD_FOLDER_THUMBNAILS' or 'UPLOAD_FOLDER_ADS'.
    """
    if file and file.filename == '':
        return None, "No selected file"
    
    allowed_extensions = None
    if upload_folder_key == 'UPLOAD_FOLDER_THUMBNAILS':
        allowed_extensions = ALLOWED_EXTENSIONS_IMAGES
    elif upload_folder_key == 'UPLOAD_FOLDER_ADS':
        allowed_extensions = ALLOWED_EXTENSIONS_VIDEOS # Or broader if ads can be images too
    else:
        return None, "Invalid upload folder key"

    if file and allowed_file(file.filename, allowed_extensions):
        filename = secure_filename(file.filename)
        # Ensure the specific upload folder (e.g., static/thumbnails) exists
        upload_path_base = current_app.config[upload_folder_key]
        
        # Create a unique subfolder if desired (e.g., based on ID, or a general subfolder)
        target_folder = os.path.join(upload_path_base, subfolder)
        if not os.path.exists(target_folder):
            os.makedirs(target_folder, exist_ok=True)
            
        file_path = os.path.join(target_folder, filename)
        
        try:
            file.save(file_path)
            # Construct the URL to access the file
            # This assumes your static files are served from '/static/...'
            # and your UPLOAD_FOLDER config starts with 'static/'
            # e.g., UPLOAD_FOLDER_THUMBNAILS = 'static/thumbnails'
            # URL becomes /static/thumbnails/subfolder/filename.jpg
            
            relative_path = os.path.join(os.path.basename(upload_path_base), subfolder, filename)
            relative_path = relative_path.replace("\\", "/")

            # Construct a relative URL (not absolute external)
            file_url = f"/static/{relative_path}"  # e.g. /static/thumbnails/playlists/file.jpg

            return file_url, None
        except Exception as e:
            return None, str(e)
    else:
        return None, f"File type not allowed. Allowed: {allowed_extensions}"
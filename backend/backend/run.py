from app import create_app
from flask import send_from_directory
import os

app = create_app()

@app.route('/uploads/subtitles/<path:filename>')
def serve_subtitles(filename):
    return send_from_directory(os.path.join(os.getcwd(), "uploads", "subtitles"), filename)

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5001, debug=True)  # debug=True for development
    # In production, consider using a WSGI server like Gunicorn or uWSGI
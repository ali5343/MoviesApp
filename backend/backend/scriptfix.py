# scriptfix.py
import os
from flask import Flask
from flask_pymongo import PyMongo
from app import create_app

def fix_thumbnails():
    # Create app with your configs
    app = create_app()
    
    with app.app_context():
        mongo = app.extensions.get("pymongo")  # safer way to access
        if not mongo:
            print("❌ Could not connect to MongoDB. Check your MONGO_URI in config.")
            return

        db = mongo.cx.get_database()  # get the DB instance
        playlists = db.playlists.find({"thumbnail_url": {"$regex": r"\\\\"}})

        fixed_count = 0
        for p in playlists:
            old_url = p.get("thumbnail_url")
            if not old_url:
                continue

            new_url = old_url.replace("\\", "/")
            db.playlists.update_one(
                {"_id": p["_id"]},
                {"$set": {"thumbnail_url": new_url}}
            )
            print(f"✅ Fixed: {old_url} -> {new_url}")
            fixed_count += 1

        if fixed_count == 0:
            print("🎉 No broken thumbnails found.")
        else:
            print(f"🔧 {fixed_count} thumbnail(s) fixed.")

if __name__ == "__main__":
    fix_thumbnails()

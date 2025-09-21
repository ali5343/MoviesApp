from flask import Blueprint, request, jsonify, current_app
from app import mongo
from app.models import DashboardStats, RecentVideoInfo, WatchedSeriesInfo, RegionalAnalyticsSummary, TopPerformingVideo
from pymongo.errors import PyMongoError
from pydantic import ValidationError
from bson import ObjectId

admin_data_bp = Blueprint('admin', __name__)

@admin_data_bp.route('/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    try:
        total_views_result = mongo.db.videos.aggregate([
            {"$group": {"_id": None, "total_views": {"$sum": "$views"}}}
        ])
        total_views = next(total_views_result, {"total_views": 0})["total_views"]

        total_likes_result = mongo.db.videos.aggregate([
            {"$group": {"_id": None, "total_likes": {"$sum": "$likes"}}}
        ])
        total_likes = next(total_likes_result, {"total_likes": 0})["total_likes"]

        total_series = mongo.db.playlists.count_documents({})

        watch_time_hours = 0.0 # Placeholder

        stats = DashboardStats(
            total_views=total_views,
            total_likes=total_likes,
            watch_time_hours=watch_time_hours,
            total_series=total_series
        )
        return jsonify(stats.model_dump()), 200
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@admin_data_bp.route('/recent-videos', methods=['GET'])
def get_recent_videos():
    try:
        recent_videos_cursor = mongo.db.videos.find().sort("created_at", -1).limit(10)
        recent_videos = []
        for video_doc in recent_videos_cursor:
            playlist_doc = mongo.db.playlists.find_one({"_id": video_doc["playlist_id"]})
            region = playlist_doc["region"] if playlist_doc else "N/A"

            video_info = {
                "id": str(video_doc["_id"]),
                "title": video_doc["title"],
                "views": str(video_doc.get("views", 0)),
                "likes": str(video_doc.get("likes", 0)),
                "region": region
            }
            recent_videos.append(video_info)

        return jsonify(recent_videos), 200
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@admin_data_bp.route('/watched-series', methods=['GET'])
def get_watched_series_info():
    try:
        # Just sum views as total_watch_time placeholder
        series_info_cursor = mongo.db.playlists.aggregate([
            {
                "$lookup": {
                    "from": "videos",
                    "localField": "_id",
                    "foreignField": "playlist_id",
                    "as": "videos"
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "title": 1,
                    "region": 1,
                    "total_videos": {"$size": "$videos"},
                    "total_watch_time": {"$sum": "$videos.views"} # Placeholder
                }
            }
        ])
        series_info = list(series_info_cursor)

        for doc in series_info:
            doc["_id"] = str(doc["_id"])
        # series_info = []
        # for doc in series_info_cursor:
        #     print("Arsooo")
        #     series_info.append(WatchedSeriesInfo(
        #         id=doc["_id"],
        #         title=doc["title"],
        #         total_watch_time=str(doc.get("total_watch_time", 0)),
        #         total_videos=doc.get("total_videos", 0),
        #         region=doc.get("region", "")
        #     ).model_dump(by_alias=True))
        return jsonify(series_info), 200
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@admin_data_bp.route('/regional_analytics_summary', methods=['GET'])
def get_regional_analytics_summary():
    # "duration_in_seconds" not implemented, using dummy value
    try:
        regional_summary_cursor = mongo.db.videos.aggregate([
            {
                "$lookup": {
                    "from": "playlists",
                    "localField": "playlist_id",
                    "foreignField": "_id",
                    "as": "playlist_info"
                }
            },
            {"$unwind": "$playlist_info"},
            {
                "$group": {
                    "_id": "$playlist_info.region",
                    "views": {"$sum": "$views"},
                    # "watch_time": {"$sum": "$duration_in_seconds"}
                    # "avg_duration": {"$avg": "$duration_in_seconds"}
                }
            },
            {
                "$project": {
                    "region": "$_id",
                    "views": {"$toString": "$views"},
                    "watch_time": {"$literal": "N/A"},
                    "avg_duration": {"$literal": "N/A"}
                }
            }
        ])
        regional_analytics = []
        # print(list(regional_summary_cursor))
        for doc in regional_summary_cursor:
            regional_analytics.append(RegionalAnalyticsSummary(**doc).model_dump())
        return jsonify(regional_analytics), 200
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@admin_data_bp.route('/top_performing_videos', methods=['GET'])
def get_top_performing_videos():
    try:
        top_videos_cursor = mongo.db.videos.aggregate([
            {
                "$lookup": {
                    "from": "playlists",
                    "localField": "playlist_id",
                    "foreignField": "_id",
                    "as": "playlist_info"
                }
            },
            {"$unwind": "$playlist_info"},
            {"$sort": {"views": -1}},
            {"$limit": 10},
            {
                "$project": {
                    "_id": 0,
                    "title": "$title",
                    "region": "$playlist_info.region",
                    "views": {"$toString": "$views"},
                    "likes": {"$toString": "$likes"}
                }
            }
        ])
        top_videos = []
        for doc in top_videos_cursor:
            top_videos.append(TopPerformingVideo(**doc).model_dump())
        return jsonify(top_videos), 200
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@admin_data_bp.route('/admin/analytics/regions', methods=['GET'])
def regional_analytics():
    try:
        # Example: return counts per region from playlists or videos collection
        pipeline = [
            {"$group": {"_id": "$region", "count": {"$sum": 1}}}
        ]
        res = list(mongo.db.playlists.aggregate(pipeline))
        # normalize
        out = [{"region": r.get("_id") or "unknown", "count": r.get("count", 0)} for r in res]
        return jsonify({"regions": out}), 200
    except Exception as e:
        current_app.logger.exception("Failed to compute regional analytics")
        return jsonify({"msg": "Internal server error", "error": str(e)}), 500
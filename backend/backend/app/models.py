# app/models.py
from pydantic import BaseModel, Field, HttpUrl, EmailStr, validator
from typing import List, Optional, Any
from datetime import datetime
from bson import ObjectId # Import ObjectId
from pydantic.json_schema import JsonSchemaValue # Import JsonSchemaValue

# Helper to allow ObjectId in Pydantic models and convert to str for JSON
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler) -> JsonSchemaValue:
        # Get the default JSON schema for the type
        json_schema = handler(core_schema)
        # Update the schema to specify type as string
        json_schema.update(type="string")
        return json_schema

# Rest of your models.py content remains the same
# --- User Models ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserCreate):
    pass

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias='_id')
    hashed_password: str
    role: str = "admin"

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Video Models ---
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = ""
    keywords: Optional[str] = "" # Comma-separated string or List[str]
    video_link: HttpUrl # Embed link for videos

class VideoCreate(VideoBase):
    pass # No extra fields for creation beyond base initially

class VideoUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    keywords: Optional[str]
    video_link: Optional[HttpUrl]

class VideoInDB(VideoBase):
    id: PyObjectId = Field(alias='_id')
    playlist_id: PyObjectId # Reference to the playlist
    # Add other fields from your React state if needed, e.g., views, likes
    views: int = 0
    likes: int = 0
    region: Optional[str] # Can be inherited from playlist
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

# --- Playlist (Series) Models ---
class PlaylistBase(BaseModel):
    title: str
    description: Optional[str] = ""
    keywords: Optional[str] = "" # Comma-separated
    region: str
    thumbnail_url: Optional[HttpUrl] = None
    genre: str # e.g., 'Education', 'Entertainment'

    # thumbnail_url will be set after file upload by the server

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistUpdate(BaseModel):
    # make all update fields optional so partial updates won't fail validation
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None  # or Optional[List[str]] depending on your app shape
    region: Optional[str] = None
    genre: Optional[str] = None

    # thumbnail_url might be updated via a separate endpoint or if a new file is uploaded

class PlaylistInDB(PlaylistBase):
    id: PyObjectId = Field(alias='_id')
    thumbnail_url: Optional[HttpUrl] = None # URL of the uploaded thumbnail
    videos: List[VideoInDB] = [] # List of embedded/referenced videos
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

# --- Advertisement Models ---
class AdBase(BaseModel):
    target_video_id: PyObjectId # ID of the video the ad is for
    placement: str # e.g., 'before', 'after'

    @validator('placement')
    def placement_must_be_valid(cls, v):
        if v not in ['before', 'after']:
            raise ValueError('Placement must be "before" or "after"')
        return v

class AdCreate(AdBase):
    # ad_file_name and ad_file_url will be set by the server after upload
    pass

class AdInDB(AdBase):
    id: PyObjectId = Field(alias='_id')
    ad_file_name: str
    ad_file_url: HttpUrl
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

# --- Channel Group Models ---
class ChannelGroupBase(BaseModel):
    region: str
    type: str # e.g., 'Telegram', 'WhatsApp', 'WeChat'
    link: HttpUrl

class ChannelGroupCreate(ChannelGroupBase):
    pass

class ChannelGroupUpdate(BaseModel):
    region: Optional[str]
    type: Optional[str]
    link: Optional[HttpUrl]

class ChannelGroupInDB(ChannelGroupBase):
    id: PyObjectId = Field(alias='_id')
    clicks: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

# --- For Admin Data & Public Data ---
# These will often be compositions of the models above or specific summary structures

class DashboardStats(BaseModel):
    total_views: int
    total_likes: int
    watch_time_hours: float # Or string like "4.5K"
    total_series: int

class RecentVideoInfo(BaseModel):
    id: PyObjectId
    title: str
    views: str # Or int
    likes: str # Or int
    region: str

class WatchedSeriesInfo(BaseModel):
    id: PyObjectId
    title: str
    total_watch_time: str # Or float
    total_videos: int # Renamed from totalEpisodes for clarity
    region: str

class RegionalAnalyticsSummary(BaseModel):
    region: str
    views: str
    watch_time: str
    # subscribers: str # You had this commented out, can be added
    avg_duration: str

class TopPerformingVideo(BaseModel):
    title: str
    region: str
    views: str
    likes: str
"""Database connection and utilities."""
import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from typing import Optional

# Database connection
_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def get_database() -> Database:
    """Get database connection."""
    global _client, _db
    
    if _db is None:
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        db_name = os.getenv("DATABASE_NAME", "checkers_ai")
        
        _client = MongoClient(mongodb_uri)
        _db = _client[db_name]

        # Create indexes on first connection
        _create_indexes(_db)
        
    return _db


def _create_indexes(db: Database):
    """Create database indexes for better performance."""
    # Users collection indexes
    users = db["users"]
    users.create_index([("email", ASCENDING)], unique=True)
    users.create_index([("username", ASCENDING)], unique=True)
    users.create_index([("stats.rating", DESCENDING)])
    users.create_index([("stats.total_games", DESCENDING)])
    
    # Games collection indexes
    games = db["games"]
    games.create_index([("user_id", ASCENDING)])
    games.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    games.create_index([("result", ASCENDING)])
    games.create_index([("game_mode", ASCENDING)])
    
    # Analyses collection indexes
    analyses = db["game_analyses"]
    analyses.create_index([("game_id", ASCENDING)], unique=True)
    analyses.create_index([("user_id", ASCENDING)])


def close_database():
    """Close database connection."""
    global _client
    if _client:
        _client.close()
        _client = None


def get_users_collection():
    """Get users collection."""
    return get_database()["users"]


def get_games_collection():
    """Get games collection."""
    return get_database()["games"]


def get_analyses_collection():
    """Get game analyses collection."""
    return get_database()["game_analyses"]

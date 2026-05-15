"""Pydantic models for API validation."""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# ==================== Enums ====================

class GameMode(str, Enum):
    BOT = "bot"
    OFFLINE = "offline"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    FREEPLAY = "freeplay"


class PlayerColor(str, Enum):
    RED = "red"
    WHITE = "white"


class GameResult(str, Enum):
    WIN = "win"
    LOSS = "loss"
    DRAW = "draw"
    RESIGNED = "resigned"
    IN_PROGRESS = "in_progress"


class VerificationType(str, Enum):
    NONE = "none"
    EMAIL = "email"
    PHONE = "phone"


class MoveClassification(str, Enum):
    BEST = "best"
    GOOD = "good"
    INACCURACY = "inaccuracy"
    MISTAKE = "mistake"
    BLUNDER = "blunder"
    FORCED = "forced"


# ==================== User Models ====================

class UserStats(BaseModel):
    rating: int = 1000
    total_games: int = 0
    total_wins: int = 0
    total_losses: int = 0
    total_draws: int = 0
    win_streak: int = 0
    best_streak: int = 0
    bot_games: int = 0
    bot_wins: int = 0
    offline_games: int = 0
    games_analyzed: int = 0


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class User(BaseModel):
    id: str
    username: str
    email: str
    is_verified: bool = False
    verification_type: VerificationType = VerificationType.NONE
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    stats: UserStats = UserStats()


# ==================== Game Models ====================

class MoveRecord(BaseModel):
    move_number: Optional[int] = None
    player: Optional[str] = None
    from_pos: dict = Field(default_factory=dict, alias='from')  # {"row": int, "col": int}
    to: dict = Field(default_factory=dict)  # {"row": int, "col": int}
    captures: List[dict] = []
    promotes: bool = False
    notation: Optional[str] = None
    original_type: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        extra = 'allow'
        populate_by_name = True


class GameSettings(BaseModel):
    game_mode: GameMode
    difficulty: Difficulty = Difficulty.MEDIUM
    player_color: PlayerColor = PlayerColor.RED
    show_insights: bool = True
    can_change_difficulty: bool = False


class GameCreate(BaseModel):
    game_mode: GameMode
    difficulty: Difficulty = Difficulty.MEDIUM
    player_color: PlayerColor = PlayerColor.RED
    show_insights: bool = True
    can_change_difficulty: bool = False
    is_rated: bool = True


class Game(BaseModel):
    id: str
    user_id: str
    game_number: int
    game_id: str
    
    # Settings
    game_mode: GameMode
    difficulty: Difficulty
    player_color: PlayerColor
    show_insights: bool
    can_change_difficulty: bool
    is_rated: bool
    
    # Result
    result: GameResult = GameResult.IN_PROGRESS
    winner: Optional[str] = None
    final_state: Optional[dict] = None
    
    # Moves
    moves: List[MoveRecord] = []
    
    # Stats
    captured_by_red: int = 0
    captured_by_white: int = 0
    
    # Duration
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0

    # Analysis
    is_analyzed: bool = False
    analyzed_at: Optional[datetime] = None
    analysis: Optional[dict] = None

    class Config:
        extra = 'allow'


class GameList(BaseModel):
    games: List[Game]
    total: int
    page: int
    per_page: int


# ==================== Analysis Models ====================

class MoveAnalysis(BaseModel):
    move_number: int
    classification: MoveClassification
    evaluation_before: float
    evaluation_after: float
    best_move: Optional[dict] = None
    explanation: str


class CriticalMoment(BaseModel):
    move_number: int
    description: str
    evaluation_change: float


class AnalysisSummary(BaseModel):
    accuracy: float = Field(..., ge=0, le=100)
    best_moves: int = 0
    good_moves: int = 0
    inaccuracies: int = 0
    mistakes: int = 0
    blunders: int = 0


class GameAnalysisCreate(BaseModel):
    game_id: str
    analysis_type: str = "full"


class GameAnalysis(BaseModel):
    id: str
    game_id: str
    user_id: str
    
    analysis_type: str
    moves_analyzed: int
    
    move_analysis: List[MoveAnalysis] = []
    
    # Summary
    accuracy: float
    acpl: float = 0.0
    best_moves: int
    good_moves: int
    inaccuracies: int
    mistakes: int
    blunders: int
    forced_moves: int = 0
    
    # Key moments
    critical_moments: List[CriticalMoment] = []
    
    created_at: datetime


# ==================== Game Summary Models ====================

class GameSummary(BaseModel):
    game_id: str
    summary: str
    key_insights: List[str]
    created_at: datetime


# ==================== Leaderboard Models ====================

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    rating: int
    total_games: int
    total_wins: int
    win_rate: float


class Leaderboard(BaseModel):
    entries: List[LeaderboardEntry]
    total_users: int
    page: int
    per_page: int

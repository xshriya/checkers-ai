"""FastAPI application for Checkers AI."""
import os
import secrets
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
import math
from bson import ObjectId
from groq import Groq

from dotenv import load_dotenv
load_dotenv()

from .database import (
    get_database,
    close_database,
    get_users_collection,
    get_games_collection,
    get_analyses_collection
)
from .game.moves import Move
from .game.state import PieceType, Player, GameState
from .game import (
    create_initial_state,
    apply_move,
    get_ai_move,
    evaluate,
    generate_legal_moves,
    get_moves_for_piece
)
from .models import (
    User, UserCreate, UserStats,
    GameMode, Difficulty, PlayerColor, GameResult,
    GameCreate, Game, GameList, MoveRecord,
    MoveAnalysis, MoveClassification, CriticalMoment,
    GameAnalysis, GameSummary,
    LeaderboardEntry, Leaderboard
)
from .email_service import send_otp_email, store_otp, verify_otp

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ==================== ELO Rating System ====================

def calculate_elo_rating(player_rating: int, opponent_rating: int, result: str, k_factor: int = 32) -> int:
    """
    Calculate new ELO rating using the standard ELO formula.

    Args:
        player_rating: Current rating of the player
        opponent_rating: Rating of the opponent
        result: 'win', 'loss', or 'draw'
        k_factor: K-factor determines how much ratings change (default 32)

    Returns:
        New rating for the player
    """
    # Calculate expected score
    expected_score = 1 / (1 + 10 ** ((opponent_rating - player_rating) / 400))

    # Determine actual score
    if result == 'win':
        actual_score = 1.0
    elif result == 'loss':
        actual_score = 0.0
    elif result == 'draw':
        actual_score = 0.5
    else:
        return player_rating

    # Calculate new rating
    new_rating = player_rating + k_factor * (actual_score - expected_score)
    return int(round(new_rating))


def get_bot_rating(difficulty: str) -> int:
    """
    Get the rating for a bot based on difficulty level.

    Args:
        difficulty: 'easy', 'medium', or 'hard'

    Returns:
        Bot rating
    """
    bot_ratings = {
        'easy': 800,
        'medium': 1200,
        'hard': 1600
    }
    return bot_ratings.get(difficulty, 1000)


# ==================== FastAPI Application ====================
from .auth import (
    User, 
    Token,
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_auth,
    optional_auth
)
from .models import (
    UserCreate,
    UserLogin,
    UserStats,
    VerificationType,
    GameCreate,
    Game,
    GameList,
    GameAnalysisCreate,
    GameAnalysis,
    MoveAnalysis,
    CriticalMoment,
    MoveClassification,
    Leaderboard,
    LeaderboardEntry,
    GameMode,
    GameResult,
    Difficulty,
    PlayerColor
)

app = FastAPI(title="Checkers AI API")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection on startup."""
    get_database()
    print("Connected to MongoDB")


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    close_database()
    print("Disconnected from MongoDB")


# In-memory game storage (use Redis/DB for production)
games: dict[str, GameState] = {}


class MoveRequest(BaseModel):
    game_id: str
    move: dict  # {from: {row, col}, to: {row, col}}


class AIMoveRequest(BaseModel):
    game_id: str
    difficulty: str = "medium"


class NewGameRequest(BaseModel):
    pass


@app.get("/")
async def root():
    return {"message": "Checkers AI API", "status": "running"}


@app.post("/game/new")
async def new_game():
    """Create a new game."""
    game_id = str(uuid.uuid4())[:8]
    state = create_initial_state()
    games[game_id] = state
    return {"game_id": game_id, "state": state.model_dump()}


@app.get("/game/{game_id}")
async def get_game(game_id: str):
    """Get current game state."""
    if game_id not in games:
        return {"error": "Game not found"}
    return {"game_id": game_id, "state": games[game_id].model_dump()}


@app.post("/game/move")
async def make_move(request: MoveRequest):
    """Apply a player move."""
    game_id = request.game_id
    if game_id not in games:
        return {"error": "Game not found"}

    state = games[game_id]

    # Find the legal move that matches
    legal_moves = generate_legal_moves(state)
    matching_move = None

    for m in legal_moves:
        if (
            m.from_pos["row"] == request.move["from"]["row"]
            and m.from_pos["col"] == request.move["from"]["col"]
            and m.to["row"] == request.move["to"]["row"]
            and m.to["col"] == request.move["to"]["col"]
        ):
            matching_move = m
            break

    if not matching_move:
        return {"error": "Invalid move", "legal_moves": [m.model_dump() for m in legal_moves]}

    new_state = apply_move(state, matching_move)
    games[game_id] = new_state

    return {"game_id": game_id, "state": new_state.model_dump(), "move": matching_move.model_dump()}


@app.post("/game/ai-move")
async def ai_move(request: AIMoveRequest):
    """Get AI move and apply it."""
    game_id = request.game_id
    if game_id not in games:
        return {"error": "Game not found"}

    state = games[game_id]

    result = get_ai_move(state, request.difficulty)

    if result["move"]:
        new_state = apply_move(state, result["move"])
        games[game_id] = new_state
        return {
            "game_id": game_id,
            "state": new_state.model_dump(),
            "move": result["move"].model_dump(),
            "explanation": result["explanation"],
            "continuation": result.get("continuation", [])
        }

    return {"game_id": game_id, "state": state.model_dump(), "error": "No AI move available"}


@app.get("/game/{game_id}/legal-moves")
async def get_legal_moves(game_id: str):
    """Get all legal moves for current player."""
    if game_id not in games:
        return {"error": "Game not found"}

    state = games[game_id]
    moves = generate_legal_moves(state)

    return {"game_id": game_id, "legal_moves": [m.model_dump() for m in moves]}


@app.get("/game/{game_id}/moves/{row}/{col}")
async def get_piece_moves(game_id: str, row: int, col: int):
    """Get legal moves for a specific piece."""
    if game_id not in games:
        return {"error": "Game not found"}

    state = games[game_id]
    moves = get_moves_for_piece(state, row, col)

    return {"game_id": game_id, "moves": [m.model_dump() for m in moves]}


class UndoRequest(BaseModel):
    game_id: str


@app.post("/game/undo")
async def undo_move(request: UndoRequest):
    """Undo the last two moves (AI + player)."""
    game_id = request.game_id
    if game_id not in games:
        return {"error": "Game not found"}

    state = games[game_id]

    if len(state.move_history) < 2:
        return {"error": "Not enough moves to undo", "state": state.model_dump()}

    # Undo twice (AI move + player move)
    from .game.apply_move import undo_move as undo_move_fn

    new_state = undo_move_fn(state)
    new_state = undo_move_fn(new_state)

    games[game_id] = new_state

    return {"game_id": game_id, "state": new_state.model_dump()}


class HintRequest(BaseModel):
    game_id: str
    difficulty: str = "medium"


@app.post("/game/hint")
async def get_hint(request: HintRequest):
    """Get a hint for the best move (without applying it)."""
    game_id = request.game_id
    if game_id not in games:
        return {"error": "Game not found"}

    state = games[game_id]

    result = get_ai_move(state, request.difficulty)

    if result["move"]:
        return {
            "game_id": game_id,
            "move": result["move"].model_dump(),
            "explanation": result["explanation"],
        }

    return {"game_id": game_id, "error": "No hint available"}


# ==================== Authentication Endpoints ====================

@app.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user (unverified by default)."""
    users = get_users_collection()
    
    # Check if email already exists
    existing_user = users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user document with verification status and stats
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "is_verified": False,
        "verification_type": VerificationType.NONE,
        "created_at": datetime.utcnow(),
        "stats": UserStats().model_dump()
    }
    
    result = users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with email and password."""
    print(f"DEBUG: Login attempt with email: {credentials.email}")
    users = get_users_collection()

    # Find user by email
    user_doc = users.find_one({"email": credentials.email})
    print(f"DEBUG: User found: {user_doc is not None}")

    if not user_doc:
        print(f"DEBUG: User not found for email: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    password_valid = verify_password(credentials.password, user_doc["password_hash"])
    print(f"DEBUG: Password valid: {password_valid}")

    if not password_valid:
        print(f"DEBUG: Invalid password for email: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    user_id = str(user_doc["_id"])
    access_token = create_access_token(
        data={"sub": user_id, "email": user_doc["email"]}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@app.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(require_auth)):
    """Get current authenticated user."""
    return current_user


@app.get("/auth/status")
async def auth_status(current_user: Optional[User] = Depends(optional_auth)):
    """Check authentication status."""
    if current_user:
        stats_dict = {
            "rating": current_user.stats.rating if current_user.stats else 1000,
            "total_games": current_user.stats.total_games if current_user.stats else 0,
            "total_wins": current_user.stats.total_wins if current_user.stats else 0,
            "total_losses": current_user.stats.total_losses if current_user.stats else 0,
            "total_draws": current_user.stats.total_draws if current_user.stats else 0,
            "win_streak": current_user.stats.win_streak if current_user.stats else 0,
            "best_streak": current_user.stats.best_streak if current_user.stats else 0,
            "bot_games": current_user.stats.bot_games if current_user.stats else 0,
            "bot_wins": current_user.stats.bot_wins if current_user.stats else 0,
            "offline_games": current_user.stats.offline_games if current_user.stats else 0,
            "games_analyzed": current_user.stats.games_analyzed if current_user.stats else 0
        }

        return {
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "stats": stats_dict
            }
        }
    return {"authenticated": False, "user": None}


# ==================== OTP Authentication Endpoints ====================

class OTPRequest(BaseModel):
    email: str

class OTPVerifyRequest(BaseModel):
    email: str
    otp_code: str

class PasswordResetRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str

class SignupWithOTPRequest(BaseModel):
    username: str
    email: str
    password: str
    otp_code: str

class UsernameCheckRequest(BaseModel):
    username: str


@app.post("/auth/check-username")
async def check_username(request: UsernameCheckRequest):
    """Check if username is available."""
    users = get_users_collection()
    existing_user = users.find_one({"username": request.username})
    
    if existing_user:
        return {"available": False, "message": "Username already taken"}
    
    return {"available": True, "message": "Username available"}


@app.post("/auth/send-otp")
async def send_otp(request: OTPRequest, purpose: str = "verification"):
    """Send OTP code to user's email for signup or password reset."""
    # Generate OTP code
    otp_code = ''.join(secrets.choice('0123456789') for _ in range(6))
    
    # Store OTP
    store_otp(request.email, otp_code, purpose)
    
    # Send email
    if send_otp_email(request.email, otp_code, purpose):
        return {"message": "OTP sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")


@app.post("/auth/verify-otp")
async def verify_otp_code(request: OTPVerifyRequest, purpose: str = "verification"):
    """Verify OTP code for signup."""
    if not verify_otp(request.email, request.otp_code, purpose):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
    
    # OTP verified - check if user already exists
    users = get_users_collection()
    existing_user = users.find_one({"email": request.email})
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create temporary verified email record (user will complete signup)
    return {"message": "OTP verified successfully", "email_verified": True}


@app.post("/auth/signup-with-otp")
async def signup_with_otp(request: SignupWithOTPRequest):
    """Complete signup with verified OTP."""
    # Verify OTP first
    if not verify_otp(request.email, request.otp_code, "verification"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
    
    # Check if user already exists
    users = get_users_collection()
    existing_user = users.find_one({"email": request.email})
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = users.find_one({"username": request.username})
    
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    password_hash = get_password_hash(request.password)
    
    # Create new user
    new_user = {
        "username": request.username,
        "email": request.email,
        "password_hash": password_hash,
        "stats": {
            "rating": 1000,
            "total_games": 0,
            "total_wins": 0,
            "total_losses": 0,
            "total_draws": 0,
            "win_streak": 0,
            "best_streak": 0,
            "bot_games": 0,
            "bot_wins": 0,
            "offline_games": 0,
            "games_analyzed": 0
        },
        "created_at": datetime.utcnow(),
    }
    
    result = users.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "email": request.email}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@app.post("/auth/forgot-password")
async def forgot_password(request: OTPRequest):
    """Send OTP for password reset."""
    # Check if user exists
    users = get_users_collection()
    user = users.find_one({"email": request.email})
    
    if not user:
        # Don't reveal if email exists (security best practice)
        return {"message": "If the email exists, an OTP has been sent"}
    
    # Generate and send OTP
    otp_code = ''.join(secrets.choice('0123456789') for _ in range(6))
    store_otp(request.email, otp_code, "reset")
    
    if send_otp_email(request.email, otp_code, "reset"):
        return {"message": "OTP sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")


@app.post("/auth/reset-password")
async def reset_password(request: PasswordResetRequest):
    """Reset password with OTP verification."""
    # Verify OTP
    if not verify_otp(request.email, request.otp_code, "reset"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
    
    # Check if user exists
    users = get_users_collection()
    user = users.find_one({"email": request.email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    new_password_hash = get_password_hash(request.new_password)
    
    # Update password
    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    return {"message": "Password reset successfully"}


@app.post("/auth/recalculate-stats")
async def recalculate_stats(current_user: User = Depends(require_auth)):
    """Recalculate user stats based on actual games in database."""
    games = get_games_collection()
    users = get_users_collection()
    analyses = get_analyses_collection()

    # Get all games for this user
    user_games = list(games.find({"user_id": current_user.id}))

    # Calculate stats from actual games
    total_games = len(user_games)
    total_wins = 0
    total_losses = 0
    total_draws = 0
    bot_games = 0
    bot_wins = 0
    offline_games = 0

    for game in user_games:
        if game.get("game_mode") == GameMode.BOT:
            bot_games += 1
        elif game.get("game_mode") == GameMode.OFFLINE:
            offline_games += 1

        result = game.get("result", GameResult.IN_PROGRESS)
        if result == GameResult.WIN:
            total_wins += 1
            if game.get("game_mode") == GameMode.BOT:
                bot_wins += 1
        elif result == GameResult.LOSS or result == GameResult.RESIGNED:
            total_losses += 1
        elif result == GameResult.DRAW:
            total_draws += 1

    # Get analyzed games count
    analyzed_games = list(analyses.find({"user_id": current_user.id}))
    games_analyzed = len(analyzed_games)

    # Update user stats
    new_stats = {
        "stats.total_games": total_games,
        "stats.total_wins": total_wins,
        "stats.total_losses": total_losses,
        "stats.total_draws": total_draws,
        "stats.bot_games": bot_games,
        "stats.bot_wins": bot_wins,
        "stats.offline_games": offline_games,
        "stats.games_analyzed": games_analyzed,
        "stats.win_streak": 0,
        "stats.best_streak": 0
    }

    users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": new_stats}
    )

    return {
        "message": "Stats recalculated successfully",
        "old_stats": current_user.stats.model_dump(),
        "new_stats": new_stats
    }


# ==================== Game Management Endpoints ====================

@app.post("/games", response_model=Game)
async def create_game(game_data: GameCreate, current_user: User = Depends(require_auth)):
    """Create a new game record."""
    games = get_games_collection()
    users = get_users_collection()

    # Get user's game count for numbering
    user_games_count = games.count_documents({"user_id": current_user.id})
    game_number = user_games_count + 1

    # Generate unique game ID
    game_id = str(uuid.uuid4())[:8]

    # Create game document
    game_doc = {
        "user_id": current_user.id,
        "game_number": game_number,
        "game_id": game_id,
        "game_mode": game_data.game_mode,
        "difficulty": game_data.difficulty,
        "player_color": game_data.player_color,
        "show_insights": game_data.show_insights,
        "can_change_difficulty": game_data.can_change_difficulty,
        "is_rated": game_data.is_rated,
        "result": GameResult.IN_PROGRESS,
        "moves": [],
        "captured_by_red": 0,
        "captured_by_white": 0,
        "started_at": datetime.utcnow(),
        "is_analyzed": False
    }

    result = games.insert_one(game_doc)

    return Game(
        id=str(result.inserted_id),
        user_id=current_user.id,
        game_number=game_number,
        game_id=game_id,
        game_mode=game_data.game_mode,
        difficulty=game_data.difficulty,
        player_color=game_data.player_color,
        show_insights=game_data.show_insights,
        can_change_difficulty=game_data.can_change_difficulty,
        is_rated=game_data.is_rated,
        result=GameResult.IN_PROGRESS,
        moves=[],
        captured_by_red=0,
        captured_by_white=0,
        started_at=game_doc["started_at"],
        is_analyzed=False
    )


@app.put("/games/{game_id}/complete")
async def complete_game(
    game_id: str,
    result: GameResult,
    winner: Optional[str] = None,
    final_state: Optional[dict] = None,
    current_user: User = Depends(require_auth)
):
    """Complete a game with result."""
    games = get_games_collection()
    users = get_users_collection()
    
    # Find game
    game = games.find_one({"game_id": game_id, "user_id": current_user.id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check if game is already completed
    if game.get("result") and game.get("result") != GameResult.IN_PROGRESS:
        return {"message": "Game already completed"}

    # Calculate duration
    ended_at = datetime.utcnow()
    duration_seconds = int((ended_at - game["started_at"]).total_seconds())

    # Update game
    update_data = {
        "result": result,
        "winner": winner,
        "final_state": final_state,
        "ended_at": ended_at,
        "duration_seconds": duration_seconds
    }

    # Extract moves from final_state if available
    # Handle nested structure: final_state may contain {final_state: {...}}
    actual_state = final_state.get("final_state") if final_state and "final_state" in final_state else final_state

    if actual_state and "move_history" in actual_state:
        update_data["moves"] = actual_state["move_history"]

    games.update_one(
        {"game_id": game_id},
        {"$set": update_data}
    )

    # Update user stats
    stats_update = {
        "stats.total_games": 1,
        f"stats.{game['game_mode']}_games": 1
    }

    if result == GameResult.WIN:
        stats_update["stats.total_wins"] = 1
        stats_update["stats.win_streak"] = 1
        if game["game_mode"] == GameMode.BOT:
            stats_update["stats.bot_wins"] = 1
    elif result == GameResult.LOSS:
        stats_update["stats.total_losses"] = 1
        stats_update["stats.win_streak"] = 0
    elif result == GameResult.DRAW:
        stats_update["stats.total_draws"] = 1
        stats_update["stats.win_streak"] = 0
    elif result == GameResult.RESIGNED:
        stats_update["stats.total_losses"] = 1
        stats_update["stats.win_streak"] = 0

    # Update best streak
    user = users.find_one({"_id": ObjectId(current_user.id)})
    current_streak = user.get("stats", {}).get("win_streak", 0)
    best_streak = user.get("stats", {}).get("best_streak", 0)

    if current_streak > best_streak:
        stats_update["stats.best_streak"] = current_streak

    users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$inc": stats_update}
    )

    # Calculate and update ELO rating only if game is rated
    if game.get("is_rated", False):
        current_rating = user.get("stats", {}).get("rating", 1000)

        if game["game_mode"] == GameMode.BOT:
            # Bot game - use bot rating based on difficulty
            bot_rating = get_bot_rating(game.get("difficulty", "medium"))
            opponent_rating = bot_rating
        else:
            # Offline or other modes - don't update ELO rating
            return {"message": "Game completed successfully"}

        # Convert result to string for ELO calculation
        result_str = result.value if hasattr(result, 'value') else str(result).lower()
        if result_str == 'resigned':
            result_str = 'loss'

        new_rating = calculate_elo_rating(current_rating, opponent_rating, result_str)

        users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"stats.rating": new_rating}}
        )

    return {"message": "Game completed successfully"}


@app.get("/games", response_model=GameList)
async def get_user_games(
    page: int = 1,
    per_page: int = 20,
    game_mode: Optional[GameMode] = None,
    current_user: User = Depends(require_auth)
):
    """Get user's games with pagination."""
    games = get_games_collection()
    analyses = get_analyses_collection()

    # Build query
    query = {"user_id": current_user.id}
    if game_mode:
        query["game_mode"] = game_mode

    # Get total count
    total = games.count_documents(query)

    # Get paginated games
    skip = (page - 1) * per_page
    games_cursor = games.find(query).sort("started_at", -1).skip(skip).limit(per_page)

    games_list = []
    for game in games_cursor:
        game_id = game.get("game_id", str(game["_id"]))

        # Try to get analysis for this game
        analysis = analyses.find_one({"game_id": game_id})

        # Construct Game object with only the fields we need
        game_obj = Game(
            id=str(game["_id"]),
            user_id=str(game.get("user_id", "")),
            game_number=game.get("game_number", 0),
            game_id=game_id,
            game_mode=game.get("game_mode", GameMode.BOT),
            difficulty=game.get("difficulty", Difficulty.MEDIUM),
            player_color=game.get("player_color", PlayerColor.RED),
            show_insights=game.get("show_insights", True),
            can_change_difficulty=game.get("can_change_difficulty", False),
            is_rated=game.get("is_rated", True),
            result=game.get("result", GameResult.IN_PROGRESS),
            winner=game.get("winner"),
            final_state=game.get("final_state"),
            moves=game.get("moves", []),
            captured_by_red=game.get("captured_by_red", 0),
            captured_by_white=game.get("captured_by_white", 0),
            started_at=game.get("started_at"),
            ended_at=game.get("ended_at"),
            duration_seconds=game.get("duration_seconds", 0),
            is_analyzed=game.get("is_analyzed", False),
            analyzed_at=game.get("analyzed_at")
        )

        # Add analysis if exists
        if analysis:
            game_obj.analysis = {
                "accuracy": analysis.get("accuracy", 0),
                "best_moves": analysis.get("best_moves", 0),
                "good_moves": analysis.get("good_moves", 0),
                "inaccuracies": analysis.get("inaccuracies", 0),
                "mistakes": analysis.get("mistakes", 0),
                "blunders": analysis.get("blunders", 0),
                "moves_analyzed": analysis.get("moves_analyzed", 0)
            }

        games_list.append(game_obj)

    return GameList(
        games=games_list,
        total=total,
        page=page,
        per_page=per_page
    )


@app.get("/games/{game_id}", response_model=Game)
async def get_game(game_id: str, current_user: User = Depends(require_auth)):
    """Get a specific game."""
    games = get_games_collection()

    game = games.find_one({"game_id": game_id, "user_id": current_user.id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return Game(
        id=str(game["_id"]),
        user_id=str(game.get("user_id", "")),
        game_number=game.get("game_number", 0),
        game_id=game.get("game_id", ""),
        game_mode=game.get("game_mode", GameMode.BOT),
        difficulty=game.get("difficulty", Difficulty.MEDIUM),
        player_color=game.get("player_color", PlayerColor.RED),
        show_insights=game.get("show_insights", True),
        can_change_difficulty=game.get("can_change_difficulty", False),
        is_rated=game.get("is_rated", True),
        result=game.get("result", GameResult.IN_PROGRESS),
        winner=game.get("winner"),
        final_state=game.get("final_state"),
        moves=game.get("moves", []),
        captured_by_red=game.get("captured_by_red", 0),
        captured_by_white=game.get("captured_by_white", 0),
        started_at=game.get("started_at"),
        ended_at=game.get("ended_at"),
        duration_seconds=game.get("duration_seconds", 0),
        is_analyzed=game.get("is_analyzed", False),
        analyzed_at=game.get("analyzed_at")
    )


@app.get("/games/{game_id}/replay")
async def get_game_replay(game_id: str, current_user: User = Depends(require_auth)):
    """Get game with full state for replay."""
    games = get_games_collection()

    game = games.find_one({"game_id": game_id, "user_id": current_user.id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Extract final_state from nested structure
    final_state = game.get("final_state", {})
    actual_state = final_state.get("final_state") if "final_state" in final_state else final_state

    return {
        "game_id": game["game_id"],
        "moves": game.get("moves", []),
        "final_state": actual_state,
        "result": game.get("result"),
        "winner": game.get("winner")
    }


@app.get("/games/{game_id}/state/{move_number}")
async def get_state_at_move(game_id: str, move_number: int, current_user: User = Depends(require_auth)):
    """Get game state at a specific move (move_number is 0-indexed, -1 for start)."""
    games = get_games_collection()

    game = games.find_one({"game_id": game_id, "user_id": current_user.id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    moves = game.get("moves", [])

    # Create initial state
    state = create_initial_state()

    # Apply moves up to move_number
    for i in range(min(move_number + 1, len(moves))):
        move_data = moves[i]
        move = Move(
            from_pos=move_data["from"],
            to=move_data["to"],
            captures=move_data.get("captures", []),
            is_capture=move_data.get("is_capture", False),
            promotes=move_data.get("promotes", False)
        )
        state = apply_move(state, move)

    return state.model_dump()


# ==================== Game Analysis Endpoints ====================

@app.post("/games/{game_id}/analyze", response_model=GameAnalysis)
async def analyze_game(
    game_id: str,
    analysis_type: str = "full",
    force: bool = False,
    current_user: User = Depends(require_auth)
):
    """Analyze a completed game."""
    games = get_games_collection()
    analyses = get_analyses_collection()

    # Check if game exists and belongs to user
    game = games.find_one({"game_id": game_id, "user_id": current_user.id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Allow analyzing in_progress games too
    # if game.get("result") == GameResult.IN_PROGRESS:
    #     raise HTTPException(status_code=400, detail="Game must be completed to analyze")

    # Check if analysis already exists (unless force=True)
    existing_analysis = analyses.find_one({"game_id": game_id})
    if existing_analysis and not force:
        return GameAnalysis(
            id=str(existing_analysis["_id"]),
            **existing_analysis
        )

    # If force=True, delete existing analysis
    if existing_analysis and force:
        analyses.delete_one({"game_id": game_id})

    # Determine analysis depth based on type
    depths = {"quick": 3, "full": 5, "deep": 7}
    depth = depths.get(analysis_type, 5)

    # Reconstruct game state
    initial_state = create_initial_state()
    current_state = initial_state

    # Set player color based on game settings
    player_color = Player(game.get("player_color", "red"))

    move_analysis_list = []
    best_moves_count = 0
    good_moves_count = 0
    inaccuracies_count = 0
    mistakes_count = 0
    blunders_count = 0
    forced_moves_count = 0
    total_eval_diff = 0.0  # For ACPL calculation

    moves = game.get("moves", [])

    for i, move_data in enumerate(moves):
        move_number = i + 1

        try:
            # Track who made this move (before applying it)
            move_made_by = current_state.current_player

            # Calculate evaluation before move from the perspective of the player who is about to move
            eval_before = evaluate(current_state, move_made_by)

            # Check if this is a forced move (only one legal move available)
            legal_moves = generate_legal_moves(current_state)
            is_forced = len(legal_moves) == 1

            # Get AI's best move for this position from the player whose turn it is
            ai_result = get_ai_move(current_state, "hard")
            best_move = ai_result["move"]
            best_score = ai_result["evaluation"]

            # Apply the actual move
            actual_move = Move(
                from_pos=move_data["from"],
                to=move_data["to"],
                captures=move_data.get("captures", []),
                is_capture=move_data.get("is_capture", False),
                promotes=move_data.get("promotes", False)
            )

            current_state = apply_move(current_state, actual_move)

            # Get evaluation after move using minimax (more accurate than static evaluation)
            # IMPORTANT: Evaluate from move_made_by's perspective, not current_state.current_player
            try:
                actual_result = get_ai_move(current_state, "hard")
                # The get_ai_move returns evaluation from current_state.current_player's perspective
                # We need to convert it to move_made_by's perspective
                actual_score = actual_result["evaluation"]
                # If the perspectives don't match, negate the score
                if current_state.current_player != move_made_by:
                    actual_score = -actual_score
            except Exception as e:
                # Fallback to static evaluation if minimax fails
                actual_score = evaluate(current_state, move_made_by)

            # actual_score: How good the actual move was for the player who moved
            # Positive diff: Actual move is worse than AI's best move
            # Negative diff: Actual move is better than AI's best move
            eval_diff = best_score - actual_score

            # Calculate dynamic thresholds based on number of pieces remaining
            # Count total pieces on board
            total_pieces = sum(1 for row in range(8) for col in range(8) if current_state.board[row][col])
            
            # Scale thresholds based on game stage
            # Early game (many pieces): use standard thresholds
            # Endgame (few pieces): use more sensitive thresholds
            if total_pieces > 12:
                # Early/mid game - standard thresholds
                blunder_threshold = 150
                mistake_threshold = 75
                inaccuracy_threshold = 30
            elif total_pieces > 8:
                # Late midgame - more sensitive
                blunder_threshold = 100
                mistake_threshold = 50
                inaccuracy_threshold = 20
            else:
                # Endgame - very sensitive (small errors matter more)
                blunder_threshold = 60
                mistake_threshold = 30
                inaccuracy_threshold = 10

            # Classify the move with dynamic thresholds
            if is_forced:
                classification = MoveClassification.FORCED
                if move_made_by == player_color:
                    forced_moves_count += 1
            elif eval_diff > blunder_threshold:
                classification = MoveClassification.BLUNDER
                if move_made_by == player_color:
                    blunders_count += 1
            elif eval_diff > mistake_threshold:
                classification = MoveClassification.MISTAKE
                if move_made_by == player_color:
                    mistakes_count += 1
            elif eval_diff > inaccuracy_threshold:
                classification = MoveClassification.INACCURACY
                if move_made_by == player_color:
                    inaccuracies_count += 1
            elif eval_diff > 10:
                classification = MoveClassification.GOOD
                if move_made_by == player_color:
                    good_moves_count += 1
            else:
                classification = MoveClassification.BEST
                if move_made_by == player_color:
                    best_moves_count += 1

            # Accumulate eval_diff for ACPL calculation (only for user's moves)
            if move_made_by == player_color and not is_forced:
                total_eval_diff += max(0, eval_diff)  # Only count positive diffs (losses)

            print(f"Move {move_number}: best_score={best_score:.1f}, actual_score={actual_score:.1f}, eval_diff={eval_diff:.1f}, classification={classification}, perspective={move_made_by}, pieces={total_pieces}, forced={is_forced}")

            # Generate explanation
            explanation = generate_move_explanation(actual_move, classification, eval_diff, best_move)

            # Create move analysis
            move_analysis = MoveAnalysis(
                move_number=move_number,
                classification=classification,
                evaluation_before=eval_before,
                evaluation_after=actual_score,
                best_move=best_move.model_dump() if best_move else None,
                explanation=explanation
            )
            move_analysis_list.append(move_analysis)

        except Exception as e:
            print(f"Error analyzing move {move_number}: {e}")
            # Continue with next move instead of crashing
            continue

    # Calculate accuracy with weighted scoring
    user_moves_count = best_moves_count + good_moves_count + inaccuracies_count + mistakes_count + blunders_count
    if user_moves_count > 0:
        # Weighted scoring: BEST=1.0, GOOD=0.8, INACCURACY=0.5, MISTAKE=0.2, BLUNDER=0.0
        weighted_sum = (
            best_moves_count * 1.0 +
            good_moves_count * 0.8 +
            inaccuracies_count * 0.5 +
            mistakes_count * 0.2 +
            blunders_count * 0.0
        )
        accuracy = (weighted_sum / user_moves_count) * 100
    else:
        accuracy = 0.0

    # Calculate ACPL (Average Centipawn Loss)
    # ACPL measures how much the player deviated from the engine's best moves on average
    non_forced_user_moves = user_moves_count - forced_moves_count
    if non_forced_user_moves > 0:
        acpl = total_eval_diff / non_forced_user_moves
    else:
        acpl = 0.0

    # Identify critical moments (large evaluation swings)
    critical_moments = []
    for ma in move_analysis_list:
        eval_change = abs(ma.evaluation_after - ma.evaluation_before)
        if eval_change > 30:
            critical_moments.append(CriticalMoment(
                move_number=ma.move_number,
                description=f"Large position swing: {eval_change:.1f} points",
                evaluation_change=eval_change
            ))

    # Create analysis document
    analysis_doc = {
        "game_id": game_id,
        "user_id": current_user.id,
        "analysis_type": analysis_type,
        "moves_analyzed": user_moves_count,
        "move_analysis": [ma.model_dump() for ma in move_analysis_list],
        "accuracy": accuracy,
        "acpl": acpl,
        "best_moves": best_moves_count,
        "good_moves": good_moves_count,
        "inaccuracies": inaccuracies_count,
        "mistakes": mistakes_count,
        "blunders": blunders_count,
        "forced_moves": forced_moves_count,
        "critical_moments": [cm.model_dump() for cm in critical_moments],
        "created_at": datetime.utcnow()
    }

    # Store analysis
    result = analyses.insert_one(analysis_doc)

    # Update user stats (only for new analyses, not re-analyses)
    if not existing_analysis:
        users = get_users_collection()
        users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$inc": {"stats.games_analyzed": 1}}
        )

    return GameAnalysis(
        id=str(result.inserted_id),
        **analysis_doc
    )


@app.get("/games/{game_id}/analysis", response_model=GameAnalysis)
async def get_game_analysis(game_id: str, current_user: User = Depends(require_auth)):
    """Get game analysis."""
    analyses = get_analyses_collection()

    analysis = analyses.find_one({"game_id": game_id, "user_id": current_user.id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return GameAnalysis(
        id=str(analysis["_id"]),
        **analysis
    )


@app.post("/games/{game_id}/summary", response_model=GameSummary)
async def generate_game_summary(game_id: str, current_user: User = Depends(require_auth)):
    """Generate AI-powered game summary using Groq."""
    games = get_games_collection()
    analyses = get_analyses_collection()

    # Get game and analysis
    game = games.find_one({"game_id": game_id, "user_id": current_user.id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    analysis = analyses.find_one({"game_id": game_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Prepare summary data
    game_mode = game.get("game_mode", "bot")
    result = game.get("result", "unknown")
    difficulty = game.get("difficulty", "medium")
    accuracy = analysis.get("accuracy", 0)
    acpl = analysis.get("acpl", 0)
    best_moves = analysis.get("best_moves", 0)
    good_moves = analysis.get("good_moves", 0)
    inaccuracies = analysis.get("inaccuracies", 0)
    mistakes = analysis.get("mistakes", 0)
    blunders = analysis.get("blunders", 0)
    forced_moves = analysis.get("forced_moves", 0)
    total_moves = analysis.get("moves_analyzed", 0)

    # Build prompt for Groq
    prompt = f"""
    Generate a concise, engaging game summary for a checkers game (max 150 words).

    Game Details:
    - Mode: {game_mode} vs AI
    - Difficulty: {difficulty}
    - Result: {result}
    - Total moves: {total_moves}

    Performance:
    - Accuracy: {accuracy:.1f}%
    - ACPL (Average Centipawn Loss): {acpl:.1f}
    - Best moves: {best_moves}
    - Good moves: {good_moves}
    - Inaccuracies: {inaccuracies}
    - Mistakes: {mistakes}
    - Blunders: {blunders}
    - Forced moves: {forced_moves}

    Provide:
    1. A 2-3 sentence narrative summary of the game
    2. 3-5 key insights/takeaways for improvement

    Keep it conversational, encouraging, and helpful for a player learning checkers.
    Format as JSON with "summary" and "key_insights" fields.
    """

    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        import json
        summary_data = json.loads(response.choices[0].message.content)

        return GameSummary(
            game_id=game_id,
            summary=summary_data.get("summary", "Game summary unavailable"),
            key_insights=summary_data.get("key_insights", []),
            created_at=datetime.utcnow()
        )
    except Exception as e:
        print(f"Error generating summary: {e}")
        # Fallback summary
        return GameSummary(
            game_id=game_id,
            summary=f"You played a {difficulty} game vs the AI and achieved {accuracy:.1f}% accuracy with an ACPL of {acpl:.1f}. You made {best_moves} best moves and {good_moves} good moves out of {total_moves} total moves.",
            key_insights=[
                f"Your accuracy of {accuracy:.1f}% shows {'strong' if accuracy > 70 else 'room for improvement'} play.",
                f"ACPL of {acpl:.1f} indicates {'excellent' if acpl < 20 else 'good' if acpl < 40 else 'needs work'} tactical awareness.",
                f"Focus on reducing {'blunders' if blunders > 0 else 'mistakes'} in future games."
            ],
            created_at=datetime.utcnow()
        )


class ContinuationRequest(BaseModel):
    continuation: list


@app.post("/game/{game_id}/explain-continuation")
async def explain_ai_continuation(game_id: str, request: ContinuationRequest, current_user: User = Depends(require_auth)):
    """Explain AI's continuation moves using Groq."""

    continuation = request.continuation
    print(f"DEBUG: Received continuation request with {len(continuation) if continuation else 0} moves")

    if not continuation or len(continuation) == 0:
        return {"explanation": "The AI has no planned continuation moves for this position."}

    # Format continuation for prompt
    continuation_text = ""
    for i, move in enumerate(continuation):
        print(f"DEBUG: Move {i} full structure: {move}")
        print(f"DEBUG: Move {i} keys: {move.keys() if hasattr(move, 'keys') else 'N/A'}")

        # Try different possible key names
        from_pos = None
        to_pos = None

        if "from" in move:
            from_pos = move["from"]
        elif "from_pos" in move:
            from_pos = move["from_pos"]

        if "to" in move:
            to_pos = move["to"]

        print(f"DEBUG: from_pos = {from_pos}, to_pos = {to_pos}")

        if from_pos and to_pos:
            notation = f"({from_pos.get('row', '')},{from_pos.get('col', '')}) → ({to_pos.get('row', '')},{to_pos.get('col', '')})"
        else:
            notation = "Unknown"

        captures = move.get("captures", [])
        promotes = move.get("promotes", False)

        move_desc = f"Move {i+1}: {notation}"
        if captures:
            move_desc += f" (captures {len(captures)} piece{'s' if len(captures) > 1 else ''})"
        if promotes:
            move_desc += " (promotes to king)"

        continuation_text += f"\n  {move_desc}"

    print(f"DEBUG: Continuation text:\n{continuation_text}")

    # Build prompt for Groq
    prompt = f"""
    You are a checkers expert explaining the AI's strategy to a beginner player. The AI is planning these moves:
{continuation_text}

    Analyze this sequence and provide a specific explanation (max 90 words) that covers:
    1. The immediate tactical goal (capturing, advancing, positioning)
    2. Strategic reasoning (control center, create threats, avoid traps)
    3. Why these specific moves work together as a plan

    Be specific about checkers concepts like:
    - Advancing pieces toward the opponent's side
    - Controlling the center of the board
    - Setting up multi-jump captures
    - Protecting pieces from being captured
    - Creating kings by promoting pieces

    Use concrete examples from the moves shown. Make it actionable and educational.
    """

    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.8
        )

        explanation = response.choices[0].message.content.strip()
        print(f"DEBUG: Groq response: {explanation}")

        if not explanation or len(explanation) < 10:
            return {"explanation": "The AI is planning a sequence of moves to improve its position and create tactical opportunities."}

        return {"explanation": explanation}
    except Exception as e:
        print(f"Error explaining continuation: {e}")
        # Fallback explanation
        return {"explanation": "The AI is planning a sequence of moves to improve its position and create tactical opportunities."}


def generate_move_explanation(move, classification, eval_diff, best_move):
    """Generate explanation for a move."""
    from .game.state import PieceType

    reasons = []

    # Capture analysis
    if move.captures and len(move.captures) > 0:
        capture_count = len(move.captures)
        if capture_count > 1:
            reasons.append(f"Multi-jump! Capturing {capture_count} pieces")
        else:
            reasons.append("Capturing opponent's piece")

    # Promotion analysis
    if move.promotes:
        reasons.append("Promoting to king")

    # Classification-based explanation
    if classification == MoveClassification.BLUNDER:
        reasons.append(f"Lost significant advantage (-{eval_diff:.0f} points)")
    elif classification == MoveClassification.MISTAKE:
        reasons.append(f"Lost advantage (-{eval_diff:.0f} points)")
    elif classification == MoveClassification.INACCURACY:
        reasons.append(f"Suboptimal move (-{eval_diff:.0f} points)")
    elif classification == MoveClassification.GOOD:
        reasons.append("Solid move")
    elif classification == MoveClassification.BEST:
        reasons.append("Excellent move")

    if best_move:
        reasons.append(f"Best alternative available (+{eval_diff:.0f} points)")

    return ". ".join(reasons[:3]) + "." if reasons else "Standard move."


# ==================== Leaderboard Endpoints ====================

@app.get("/leaderboard", response_model=Leaderboard)
async def get_leaderboard(
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "rating"
):
    """Get leaderboard sorted by rating or games."""
    try:
        users = get_users_collection()
        
        # Determine sort field
        sort_field = "stats.rating" if sort_by == "rating" else "stats.total_games"
        
        # Get total count
        total = users.count_documents({})
        
        # Get paginated users
        skip = (page - 1) * per_page
        users_cursor = users.find({}).sort(sort_field, -1).skip(skip).limit(per_page)
        
        entries = []
        rank = skip + 1
        
        for user in users_cursor:
            stats = user.get("stats", {})
            total_games = stats.get("total_games", 0)
            total_wins = stats.get("total_wins", 0)
            
            win_rate = 0
            if total_games > 0:
                win_rate = round((total_wins / total_games) * 100, 1)
            
            entries.append(LeaderboardEntry(
                rank=rank,
                user_id=str(user["_id"]),
                username=user["username"],
                avatar_url=user.get("avatar_url"),
                rating=stats.get("rating", 1000),
                total_games=total_games,
                total_wins=total_wins,
                win_rate=win_rate
            ))
            rank += 1
        
        return Leaderboard(
            entries=entries,
            total_users=total,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        print(f"Leaderboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

"""Board state representation and utilities."""
from enum import Enum
from typing import Optional
from pydantic import BaseModel
import copy


class Player(str, Enum):
    RED = "red"
    WHITE = "white"


class PieceType(str, Enum):
    MAN = "man"
    KING = "king"


class Piece(BaseModel):
    player: Player
    type: PieceType


class GameState(BaseModel):
    board: list[list[Optional[Piece]]]
    current_player: Player
    move_history: list[dict]
    captured_pieces: dict[str, int]
    game_over: bool
    winner: Optional[str]


def create_initial_state() -> GameState:
    """Create initial board state with pieces in starting positions."""
    board = [[None for _ in range(8)] for _ in range(8)]

    # Place red pieces (top 3 rows)
    for row in range(3):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = Piece(player=Player.RED, type=PieceType.MAN)

    # Place white pieces (bottom 3 rows)
    for row in range(5, 8):
        for col in range(8):
            if (row + col) % 2 == 1:
                board[row][col] = Piece(player=Player.WHITE, type=PieceType.MAN)

    return GameState(
        board=board,
        current_player=Player.RED,
        move_history=[],
        captured_pieces={Player.RED.value: 0, Player.WHITE.value: 0},
        game_over=False,
        winner=None,
    )


def clone_state(state: GameState) -> GameState:
    """Deep clone a state for AI simulation."""
    return GameState(
        board=[[piece.model_copy() if piece else None for piece in row] for row in state.board],
        current_player=state.current_player,
        move_history=[m.copy() for m in state.move_history],
        captured_pieces=state.captured_pieces.copy(),
        game_over=state.game_over,
        winner=state.winner,
    )


def get_piece(state: GameState, row: int, col: int) -> Optional[Piece]:
    """Get piece at position."""
    if not (0 <= row <= 7 and 0 <= col <= 7):
        return None
    return state.board[row][col]


def is_dark_square(row: int, col: int) -> bool:
    """Check if position is valid dark square."""
    return (row + col) % 2 == 1


def count_pieces(state: GameState, player: Player) -> dict:
    """Count pieces for a player."""
    total = 0
    kings = 0
    for row in range(8):
        for col in range(8):
            piece = state.board[row][col]
            if piece and piece.player == player:
                total += 1
                if piece.type == PieceType.KING:
                    kings += 1
    return {"total": total, "kings": kings, "men": total - kings}


def get_opponent(player: Player) -> Player:
    """Get opponent player."""
    return Player.WHITE if player == Player.RED else Player.RED


def has_valid_moves(state: GameState, player: Player) -> bool:
    """Check if a player has any valid moves."""
    from .moves import generate_legal_moves

    # Temporarily set current player to check their moves
    original_player = state.current_player
    state.current_player = player
    moves = generate_legal_moves(state)
    state.current_player = original_player

    return len(moves) > 0


def get_winner(state: GameState) -> Optional[str]:
    """Check if there's a winner."""
    red_count = count_pieces(state, Player.RED)
    white_count = count_pieces(state, Player.WHITE)

    # Check if a player has no pieces
    if red_count["total"] == 0:
        return Player.WHITE.value
    if white_count["total"] == 0:
        return Player.RED.value

    # Check if current player has no valid moves (stalemate)
    if not state.game_over:
        if not has_valid_moves(state, state.current_player):
            # Current player loses, opponent wins
            return get_opponent(state.current_player).value

    return None

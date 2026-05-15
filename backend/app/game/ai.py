"""AI engine with minimax and alpha-beta pruning."""
import random
from typing import Optional
from .state import GameState, Player, PieceType, count_pieces, get_opponent
from .moves import Move, generate_legal_moves
from .apply_move import apply_move


# Position weights for evaluation
POSITION_WEIGHTS = [
    [0, 4, 0, 4, 0, 4, 0, 4],
    [4, 0, 5, 0, 5, 0, 5, 0],
    [0, 5, 0, 6, 0, 6, 0, 5],
    [5, 0, 6, 0, 7, 0, 6, 0],
    [0, 6, 0, 7, 0, 7, 0, 6],
    [6, 0, 7, 0, 7, 0, 6, 0],
    [0, 7, 0, 7, 0, 7, 0, 7],
    [7, 0, 7, 0, 7, 0, 7, 0],
]

# Evaluation weights
W_MATERIAL = 10
W_POSITION = 1
W_KING = 5
W_ADVANCEMENT = 0.5


def evaluate(state: GameState, ai_player: Player) -> float:
    """Evaluate board position for AI player."""
    opponent = get_opponent(ai_player)

    # Material score
    ai_pieces = count_pieces(state, ai_player)
    opp_pieces = count_pieces(state, opponent)

    material_score = (
        (ai_pieces["men"] - opp_pieces["men"]) * W_MATERIAL +
        (ai_pieces["kings"] - opp_pieces["kings"]) * (W_MATERIAL + W_KING)
    )

    # Position score
    position_score = 0
    for row in range(8):
        for col in range(8):
            piece = state.board[row][col]
            if piece:
                pos_value = POSITION_WEIGHTS[row][col]
                if piece.player == ai_player:
                    position_score += pos_value
                else:
                    position_score -= pos_value

    # Advancement score (encourage pieces to move forward)
    advancement_score = 0
    for row in range(8):
        for col in range(8):
            piece = state.board[row][col]
            if piece and piece.type == PieceType.MAN:
                if piece.player == Player.RED:
                    advancement_score += row * W_ADVANCEMENT if piece.player == ai_player else -row * W_ADVANCEMENT
                else:
                    advancement_score += (7 - row) * W_ADVANCEMENT if piece.player == ai_player else -(7 - row) * W_ADVANCEMENT

    return material_score + W_POSITION * position_score + advancement_score


def minimax(
    state: GameState,
    depth: int,
    alpha: float,
    beta: float,
    maximizing: bool,
    ai_player: Player
) -> dict:
    """Minimax with alpha-beta pruning."""
    if depth == 0 or state.game_over:
        return {"score": evaluate(state, ai_player), "move": None}

    moves = generate_legal_moves(state)

    if not moves:
        score = -10000 if maximizing else 10000
        return {"score": score, "move": None}

    best_move = moves[0]

    if maximizing:
        max_score = float("-inf")
        for move in moves:
            try:
                new_state = apply_move(state, move)
                result = minimax(new_state, depth - 1, alpha, beta, False, ai_player)

                if result["score"] > max_score:
                    max_score = result["score"]
                    best_move = move

                alpha = max(alpha, result["score"])
                if beta <= alpha:
                    break  # Beta cutoff
            except Exception:
                continue

        return {"score": max_score, "move": best_move}
    else:
        min_score = float("inf")
        for move in moves:
            try:
                new_state = apply_move(state, move)
                result = minimax(new_state, depth - 1, alpha, beta, True, ai_player)

                if result["score"] < min_score:
                    min_score = result["score"]
                    best_move = move

                beta = min(beta, result["score"])
                if beta <= alpha:
                    break  # Alpha cutoff
            except Exception:
                continue

        return {"score": min_score, "move": best_move}


def generate_explanation(move: Move, score: float, difficulty: str, state: GameState = None) -> str:
    """Generate human-readable explanation for a move."""
    reasons = []
    
    # Capture analysis
    if move.captures and len(move.captures) > 0:
        capture_count = len(move.captures)
        if capture_count > 1:
            reasons.append(f"Multi-jump! Capturing {capture_count} pieces")
        else:
            captured = move.captures[0]
            if state:
                captured_piece = state.board[captured["row"]][captured["col"]]
                if captured_piece and captured_piece.type == PieceType.KING:
                    reasons.append("Capturing opponent's king - big material gain")
                else:
                    reasons.append("Capturing opponent's piece")
            else:
                reasons.append("Capturing opponent's piece")
    
    # Promotion analysis
    if move.promotes:
        reasons.append("Promoting to king for diagonal movement in both directions")
    
    # Positional analysis
    to_row, to_col = move.to["row"], move.to["col"]
    from_row, from_col = move.from_pos["row"], move.from_pos["col"]
    
    # Check if moving towards center
    center_dist_before = abs(3.5 - from_col) + abs(3.5 - from_row)
    center_dist_after = abs(3.5 - to_col) + abs(3.5 - to_row)
    
    if center_dist_after < center_dist_before - 1:
        reasons.append("Moving towards center for more control")
    
    # Check if moving to edge (defensive)
    if to_col == 0 or to_col == 7:
        reasons.append("Moving to edge - harder to capture but less mobile")
    
    # Check advancement for regular pieces
    if state:
        piece = state.board[from_row][from_col]
        if piece and piece.type == PieceType.MAN:
            if piece.player == Player.RED:
                if to_row > from_row:
                    reasons.append("Advancing towards promotion")
            else:
                if to_row < from_row:
                    reasons.append("Advancing towards promotion")
    
    # Score-based analysis
    if score > 100:
        reasons.append("Excellent move with significant advantage")
    elif score > 50:
        reasons.append("Strong positional gain")
    elif score > 20:
        reasons.append("Good move improving position")
    
    # Safety analysis
    if state:
        # Check if the piece was in danger before
        opponent_moves = generate_legal_moves(state)
        was_in_danger = any(
            any(c["row"] == from_row and c["col"] == from_col for c in m.captures)
            for m in opponent_moves if m.captures
        )
        if was_in_danger:
            reasons.append("Escaping from capture threat")
    
    if reasons:
        return ". ".join(reasons[:3]) + "."  # Limit to 3 reasons
    elif score > 0:
        return "Solid move maintaining good position."
    else:
        return "Defensive play to stabilize position."


def get_ai_move(state: GameState, difficulty: str = "medium") -> dict:
    """Get AI's best move with difficulty setting."""
    ai_player = state.current_player
    moves = generate_legal_moves(state)

    if not moves:
        return {"move": None, "evaluation": 0, "explanation": "No moves available.", "continuation": []}

    depths = {"easy": 2, "medium": 4, "hard": 6}
    depth = depths.get(difficulty, 4)

    # Random moves for easy mode
    if difficulty == "easy" and random.random() < 0.3:
        random_move = random.choice(moves)
        return {
            "move": random_move,
            "evaluation": evaluate(state, ai_player),
            "explanation": "Exploring possibilities...",
            "continuation": []
        }

    try:
        result = minimax(state, depth, float("-inf"), float("inf"), True, ai_player)
    except Exception:
        random_move = random.choice(moves)
        return {"move": random_move, "evaluation": 0, "explanation": "Making a move...", "continuation": []}

    if not result["move"]:
        random_move = random.choice(moves)
        return {"move": random_move, "evaluation": 0, "explanation": "Making a move...", "continuation": []}

    explanation = generate_explanation(result["move"], result["score"], difficulty, state)

    # Generate continuation (next 3 moves)
    continuation = []
    temp_state = apply_move(state, result["move"])
    
    for i in range(3):
        if temp_state.game_over:
            break
        
        try:
            cont_result = minimax(temp_state, 2, float("-inf"), float("inf"), True, temp_state.current_player)
            if cont_result["move"]:
                continuation.append(cont_result["move"].model_dump())
                temp_state = apply_move(temp_state, cont_result["move"])
            else:
                break
        except Exception:
            break

    return {
        "move": result["move"],
        "evaluation": result["score"],
        "explanation": explanation,
        "continuation": continuation
    }

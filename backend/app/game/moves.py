"""Move generation with mandatory jumps and multi-jump support."""
from typing import Optional
from pydantic import BaseModel
from .state import GameState, Piece, Player, PieceType, get_piece, get_opponent, is_dark_square


class Move(BaseModel):
    from_pos: dict  # {"row": int, "col": int}
    to: dict  # {"row": int, "col": int}
    captures: list[dict]  # [{"row": int, "col": int, "piece": Piece}]
    is_capture: bool = False
    promotes: bool = False


def get_forward_direction(player: Player) -> int:
    """Get forward direction for a player."""
    return 1 if player == Player.RED else -1


def get_directions(piece: Piece) -> list[dict]:
    """Get all diagonal directions for a piece."""
    forward = get_forward_direction(piece.player)
    if piece.type == PieceType.KING:
        return [
            {"d_row": forward, "d_col": 1},
            {"d_row": forward, "d_col": -1},
            {"d_row": -forward, "d_col": 1},
            {"d_row": -forward, "d_col": -1},
        ]
    return [
        {"d_row": forward, "d_col": 1},
        {"d_row": forward, "d_col": -1},
    ]


def is_valid_position(row: int, col: int) -> bool:
    """Check if position is on the board."""
    return 0 <= row <= 7 and 0 <= col <= 7


def should_promote(piece: Piece, row: int) -> bool:
    """Check if a piece should be promoted."""
    if piece.type == PieceType.KING:
        return False
    if piece.player == Player.RED and row == 7:
        return True
    if piece.player == Player.WHITE and row == 0:
        return True
    return False


def generate_non_capture_moves(state: GameState, row: int, col: int) -> list[Move]:
    """Generate all non-capture moves for a piece."""
    piece = get_piece(state, row, col)
    if not piece:
        return []

    moves = []
    for direction in get_directions(piece):
        new_row = row + direction["d_row"]
        new_col = col + direction["d_col"]

        if is_valid_position(new_row, new_col) and not get_piece(state, new_row, new_col):
            moves.append(Move(
                from_pos={"row": row, "col": col},
                to={"row": new_row, "col": new_col},
                captures=[],
                is_capture=False,
                promotes=should_promote(piece, new_row),
            ))

    return moves


def generate_capture_moves(
    state: GameState,
    row: int,
    col: int,
    current_captures: list[dict] = None,
    visited_positions: list[dict] = None,
    original_from: dict = None
) -> list[Move]:
    """Generate all capture moves for a piece (including multi-jumps)."""
    piece = get_piece(state, row, col)
    if not piece:
        return []

    if current_captures is None:
        current_captures = []
    if visited_positions is None:
        visited_positions = []

    from_pos = original_from or {"row": row, "col": col}
    moves = []
    directions = get_directions(piece)
    opponent = get_opponent(piece.player)

    # Create temporary board for multi-jump simulation
    temp_board = [[p for p in r] for r in state.board]

    # Apply previous captures
    for cap in current_captures:
        temp_board[cap["row"]][cap["col"]] = None

    for direction in directions:
        mid_row = row + direction["d_row"]
        mid_col = col + direction["d_col"]
        new_row = row + 2 * direction["d_row"]
        new_col = col + 2 * direction["d_col"]

        if (
            is_valid_position(new_row, new_col)
            and is_dark_square(new_row, new_col)
            and not any(p["row"] == mid_row and p["col"] == mid_col for p in visited_positions)
        ):
            mid_piece = temp_board[mid_row][mid_col] if is_valid_position(mid_row, mid_col) else None
            landing_square = temp_board[new_row][new_col] if is_valid_position(new_row, new_col) else None

            if mid_piece and mid_piece.player == opponent and not landing_square:
                new_capture = {"row": mid_row, "col": mid_col, "piece": mid_piece.model_dump()}
                new_captures = current_captures + [new_capture]
                new_visited = visited_positions + [{"row": mid_row, "col": mid_col}]

                would_promote = should_promote(piece, new_row)

                if would_promote:
                    moves.append(Move(
                        from_pos=from_pos,
                        to={"row": new_row, "col": new_col},
                        captures=new_captures,
                        is_capture=True,
                        promotes=True,
                    ))
                else:
                    # Check for more jumps
                    temp_state = GameState(
                        board=[[c for c in r] for r in temp_board],
                        current_player=state.current_player,
                        move_history=state.move_history,
                        captured_pieces=state.captured_pieces.copy(),
                        game_over=state.game_over,
                        winner=state.winner,
                    )
                    temp_state.board[new_row][new_col] = piece
                    temp_state.board[row][col] = None
                    for cap in new_captures:
                        temp_state.board[cap["row"]][cap["col"]] = None

                    further_jumps = generate_capture_moves(
                        temp_state, new_row, new_col, new_captures, new_visited, from_pos
                    )

                    if further_jumps:
                        moves.extend(further_jumps)
                    else:
                        moves.append(Move(
                            from_pos=from_pos,
                            to={"row": new_row, "col": new_col},
                            captures=new_captures,
                            is_capture=True,
                            promotes=False,
                        ))

    return moves


def generate_legal_moves(state: GameState) -> list[Move]:
    """Generate all legal moves for the current player."""
    player = state.current_player
    all_moves = []
    capture_moves = []

    for row in range(8):
        for col in range(8):
            piece = get_piece(state, row, col)
            if piece and piece.player == player:
                captures = generate_capture_moves(state, row, col)
                capture_moves.extend(captures)

                non_captures = generate_non_capture_moves(state, row, col)
                all_moves.extend(non_captures)

    # Mandatory jump rule
    if capture_moves:
        return capture_moves

    return all_moves


def get_moves_for_piece(state: GameState, row: int, col: int) -> list[Move]:
    """Get all legal moves for a specific piece."""
    legal_moves = generate_legal_moves(state)
    return [m for m in legal_moves if m.from_pos["row"] == row and m.from_pos["col"] == col]


def is_legal_move(state: GameState, move: Move) -> bool:
    """Check if a move is legal."""
    legal_moves = generate_legal_moves(state)
    return any(
        m.from_pos["row"] == move.from_pos["row"]
        and m.from_pos["col"] == move.from_pos["col"]
        and m.to["row"] == move.to["row"]
        and m.to["col"] == move.to["col"]
        for m in legal_moves
    )

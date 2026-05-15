"""Apply moves to game state."""
from .state import GameState, Piece, Player, PieceType, clone_state, get_winner
from .moves import Move


def apply_move(state: GameState, move: Move) -> GameState:
    """Apply a move to the state (returns new state, does not mutate)."""
    new_state = clone_state(state)
    from_row, from_col = move.from_pos["row"], move.from_pos["col"]
    to_row, to_col = move.to["row"], move.to["col"]

    piece = new_state.board[from_row][from_col]

    if not piece:
        return state

    # Store original piece type before promotion
    original_type = piece.type

    # Move the piece
    new_state.board[from_row][from_col] = None
    new_state.board[to_row][to_col] = piece

    # Store captured pieces with their info for undo
    captured_pieces = []
    for capture in move.captures:
        cap_row, cap_col = capture["row"], capture["col"]
        captured_piece = new_state.board[cap_row][cap_col]
        if captured_piece:
            captured_pieces.append({
                "row": cap_row,
                "col": cap_col,
                "player": captured_piece.player.value,
                "type": captured_piece.type.value,
            })
        new_state.board[cap_row][cap_col] = None
        new_state.captured_pieces[piece.player.value] += 1

    # Promote if needed
    if move.promotes and piece.type == PieceType.MAN:
        piece.type = PieceType.KING

    # Record move in history with full info for undo
    move_record = {
        "from": {"row": from_row, "col": from_col},
        "to": {"row": to_row, "col": to_col},
        "captures": captured_pieces,
        "promotes": move.promotes,
        "player": piece.player.value,
        "original_type": original_type.value,  # Store for undo
    }
    new_state.move_history.append(move_record)

    # Switch player
    new_state.current_player = Player.WHITE if state.current_player == Player.RED else Player.RED

    # Check for game over
    winner = get_winner(new_state)
    if winner:
        new_state.game_over = True
        new_state.winner = winner

    return new_state


def undo_move(state: GameState) -> GameState:
    """Undo the last move (returns new state)."""
    if not state.move_history:
        return state

    new_state = clone_state(state)
    last_move = new_state.move_history.pop()

    from_pos = last_move["from"]
    to_pos = last_move["to"]
    player = Player(last_move["player"])

    # Get the piece at destination
    piece = new_state.board[to_pos["row"]][to_pos["col"]]

    if piece:
        # Demote if it was promoted
        if last_move.get("promotes"):
            piece.type = PieceType.MAN

        # Move piece back
        new_state.board[to_pos["row"]][to_pos["col"]] = None
        new_state.board[from_pos["row"]][from_pos["col"]] = piece

    # Restore captured pieces
    for capture in last_move.get("captures", []):
        captured_piece = Piece(
            player=Player(capture["player"]),
            type=PieceType(capture["type"]),
        )
        new_state.board[capture["row"]][capture["col"]] = captured_piece
        # Decrease captured count
        new_state.captured_pieces[player.value] -= 1

    # Switch back to previous player
    new_state.current_player = player

    # Reset game over
    new_state.game_over = False
    new_state.winner = None

    return new_state

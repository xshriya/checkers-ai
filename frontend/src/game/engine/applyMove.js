// Apply moves to state

import { PIECE_TYPES, PLAYERS, getOpponent, countPieces, cloneState } from './state';

/**
 * Apply a move to the state (returns new state, does not mutate)
 */
export function applyMove(state, move) {
  const newState = cloneState(state);
  const { from, to, captures, promotes } = move;
  const piece = newState.board[from.row][from.col];

  if (!piece) {
    console.warn('applyMove: No piece at source position', from);
    return state; // Return unchanged state instead of throwing
  }

  // Move the piece
  newState.board[from.row][from.col] = null;
  newState.board[to.row][to.col] = piece;

  // Remove captured pieces
  for (const capture of captures) {
    newState.board[capture.row][capture.col] = null;
    newState.capturedPieces[piece.player]++;
  }

  // Check for promotion
  const shouldPromote = promotes || (
    piece.type === PIECE_TYPES.MAN &&
    ((piece.player === PLAYERS.RED && to.row === 7) ||
     (piece.player === PLAYERS.WHITE && to.row === 0))
  );

  if (shouldPromote) {
    newState.board[to.row][to.col] = {
      ...piece,
      type: PIECE_TYPES.KING,
    };
  }

  // Record move in history
  newState.moveHistory.push({
    ...move,
    player: state.currentPlayer,
    promoted: shouldPromote,
    notation: generateNotation(move, piece, shouldPromote),
  });

  // Switch player
  newState.currentPlayer = getOpponent(state.currentPlayer);

  // Check for game over
  const opponentPieces = countPieces(newState, newState.currentPlayer);
  if (opponentPieces.total === 0) {
    newState.gameOver = true;
    newState.winner = state.currentPlayer;
  }

  return newState;
}

/**
 * Generate algebraic notation for a move
 */
function generateNotation(move, piece, promoted) {
  const fromSquare = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
  const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
  const separator = move.isCapture ? 'x' : '-';
  const promotionSuffix = promoted ? '=K' : '';

  return `${fromSquare}${separator}${toSquare}${promotionSuffix}`;
}

/**
 * Undo the last move (returns new state)
 */
export function undoMove(state) {
  if (state.moveHistory.length === 0) {
    return state;
  }

  // For now, we'll implement a simple replay from start
  // A more sophisticated approach would store snapshots
  const newState = cloneState(state);
  const lastMove = newState.moveHistory.pop();

  // Handle both from and from_pos property names
  const from = lastMove.from || lastMove.from_pos;
  const to = lastMove.to;

  if (!from || !to) {
    console.warn('undoMove: Move missing from/to', lastMove);
    return state;
  }

  // Reverse the move
  const piece = newState.board[to.row][to.col];

  if (!piece) {
    console.warn('undoMove: No piece at destination', to);
    return state;
  }

  // If it was promoted, demote it
  if (lastMove.promoted) {
    piece.type = PIECE_TYPES.MAN;
  }

  // Move piece back
  newState.board[to.row][to.col] = null;
  newState.board[from.row][from.col] = piece;

  // Restore captured pieces
  const captures = Array.isArray(lastMove.captures) ? lastMove.captures : [];
  for (const capture of captures) {
    if (capture.piece) {
      newState.board[capture.row][capture.col] = capture.piece;
    } else {
      // Reconstruct piece from current player's opponent
      const opponent = getOpponent(lastMove.player);
      newState.board[capture.row][capture.col] = { player: opponent, type: PIECE_TYPES.MAN };
    }
    newState.capturedPieces[lastMove.player]--;
  }

  // Switch back to previous player
  newState.currentPlayer = lastMove.player;

  // Reset game over if applicable
  newState.gameOver = false;
  newState.winner = null;

  return newState;
}

/**
 * Check if current player has any legal moves
 */
export function hasLegalMoves(state) {
  const player = state.currentPlayer;
  const pieceCount = countPieces(state, player);

  if (pieceCount.total === 0) {
    return false;
  }

  // This is a simplified check - in practice we'd call generateLegalMoves
  // but we want to avoid circular dependency
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece && piece.player === player) {
        // Check for any adjacent empty squares or jump opportunities
        const directions = piece.type === PIECE_TYPES.KING
          ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
          : piece.player === PLAYERS.RED
            ? [[1, -1], [1, 1]]
            : [[-1, -1], [-1, 1]];

        for (const [dRow, dCol] of directions) {
          const newRow = row + dRow;
          const newCol = col + dCol;

          // Check for regular move
          if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
            if (!state.board[newRow][newCol]) {
              return true;
            }

            // Check for jump
            const jumpRow = row + 2 * dRow;
            const jumpCol = col + 2 * dCol;
            if (jumpRow >= 0 && jumpRow <= 7 && jumpCol >= 0 && jumpCol <= 7) {
              const midPiece = state.board[newRow][newCol];
              if (midPiece && midPiece.player !== player && !state.board[jumpRow][jumpCol]) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Get winner if game is over
 */
export function getWinner(state) {
  if (state.gameOver) {
    return state.winner;
  }

  // Check if current player has no moves
  if (!hasLegalMoves(state)) {
    return getOpponent(state.currentPlayer);
  }

  return null;
}

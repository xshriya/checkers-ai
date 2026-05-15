// Move generation with mandatory jumps and multi-jump support

import { getPiece, isDarkSquare, getOpponent, PLAYERS, PIECE_TYPES } from './state';

/**
 * Get forward direction for a player
 */
function getForwardDirection(player) {
  return player === PLAYERS.RED ? 1 : -1; // Red moves down, White moves up
}

/**
 * Get all diagonal directions for a piece
 */
function getDirections(piece) {
  const forward = getForwardDirection(piece.player);
  if (piece.type === PIECE_TYPES.KING) {
    // Kings can move in all 4 directions
    return [
      { dRow: forward, dCol: 1 },
      { dRow: forward, dCol: -1 },
      { dRow: -forward, dCol: 1 },
      { dRow: -forward, dCol: -1 },
    ];
  }
  // Men can only move forward
  return [
    { dRow: forward, dCol: 1 },
    { dRow: forward, dCol: -1 },
  ];
}

/**
 * Check if a position is on the board
 */
function isValidPosition(row, col) {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

/**
 * Generate all non-capture moves for a piece
 */
function generateNonCaptureMoves(state, row, col) {
  const piece = getPiece(state, row, col);
  if (!piece) return [];

  const moves = [];
  const directions = getDirections(piece);

  for (const { dRow, dCol } of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (isValidPosition(newRow, newCol) && !getPiece(state, newRow, newCol)) {
      moves.push({
        from: { row, col },
        to: { row: newRow, col: newCol },
        captures: [],
        isCapture: false,
      });
    }
  }

  return moves;
}

/**
 * Generate all capture moves for a piece (including multi-jumps)
 * @param {Object} state - Current game state
 * @param {number} row - Current row position
 * @param {number} col - Current column position
 * @param {Array} currentCaptures - Captures made so far in multi-jump
 * @param {Array} visitedPositions - Positions already visited (to prevent infinite loops)
 * @param {Object} originalFrom - Original starting position (preserved through multi-jumps)
 */
function generateCaptureMoves(state, row, col, currentCaptures = [], visitedPositions = [], originalFrom = null) {
  const piece = getPiece(state, row, col);
  if (!piece) return [];

  // Preserve original from position for multi-jumps
  const fromPos = originalFrom || { row, col };

  const moves = [];
  const directions = getDirections(piece);
  const opponent = getOpponent(piece.player);

  // Create a temporary board state for multi-jump simulation
  const tempBoard = state.board.map(r => r.map(c => c));

  // Apply previous captures to temp board
  for (const cap of currentCaptures) {
    tempBoard[cap.row][cap.col] = null;
  }

  for (const { dRow, dCol } of directions) {
    const midRow = row + dRow;
    const midCol = col + dCol;
    const newRow = row + 2 * dRow;
    const newCol = col + 2 * dCol;

    // Check if jump is valid
    if (
      isValidPosition(newRow, newCol) &&
      isDarkSquare(newRow, newCol) &&
      !visitedPositions.some(p => p.row === midRow && p.col === midCol)
    ) {
      const midPiece = tempBoard[midRow]?.[midCol];
      const landingSquare = tempBoard[newRow]?.[newCol];

      // Must jump over opponent piece and land on empty square
      if (midPiece && midPiece.player === opponent && !landingSquare) {
        const newCapture = { row: midRow, col: midCol, piece: midPiece };
        const newCaptures = [...currentCaptures, newCapture];
        const newVisited = [...visitedPositions, { row: midRow, col: midCol }];

        // Check for promotion during jump
        const wouldPromote = shouldPromote(piece, newRow);

        // If promoted, can't continue jumping (standard American checkers rule)
        if (wouldPromote) {
          moves.push({
            from: fromPos,
            to: { row: newRow, col: newCol },
            captures: newCaptures,
            isCapture: true,
            promotes: true,
          });
        } else {
          // Check if more jumps are available from the new position
          const tempState = {
            ...state,
            board: tempBoard.map(r => r.map(c => c)),
          };
          // Temporarily move the piece
          tempState.board[newRow][newCol] = piece;
          tempState.board[row][col] = null;
          for (const cap of newCaptures) {
            tempState.board[cap.row][cap.col] = null;
          }

          const furtherJumps = generateCaptureMoves(tempState, newRow, newCol, newCaptures, newVisited, fromPos);

          if (furtherJumps.length > 0) {
            // Can continue jumping, add all possible continuations
            moves.push(...furtherJumps);
          } else {
            // No more jumps, this is a complete move
            moves.push({
              from: fromPos,
              to: { row: newRow, col: newCol },
              captures: newCaptures,
              isCapture: true,
              promotes: false,
            });
          }
        }
      }
    }
  }

  return moves;
}

/**
 * Check if a piece should be promoted
 */
function shouldPromote(piece, row) {
  if (piece.type === PIECE_TYPES.KING) return false;
  if (piece.player === PLAYERS.RED && row === 7) return true;
  if (piece.player === PLAYERS.WHITE && row === 0) return true;
  return false;
}

/**
 * Generate all legal moves for the current player
 * Mandatory jumps: if captures are available, only those are legal
 */
export function generateLegalMoves(state) {
  const player = state.currentPlayer;
  const allMoves = [];
  const captureMoves = [];

  // Find all pieces belonging to current player
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPiece(state, row, col);
      if (piece && piece.player === player) {
        // Generate capture moves
        const captures = generateCaptureMoves(state, row, col);
        captureMoves.push(...captures);

        // Generate non-capture moves (only used if no captures available)
        const nonCaptures = generateNonCaptureMoves(state, row, col);
        allMoves.push(...nonCaptures);
      }
    }
  }

  // Mandatory jump rule: if captures are available, must take them
  if (captureMoves.length > 0) {
    return captureMoves;
  }

  return allMoves;
}

/**
 * Get all legal moves for a specific piece
 */
export function getMovesForPiece(state, row, col) {
  const legalMoves = generateLegalMoves(state);
  return legalMoves.filter(move => move.from.row === row && move.from.col === col);
}

/**
 * Check if a move is legal
 */
export function isLegalMove(state, move) {
  const legalMoves = generateLegalMoves(state);
  return legalMoves.some(m =>
    m.from.row === move.from.row &&
    m.from.col === move.from.col &&
    m.to.row === move.to.row &&
    m.to.col === move.to.col
  );
}

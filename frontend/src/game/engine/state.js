// Board state representation and utilities

export const PLAYERS = {
  RED: 'red',
  WHITE: 'white',
};

export const PIECE_TYPES = {
  MAN: 'man',
  KING: 'king',
};

/**
 * Create initial board state
 * Red pieces on top (rows 0-2), White pieces on bottom (rows 5-7)
 * Only dark squares have pieces
 */
export function createInitialState() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Place red pieces (top 3 rows)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: PLAYERS.RED, type: PIECE_TYPES.MAN };
      }
    }
  }

  // Place white pieces (bottom 3 rows)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: PLAYERS.WHITE, type: PIECE_TYPES.MAN };
      }
    }
  }

  return {
    board,
    currentPlayer: PLAYERS.RED, // Red moves first
    moveHistory: [],
    capturedPieces: { [PLAYERS.RED]: 0, [PLAYERS.WHITE]: 0 },
    gameOver: false,
    winner: null,
  };
}

/**
 * Deep clone a state for AI simulation
 */
export function cloneState(state) {
  return {
    board: state.board.map(row => row.map(cell => cell ? { ...cell } : null)),
    currentPlayer: state.currentPlayer,
    moveHistory: [...state.moveHistory],
    capturedPieces: { ...state.capturedPieces },
    gameOver: state.gameOver,
    winner: state.winner,
  };
}

/**
 * Get piece at position
 */
export function getPiece(state, row, col) {
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return state.board[row][col];
}

/**
 * Check if position is valid dark square
 */
export function isDarkSquare(row, col) {
  return (row + col) % 2 === 1;
}

/**
 * Count pieces for a player
 */
export function countPieces(state, player) {
  let count = 0;
  let kings = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece && piece.player === player) {
        count++;
        if (piece.type === PIECE_TYPES.KING) kings++;
      }
    }
  }
  return { total: count, kings, men: count - kings };
}

/**
 * Get opponent
 */
export function getOpponent(player) {
  return player === PLAYERS.RED ? PLAYERS.WHITE : PLAYERS.RED;
}

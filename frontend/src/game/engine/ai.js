// Simple AI using Minimax with Alpha-Beta Pruning

import { cloneState, countPieces, getOpponent, PLAYERS } from './state';
import { generateLegalMoves } from './moves';
import { applyMove } from './applyMove';

/**
 * Position weights for board evaluation
 * Center control and advancement are valued
 */
const POSITION_WEIGHTS = [
  [0, 4, 0, 4, 0, 4, 0, 4],
  [4, 0, 6, 0, 6, 0, 6, 0],
  [0, 6, 0, 8, 0, 8, 0, 6],
  [4, 0, 8, 0, 10, 0, 8, 0],
  [0, 8, 0, 10, 0, 8, 0, 4],
  [6, 0, 8, 0, 8, 0, 6, 0],
  [0, 6, 0, 6, 0, 4, 0, 4],
  [4, 0, 4, 0, 4, 0, 4, 0],
];

/**
 * Evaluate board state from AI's perspective
 * Higher score = better for AI
 */
export function evaluate(state, aiPlayer) {
  const opponent = getOpponent(aiPlayer);

  // Piece counts
  const aiPieces = countPieces(state, aiPlayer);
  const oppPieces = countPieces(state, opponent);

  // Weights
  const W_PIECE = 100;
  const W_KING = 200;
  const W_POSITION = 5;
  const W_ADVANCEMENT = 3;
  const W_MOBILITY = 2;

  // Material score
  const materialScore =
    W_PIECE * (aiPieces.men - oppPieces.men) +
    W_KING * (aiPieces.kings - oppPieces.kings);

  // Position score
  let positionScore = 0;
  let advancementScore = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece) {
        const posValue = POSITION_WEIGHTS[row][col];
        const advancement = aiPlayer === PLAYERS.RED ? row : 7 - row;

        if (piece.player === aiPlayer) {
          positionScore += posValue;
          if (piece.type !== 'king') {
            advancementScore += advancement;
          }
        } else {
          positionScore -= posValue;
          if (piece.type !== 'king') {
            advancementScore -= (7 - advancement);
          }
        }
      }
    }
  }

  // Mobility score (number of available moves)
  const mobilityScore = state.currentPlayer === aiPlayer
    ? generateLegalMoves(state).length
    : -generateLegalMoves(state).length;

  // Combine scores
  const totalScore =
    materialScore +
    W_POSITION * positionScore +
    W_ADVANCEMENT * advancementScore +
    W_MOBILITY * mobilityScore;

  return totalScore;
}

/**
 * Minimax with Alpha-Beta Pruning
 */
function minimax(state, depth, alpha, beta, maximizingPlayer, aiPlayer) {
  // Terminal conditions
  if (depth === 0 || state.gameOver) {
    return { score: evaluate(state, aiPlayer), move: null };
  }

  const moves = generateLegalMoves(state);

  if (moves.length === 0) {
    // No moves available - current player loses
    const score = maximizingPlayer ? -10000 : 10000;
    return { score, move: null };
  }

  let bestMove = moves[0];

  if (maximizingPlayer) {
    let maxScore = -Infinity;

    for (const move of moves) {
      try {
        const newState = applyMove(state, move);
        const result = minimax(newState, depth - 1, alpha, beta, false, aiPlayer);

        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, result.score);

        if (beta <= alpha) {
          break; // Beta cutoff
        }
      } catch (e) {
        // Skip invalid moves
        continue;
      }
    }

    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;

    for (const move of moves) {
      try {
        const newState = applyMove(state, move);
        const result = minimax(newState, depth - 1, alpha, beta, true, aiPlayer);

        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }

        beta = Math.min(beta, result.score);

        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      } catch (e) {
        // Skip invalid moves
        continue;
      }
    }

    return { score: minScore, move: bestMove };
  }
}

/**
 * Get AI's best move
 * @param {Object} state - Current game state
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Object} - Best move with explanation
 */
export function getAIMove(state, difficulty = 'medium') {
  const aiPlayer = state.currentPlayer;
  const moves = generateLegalMoves(state);

  // No moves available
  if (moves.length === 0) {
    return { move: null, evaluation: 0, explanation: 'No moves available.' };
  }

  // Depth based on difficulty
  const depths = {
    easy: 2,
    medium: 4,
    hard: 6,
  };

  const depth = depths[difficulty] || 4;

  // Add some randomness for easy mode
  if (difficulty === 'easy' && Math.random() < 0.3) {
    // 30% chance to make a random move
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return {
      move: randomMove,
      evaluation: evaluate(state, aiPlayer),
      explanation: 'Exploring different possibilities...',
    };
  }

  let result;
  try {
    result = minimax(state, depth, -Infinity, Infinity, true, aiPlayer);
  } catch (e) {
    console.error('Minimax error, falling back to random move:', e);
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return {
      move: randomMove,
      evaluation: 0,
      explanation: 'Making a move...',
    };
  }

  // Fallback if minimax returned no move
  if (!result.move) {
    console.warn('Minimax returned no move, picking random');
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return {
      move: randomMove,
      evaluation: 0,
      explanation: 'Making a move...',
    };
  }

  // Generate explanation
  const explanation = generateExplanation(result.move, result.score, difficulty);

  return {
    move: result.move,
    evaluation: result.score,
    explanation,
  };
}

/**
 * Generate human-readable explanation for AI's move
 */
function generateExplanation(move, score, difficulty) {
  if (!move) return 'No moves available.';

  const explanations = [];

  if (move.captures.length > 0) {
    explanations.push(`Capturing ${move.captures.length} piece${move.captures.length > 1 ? 's' : ''}.`);
  }

  if (move.promotes) {
    explanations.push('Promoting to King for more mobility.');
  }

  if (score > 200) {
    explanations.push('This move gives a strong material advantage.');
  } else if (score > 50) {
    explanations.push('Improving position and maintaining control.');
  } else if (score < -50) {
    explanations.push('Making the best of a difficult situation.');
  }

  if (explanations.length === 0) {
    explanations.push('Developing pieces toward the center.');
  }

  return explanations.join(' ');
}

/**
 * Analyze a player's move and classify it
 * @returns {Object} - Analysis with best move comparison
 */
export function analyzeMove(stateBefore, playerMove, difficulty = 'medium') {
  const player = stateBefore.currentPlayer;

  // Get AI's best move from the same position
  const aiResult = getAIMove(stateBefore, difficulty);
  const bestMove = aiResult.move;

  // Evaluate position before
  const evalBefore = evaluate(stateBefore, player);

  // Evaluate position after player's move
  const stateAfter = applyMove(stateBefore, playerMove);
  const evalAfter = evaluate(stateAfter, player);

  // Calculate evaluation delta (from player's perspective)
  const delta = evalAfter - evalBefore;

  // Classify the move
  let classification = 'good';
  let label = 'Good move';

  if (delta < -200) {
    classification = 'blunder';
    label = 'Blunder';
  } else if (delta < -100) {
    classification = 'mistake';
    label = 'Mistake';
  } else if (delta < -30) {
    classification = 'inaccuracy';
    label = 'Inaccuracy';
  }

  // Check if player made the best move
  const isBestMove = bestMove &&
    bestMove.from.row === playerMove.from.row &&
    bestMove.from.col === playerMove.from.col &&
    bestMove.to.row === playerMove.to.row &&
    bestMove.to.col === playerMove.to.col;

  if (isBestMove) {
    classification = 'best';
    label = 'Best move';
  }

  return {
    classification,
    label,
    delta,
    evalBefore,
    evalAfter,
    bestMove,
    isBestMove,
    explanation: generateAnalysisExplanation(classification, delta, bestMove, playerMove),
  };
}

/**
 * Generate explanation for move analysis
 */
function generateAnalysisExplanation(classification, delta, bestMove, playerMove) {
  if (classification === 'best') {
    return 'Excellent! This is the strongest move available.';
  }

  if (classification === 'good') {
    return 'Solid move that maintains a good position.';
  }

  if (classification === 'inaccuracy') {
    return `This move is slightly suboptimal. Consider ${formatMove(bestMove)} for a better position.`;
  }

  if (classification === 'mistake') {
    return `This loses material or position. ${formatMove(bestMove)} would have been better.`;
  }

  if (classification === 'blunder') {
    return `A significant error. ${formatMove(bestMove)} was the correct choice.`;
  }

  return '';
}

/**
 * Format a move for display
 */
function formatMove(move) {
  if (!move) return 'another move';
  const from = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
  const to = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
  return `${from}-${to}`;
}

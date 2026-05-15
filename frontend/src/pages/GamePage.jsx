// Game Page - Main checkers game with AI backend

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Board from '../components/game/Board';
import RightPanel from '../components/game/RightPanel';
import { useAuth } from '../contexts/AuthContext';

const PLAYERS = { RED: 'red', WHITE: 'white' };

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const settings = location.state;

  // Game settings from setup
  const gameMode = settings?.mode || 'bot';
  const initialDifficulty = settings?.difficulty || 'medium';
  const canChangeDifficulty = settings?.canChangeDifficulty || false;
  const playerColor = settings?.playerColor || 'red';
  const showInsights = settings?.showInsights !== false;
  const isRated = settings?.isRated !== false;

  const [gameId, setGameId] = useState(null);
  const [dbGameId, setDbGameId] = useState(null); // Database game ID for tracking
  const [state, setState] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [allLegalMoves, setAllLegalMoves] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiContinuation, setAiContinuation] = useState([]);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const gameInitializedRef = useRef(false);
  const aiProcessingRef = useRef(false);

  // Redirect to setup if no settings
  useEffect(() => {
    if (!settings) {
      navigate('/play');
    }
  }, [settings, navigate]);

  // Initialize game
  useEffect(() => {
    if (settings && !gameInitializedRef.current) {
      gameInitializedRef.current = true;
      startNewGame();
    }
  }, [settings]);

  // Fetch legal moves when state changes
  useEffect(() => {
    if (gameId && !state?.game_over) {
      api.getLegalMoves(gameId).then(data => {
        setAllLegalMoves(data.legal_moves || []);
      }).catch(err => {
        console.error('Failed to fetch legal moves:', err);
      });
    } else {
      setAllLegalMoves([]);
    }
  }, [gameId, state]);

  const completeGame = useCallback(async (winner, result) => {
    if (!dbGameId || !state || gameCompleted) return;

    setGameCompleted(true);

    try {
      const response = await api.completeGame(dbGameId, result, winner, state);
      // Refresh user stats
      await checkAuth();
    } catch (err) {
      console.error('Failed to complete game:', err);
      setGameCompleted(false); // Allow retry if failed
    }
  }, [dbGameId, state, checkAuth, gameCompleted]);

  // Complete game when game_over becomes true
  useEffect(() => {
    if (state?.game_over && state?.winner && dbGameId) {
      // Determine result from player's perspective
      const result = state.winner === playerColor ? 'win' : 'loss';
      completeGame(state.winner, result);
    }
  }, [state?.game_over, state?.winner, dbGameId, playerColor, completeGame]);

  // AI's turn (only in bot mode)
  useEffect(() => {
    if (gameMode !== 'bot') return;
    if (!state || state?.game_over || aiProcessingRef.current) return;

    const aiColor = playerColor === 'red' ? PLAYERS.WHITE : PLAYERS.RED;
    if (state?.current_player !== aiColor) return;

    aiProcessingRef.current = true;
    setAiThinking(true);
    setAiExplanation('');
    setAiContinuation([]);

    const timeout = setTimeout(async () => {
      try {
        const result = await api.getAIMove(gameId, difficulty);
        if (result.state) {
          setState(result.state);
          setAiExplanation(result.explanation || '');
          setAiContinuation(result.continuation || []);
        }
      } catch (err) {
        console.error('AI move error:', err);
      }
      aiProcessingRef.current = false;
      setAiThinking(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [state?.current_player, state?.game_over, gameId, difficulty, gameMode, playerColor]);

  const startNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create game record in database
      const dbGame = await api.createGameRecord({
        game_mode: gameMode,
        difficulty: initialDifficulty,
        player_color: playerColor,
        show_insights: showInsights,
        can_change_difficulty: canChangeDifficulty,
        is_rated: isRated,
      });
      setDbGameId(dbGame.game_id);

      // Start new game session
      const data = await api.newGame();
      setGameId(data.game_id);
      setState(data.state);
    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Failed to connect to backend. Please ensure the server is running.');
    }
    setSelectedSquare(null);
    setLegalMoves([]);
    setAllLegalMoves([]);
    setAiThinking(false);
    setAiExplanation('');
    setAiContinuation([]);
    setLoading(false);
  };

  const lastMove = state?.move_history?.length > 0 ? state.move_history[state.move_history.length - 1] : null;

  const handleSquareClick = useCallback(async (row, col) => {
    if (!state || state?.game_over) return;

    // In bot mode, only allow player's turn
    if (gameMode === 'bot' && state?.current_player !== playerColor) return;
    if (aiThinking) return;

    const piece = state.board[row][col];
    const currentTurn = state.current_player;

    // If a square is already selected
    if (selectedSquare) {
      const targetMove = legalMoves.find(m => m.to.row === row && m.to.col === col);

      if (targetMove) {
        // Apply the move via backend
        try {
          const result = await api.makeMove(gameId, {
            from: selectedSquare,
            to: { row, col },
          });

          if (result.state) {
            setState(result.state);
            setSelectedSquare(null);
            setLegalMoves([]);
            setAiExplanation('');
            setAiContinuation([]);
          }
        } catch (err) {
          console.error('Move failed:', err);
        }
        return;
      }

      // Clicking on same piece - deselect
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Clicking on another piece of same player - reselect
      if (piece && piece.player === currentTurn) {
        const moves = allLegalMoves.filter(m => {
          const fromRow = m.from_pos?.row ?? m.from?.row;
          const fromCol = m.from_pos?.col ?? m.from?.col;
          return fromRow === row && fromCol === col;
        });
        setSelectedSquare({ row, col });
        setLegalMoves(moves);
        return;
      }

      // Clicking elsewhere - deselect
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // No square selected - try to select a piece
    if (piece && piece.player === currentTurn) {
      const moves = allLegalMoves.filter(m => {
        const fromRow = m.from_pos?.row ?? m.from?.row;
        const fromCol = m.from_pos?.col ?? m.from?.col;
        return fromRow === row && fromCol === col;
      });
      if (moves.length > 0) {
        setSelectedSquare({ row, col });
        setLegalMoves(moves);
      }
    }
  }, [gameId, state, selectedSquare, legalMoves, allLegalMoves, aiThinking, gameMode, playerColor]);

  const handleNewGame = useCallback(() => {
    gameInitializedRef.current = false;
    startNewGame();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!dbGameId) return;

    try {
      await api.analyzeGame(dbGameId, 'full');
      navigate(`/analysis/${dbGameId}`);
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Failed to analyze game: ' + err.message);
    }
  }, [dbGameId, navigate]);

  const handleResign = useCallback(async () => {
    if (!state) return;
    const winner = gameMode === 'bot'
      ? (playerColor === 'red' ? PLAYERS.WHITE : PLAYERS.RED)
      : (state.current_player === PLAYERS.RED ? PLAYERS.WHITE : PLAYERS.RED);

    setState(prev => ({
      ...prev,
      game_over: true,
      winner,
    }));

    // Complete game in database
    if (dbGameId) {
      try {
        await api.completeGame(dbGameId, 'resigned', winner, state);
      } catch (err) {
        console.error('Failed to complete game:', err);
      }
    }
  }, [state, gameMode, playerColor, dbGameId]);

  const handleUndo = useCallback(async () => {
    if (!state || !gameId) return;

    if (!state.move_history || state.move_history.length < 2) {
      return;
    }

    try {
      const result = await api.undoMoves(gameId);
      if (result.state) {
        setState(result.state);
        setSelectedSquare(null);
        setLegalMoves([]);
        setAiExplanation('');
        setAiContinuation([]);
      }
    } catch (err) {
      console.error('Undo failed:', err);
    }
  }, [state, gameId]);

  const handleHint = useCallback(async () => {
    if (!state || state?.game_over || !gameId || gameMode !== 'bot') return;
    if (state.current_player !== playerColor) return;

    try {
      const result = await api.getHint(gameId, difficulty);

      if (result.move) {
        const from = result.move.from_pos;
        setSelectedSquare(from);
        setAiExplanation(`Hint: ${result.explanation}`);

        // Find the matching legal move(s) for this piece
        const moves = allLegalMoves.filter(m => {
          const fromRow = m.from_pos?.row ?? m.from?.row;
          const fromCol = m.from_pos?.col ?? m.from?.col;
          return fromRow === from.row && fromCol === from.col;
        });

        setLegalMoves(moves);
      } else {
        setAiExplanation('No moves available');
      }
    } catch (err) {
      console.error('Hint error:', err);
      setAiExplanation('Hint unavailable');
    }
  }, [state, gameId, difficulty, allLegalMoves, gameMode, playerColor]);

  // Loading state
  if (loading) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading game...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={startNewGame}
            className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl font-bold"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // No state yet
  if (!state) {
    return null;
  }

  const currentPlayer = state.current_player;
  const gameOver = state.game_over;
  const winner = state.winner;
  const moveHistory = state.move_history;
  const capturedPieces = state.captured_pieces;

  return (
    <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
      {/* Background blobs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 fade-up">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface leading-none mb-3">
            {gameMode === 'offline' ? 'Offline Game' : 'Play vs AI'}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            {/* Difficulty selector - only in bot mode */}
            {gameMode === 'bot' && (
              <>
                <span className="text-on-surface-variant text-sm font-medium">Difficulty:</span>
                <div className="flex gap-2 bg-surface-container-high rounded-xl p-1.5 border border-outline-variant/30">
                  {['easy', 'medium', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => canChangeDifficulty && setDifficulty(d)}
                      disabled={!canChangeDifficulty}
                      className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                        difficulty === d
                          ? 'bg-primary text-on-primary shadow-lg shadow-primary/30'
                          : canChangeDifficulty
                            ? 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                            : 'text-on-surface-variant cursor-not-allowed opacity-60'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {!canChangeDifficulty && (
                  <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">
                    Locked
                  </span>
                )}
              </>
            )}
            
            {/* Player color indicator */}
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant text-sm">You:</span>
              <div 
                className={`w-6 h-6 rounded-full ${
                  playerColor === 'red'
                    ? 'bg-gradient-to-br from-red-400 to-red-700 border-2 border-red-300'
                    : 'bg-gradient-to-br from-white to-gray-300 border-2 border-gray-400'
                }`}
              />
            </div>

            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Backend Connected</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 fade-up fade-up-delay-1">
          {/* Board */}
          <div className="flex justify-center lg:justify-center w-full">
            <div className="w-full max-w-[min(90vw,500px)] lg:max-w-[min(50vw,600px)]">
              <Board
                state={state}
                selectedSquare={selectedSquare}
                legalMoves={legalMoves}
                allLegalMoves={allLegalMoves}
                lastMove={lastMove}
                onSquareClick={handleSquareClick}
                playerColor={playerColor}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:max-w-xs lg:w-80">
            <div className="lg:sticky lg:top-28">
              <RightPanel
                currentPlayer={currentPlayer}
                gameOver={gameOver}
                winner={winner}
                moveHistory={moveHistory}
                aiThinking={aiThinking}
                aiExplanation={showInsights ? aiExplanation : ''}
                aiContinuation={aiContinuation}
                onUndo={handleUndo}
                onResign={handleResign}
                onNewGame={handleNewGame}
                onAnalyze={handleAnalyze}
                onDashboard={() => navigate('/dashboard')}
                onHint={gameMode === 'bot' ? handleHint : null}
                capturedPieces={capturedPieces}
                gameMode={gameMode}
                dbGameId={dbGameId}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

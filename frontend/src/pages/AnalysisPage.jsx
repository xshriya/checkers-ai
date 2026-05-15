import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import * as api from '../services/api';
import Board from '../components/game/Board';

export default function AnalysisPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  console.log('AnalysisPage mounting with gameId:', gameId);

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replay state
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [replayState, setReplayState] = useState(null);
  const [showBestMove, setShowBestMove] = useState(false);
  const [gameInfo, setGameInfo] = useState(null);

  // Load analysis on mount
  useEffect(() => {
    console.log('AnalysisPage useEffect triggered');
    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const data = await api.getGameAnalysis(gameId);
        console.log('Analysis data loaded:', data);
        console.log('Move analysis:', data.move_analysis);
        setAnalysis(data);
        setCurrentMoveIndex(-1);
      } catch (err) {
        console.error('Failed to load analysis:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [gameId]);

  // Load state at current move
  useEffect(() => {
    const loadStateAtMove = async (moveIndex) => {
      try {
        const state = await api.getStateAtMove(gameId, moveIndex);
        setReplayState(state);
      } catch (err) {
        console.error('Failed to load state:', err);
      }
    };

    if (gameId && currentMoveIndex >= -1) {
      loadStateAtMove(currentMoveIndex);
    }
  }, [currentMoveIndex, gameId]);

  // Load game info for player colors
  useEffect(() => {
    const loadGameInfo = async () => {
      try {
        const info = await api.getGameReplay(gameId);
        setGameInfo(info);
      } catch (err) {
        console.error('Failed to load game info:', err);
      }
    };
    loadGameInfo();
  }, [gameId]);

  const handleMoveClick = (index) => {
    setCurrentMoveIndex(index);
  };

  const getMovePlayer = (moveIndex) => {
    if (!gameInfo) return 'Unknown';

    const move = gameInfo.moves[moveIndex];
    const playerColor = move?.player || (moveIndex % 2 === 0 ? 'red' : 'white');
    const userColor = gameInfo.final_state?.player_color || 'red';

    if (playerColor === userColor) {
      return 'You';
    } else {
      return gameInfo.game_mode === 'bot' ? 'Bot' : 'Opponent';
    }
  };

  const getPlayerColorClass = (moveIndex) => {
    if (!gameInfo) return 'text-on-surface-variant';

    const move = gameInfo.moves[moveIndex];
    const playerColor = move?.player || (moveIndex % 2 === 0 ? 'red' : 'white');

    return playerColor === 'red' ? 'text-red-400' : 'text-slate-200';
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'best': return 'bg-green-500/20 border-green-500 text-green-300';
      case 'good': return 'bg-blue-500/20 border-blue-500 text-blue-300';
      case 'inaccuracy': return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
      case 'mistake': return 'bg-orange-500/20 border-orange-500 text-orange-300';
      case 'blunder': return 'bg-red-500/20 border-red-500 text-red-300';
      default: return 'bg-surface-container-high/20 border-outline text-on-surface';
    }
  };

  const getClassificationIcon = (classification) => {
    switch (classification) {
      case 'best': return '✓';
      case 'good': return '✓';
      case 'inaccuracy': return '⚠';
      case 'mistake': return '✗';
      case 'blunder': return '✗✗';
      default: return '';
    }
  };

  if (loading) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="text-2xl font-bold animate-pulse">Analyzing game...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline">
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!analysis || !analysis.move_analysis) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="text-yellow-400 text-xl mb-4">Invalid analysis data</div>
          <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline">
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const currentMoveAnalysis = analysis.move_analysis?.[currentMoveIndex];
  const totalMoves = analysis.move_analysis?.length || 0;
  const progress = totalMoves > 0 ? ((currentMoveIndex + 1) / totalMoves) * 100 : 0;

  return (
    <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-on-surface-variant hover:text-on-surface flex items-center gap-2 mb-2"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface">
              Game Analysis
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {analysis.moves_analyzed} moves analyzed • {analysis.analysis_type} analysis
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-primary">
              {analysis.accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-on-surface-variant">Accuracy</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <StatCard label="Best" value={analysis.best_moves} color="green" />
          <StatCard label="Good" value={analysis.good_moves} color="blue" />
          <StatCard label="Inaccuracies" value={analysis.inaccuracies} color="yellow" />
          <StatCard label="Mistakes" value={analysis.mistakes} color="orange" />
          <StatCard label="Blunders" value={analysis.blunders} color="red" />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1.5fr_400px] gap-6">
          {/* Left: Board */}
          <div className="w-full">
            {/* Board */}
            <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-4 backdrop-blur-[12px] mb-4">
              <div className="flex justify-center">
                {replayState && (
                  <div className="w-full max-w-[min(85vw,450px)] lg:max-w-[min(45vw,500px)]">
                    <Board
                      state={replayState}
                      selectedSquare={null}
                      legalMoves={showBestMove && currentMoveAnalysis?.best_move ? [currentMoveAnalysis.best_move] : []}
                      allLegalMoves={[]}
                      lastMove={currentMoveIndex >= 0 ? analysis.move_analysis[currentMoveIndex] : null}
                      onSquareClick={() => {}}
                      playerColor={gameInfo?.final_state?.player_color || 'red'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-4 backdrop-blur-[12px]">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentMoveIndex(-1)}
                  className="p-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 transition-all"
                  title="Go to start"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1))}
                  disabled={currentMoveIndex < 0}
                  className="p-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 disabled:opacity-50 transition-all"
                  title="Previous move"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold">
                    {currentMoveIndex < 0 ? 'Start' : `Move ${currentMoveIndex + 1}`}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {currentMoveIndex < 0 ? 'Starting position' : `${currentMoveIndex + 1} / ${totalMoves}`}
                  </div>
                </div>
                <button
                  onClick={() => setCurrentMoveIndex(Math.min(totalMoves - 1, currentMoveIndex + 1))}
                  disabled={currentMoveIndex >= totalMoves - 1}
                  className="p-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 disabled:opacity-50 transition-all"
                  title="Next move"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => setCurrentMoveIndex(totalMoves - 1)}
                  className="p-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 transition-all"
                  title="Go to end"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 bg-surface-container-high/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Analysis Details */}
          <div className="space-y-4">
            {/* Current Move Analysis */}
            {currentMoveAnalysis && (
              <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-5 backdrop-blur-[12px]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                  <Lightbulb size={14} />
                  Move {currentMoveAnalysis.move_number} Analysis
                  <span className={`text-xs font-bold ${getPlayerColorClass(currentMoveIndex)}`}>
                    ({getMovePlayer(currentMoveIndex)})
                  </span>
                </h3>

                {/* Classification Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 font-bold text-sm mb-3 ${getClassificationColor(currentMoveAnalysis.classification)}`}>
                  <span className="text-lg">{getClassificationIcon(currentMoveAnalysis.classification)}</span>
                  <span className="uppercase">{currentMoveAnalysis.classification}</span>
                </div>

                {/* Evaluation Change */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface-variant">Evaluation</span>
                    <span className="font-bold">
                      {currentMoveAnalysis.evaluation_before.toFixed(1)} → {currentMoveAnalysis.evaluation_after.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Change</span>
                    <span className={`font-bold ${(currentMoveAnalysis.evaluation_after - currentMoveAnalysis.evaluation_before) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(currentMoveAnalysis.evaluation_after - currentMoveAnalysis.evaluation_before) >= 0 ? '+' : ''}{(currentMoveAnalysis.evaluation_after - currentMoveAnalysis.evaluation_before).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-surface-container-high/20 rounded-lg p-3 mb-3">
                  <p className="text-sm leading-relaxed">{currentMoveAnalysis.explanation}</p>
                </div>

                {/* Best Move Alternative */}
                {currentMoveAnalysis.best_move && (
                  <div className="bg-primary-container/10 border border-primary/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-primary" />
                      <span className="text-sm font-bold text-primary">Best Alternative</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-on-surface-variant">From:</span> ({currentMoveAnalysis.best_move.from_pos?.row ?? currentMoveAnalysis.best_move.from?.row}, {currentMoveAnalysis.best_move.from_pos?.col ?? currentMoveAnalysis.best_move.from?.col})
                      <span className="mx-2">→</span>
                      <span className="text-on-surface-variant">To:</span> ({currentMoveAnalysis.best_move.to?.row}, {currentMoveAnalysis.best_move.to?.col})
                      <span className="ml-2 text-xs text-on-surface-variant/60">(row, col)</span>
                    </div>
                    <button
                      onClick={() => setShowBestMove(!showBestMove)}
                      className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {showBestMove ? 'Hide' : 'Show'} on board
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Move Timeline */}
            <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-5 backdrop-blur-[12px]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Move Timeline
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
                <button
                  onClick={() => handleMoveClick(-1)}
                  className={`w-full text-left p-2 rounded-lg transition-all ${
                    currentMoveIndex === -1 ? 'bg-primary-container/30 border border-primary' : 'hover:bg-surface-container-high/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">START</span>
                    <span className="text-sm">Starting position</span>
                  </div>
                </button>
                {analysis.move_analysis.map((move, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMoveClick(idx)}
                    className={`w-full text-left p-2 rounded-lg transition-all ${
                      currentMoveIndex === idx ? 'bg-primary-container/30 border border-primary' : 'hover:bg-surface-container-high/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${getClassificationColor(move.classification)}`}>
                        {getClassificationIcon(move.classification)}
                      </span>
                      <span className="text-xs font-bold text-on-surface-variant">Move {move.move_number}</span>
                      <span className={`text-xs font-bold ${getPlayerColorClass(idx)}`}>
                        {getMovePlayer(idx)}
                      </span>
                      <span className="text-sm flex-1 truncate">{move.explanation}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Moments */}
            {analysis.critical_moments.length > 0 && (
              <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-5 backdrop-blur-[12px]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Critical Moments
                </h3>
                <div className="space-y-2">
                  {analysis.critical_moments.map((moment, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleMoveClick(moment.move_number - 1)}
                      className="w-full text-left p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-orange-300">Move {moment.move_number}</span>
                        <span className="text-xs text-orange-200">{moment.evaluation_change.toFixed(1)} pts</span>
                      </div>
                      <p className="text-sm text-on-surface">{moment.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    red: 'text-red-400'
  };

  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-4 backdrop-blur-[12px] text-center">
      <div className={`text-2xl font-black ${colors[color]}`}>{value}</div>
      <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

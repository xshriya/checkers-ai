// Right Panel - AI explanation, move history, and actions

import { useState } from 'react';
import { RotateCcw, Lightbulb, Flag, X, Sparkles } from 'lucide-react';
import * as api from '../../services/api';

// Helper to format move notation
function formatMoveNotation(move) {
  const from = move.from || move.from_pos;
  const to = move.to;
  if (!from || !to) return '---';

  const fromSquare = String.fromCharCode(97 + from.col) + (8 - from.row);
  const toSquare = String.fromCharCode(97 + to.col) + (8 - to.row);
  const separator = move.isCapture || (move.captures && move.captures.length > 0) ? 'x' : '-';
  const promotionSuffix = move.promotes || move.promoted ? '=K' : '';

  return `${fromSquare}${separator}${toSquare}${promotionSuffix}`;
}

export default function RightPanel({
  currentPlayer,
  gameOver,
  winner,
  moveHistory,
  aiThinking,
  aiExplanation,
  lastAnalysis,
  onUndo,
  onResign,
  onNewGame,
  onHint,
  onAnalyze,
  onDashboard,
  capturedPieces,
  gameMode = 'bot',
  dbGameId,
  aiContinuation,
}) {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showContinuation, setShowContinuation] = useState(false);
  const [continuationExplanation, setContinuationExplanation] = useState(null);
  const [loadingContinuation, setLoadingContinuation] = useState(false);

  const handleViewSummary = async () => {
    if (!dbGameId) return;

    setLoadingSummary(true);
    setShowSummary(true);

    try {
      const data = await api.getGameSummary(dbGameId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setSummary({
        summary: 'Unable to generate summary. Please try again.',
        key_insights: ['Summary generation failed.']
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExplainContinuation = async () => {
    if (!dbGameId || !aiContinuation || aiContinuation.length === 0) return;

    setLoadingContinuation(true);
    setShowContinuation(true);

    try {
      const data = await api.explainAIContinuation(dbGameId, aiContinuation);
      setContinuationExplanation(data.explanation);
    } catch (err) {
      console.error('Failed to explain continuation:', err);
      setContinuationExplanation('Unable to generate explanation. Please try again.');
    } finally {
      setLoadingContinuation(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      {/* Current Turn / Game Status */}
      <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-5 backdrop-blur-[12px] min-h-[72px]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Status</h3>

        {gameOver ? (
          <div className="text-center">
            <div className="text-2xl font-black mb-2">
              {winner === 'red' ? (
                <span className="text-red-400">Red Wins!</span>
              ) : winner === 'white' ? (
                <span className="text-slate-200">White Wins!</span>
              ) : (
                <span className="text-on-surface">Draw!</span>
              )}
            </div>
            <div className="flex gap-2 justify-center mt-3 flex-wrap">
              {dbGameId && (
                <button
                  onClick={handleViewSummary}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-on-surface px-4 py-2.5 rounded-xl border-2 border-purple-500/30 font-bold text-sm hover:shadow-[0_0_15px_2px_rgba(168,85,247,0.3)] transition-all duration-300 active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Summary
                </button>
              )}
              {onAnalyze && (
                <button
                  onClick={onAnalyze}
                  className="bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl border-2 border-outline font-bold text-sm hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.2)] transition-all duration-300 active:scale-95"
                >
                  📊 Analyze
                </button>
              )}
              <button
                onClick={onNewGame}
                className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl border-2 border-primary font-bold text-sm hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.3)] transition-all duration-300 active:scale-95"
              >
                New Game
              </button>
              {onDashboard && (
                <button
                  onClick={onDashboard}
                  className="glass-panel text-on-surface px-6 py-2.5 rounded-xl border-2 border-outline-variant/20 font-bold text-sm hover:bg-white/10 transition-all duration-300 active:scale-95"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${currentPlayer === 'red' ? 'bg-red-500' : 'bg-slate-200'}`} />
            <span className="text-on-surface font-semibold">
              {currentPlayer === 'red' ? 'Red' : 'White'} to move
            </span>
            {aiThinking && gameMode === 'bot' && (
              <span className="text-on-surface-variant text-sm animate-pulse">AI thinking...</span>
            )}
          </div>
        )}
      </div>

      {/* AI Explanation - only in bot mode */}
      {gameMode === 'bot' && (
        <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-5 backdrop-blur-[12px] min-h-[80px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              {aiExplanation && <div className="w-3 h-3 rounded-full bg-slate-200 animate-pulse" />}
              AI Insight
            </h3>
            <div className="flex items-center gap-2">
              {aiContinuation && aiContinuation.length > 0 && (
                <button
                  onClick={handleExplainContinuation}
                  className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 hover:border-primary/50 transition-all duration-200 flex items-center justify-center text-xs font-bold"
                  title="Explain AI's thinking"
                >
                  ?
                </button>
              )}
              {moveHistory.length > 0 && moveHistory[moveHistory.length - 1]?.player === 'white' && (
                <button
                  onClick={onHint}
                  disabled={aiThinking}
                  className="text-xs text-primary hover:text-primary-fixed transition-colors"
                >
                  Show Hint
                </button>
              )}
            </div>
          </div>

          {aiExplanation ? (
            <p className="text-sm text-on-surface leading-relaxed">{aiExplanation}</p>
          ) : (
            <p className="text-sm text-on-surface-variant italic">Make a move to see AI insights</p>
          )}
        </div>
      )}

      {/* Last Analysis */}
      {lastAnalysis && lastAnalysis.classification !== 'best' && lastAnalysis.classification !== 'good' && (
        <div className={`p-4 rounded-2xl text-sm ${
          lastAnalysis.classification === 'blunder' ? 'bg-red-500/10 border border-red-500/20 text-red-300' :
          lastAnalysis.classification === 'mistake' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-300' :
          'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300'
        }`}>
          <span className="font-bold">{lastAnalysis.label}</span>
          {lastAnalysis.explanation && (
            <p className="mt-1 text-xs opacity-80">{lastAnalysis.explanation}</p>
          )}
        </div>
      )}

      {/* Move History */}
      <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-5 backdrop-blur-[12px]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Move History</h3>

        <div className="h-24 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {moveHistory.length === 0 ? (
            <p className="text-on-surface-variant text-sm italic">No moves yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {moveHistory.map((move, idx) => {
                // Generate notation if not present
                const notation = move.notation || formatMoveNotation(move);
                return (
                  <div key={idx} className={`flex items-center gap-2 ${move.player === 'red' ? 'text-red-400' : 'text-slate-300'}`}>
                    <span className="text-on-surface-variant text-xs w-6">{Math.floor(idx / 2) + 1}{idx % 2 === 0 ? '.' : '...'}</span>
                    <span className="font-mono">{notation}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-5 backdrop-blur-[12px]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Actions</h3>

        <div className="flex flex-col gap-2">
          {/* Hint button - only in bot mode */}
          {gameMode === 'bot' && onHint && (
            <button
              onClick={onHint}
              disabled={gameOver || aiThinking}
              className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-2.5 rounded-xl border border-primary/20 font-bold text-sm hover:bg-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lightbulb size={16} /> Show Hint
            </button>
          )}

          <button
            onClick={onUndo}
            disabled={moveHistory.length === 0 || gameOver}
            className="flex items-center justify-center gap-2 glass-panel text-on-surface py-2.5 rounded-xl border border-outline-variant/20 font-bold text-sm hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={16} /> Undo Move
          </button>

          <button
            onClick={onResign}
            disabled={gameOver}
            className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 py-2.5 rounded-xl border border-red-500/20 font-bold text-sm hover:bg-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Flag size={16} /> Resign
          </button>
        </div>
      </div>

      {/* Game Summary Popup */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/20 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Game Summary
              </h2>
              <button
                onClick={() => setShowSummary(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingSummary ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-on-surface-variant">Generating summary...</p>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                <div className="bg-white/[0.03] rounded-xl p-4 border border-outline-variant/10">
                  <p className="text-on-surface leading-relaxed">{summary.summary}</p>
                </div>

                {summary.key_insights && summary.key_insights.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-3">Key Insights</h3>
                    <div className="space-y-2">
                      {summary.key_insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-on-surface">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-on-surface-variant">No summary available</p>
            )}
          </div>
        </div>
      )}

      {/* Continuation Explanation Popup */}
      {showContinuation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/20 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI's Thinking
              </h2>
              <button
                onClick={() => setShowContinuation(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingContinuation ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-on-surface-variant">Analyzing AI's plan...</p>
              </div>
            ) : continuationExplanation ? (
              <div className="space-y-4">
                <div className="bg-white/[0.03] rounded-xl p-4 border border-outline-variant/10">
                  <p className="text-on-surface leading-relaxed">{continuationExplanation}</p>
                </div>

                {aiContinuation && aiContinuation.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-3">Planned Moves</h3>
                    <div className="space-y-2">
                      {aiContinuation.map((move, idx) => {
                        const from = move.from || move.from_pos || {};
                        const to = move.to || {};
                        const fromRow = from.row;
                        const fromCol = from.col;
                        const toRow = to.row;
                        const toCol = to.col;

                        const notation = `(${fromRow},${fromCol}) → (${toRow},${toCol})`;
                        const captures = move.captures || [];
                        const promotes = move.promotes || move.promoted;

                        return (
                          <div key={idx} className="flex items-start gap-2 text-sm text-on-surface">
                            <span className="text-primary mt-1 font-bold">{idx + 1}.</span>
                            <span>
                              {notation}
                              {captures.length > 0 && <span className="text-red-400 ml-2">({captures.length} capture{captures.length > 1 ? 's' : ''})</span>}
                              {promotes && <span className="text-yellow-400 ml-2">→ King</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-on-surface-variant">No explanation available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

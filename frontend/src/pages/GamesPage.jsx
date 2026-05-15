import { useState, useEffect } from 'react';
import { Trophy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../services/api';

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    loadGames();
  }, [page]);

  const loadGames = async () => {
    try {
      const data = await api.getUserGames(page, perPage);
      setGames(data.games);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading games...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface leading-none mb-2">
            Game History
          </h1>
          <p className="text-on-surface-variant text-sm">
            {total} games played
          </p>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-16">
            <Trophy size={64} className="mx-auto text-outline/30 mb-4" />
            <p className="text-on-surface-variant text-lg">No games played yet</p>
            <button
              onClick={() => window.location.href = '/play'}
              className="mt-4 bg-primary-container text-on-primary-container px-6 py-3 rounded-xl border-2 border-primary font-bold"
            >
              Start Playing
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            {/* Pagination */}
            {total > perPage && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-on-surface-variant text-sm">
                  Page {page} of {Math.ceil(total / perPage)}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(total / perPage), p + 1))}
                  disabled={page >= Math.ceil(total / perPage)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function GameCard({ game }) {
  const resultColors = {
    win: 'text-green-400',
    loss: 'text-red-400',
    draw: 'text-slate-400',
    resigned: 'text-orange-400',
    in_progress: 'text-yellow-400'
  };

  const resultLabels = {
    win: 'Won',
    loss: 'Lost',
    draw: 'Draw',
    resigned: 'Resigned',
    in_progress: 'In Progress'
  };

  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl p-4 backdrop-blur-[12px] hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${resultColors[game.result]?.replace('text-', 'bg-')}/20`}>
            <span className={`text-sm font-bold uppercase ${resultColors[game.result]}`}>
              {resultLabels[game.result]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold uppercase ${resultColors[game.result]}`}>
                {resultLabels[game.result]}
              </span>
              <span className="text-on-surface-variant text-xs">
                {game.game_mode === 'bot' ? `vs AI (${game.difficulty})` : 'Offline'}
              </span>
            </div>
            <div className="text-on-surface-variant text-xs">
              {game.player_color === 'red' ? 'Red' : 'White'} • {game.duration_seconds ? `${Math.floor(game.duration_seconds / 60)}m ${game.duration_seconds % 60}s` : 'Active'}
            </div>
            <div className="text-outline text-[10px] mt-1">
              {new Date(game.started_at).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-on-surface-variant">#{game.game_number}</div>
          <div className="text-xs text-outline">
            {game.moves?.length || 0} moves
          </div>
        </div>
      </div>
    </div>
  );
}

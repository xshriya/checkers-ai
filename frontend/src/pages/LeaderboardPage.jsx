import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, ChevronLeft, ChevronRight, User } from 'lucide-react';
import * as api from '../services/api';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('rating');
  const perPage = 20;

  useEffect(() => {
    loadLeaderboard();
  }, [page, sortBy]);

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard(page, perPage, sortBy);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading leaderboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface leading-none mb-2">
            Leaderboard
          </h1>
          <p className="text-on-surface-variant text-sm">
            {leaderboard?.total_users || 0} players
          </p>
        </div>

        {/* Sort options */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSortBy('rating')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              sortBy === 'rating'
                ? 'bg-primary-container text-on-primary-container border-2 border-primary'
                : 'bg-surface-container-high/30 text-on-surface-variant hover:bg-surface-container-high/50'
            }`}
          >
            <Trophy size={16} /> By Rating
          </button>
          <button
            onClick={() => setSortBy('games')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              sortBy === 'games'
                ? 'bg-primary-container text-on-primary-container border-2 border-primary'
                : 'bg-surface-container-high/30 text-on-surface-variant hover:bg-surface-container-high/50'
            }`}
          >
            <TrendingUp size={16} /> By Games
          </button>
        </div>

        {/* Leaderboard table */}
        <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px]">
          <div className="space-y-2">
            {leaderboard?.entries.map((player) => (
              <LeaderboardEntry key={player.user_id} player={player} />
            ))}
          </div>
        </div>

        {/* Pagination */}
        {leaderboard && leaderboard.total_users > perPage && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-on-surface-variant text-sm">
              Page {page} of {Math.ceil(leaderboard.total_users / perPage)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(leaderboard.total_users / perPage), p + 1))}
              disabled={page >= Math.ceil(leaderboard.total_users / perPage)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/30 hover:bg-surface-container-high/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function LeaderboardEntry({ player }) {
  const rankColors = {
    1: 'text-yellow-400',
    2: 'text-slate-300',
    3: 'text-amber-600'
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/[0.03] transition-all duration-200 border border-outline-variant/10">
      <div className="flex items-center gap-4">
        <span className={`text-lg font-black w-8 ${rankColors[player.rank] || 'text-on-surface-variant'}`}>
          #{player.rank}
        </span>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold">
            <User size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-on-surface">
              {player.username}
            </div>
            <div className="text-[10px] text-outline">
              {player.total_games} games
            </div>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-black text-on-surface">{player.rating}</div>
        <div className="text-xs text-on-surface-variant">
          {player.win_rate}% win rate
        </div>
      </div>
    </div>
  );
}

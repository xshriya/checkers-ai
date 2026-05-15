import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Gamepad2, Clock, Target, Zap, Play, ChevronRight, User, Sparkles, X } from 'lucide-react';
import * as api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, checkAuth } = useAuth();
  const [leaderboard, setLeaderboard] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [leaderboardData, gamesData] = await Promise.all([
        api.getLeaderboard(1, 5, 'rating'),
        api.getUserGames(1, 5)
      ]);

      setLeaderboard(leaderboardData);
      setRecentGames(gamesData.games);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  if (authLoading) {
    return (
      <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const stats = user.stats || {
    total_games: 0,
    total_wins: 0,
    total_losses: 0,
    rating: 1000
  };
  const winRate = stats.total_games > 0 ? Math.round((stats.total_wins / stats.total_games) * 100) : 0;

  return (
    <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
      {/* Background effects */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 fade-up">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface leading-none mb-2">
                Welcome back, <span className="text-primary">{user.username}</span>
              </h1>
              <p className="text-on-surface-variant text-sm">
                {user.is_verified ? '✓ Verified Player' : 'Unverified Player'} • {stats.total_games} games played • {leaderboard ? `Ranked ${leaderboard.rank} out of ${leaderboard.total_users} users` : 'Loading rankings...'}
              </p>
            </div>
            <button
              onClick={() => navigate('/play')}
              className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl border-2 border-primary font-bold flex items-center gap-2 hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.3)] transition-all duration-300 active:scale-95"
            >
              <Play size={18} /> Play Now
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-up fade-up-delay-1">
          <StatCard
            icon={<Trophy size={20} />}
            label="Rating"
            value={stats.rating}
            color="text-yellow-400"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Win Rate"
            value={`${winRate}%`}
            color="text-green-400"
          />
          <StatCard
            icon={<Gamepad2 size={20} />}
            label="Games"
            value={stats.total_games}
            color="text-primary"
          />
          <StatCard
            icon={<Zap size={20} />}
            label="Win Streak"
            value={stats.win_streak}
            color="text-orange-400"
          />
        </div>

        {/* Recalculate Stats Button */}
        <button
          onClick={async () => {
            try {
              await api.recalculateStats();
              await checkAuth();
              alert('Stats recalculated successfully!');
            } catch (err) {
              alert('Failed to recalculate stats: ' + err.message);
            }
          }}
          className="text-xs text-outline hover:text-on-surface-variant transition-colors mb-6"
        >
          ↻ Recalculate Stats
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up fade-up-delay-2">
          {/* Recent Games */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <Clock size={14} /> Recent Games
                </h3>
                <button
                  onClick={() => navigate('/games')}
                  className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-fixed transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>

              {recentGames.length === 0 ? (
                <div className="text-center py-8">
                  <Gamepad2 size={48} className="mx-auto text-outline/30 mb-3" />
                  <p className="text-on-surface-variant text-sm">No games yet</p>
                  <button
                    onClick={() => navigate('/play')}
                    className="mt-3 text-primary font-bold text-sm hover:underline"
                  >
                    Start your first game
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onAnalyze={() => loadDashboardData()}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <Trophy size={14} /> Leaderboard
                </h3>
              </div>

              {leaderboard && leaderboard.entries.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.entries.map((player) => (
                    <LeaderboardEntry
                      key={player.user_id}
                      player={player}
                      isCurrentUser={player.user_id === user.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm text-center py-4">No leaderboard data</p>
              )}

              <button
                onClick={() => navigate('/leaderboard')}
                className="mt-4 w-full text-center text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-fixed transition-colors flex items-center justify-center gap-1"
              >
                Full Leaderboard <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="mt-6 fade-up fade-up-delay-3">
          <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-4">
              <Target size={14} /> Performance Overview
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PerformanceStat label="Total Wins" value={stats.total_wins} color="text-green-400" />
              <PerformanceStat label="Total Losses" value={stats.total_losses} color="text-red-400" />
              <PerformanceStat label="Best Streak" value={stats.best_streak} color="text-yellow-400" />
              <PerformanceStat label="Games Analyzed" value={stats.games_analyzed} color="text-primary" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-xl p-4 backdrop-blur-[12px] hover:border-primary/30 transition-all duration-300">
      <div className={`flex items-center gap-2 ${color} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-black text-on-surface">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</div>
    </div>
  );
}

function GameCard({ game, onAnalyze }) {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

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

  const handleAnalyze = async (force = false) => {
    setAnalyzing(true);
    try {
      await api.analyzeGame(game.game_id, 'full', force);
      onAnalyze?.();
      navigate(`/analysis/${game.game_id}`);
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Failed to analyze game: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewSummary = async () => {
    setLoadingSummary(true);
    setShowSummary(true);

    try {
      const data = await api.getGameSummary(game.game_id);
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

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/20 hover:bg-surface-container-high/30 transition-all duration-200 border border-outline-variant/10">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resultColors[game.result]?.replace('text-', 'bg-')}/20`}>
          <span className={`text-xs font-bold uppercase ${resultColors[game.result]}`}>
            {resultLabels[game.result]?.charAt(0)}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase ${resultColors[game.result]}`}>
              {resultLabels[game.result]}
            </span>
            <span className="text-on-surface-variant text-xs">
              {game.game_mode === 'bot' ? `vs AI (${game.difficulty})` : 'Offline'}
            </span>
          </div>
          <div className="text-on-surface-variant text-xs">
            {game.player_color === 'red' ? 'Red' : 'White'} • {game.duration_seconds ? `${Math.floor(game.duration_seconds / 60)}m` : 'Active'}
          </div>
          {game.analysis && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-primary font-bold">
                {game.analysis.accuracy.toFixed(0)}% accuracy
              </span>
              <span className="text-outline">•</span>
              <span className="text-green-400">{game.analysis.best_moves} best</span>
              <span className="text-blue-400">{game.analysis.good_moves} good</span>
              <span className="text-yellow-400">{game.analysis.inaccuracies} inacc.</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-2">
        <div>
          <div className="text-xs font-bold text-on-surface-variant">#{game.game_number}</div>
          <div className="text-xs text-outline">
            {new Date(game.started_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAnalyze(game.analysis ? true : false)}
            disabled={analyzing}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 border ${
              analyzing
                ? 'bg-surface-container-high/30 text-outline cursor-not-allowed border-outline-variant/20'
                : game.analysis
                ? 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 hover:border-primary/60'
                : 'bg-surface-container-high/20 text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high/30 hover:border-outline-variant/50'
            }`}
          >
            {analyzing ? 'Analyzing...' : game.analysis ? 'Re-analyze' : 'Analyze'}
          </button>
          <button
            onClick={handleViewSummary}
            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 border bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-on-surface border-purple-500/30 hover:shadow-[0_0_10px_2px_rgba(168,85,247,0.2)]"
          >
            Summary
          </button>
        </div>
      </div>

      {/* Summary Popup */}
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
    </div>
  );
}

function LeaderboardEntry({ player, isCurrentUser }) {
  const rankColors = {
    1: 'text-yellow-400',
    2: 'text-slate-300',
    3: 'text-amber-600'
  };

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 ${isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/[0.03]'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-xs font-black w-5 ${rankColors[player.rank] || 'text-on-surface-variant'}`}>
          {player.rank}
        </span>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${isCurrentUser ? 'from-indigo-400 to-purple-500' : 'from-slate-400 to-slate-600'} flex items-center justify-center text-white text-xs font-bold`}>
            <User size={12} />
          </div>
          <span className={`text-sm font-semibold ${isCurrentUser ? 'text-primary' : 'text-on-surface'}`}>
            {player.username}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xs font-bold text-on-surface-variant">{player.rating}</span>
        <div className="text-[10px] text-outline">{player.win_rate}% win</div>
      </div>
    </div>
  );
}

function PerformanceStat({ label, value, color }) {
  return (
    <div className="text-center p-3 rounded-lg bg-surface-container-high/20">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</div>
    </div>
  );
}

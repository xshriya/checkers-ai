import { useState } from 'react';
import { Trophy, ChevronRight } from 'lucide-react';

const friendsData = [
  { rank: 1, name: 'You', rating: 1247, isUser: true },
  { rank: 2, name: 'Alex', rating: 1180, isUser: false },
  { rank: 3, name: 'Sam', rating: 1095, isUser: false },
  { rank: 4, name: 'Jamie', rating: 1020, isUser: false },
  { rank: 5, name: 'Priya', rating: 980, isUser: false },
];

const globalData = [
  { rank: 1, name: 'xKing', rating: 1842, isUser: false },
  { rank: 2, name: 'CheckMate99', rating: 1790, isUser: false },
  { rank: 3, name: 'BoardMaster', rating: 1735, isUser: false },
  { rank: 4, name: 'JumpShot', rating: 1688, isUser: false },
  { rank: 5, name: 'RedQueen', rating: 1645, isUser: false },
];

export default function LeaderboardCard() {
  const [tab, setTab] = useState('friends');
  const data = tab === 'friends' ? friendsData : globalData;

  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px] hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
          <Trophy size={14} /> Leaderboard
        </h3>
      </div>

      <div className="flex mb-4 bg-surface-container-high/30 rounded-lg p-1">
        <button
          className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${tab === 'friends' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => setTab('friends')}
        >
          Friends
        </button>
        <button
          className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 ${tab === 'global' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => setTab('global')}
        >
          Global
        </button>
      </div>

      <div className="space-y-2">
        {data.map((player) => (
          <div
            key={player.rank}
            className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 ${player.isUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/[0.03]'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-black w-5 ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-slate-300' : player.rank === 3 ? 'text-amber-600' : 'text-on-surface-variant'}`}>
                {player.rank}
              </span>
              <span className={`text-sm font-semibold ${player.isUser ? 'text-primary' : 'text-on-surface'}`}>
                {player.name}
              </span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant">{player.rating}</span>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full text-center text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-fixed transition-colors flex items-center justify-center gap-1">
        View Full Board <ChevronRight size={14} />
      </button>
    </div>
  );
}

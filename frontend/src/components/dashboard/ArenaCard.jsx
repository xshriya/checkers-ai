import { Palette, ChevronRight } from 'lucide-react';

const badges = [
  { name: 'First Win', icon: '🏆', unlocked: true },
  { name: '5 Streak', icon: '🔥', unlocked: true },
  { name: '100 Games', icon: '💯', unlocked: false },
  { name: 'Grandmaster', icon: '👑', unlocked: false },
];

export default function ArenaCard() {
  const xp = 340;
  const xpMax = 500;
  const level = 7;

  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px] hover:border-primary/30 transition-all duration-300">
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
        <Palette size={14} /> Your Arena
      </h3>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-on-surface text-sm font-bold">Level {level}</span>
          <span className="text-on-surface-variant text-xs">{xp}/{xpMax} XP</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-fixed rounded-full transition-all duration-700"
            style={{ width: `${(xp / xpMax) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {badges.map((badge) => (
          <div
            key={badge.name}
            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${badge.unlocked ? 'bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:scale-105 cursor-pointer' : 'bg-surface-container-high/20 border border-outline-variant/10 opacity-40'}`}
            title={badge.name}
          >
            <span className="text-lg">{badge.icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant leading-none">{badge.name}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4">
        <span>Theme: <span className="text-on-surface font-semibold">Dark Board</span></span>
      </div>

      <button className="w-full text-center text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-fixed transition-colors flex items-center justify-center gap-1">
        Customize <ChevronRight size={14} />
      </button>
    </div>
  );
}

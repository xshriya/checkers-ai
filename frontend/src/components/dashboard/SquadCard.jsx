import { Swords, UserPlus } from 'lucide-react';

const friends = [
  { name: 'Alex', online: true },
  { name: 'Sam', online: true },
  { name: 'Jamie', online: false },
  { name: 'Priya', online: false },
];

export default function SquadCard() {
  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px] hover:border-primary/30 transition-all duration-300">
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
        <Swords size={14} /> Squad
      </h3>

      <div className="flex flex-wrap gap-3 mb-5">
        {friends.map((friend) => (
          <div
            key={friend.name}
            className="flex items-center gap-2 bg-surface-container-high/30 rounded-lg px-3 py-2 border border-outline-variant/10 hover:border-primary/20 transition-all duration-200"
          >
            <span className={`w-2 h-2 rounded-full ${friend.online ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-slate-500'}`}></span>
            <span className="text-sm font-semibold text-on-surface">{friend.name}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button className="flex-1 bg-primary-container text-on-primary-container py-2.5 rounded-xl border-2 border-primary font-bold text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.3)] transition-all duration-300 active:scale-95">
          <Swords size={16} /> Challenge
        </button>
        <button className="flex-1 glass-panel text-on-surface py-2.5 rounded-xl border border-outline-variant/20 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all duration-200">
          <UserPlus size={16} /> Invite
        </button>
      </div>
    </div>
  );
}

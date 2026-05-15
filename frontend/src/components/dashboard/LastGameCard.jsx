import { RotateCcw, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LastGameCard() {
  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px] hover:border-primary/30 transition-all duration-300 group">
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Last Game</h3>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Loss</span>
          <span className="text-on-surface-variant text-xs">vs AI • Medium</span>
        </div>
        <p className="text-on-surface text-sm leading-relaxed italic">
          "You were <span className="text-primary font-bold not-italic">1 move from winning</span> — a double jump was open on square 22."
        </p>
      </div>

      <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-5">
        <span>Rating:</span>
        <span className="text-red-400 font-bold">-8</span>
        <span className="mx-1">•</span>
        <span>23 moves</span>
        <span className="mx-1">•</span>
        <span>4m 12s</span>
      </div>

      <div className="flex gap-3">
        <Link
          to="/game"
          className="flex-1 bg-primary-container text-on-primary-container py-2.5 rounded-xl border-2 border-primary font-bold text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_15px_2px_rgba(128,131,255,0.3)] transition-all duration-300 active:scale-95"
        >
          <Play size={16} /> Play Again
        </Link>
        <button className="flex-1 glass-panel text-on-surface py-2.5 rounded-xl border border-outline-variant/20 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all duration-200">
          <RotateCcw size={16} /> Replay
        </button>
      </div>
    </div>
  );
}

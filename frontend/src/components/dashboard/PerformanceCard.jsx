import { BarChart3, ChevronRight, Flame } from 'lucide-react';

const sparklineData = [3, 5, 4, 7, 6, 8, 5, 9, 7, 10, 8, 6, 9, 11, 10, 12, 9, 13, 11, 14];
const maxVal = Math.max(...sparklineData);

export default function PerformanceCard() {
  const points = sparklineData.map((val, i) => {
    const x = (i / (sparklineData.length - 1)) * 100;
    const y = 100 - ((val / maxVal) * 80) - 10;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="bg-white/[0.03] border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-[12px] hover:border-primary/30 transition-all duration-300">
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
        <BarChart3 size={14} /> Performance
      </h3>

      <div className="mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(128,131,255,0.3)" />
              <stop offset="100%" stopColor="rgba(128,131,255,0)" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#sparkGrad)" />
          <polyline
            points={points}
            fill="none"
            stroke="rgba(128,131,255,0.8)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sparkline-draw"
          />
        </svg>
        <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
          <span>20 games ago</span>
          <span>Now</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-on-surface text-sm font-bold">3 win streak</span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-green-400 font-bold">W: 12</span>
          <span className="text-red-400 font-bold">L: 8</span>
        </div>
      </div>

      <button className="w-full text-center text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-fixed transition-colors flex items-center justify-center gap-1">
        Full Stats <ChevronRight size={14} />
      </button>
    </div>
  );
}

import { TrendingUp, Brain, History, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

const boardCells = Array.from({ length: 64 }, (_, i) => {
  const row = Math.floor(i / 8);
  const col = i % 8;
  const isDark = (row + col) % 2 === 1;
  let piece = null;
  if (isDark) {
    if (row < 3) piece = 'dark';
    else if (row > 4) piece = 'light';
  }
  const isHighlight = row === 5 && col === 2;
  return { isDark, piece, isHighlight };
});

export default function HeroSection() {
  return (
    <main className="relative min-h-screen pt-14 overflow-hidden hero-gradient">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 lg:py-12 grid lg:grid-cols-2 items-center gap-16 relative z-10">
        <div className="flex flex-col gap-4 order-2 lg:order-1">
          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black leading-[1.1] tracking-tighter text-on-surface overflow-hidden">
            <span className="fade-up block">Play.</span>
            <span className="fade-up fade-up-delay-2 block">Analyze.</span>
            <span className="fade-up fade-up-delay-3 block text-primary italic">Dominate.</span>
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
            Master checkers with AI-powered analysis, move classification, and personalized insights that help you improve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/signup" className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl border-2 border-primary text-lg font-extrabold primary-button-glow transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-110 hover:shadow-[0_0_30px_8px_rgba(128,131,255,0.5)] hover:brightness-125">
              Get Started Free <TrendingUp size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            <div className="flex flex-col gap-1.5">
              <Brain className="text-tertiary" size={28} fill="currentColor" />
              <span className="text-sm font-bold text-on-surface">AI Move Hints</span>
              <span className="text-xs text-on-surface-variant leading-relaxed">Get best-move suggestions after every turn</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <History className="text-primary" size={28} fill="currentColor" />
              <span className="text-sm font-bold text-on-surface">Move History</span>
              <span className="text-xs text-on-surface-variant leading-relaxed">Review every move and learn from each game</span>
            </div>
            <div className="hidden md:flex flex-col gap-1.5">
<SlidersHorizontal className="text-on-surface-variant" size={28} fill="currentColor" />
              <span className="text-sm font-bold text-on-surface">Adjustable Difficulty</span>
              <span className="text-xs text-on-surface-variant leading-relaxed">From beginner to grandmaster — your pace</span>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 relative aspect-square group">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="w-full h-full glass-panel rounded-[2rem] border border-white/5 p-4 relative flex items-center justify-center overflow-hidden">
            <div className="checker-board rounded-lg overflow-hidden shadow-2xl">
              {boardCells.map((cell, i) => (
                <div key={i} className={`checker-cell ${cell.isDark ? 'dark' : 'light'}`}>
                  {cell.piece === 'dark' && <div className="piece piece-red"></div>}
                  {cell.piece === 'light' && <div className={"piece piece-light"}></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
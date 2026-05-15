import { BarChart3, Trophy, Brain, Sparkles, Target, ChevronRight } from 'lucide-react';
export default function FeaturesSection() {
  return (
    <section className="py-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col gap-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter">AI-Powered Checkers</h2>
          <p className="text-on-surface-variant max-w-xl">Master checkers with intelligent analysis, move-by-move feedback, and AI-powered insights that help you improve your game.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-8 rounded-xl border border-white/5 flex flex-col justify-between min-h-[300px]">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-2xl font-bold">Move-by-Move Analysis</h3>
              <p className="text-on-surface-variant">Get detailed analysis of every move with classifications like BEST, GOOD, INACCURACY, MISTAKE, BLUNDER, and FORCED. See your accuracy metrics.</p>
            </div>
            <div className="pt-6 border-t border-white/5 flex gap-4 text-sm font-bold text-primary">
              <span>Accuracy Metrics</span>
              <span className="text-outline-variant">|</span>
              <span>Move Classifications</span>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-xl border border-white/5 bg-surface-container flex flex-col gap-6">
            <div className="w-12 h-12 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary">
              <Trophy size={24} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-bold">ELO Leaderboard</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">Compete in rated games to earn ELO points and climb the global leaderboard. Track your progress and see how you rank.</p>
            <a className="mt-auto text-on-surface flex items-center gap-2 font-bold hover:gap-4 transition-all" href="#leaderboard">
              View Rankings <ChevronRight size={16} />
            </a>
          </div>

          <div className="glass-panel p-8 rounded-xl border border-white/5 bg-surface-container flex flex-col gap-6">
            <div className="w-12 h-12 rounded-lg bg-on-surface-variant/10 flex items-center justify-center text-on-surface">
              <Brain size={24} />
            </div>
            <h3 className="text-2xl font-bold">AI Game Summaries</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">Get AI-powered summaries after each game with key insights and personalized feedback to improve your strategy.</p>
          </div>

          <div className="glass-panel p-8 rounded-xl border border-white/5 bg-surface-container flex flex-col gap-6">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles size={24} />
            </div>
            <h3 className="text-2xl font-bold">AI Thinking Revealed</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">See the AI's planned moves and understand its strategy with AI-powered explanations of its thinking process.</p>
          </div>

          <div className="glass-panel p-8 rounded-xl border border-white/5 bg-surface-container flex flex-col gap-6">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
              <Target size={24} />
            </div>
            <h3 className="text-2xl font-bold">Bot Difficulty Levels</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">Choose from Easy, Medium, or Hard AI opponents. Each level uses different search depths for a tailored challenge.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
export default function CtaSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to evolve your game?</h2>
        <p className="text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto">Join the next generation of checkers players. Powered by AI, perfected by you.</p>
        <button className="bg-primary-container text-on-primary-container px-12 py-5 rounded-xl border-2 border-primary text-xl font-extrabold primary-button-glow active:scale-95 transition-all">
          Get Started Free
        </button>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-[100%] blur-[120px] pointer-events-none"></div>
    </section>
  );
}
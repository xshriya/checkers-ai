export default function Footer() {
  return (
    <footer className="w-full py-12 border-t border-white/5 bg-[#131313]">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 gap-6 max-w-7xl mx-auto">
        <div className="text-lg font-bold text-slate-200">Checkers AI</div>
        <div className="flex flex-wrap justify-center gap-8 font-['Inter'] text-sm tracking-wide uppercase text-slate-500">
          <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-white transition-colors" href="#">AI Methodology</a>
          <a className="hover:text-white transition-colors" href="#">Contact</a>
        </div>
        <div className="text-slate-500 font-['Inter'] text-sm tracking-wide uppercase text-center md:text-right">
          © 2024 Checkers AI. The Digital Grandmaster Experience.
        </div>
      </div>
    </footer>
  );
}
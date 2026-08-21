import Link from 'next/link';

export const HeroSection = () => {
  return (
    <section className="relative pt-10 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[350px] bg-emerald-500/10 blur-[100px] sm:blur-[140px] pointer-events-none -z-10 rounded-full" />

      <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Next-Gen Real-Time Engine
      </div>

      <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-[1.15]">
        Seamless, Instant Messaging for <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Modern Teams</span>
      </h1>

      <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Engineered with high-throughput WebSocket events, optimistic UI updates, and intelligent auto-scrolling for an unmatched chat experience.
      </p>

      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Link
          href="/chat"
          className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-500/25"
        >
          Start Chatting Now
        </Link>
        <a
          href="https://frontend-task-chatapp.onrender.com/docs/"
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 font-semibold text-sm sm:text-base transition-all"
        >
          Explore API Specs
        </a>
      </div>
    </section>
  );
};
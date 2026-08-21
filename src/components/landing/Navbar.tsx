import Link from 'next/link';

export const Navbar = () => {
  return (
    <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-[#0B0F17]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-black text-base sm:text-xl shadow-lg shadow-emerald-500/20">
            P
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Pulse<span className="text-emerald-400">Chat</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#tech" className="hover:text-white transition-colors">Architecture</a>
          <a href="https://frontend-task-chatapp.onrender.com/docs/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">API Specs</a>
        </nav>

        {/* CTA Button */}
        <Link
          href="/chat"
          className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-md shrink-0"
        >
          Launch Web App
        </Link>
      </div>
    </header>
  );
};
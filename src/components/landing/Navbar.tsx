import Link from "next/link";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
            P
          </span>
          <span className="text-white font-bold text-lg tracking-tight">
            PulseChat
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#stack" className="hover:text-white transition-colors">
            Stack
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0B0F17] hover:bg-emerald-400 transition-colors"
        >
          Launch app
        </Link>
      </div>
    </header>
  );
};
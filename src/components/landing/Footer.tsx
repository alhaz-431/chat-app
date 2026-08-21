export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 py-10 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 PulseChat Engine. Built for Assessment.</p>
        <div className="flex gap-6 text-slate-400 font-medium">
          <span>Next.js App Router</span>
          <span>TypeScript</span>
          <span>Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
};
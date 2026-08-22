export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} PulseChat. Built for the take-home assignment.</p>
        <p>Real-time chat, done simply.</p>
      </div>
    </footer>
  );
};
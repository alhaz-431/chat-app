export const TechStackSection = () => {
  const stack = ['Next.js 15+', 'TypeScript', 'Tailwind CSS', 'Axios', 'Socket.IO', 'Zustand / React Hooks'];

  return (
    <section id="tech" className="py-20 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-8">Powered by Modern Engineering Stack</h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {stack.map((tech, i) => (
            <span key={i} className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 text-sm font-medium">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
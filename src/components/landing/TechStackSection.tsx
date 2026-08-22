const stack = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Zustand",
  "Socket.io",
  "Axios",
];

export const TechStackSection = () => {
  return (
    <section id="stack" className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 sm:p-10 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Built with a modern, real-time stack
        </h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          No unnecessary layers — just what a fast, reliable chat needs.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-slate-800 bg-[#0B0F17] px-4 py-1.5 text-sm text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
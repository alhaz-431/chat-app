export const AppPreview = () => {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 sm:p-3 shadow-2xl backdrop-blur-xl">
        <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-[#0F172A] p-6 sm:p-8 text-center">
          <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl sm:text-2xl">
              ✓
            </div>
            <h3 className="text-white text-lg sm:text-xl font-bold">PulseChat Live Interface</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Experience zero-latency 1-on-1 direct messaging, dynamic group room orchestration, and smart viewport state retention.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
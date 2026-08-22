import Link from "next/link";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]"
      />

      <span className="inline-block rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium tracking-wide text-emerald-400 mb-6">
        REAL-TIME · SOCKET-POWERED
      </span>

      <h1 className="mx-auto max-w-2xl text-4xl sm:text-6xl font-bold leading-tight tracking-tight text-white">
        Messaging that never
        <span className="text-emerald-400"> misses a beat.</span>
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-slate-400">
        PulseChat delivers direct and group conversations instantly — with
        smart auto-scroll, live delivery, and zero refreshes.
      </p>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-[#0B0F17] hover:bg-emerald-400 transition-colors"
        >
          Try it now
        </Link>
        
        <Link
          href="#features"
          className="rounded-lg border border-slate-800 px-6 py-3 font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
        >
          See features
        </Link>
      </div>
    </section>
  );
};
export const FeaturesSection = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Real-Time WebSockets',
      desc: 'Sub-millisecond message delivery and immediate state syncing across active sessions.',
    },
    {
      icon: '👥',
      title: 'Group Conversations',
      desc: 'Create and manage multi-participant rooms dynamically with customized participant lists.',
    },
    {
      icon: '🎯',
      title: 'Smart Auto-Scroll',
      desc: 'Auto-scrolls to new messages naturally while maintaining position when reviewing history.',
    },
    {
      icon: '🔒',
      title: 'Persistent Sessions',
      desc: 'Secure token storage and automatic authorization state recovery on reloads.',
    },
    {
      icon: '🎨',
      title: 'Polished UI/UX',
      desc: 'Dark mode theme tailored for prolonged developer and team messaging sessions.',
    },
    {
      icon: '🛡️',
      title: 'Robust Error Handling',
      desc: 'Graceful fallback states for 400 bad requests, disconnected sockets, and network timeouts.',
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-slate-800/60 bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">
            Built for High-Performance Workflows
          </h2>
          <p className="mt-4 text-slate-400">
            Every layer is optimized for speed, fault tolerance, and absolute reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => (
            <div key={idx} className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm hover:border-emerald-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 font-bold text-xl">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
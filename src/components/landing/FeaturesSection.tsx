import { MessageCircle, Users, Zap, ScrollText, ShieldCheck, Crown } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "1-to-1 & group chat",
    body: "Start a direct conversation or spin up a group in seconds — search by name or phone.",
  },
  {
    icon: Zap,
    title: "Real-time delivery",
    body: "Messages arrive instantly over a live socket connection — no refresh, no polling delay.",
  },
  {
    icon: ScrollText,
    title: "Smart auto-scroll",
    body: "Stays pinned to the latest message by default, but never yanks you down while reading history.",
  },
  {
    icon: Crown,
    title: "Group admin controls",
    body: "Admins can add or remove members, promote co-admins, and rename the group in place.",
  },
  {
    icon: ShieldCheck,
    title: "Simple, secure auth",
    body: "Sign in with just a phone number and name — new numbers register automatically.",
  },
  {
    icon: Users,
    title: "Live presence",
    body: "Conversation and membership updates broadcast to everyone in the room instantly.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Built for real conversations
        </h2>
        <p className="mt-3 text-slate-400 max-w-md mx-auto">
          Every piece designed around one goal: keep the conversation moving.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {features.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 hover:border-slate-700 transition-colors"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Icon size={20} />
            </div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
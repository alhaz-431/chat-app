import Link from "next/link";
import { MessageCircle, Users, Zap, ScrollText } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "1-to-1 & group chat",
    body: "Start a direct conversation or spin up a group in a couple of taps — search by name or phone and go.",
  },
  {
    icon: Zap,
    title: "Real-time, always",
    body: "Messages land the instant they're sent, no refresh needed — powered by a live socket connection.",
  },
  {
    icon: ScrollText,
    title: "Smart scrolling",
    body: "Stays pinned to the latest message by default, but never yanks you back down while you're reading up.",
  },
  {
    icon: Users,
    title: "Group admin controls",
    body: "Admins can add or remove members, promote co-admins, and rename the group — right from the chat.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1 bg-[var(--background)]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[var(--accent)]/10 blur-3xl"
        />
        <p className="mb-4 inline-block rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium tracking-wide text-[var(--muted)]">
          NOW LIVE
        </p>
        <h1 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-6xl">
          Conversations that keep up with you.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--muted)]">
          Chatline is a real-time messaging screen built for speed — direct
          chats, groups, and live delivery, without the clutter.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Try it now
          </Link>
        </div>
      </section>

      {/* Mock preview */}
      <section className="mx-auto max-w-3xl px-6">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]/40" />
          </div>
          <div className="space-y-3 p-6">
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-sm border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)]">
                Hey — did you push the latest build?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-foreground)]">
                Just did. Should be live in a minute.
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-sm border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)]">
                Perfect, checking now 👀
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 py-24 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
              <Icon size={20} />
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--foreground)]">
          Ready to jump in?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
          No sign-up form, no password — just your phone number and a name.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
        >
          Open Chatline
        </Link>
      </section>
    </main>
  );
}
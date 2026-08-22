"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = phone.trim().length > 3 && name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await login(phone.trim(), name.trim());
      // TODO: confirm the real response shape once inspected live.
      // Assuming { token, user: { id, name, phone } } for now.
      setAuth(data.user, data.token);
      router.push("/chat");
    } catch (err) {
      console.error(err);
      const message =
        "Couldn't sign you in. Check your phone number and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="phone"
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="e.g. 01812345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Your name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Mohammad Rahman"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing you in…" : "Continue"}
      </button>

      <p className="text-center text-xs text-[var(--muted)]">
        New number? You&rsquo;ll be registered automatically.
      </p>
    </form>
  );
}
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
      
      // সেফটি চেক: টোকেন বা ইউজার না থাকলে এরর থ্রো করবে
      if (!data || !data.token) {
        throw new Error("Invalid response from server");
      }

      // ব্যাকএন্ডের রেসপন্স অনুযায়ী ইউজার অবজেক্ট সেট করা
      const userData = data.user || { id: "temp-id", name: name.trim(), phone: phone.trim() };
      setAuth(userData, data.token);
      
      toast.success("Successfully logged in!");
      router.push("/chat");
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
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
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
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
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
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
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-950/50 p-3 rounded-lg border border-red-200 dark:border-red-900">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing you in…" : "Continue"}
      </button>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        New number? You&rsquo;ll be registered automatically.
      </p>
    </form>
  );
}
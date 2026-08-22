import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900 px-6 py-12">
      
      {/* ল্যান্ডিং পেজে ফেরার স্টাইলিশ ব্যাক বাটন */}
      <Link 
        href="/" 
        className="absolute left-6 top-6 group flex items-center gap-2 rounded-full bg-white/80 dark:bg-zinc-800/85 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 shadow-sm backdrop-blur-md transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md"
      >
        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        <span>Back to Home</span>
      </Link>

      {/* মূল কন্টেইনার */}
      <div className="w-full max-w-md animate-fade-in">
        
        {/* লোগো এবং হেডিং */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-4">
            <MessageSquareText size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Welcome to Chatline
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with your phone number to start instant messaging.
          </p>
        </div>

        {/* ফর্ম কার্ড (গ্লাস ইফেক্ট ও সুন্দর শ্যাডো সহ) */}
        <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-8 shadow-xl backdrop-blur-xl">
          <LoginForm />
        </div>

        {/* ফুটার নোট */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Secure, fast, and real-time communication platform.
          </p>
        </div>

      </div>
    </main>
  );
}
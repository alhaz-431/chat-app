import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[var(--background)] px-6">
      <div className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Chatline
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Sign in with your phone number to start messaging.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
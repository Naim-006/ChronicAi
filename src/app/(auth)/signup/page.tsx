"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const configured = isSupabaseConfigured();

  async function handleGoogleSignIn() {
    setError(null);
    if (!configured) {
      setError("Authentication is not configured yet. Please check your Supabase credentials.");
      return;
    }
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (authError) {
        setError(authError.message);
        setGoogleLoading(false);
      }
    } catch {
      setError("Unable to connect to Google. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!configured) {
      setError(
        "Authentication isn't configured yet. Add your Supabase credentials to .env.local."
      );
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setNeedsEmailConfirmation(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (needsEmailConfirmation) {
    return (
      <Card className="shadow-[var(--shadow-medium)]">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="font-display text-xl font-bold">Check your email</h2>
          <p className="mt-2 max-w-xs text-sm text-[var(--muted-foreground)]">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-[var(--foreground)]">{email}</span>.
            Click it to activate your account, then sign in.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-medium)]">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="font-display text-2xl font-bold">
          Create your account
        </CardTitle>
        <CardDescription>
          Your lifelong health vault is free to start
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-bold text-[var(--foreground)] shadow-xs transition-all hover:bg-[var(--secondary)] hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <GoogleIcon className="h-4 w-4 shrink-0" />
          )}
          <span>{googleLoading ? "Connecting to Google…" : "Continue with Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-[var(--border)]" />
          <span className="absolute bg-[var(--card)] px-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Or create with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-xs font-semibold text-[var(--muted-foreground)]">
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-[var(--muted-foreground)]">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-[var(--muted-foreground)]">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-[var(--muted-foreground)]">
                Confirm
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={loading || googleLoading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <div className="mt-5 space-y-3 text-center text-sm">
          <p className="text-[var(--muted-foreground)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mint-wash flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25">
          <Activity className="h-5 w-5" />
        </span>
        <span className="font-display text-xl font-bold tracking-tight">
          Chronic<span className="text-emerald-600">AI</span>
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
        Your data is encrypted and never sold. Not a substitute for
        professional medical advice.
      </p>
    </div>
  );
}

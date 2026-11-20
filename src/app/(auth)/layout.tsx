import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mint-wash flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="relative flex h-10 w-13 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-md shadow-emerald-500/20 border border-slate-200 p-0.5">
          <Image
            src="/logo.png"
            alt="ChronicAI Logo"
            width={48}
            height={32}
            className="object-contain w-full h-full scale-110"
            priority
          />
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

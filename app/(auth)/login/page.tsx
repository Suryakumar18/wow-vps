"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/app/components-home/ui/BrandLogo";
import Button from "@/app/components-home/ui/Button";
import TextField from "@/app/components-home/ui/TextField";
import Checkbox from "@/app/components-home/ui/Checkbox";
import { setCurrentUser } from "@/app/components-home/lib/useCurrentUser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign in — the single portal for customers and admins alike.
 *
 * The server decides where you land: `redirectTo` comes back as `/admin` for
 * an admin account and `/` for everyone else, so there's no second login
 * screen and no role choice exposed to whoever is typing.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const next: typeof errors = {};
    if (!EMAIL.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice(body?.error ?? "Sign in failed.");
        return;
      }
      // The header's account menu flips to the customer's name immediately.
      setCurrentUser({
        id: body.id,
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        isAdmin: body.isAdmin,
      });
      router.push(body.redirectTo ?? "/");
      router.refresh();
    } catch {
      setNotice("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <BrandMark className="h-11 w-11" />
        <p className="mt-4 text-nano font-bold uppercase tracking-[0.2em] text-gold-600">
          Welcome back
        </p>
        <h1 className="mt-2 text-promo font-bold text-ink">Login to Your Account</h1>
        <p className="mt-1.5 text-micro text-slate-500">Enter your details to continue</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Remember Me" name="remember" />
          <Link
            href="/login"
            className="text-micro font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" size="md" disabled={pending} className="mt-1 w-full">
          {pending ? "Signing in…" : "Login"}
        </Button>

        <p aria-live="polite" className="min-h-[1.25rem] text-center text-nano text-[#B91C1C]">
          {notice}
        </p>
      </form>

      <p className="mt-7 text-center text-micro text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          Register Now
        </Link>
      </p>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { BrandMark } from "@/app/components-home/ui/BrandLogo";
import Button from "@/app/components-home/ui/Button";
import TextField from "@/app/components-home/ui/TextField";
import Checkbox from "@/app/components-home/ui/Checkbox";
import { setCurrentUser } from "@/app/components-home/lib/useCurrentUser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Indian mobile: 10 digits starting 6–9, with or without +91/91/0 prefix. */
function validMobile(raw: string): boolean {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) return /^[6-9]/.test(digits);
  if (digits.length === 12 && digits.startsWith("91")) return /^[6-9]/.test(digits.slice(2));
  return false;
}

/**
 * Sign in — the single portal for customers and admins alike.
 *
 * Customers log in with the mobile number they verified at registration;
 * the same field accepts an email for accounts without a phone (the admin).
 * The server decides where you land: `redirectTo` comes back as `/admin`
 * for an admin account and `/` for everyone else.
 */
export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const next: typeof errors = {};
    if (!validMobile(identifier) && !EMAIL.test(identifier)) {
      next.identifier = "Enter your mobile number (or email).";
    }
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center text-center">
        <BrandMark className="h-11 w-11" />
        <p className="mt-4 text-nano font-bold uppercase tracking-[0.2em] text-gold-600">
          Welcome back
        </p>
        <h1 className="mt-2 text-promo font-bold text-ink">Login to Your Account</h1>
        <p className="mt-1.5 text-micro text-slate-500">
          Use your mobile number and password to continue
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <TextField
          label="Mobile number or email"
          type="text"
          autoComplete="username"
          placeholder="Mobile Number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
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

        <p
          aria-live="polite"
          className="min-h-[1.25rem] text-center text-nano font-semibold text-[#B91C1C]"
        >
          {notice}
        </p>
      </form>

      <p className="mt-5 text-center text-micro text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          Register Now
        </Link>
      </p>
    </motion.div>
  );
}

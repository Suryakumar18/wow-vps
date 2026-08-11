"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, MessageCircle } from "lucide-react";
import { BrandMark } from "@/app/components-home/ui/BrandLogo";
import Button from "@/app/components-home/ui/Button";
import TextField from "@/app/components-home/ui/TextField";
import Checkbox from "@/app/components-home/ui/Checkbox";
import OtpInput from "@/app/components-home/auth/OtpInput";
import SocialAuthButtons from "@/app/components-home/auth/SocialAuthButtons";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Indian mobile: 10 digits starting 6–9, with or without +91/91/0 prefix. */
function validMobile(raw: string): boolean {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) return /^[6-9]/.test(digits);
  if (digits.length === 12 && digits.startsWith("91")) return /^[6-9]/.test(digits.slice(2));
  return false;
}

type Step = "phone" | "code" | "details";
type Errors = Partial<
  Record<"phone" | "code" | "name" | "email" | "password" | "confirm" | "terms", string>
>;

const HEADINGS: Record<Step, { title: string; subtitle: string }> = {
  phone: { title: "Create Account", subtitle: "Join WOW Lifestyle today" },
  code: { title: "Verify your number", subtitle: "" }, // subtitle rendered with the number
  details: { title: "Almost there", subtitle: "Finish setting up your account" },
};

/**
 * Create account — WhatsApp OTP first.
 *
 * Step 1 takes the mobile number and sends a one-time code on WhatsApp;
 * step 2 verifies it (the server returns a signed 15-minute proof token);
 * step 3 collects name/email/password and registers with that proof, so an
 * account can never be created on an unverified number.
 *
 * Registration always creates a customer — the admin flag is never settable
 * from here, only from the admin panel or the seed script.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");

  const [phone, setPhone] = useState("");
  /** Server-formatted "+91 98765 43210", shown once a code has been sent. */
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [code, setCode] = useState("");
  const [phoneToken, setPhoneToken] = useState("");
  /** Local-dev only: the server echoes the code when WhatsApp isn't configured. */
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendLeft, setResendLeft] = useState(0);

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (resendLeft <= 0) return;
    const timer = setInterval(() => setResendLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const sendCode = async () => {
    setNotice(null);
    if (!validMobile(phone)) {
      setErrors({ phone: "Enter a valid mobile number." });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice(body?.error ?? "Couldn't send the code — try again.");
        return;
      }
      setPhoneDisplay(body.phone ?? phone);
      setDevCode(body.devCode ?? null);
      setResendLeft(body.resendInSeconds ?? 60);
      setCode("");
      setStep("code");
    } catch {
      setNotice("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async (submitted: string) => {
    if (pending) return;
    setNotice(null);
    if (!/^\d{6}$/.test(submitted)) {
      setErrors({ code: "Enter the 6-digit code." });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: submitted }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErrors({ code: body?.error ?? "Verification failed — try again." });
        return;
      }
      setPhoneToken(body.phoneToken);
      setPhoneDisplay(body.phone ?? phoneDisplay);
      setStep("details");
    } catch {
      setNotice("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!EMAIL.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Use at least 6 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match.";
    if (!agreed) next.terms = "Please accept the Terms & Conditions.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone,
          password: form.password,
          phoneToken,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        // 401 = the 15-minute proof lapsed while they filled the form.
        if (res.status === 401) {
          setStep("phone");
          setPhoneToken("");
        }
        setNotice(body?.error ?? "Registration failed.");
        return;
      }
      router.push(body.redirectTo ?? "/");
      router.refresh();
    } catch {
      setNotice("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  const goBack = () => {
    setNotice(null);
    setErrors({});
    if (step === "phone") router.back();
    else if (step === "code") setStep("phone");
    else setStep("code");
  };

  const heading = HEADINGS[step];

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        aria-label="Go back"
        className="-ml-2 grid h-11 w-11 place-items-center rounded-md text-ink transition-colors hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
      >
        <ArrowLeft size={19} aria-hidden="true" />
      </button>

      <div className="mt-2 flex flex-col items-center text-center">
        <BrandMark className="h-11 w-11" />
        <h1 className="mt-4 text-promo font-bold text-ink">{heading.title}</h1>
        {step === "code" ? (
          <p className="mt-1.5 text-micro text-slate-500">
            We sent a code on WhatsApp to{" "}
            <span className="font-semibold text-ink">{phoneDisplay}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-micro text-slate-500">{heading.subtitle}</p>
        )}
      </div>

      {step === "phone" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <TextField
            label="Mobile number"
            type="tel"
            autoComplete="tel"
            placeholder="Mobile Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
          />
          <p className="flex items-center gap-1.5 text-nano text-slate-500">
            <MessageCircle size={13} aria-hidden="true" className="text-[#25D366]" />
            We&apos;ll WhatsApp a one-time code to this number to verify it.
          </p>

          <Button type="submit" size="md" disabled={pending} className="mt-1 w-full">
            {pending ? "Sending code…" : "Send Code on WhatsApp"}
          </Button>

          <p aria-live="polite" className="min-h-[1.25rem] text-center text-nano text-slate-500">
            {notice}
          </p>

          <SocialAuthButtons />
        </form>
      )}

      {step === "code" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode(code);
          }}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (errors.code) setErrors({});
            }}
            onComplete={(v) => void verifyCode(v)}
            disabled={pending}
            error={errors.code}
          />

          {devCode && (
            <p className="text-center text-nano text-slate-400">
              Dev code (WhatsApp not configured): <span className="font-semibold">{devCode}</span>
            </p>
          )}

          <Button type="submit" size="md" disabled={pending || code.length !== 6} className="mt-1 w-full">
            {pending ? "Verifying…" : "Verify"}
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={pending || resendLeft > 0}
              className="text-nano font-semibold text-gold-600 transition-colors hover:text-gold-700 disabled:font-normal disabled:text-slate-400"
            >
              {resendLeft > 0 ? `Resend code in ${resendLeft}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-nano font-semibold text-gold-600 transition-colors hover:text-gold-700"
            >
              Change number
            </button>
          </div>

          <p aria-live="polite" className="min-h-[1.25rem] text-center text-nano text-slate-500">
            {notice}
          </p>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={register} noValidate className="mt-6 flex flex-col gap-4">
          <div className="flex h-11 items-center justify-between rounded-lg border border-line bg-mist px-3.5">
            <span className="text-micro text-ink">{phoneDisplay}</span>
            <span className="flex items-center gap-1 text-nano font-semibold text-[#15803D]">
              <BadgeCheck size={14} aria-hidden="true" />
              Verified
            </span>
          </div>

          <TextField
            label="Full name"
            autoComplete="name"
            placeholder="Full Name"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
          />
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm Password"
            value={form.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
          />

          <div className="flex flex-col gap-1">
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              label={
                <>
                  I agree to the{" "}
                  <Link href="/register" className="font-semibold text-gold-600 hover:text-gold-700">
                    Terms &amp; Conditions
                  </Link>
                </>
              }
            />
            {errors.terms && <p className="pl-7 text-nano text-[#B91C1C]">{errors.terms}</p>}
          </div>

          <Button type="submit" size="md" disabled={pending} className="mt-1 w-full">
            {pending ? "Creating account…" : "Create Account"}
          </Button>

          <p aria-live="polite" className="min-h-[1.25rem] text-center text-nano text-slate-500">
            {notice}
          </p>
        </form>
      )}

      <p className="mt-7 text-center text-micro text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          Login Now
        </Link>
      </p>
    </>
  );
}

"use client";

import { useState, useEffect, useRef, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

const API = "/api";

/* ─── showcase images cycling on the right panel ───────────────────────────── */
const SHOWCASE = [
  { src: "http://200.97.164.140/uploads/categories/chars-bg1.avif", label: "Off-Road RC Rovers"       },
  { src: "http://200.97.164.140/uploads/categories/chars-bg2.avif", label: "Luxury Diecast Series"    },
  { src: "http://200.97.164.140/uploads/categories/chars-bg3.avif", label: "Speed Champion Racers"    },
  { src: "http://200.97.164.140/uploads/categories/chars-bg4.avif", label: "Stunt & Drift Masters"    },
  { src: "http://200.97.164.140/uploads/categories/chars-bg5.avif", label: "4×4 Monster Trucks"       },
];

/* ─── Google SVG icon ───────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── right panel — cycling image ──────────────────────────────────────────── */
function RightPanel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % SHOWCASE.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden lg:flex flex-col relative w-[52%] overflow-hidden bg-[#080808]">
      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={SHOWCASE[idx].src}
            alt={SHOWCASE[idx].label}
            fill
            className="object-cover brightness-50"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent z-10" />

      {/* top brand */}
      <div className="relative z-20 p-10">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-[#C9A84C]" />
          <span className="text-[11px] font-bold tracking-[0.3em] text-[#C9A84C] uppercase">
            Premium Collection
          </span>
        </div>
      </div>

      {/* bottom label + dots */}
      <div className="relative z-20 mt-auto p-10">
        <AnimatePresence mode="wait">
          <motion.h2
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-black text-white mb-2 leading-tight"
          >
            {SHOWCASE[idx].label}
          </motion.h2>
        </AnimatePresence>
        <p className="text-sm text-white/40 mb-6">Discover the finest toys & collectibles</p>

        {/* dot indicators */}
        <div className="flex gap-2">
          {SHOWCASE.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === idx ? 24 : 8,
                background: i === idx ? "#C9A84C" : "#ffffff33",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── main auth content ─────────────────────────────────────────────────────── */
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode]               = useState<"signin" | "signup">("signin");
  const [fullname, setFullname]       = useState("");
  const [mobilenumber, setMobile]     = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  // guard — prevents calling the API more than once at a time
  const inFlight = useRef(false);

  useEffect(() => {
    if (searchParams.get("error") === "google_auth_failed") {
      setError("Google sign-in failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      router.replace(user.role === "admin" ? "/admin/dashboard" : "/");
    } catch { router.replace("/"); }
  }, [router]);

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPwd("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;          // ← stop repeated calls
    if (!email || !password) { setError("Email and password are required."); return; }

    if (mode === "signup") {
      if (!fullname.trim()) { setError("Please enter your name."); return; }
      if (!/^\d{10}$/.test(mobilenumber.trim())) { setError("Please enter a valid 10-digit mobile number."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
      if (password !== confirmPwd) { setError("Passwords do not match."); return; }
    }

    inFlight.current = true;
    setLoading(true);
    setError("");

    try {
      const body = mode === "signup"
        ? { action: "register", fullname: fullname.trim(), email: email.trim(), mobilenumber: mobilenumber.trim(), password }
        : { action: "login", email: email.trim(), password };

      const res = await fetch(`${API}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));
      window.dispatchEvent(new CustomEvent("authChange"));
      setSuccess(mode === "signup" ? "Account created successfully!" : "Signed in successfully!");
      setTimeout(() => router.replace(data.data.role === "admin" ? "/admin/dashboard" : "/"), 1000);
    } catch (err: any) {
      setError(err.message || (mode === "signup" ? "Registration failed. Please try again." : "Sign in failed. Please try again."));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  const handleGoogleLogin = () => {
    if (inFlight.current) return;          // ← stop repeated clicks
    inFlight.current = true;
    window.location.href = `${API}/auth/google`;
    // reset after 3 s in case the redirect is slow
    setTimeout(() => { inFlight.current = false; }, 3000);
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#080808]">

      {/* ── LEFT: form ──────────────────────────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[48%] px-8 sm:px-12 xl:px-20 py-10 relative z-10 overflow-y-auto">

        {/* faint glow */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
          className="w-full max-w-[400px] m-auto"
        >
          {/* Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <img src="http://200.97.164.140/uploads/brands/wow-logo.svg" alt="WOW Lifestyle" className="w-8 h-8 object-contain" />
              <span className="text-[13px] font-black tracking-[0.2em] text-[#C9A84C] uppercase">
                WOW Lifestyle
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-6 mb-1">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[#555]">
              {mode === "signin" ? "Sign in to your account to continue" : "Join us to start shopping premium collectibles"}
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-[#262626] bg-[#111] text-sm font-medium text-[#E0D8C8] hover:border-[#C9A84C55] hover:bg-[#161616] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mb-6"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1c1c1c]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#080808] text-[11px] text-[#444] tracking-wider uppercase">
                {mode === "signin" ? "or sign in with email" : "or register with email"}
              </span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                {/* Full name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#555]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Your full name"
                    disabled={loading}
                    className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl px-4 py-3.5 text-sm text-[#F0EAD6] placeholder-[#363636] outline-none transition-all duration-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C15] disabled:opacity-40"
                  />
                </div>
                {/* Mobile number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#555]">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobilenumber}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    disabled={loading}
                    className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl px-4 py-3.5 text-sm text-[#F0EAD6] placeholder-[#363636] outline-none transition-all duration-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C15] disabled:opacity-40"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#555]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl px-4 py-3.5 text-sm text-[#F0EAD6] placeholder-[#363636] outline-none transition-all duration-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C15] disabled:opacity-40"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#555]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl px-4 py-3.5 pr-12 text-sm text-[#F0EAD6] placeholder-[#363636] outline-none transition-all duration-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C15] disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors p-1"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password (signup only) */}
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#555]">
                  Confirm Password
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full bg-[#0f0f0f] border rounded-xl px-4 py-3.5 text-sm text-[#F0EAD6] placeholder-[#363636] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#C9A84C15] disabled:opacity-40 ${
                    confirmPwd && confirmPwd !== password ? "border-red-500/60 focus:border-red-500" : "border-[#1e1e1e] focus:border-[#C9A84C]"
                  }`}
                />
                {confirmPwd && confirmPwd !== password && (
                  <span className="text-[11px] text-red-400">Passwords do not match</span>
                )}
              </div>
            )}

            {/* Error / success */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20"
                >
                  <span className="mt-px shrink-0">✕</span><span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20"
                >
                  <CheckCircle2 size={14} className="shrink-0" /><span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
              style={{
                background: loading ? "#555" : "linear-gradient(135deg, #C9A84C 0%, #E2BE6A 100%)",
                boxShadow: loading ? "none" : "0 4px 20px #C9A84C30",
              }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><span>{mode === "signin" ? "Sign In" : "Create Account"}</span><ArrowRight size={15} /></>
              }
            </button>
          </form>

          {/* mode toggle */}
          <p className="text-center text-[13px] text-[#666] mt-6">
            {mode === "signin" ? (
              <>Don&apos;t have an account?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-semibold text-[#C9A84C] hover:text-[#E2BE6A] transition-colors">
                  Create one
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" onClick={() => switchMode("signin")} className="font-semibold text-[#C9A84C] hover:text-[#E2BE6A] transition-colors">
                  Sign in
                </button>
              </>
            )}
          </p>

          {/* footer note */}
          <p className="text-center text-[11px] text-[#383838] mt-4 leading-relaxed">
            By signing in you agree to our{" "}
            <span className="text-[#555] hover:text-[#C9A84C] cursor-pointer transition-colors">Terms of Service</span>
            {" & "}
            <span className="text-[#555] hover:text-[#C9A84C] cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </motion.div>
      </div>

      {/* ── RIGHT: image showcase ──────────────────────────────────── */}
      <RightPanel />
    </div>
  );
}

/* ─── export ─────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-[#080808]">
        <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

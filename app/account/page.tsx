"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, KeyRound, LogOut, UserRound } from "lucide-react";
import { setCurrentUser, useCurrentUser } from "@/app/components-home/lib/useCurrentUser";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import TextField from "@/app/components-home/ui/TextField";

/** "+91 86106 59547" from the canonical digits the OTP flow stores. */
function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Edit Profile — name and email are editable; the mobile number stays locked
 * to what WhatsApp OTP verified at registration. Password changes prove the
 * current password first.
 */
export default function AccountPage() {
  const router = useRouter();
  const user = useCurrentUser();

  const [form, setForm] = useState({ name: "", email: "" });
  const [profilePending, setProfilePending] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwPending, setPwPending] = useState(false);
  const [pwNotice, setPwNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Guests have no profile to edit — send them to login. Only on ARRIVAL,
  // though: a session that existed and then became null is a logout in
  // progress, whose own handler navigates home.
  const hadSession = useRef(false);
  if (user) hadSession.current = true;
  useEffect(() => {
    if (user === null && !hadSession.current) router.replace("/login");
  }, [user, router]);

  // Seed the form once the user arrives (and after external updates).
  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <Container className="py-16">
        <div className="mx-auto h-64 max-w-lg animate-pulse rounded-xl border border-line bg-mist" />
      </Container>
    );
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileNotice(null);
    setProfilePending(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setProfileNotice({ ok: false, text: body?.error ?? "Couldn't save — try again." });
        return;
      }
      setCurrentUser({ ...user, name: body.user.name, email: body.user.email });
      setProfileNotice({ ok: true, text: "Profile saved." });
    } catch {
      setProfileNotice({ ok: false, text: "Couldn't reach the server — try again." });
    } finally {
      setProfilePending(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwNotice(null);
    if (pw.next.length < 6) {
      setPwNotice({ ok: false, text: "Use at least 6 characters." });
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwNotice({ ok: false, text: "New passwords don't match." });
      return;
    }
    setPwPending(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPwNotice({ ok: false, text: body?.error ?? "Couldn't change the password." });
        return;
      }
      setPw({ current: "", next: "", confirm: "" });
      setPwNotice({ ok: true, text: "Password changed." });
    } catch {
      setPwNotice({ ok: false, text: "Couldn't reach the server — try again." });
    } finally {
      setPwPending(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    router.push("/");
    router.refresh();
  };

  const notice = (n: { ok: boolean; text: string } | null) =>
    n && (
      <p
        aria-live="polite"
        className={n.ok ? "text-nano font-semibold text-[#15803D]" : "text-nano text-[#B91C1C]"}
      >
        {n.text}
      </p>
    );

  return (
    <Container className="py-8 lg:py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-section font-bold text-ink">My Profile</h1>

        {/* Profile details */}
        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-ui font-bold text-ink">
            <UserRound size={16} className="text-gold-600" aria-hidden="true" />
            Profile details
          </h2>
          <form onSubmit={saveProfile} noValidate className="mt-4 flex flex-col gap-3.5">
            <TextField
              label="Full name"
              hideLabel={false}
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Email address"
              hideLabel={false}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-micro font-medium text-ink">Mobile number</span>
              <div className="flex h-11 items-center justify-between rounded-lg border border-line bg-mist px-3.5">
                <span className="text-micro text-ink">
                  {user.phone ? displayPhone(user.phone) : "Not set"}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1 text-nano font-semibold text-[#15803D]">
                    <BadgeCheck size={13} aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-nano text-slate-500">
                Verified on WhatsApp at registration — contact us to change it.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" size="md" disabled={profilePending}>
                {profilePending ? "Saving…" : "Save Changes"}
              </Button>
              {notice(profileNotice)}
            </div>
          </form>
        </section>

        {/* Password */}
        <section className="mt-5 rounded-xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-ui font-bold text-ink">
            <KeyRound size={16} className="text-gold-600" aria-hidden="true" />
            Change password
          </h2>
          <form onSubmit={changePassword} noValidate className="mt-4 flex flex-col gap-3.5">
            <TextField
              label="Current password"
              hideLabel={false}
              type="password"
              autoComplete="current-password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            />
            <TextField
              label="New password"
              hideLabel={false}
              type="password"
              autoComplete="new-password"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
            />
            <TextField
              label="Confirm new password"
              hideLabel={false}
              type="password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" size="md" variant="outline" disabled={pwPending}>
                {pwPending ? "Changing…" : "Change Password"}
              </Button>
              {notice(pwNotice)}
            </div>
          </form>
        </section>

        <button
          type="button"
          onClick={logout}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#FECACA] text-micro font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2]"
        >
          <LogOut size={15} aria-hidden="true" />
          Logout
        </button>
      </div>
    </Container>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Save, Trash2, X } from "lucide-react";
import "./Layout.css";

/*
 * Global unsaved-changes guard for every admin section.
 *
 * - Any input/change inside the page content marks the page "dirty".
 * - While dirty: save buttons pulse, and a floating "Unsaved changes" pill appears.
 * - Clicking a Save button clears the dirty state.
 * - Navigating away (sidebar links, any internal link) while dirty opens a
 *   Save / Discard / Keep-editing dialog. Tab close / refresh triggers the
 *   native browser warning.
 */

const SAVE_RE = /(save|publish)/i;

const findSaveButtons = (): HTMLButtonElement[] => {
  const out: HTMLButtonElement[] = [];
  document
    .querySelectorAll<HTMLButtonElement>(".page-scroll-container button")
    .forEach((b) => {
      const t = (b.textContent || "").trim();
      if (t.length > 0 && t.length < 40 && SAVE_RE.test(t)) out.push(b);
    });
  return out;
};

const isIgnorableField = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return true;
  if (el.closest(".topbar") || el.closest(".sidebar")) return true; // topbar search etc.
  // Self-contained editors (modals with their own Save/Cancel) opt out of the guard.
  if (el.closest("[data-unsaved-ignore]")) return true;
  if (el instanceof HTMLInputElement) {
    if (el.type === "search") return true;
    if ((el.placeholder || "").toLowerCase().includes("search")) return true;
  }
  return false;
};

// True while a self-contained editor (e.g. the product modal) is on screen.
const modalOpen = () =>
  typeof document !== "undefined" && !!document.querySelector("[data-unsaved-ignore]");

export default function UnsavedChangesGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const clearDirty = useCallback(() => {
    setDirty(false);
    document.querySelectorAll(".wow-save-attn").forEach((b) => b.classList.remove("wow-save-attn"));
  }, []);

  const markSaveButtons = useCallback(() => {
    if (!dirtyRef.current) return;
    findSaveButtons().forEach((b) => b.classList.add("wow-save-attn"));
  }, []);

  /* ── Detect edits ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const onEdit = (e: Event) => {
      if (isIgnorableField(e.target)) return;
      if (!dirtyRef.current) setDirty(true);
    };
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    return () => {
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, []);

  /* ── Detect save clicks (clears dirty) ────────────────────────────────── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest?.("button");
      if (!btn) return;
      const t = (btn.textContent || "").trim();
      if (t.length > 0 && t.length < 40 && SAVE_RE.test(t)) {
        // let the page's own save handler run first
        setTimeout(clearDirty, 150);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [clearDirty]);

  /* ── Highlight save buttons while dirty ───────────────────────────────── */
  useEffect(() => {
    if (!dirty) return;
    markSaveButtons();
    const container = document.querySelector(".page-scroll-container");
    if (!container) return;
    const mo = new MutationObserver(() => markSaveButtons());
    mo.observe(container, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [dirty, markSaveButtons]);

  /* ── Intercept internal link navigation while dirty ───────────────────── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || modalOpen()) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href === pathname) return;
      if (a.getAttribute("target") === "_blank") return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  /* ── Native warning on refresh / tab close ────────────────────────────── */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* ── Reset on route change ────────────────────────────────────────────── */
  useEffect(() => { clearDirty(); setPendingHref(null); setSaving(false); }, [pathname, clearDirty]);

  /* ── Actions ──────────────────────────────────────────────────────────── */
  const triggerSave = () => {
    const btn = findSaveButtons().find((b) => b.offsetParent !== null);
    if (btn) btn.click();
    return !!btn;
  };

  const handleSaveAndLeave = () => {
    setSaving(true);
    const ok = triggerSave();
    const href = pendingHref;
    clearDirty();
    setTimeout(() => {
      setPendingHref(null);
      setSaving(false);
      if (href) router.push(href);
    }, ok ? 900 : 100);
  };

  const handleDiscard = () => {
    const href = pendingHref;
    clearDirty();
    setPendingHref(null);
    if (href) router.push(href);
  };

  const handleSaveNow = () => {
    triggerSave();
    clearDirty();
  };

  return (
    <>
      {/* Floating "unsaved changes" pill */}
      {dirty && !pendingHref && !modalOpen() && (
        <div className="wow-dirty-pill">
          <span className="wow-dirty-dot" />
          <span className="wow-dirty-text">You have unsaved changes</span>
          <button className="wow-dirty-save" onClick={handleSaveNow}>
            <Save size={12} />
            Save now
          </button>
        </div>
      )}

      {/* Leave-confirmation dialog */}
      {pendingHref && (
        <div className="wow-guard-overlay" onClick={() => !saving && setPendingHref(null)}>
          <div className="wow-guard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wow-guard-icon">
              <AlertTriangle size={20} />
            </div>
            <h3 className="wow-guard-title">Unsaved changes</h3>
            <p className="wow-guard-text">
              You made changes on this page that haven&apos;t been saved yet.
              Do you want to save them before leaving?
            </p>
            <div className="wow-guard-actions">
              <button className="wow-guard-btn primary" onClick={handleSaveAndLeave} disabled={saving}>
                <Save size={13} />
                {saving ? "Saving…" : "Save & Leave"}
              </button>
              <button className="wow-guard-btn danger" onClick={handleDiscard} disabled={saving}>
                <Trash2 size={13} />
                Discard
              </button>
              <button className="wow-guard-btn" onClick={() => setPendingHref(null)} disabled={saving}>
                <X size={13} />
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';

/*
 * Global auth gate for every /admin/* page. Mounted once in app/admin/layout.tsx,
 * so it protects the (main) admin section and the billing section alike.
 *
 * If there is no valid admin token it clears the session and sends the user to "/".
 * Rendering is gated on a valid token, so unauthenticated pages never mount and
 * never fire the API calls that return { success: false, message: "Not authorized..." }.
 */

const SESSION_KEYS = ['token', 'user'];

/** Decode a JWT payload without verifying its signature (client-side sanity check only). */
function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** A token is valid for admin pages only if it exists, is an admin role, and hasn't expired. */
function hasValidAdminToken(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token')?.replace(/['"]+/g, '');
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (payload.role !== 'admin') return false;
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return false;
  return true;
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // null = not checked yet, true = allowed, false = redirecting away
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const logout = useCallback(() => {
    try {
      SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore storage errors */
    }
    // Full navigation (replace) so no admin state lingers and back doesn't return here.
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.replace('/');
    }
  }, []);

  const check = useCallback(() => {
    if (hasValidAdminToken()) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
      logout();
    }
  }, [logout]);

  // Check on mount and whenever the route changes within /admin.
  useEffect(() => {
    check();
  }, [check, pathname]);

  // Re-check on tab focus, cross-tab logout, and periodically (so an expiring token kicks out).
  useEffect(() => {
    const onFocus = () => check();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === null) check();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    const intervalId = window.setInterval(check, 60_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, [check]);

  // If the server rejects the token (401/403), force logout too. Covers calls made with
  // the default axios instance; the render gate above handles the no-token case for all pages.
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) logout();
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptorId);
  }, [logout]);

  // Don't render admin UI until a valid token is confirmed.
  if (authorized !== true) return null;
  return <>{children}</>;
}

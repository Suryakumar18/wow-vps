'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Pencil, Trash2, Star, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import NavbarHome from '@/app/components-main/NavbarHome';

interface Address {
  _id?: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  country: string;
  isDefault: boolean;
}

const EMPTY: Address = {
  label: 'Home', firstName: '', lastName: '', address: '', apartment: '',
  city: '', state: 'Tamil Nadu', pinCode: '', phone: '', country: 'India', isDefault: false,
};

export default function SavedAddressesPage() {
  const router = useRouter();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Address>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isDark  = theme === 'dark';
  const gold    = '#C9A84C';
  const bg      = isDark ? '#070707' : '#F6F6F4';
  const surface = isDark ? '#0D0D0D' : '#FFFFFF';
  const border  = isDark ? '#1C1C1C' : '#EAEAEA';
  const textPri = isDark ? '#F0EAD6' : '#111827';
  const textSec = isDark ? '#9A8E7A' : '#6B7280';

  const inputClass = `w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all border ${
    isDark
      ? 'bg-[#0f0f0f] border-[#1e1e1e] text-[#F0EAD6] placeholder-[#4a4a4a] focus:border-[#C9A84C]'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C9A84C]'
  }`;

  const getToken = () => localStorage.getItem('token')?.replace(/['"]+/g, '') || null;

  /* theme sync */
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) setTheme(e.detail as 'dark' | 'light'); };
    window.addEventListener('theme-change', handler as EventListener);
    const cur = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (cur) setTheme(cur);
    return () => window.removeEventListener('theme-change', handler as EventListener);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  };

  /* load */
  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetch('/api/user/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setAddresses(d.data);
        else if (d.message?.includes('Not authorized')) router.push('/login');
      })
      .catch(() => setToast({ message: 'Failed to load addresses', type: 'error' }))
      .finally(() => setIsLoading(false));
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (a: Address) => { setEditing(a); setForm({ ...a }); setShowForm(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!form.firstName || !form.address || !form.city || !form.state || !form.pinCode || !form.phone) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      const token = getToken();
      const res = await fetch('/api/user/addresses', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editing ? { ...form, addressId: editing._id } : form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAddresses(data.data);
      setShowForm(false);
      setToast({ message: editing ? 'Address updated' : 'Address saved', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Something went wrong', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    setDeleteTarget(null);
    try {
      const token = getToken();
      const res = await fetch(`/api/user/addresses?addressId=${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAddresses(data.data);
      setToast({ message: 'Address removed', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to remove address', type: 'error' });
    }
  };

  const handleSetDefault = async (a: Address) => {
    if (a.isDefault) return;
    try {
      const token = getToken();
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addressId: a._id, isDefault: true }),
      });
      const data = await res.json();
      if (data.success) { setAddresses(data.data); setToast({ message: 'Default address updated', type: 'success' }); }
    } catch {
      setToast({ message: 'Failed to update default', type: 'error' });
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: bg, color: textPri }}>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="w-full max-w-sm rounded-xl p-6" style={{ background: surface, border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2" style={{ color: textPri }}>Remove address?</h3>
              <p className="text-sm mb-6" style={{ color: textSec }}>This address will be permanently removed from your account.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteTarget)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold">Remove</button>
                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: isDark ? '#1a1a1a' : '#F3F4F6', color: textPri }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / edit form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-lg rounded-xl my-8" style={{ background: surface, border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-base font-bold" style={{ color: textPri }}>{editing ? 'Edit Address' : 'Add New Address'}</h3>
                <button onClick={() => setShowForm(false)} className="hover:opacity-60" style={{ color: textSec }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select name="label" value={form.label} onChange={onChange} className={inputClass}>
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
                <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone *" required className={inputClass} />
                <input name="firstName" value={form.firstName} onChange={onChange} placeholder="First name *" required className={inputClass} />
                <input name="lastName" value={form.lastName} onChange={onChange} placeholder="Last name" className={inputClass} />
                <input name="address" value={form.address} onChange={onChange} placeholder="Address *" required className={`${inputClass} sm:col-span-2`} />
                <input name="apartment" value={form.apartment} onChange={onChange} placeholder="Apartment, suite, etc. (optional)" className={`${inputClass} sm:col-span-2`} />
                <input name="city" value={form.city} onChange={onChange} placeholder="City *" required className={inputClass} />
                <input name="state" value={form.state} onChange={onChange} placeholder="State *" required className={inputClass} />
                <input name="pinCode" value={form.pinCode} onChange={onChange} placeholder="PIN code *" required className={inputClass} />
                <input name="country" value={form.country} onChange={onChange} placeholder="Country" className={inputClass} />
                <label className="sm:col-span-2 flex items-center gap-2.5 cursor-pointer py-1">
                  <input type="checkbox" checked={form.isDefault}
                    onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                    className="w-4 h-4 accent-[#C9A84C]" />
                  <span className="text-sm" style={{ color: textSec }}>Set as default address</span>
                </label>
                <button type="submit" disabled={isSaving}
                  className="sm:col-span-2 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${gold}, #E2BE6A)` }}>
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Update Address' : 'Save Address')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <MapPin size={22} style={{ color: gold }} />
            <h1 className="text-2xl font-bold" style={{ color: textPri }}>Saved Addresses</h1>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.15em] uppercase text-black transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${gold}, #E2BE6A)` }}>
            <Plus size={14} /> Add Address
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin mb-4" style={{ color: gold }} />
            <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: textSec }}>Loading Addresses</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl"
            style={{ background: surface, border: `1px dashed ${border}` }}>
            <MapPin size={40} className="mb-4 opacity-20" style={{ color: textSec }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: textPri }}>No saved addresses yet</h3>
            <p className="text-sm mb-6" style={{ color: textSec }}>Save an address to speed up your checkout.</p>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.15em] uppercase transition-opacity hover:opacity-80"
              style={{ border: `1px solid ${gold}`, color: gold }}>
              <Plus size={14} /> Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map(a => (
              <motion.div key={a._id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-5 flex flex-col"
                style={{ background: surface, border: `1px solid ${a.isDefault ? gold : border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold tracking-[0.2em] uppercase"
                    style={{ background: isDark ? `${gold}22` : `${gold}15`, color: isDark ? gold : '#B8860B', border: `1px solid ${gold}50` }}>
                    {a.label}
                  </span>
                  {a.isDefault && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: gold }}>
                      <Star size={11} fill={gold} /> Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: textPri }}>{a.firstName} {a.lastName}</p>
                <p className="text-sm leading-relaxed mb-1" style={{ color: textSec }}>
                  {a.address}{a.apartment ? `, ${a.apartment}` : ''}<br />
                  {a.city}, {a.state} — {a.pinCode}<br />
                  {a.country}
                </p>
                <p className="text-sm mb-4" style={{ color: textSec }}>Phone: {a.phone}</p>
                <div className="mt-auto flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                  <button onClick={() => openEdit(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: textPri, border: `1px solid ${border}` }}>
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(a._id!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-400 transition-opacity hover:opacity-70"
                    style={{ border: `1px solid ${border}` }}>
                    <Trash2 size={12} /> Remove
                  </button>
                  {!a.isDefault && (
                    <button onClick={() => handleSetDefault(a)}
                      className="ml-auto text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: gold }}>
                      Set as default
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

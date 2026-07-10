'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Save, Loader2, CheckCircle2, Percent, Receipt, MapPin, Image as ImageIcon,
} from 'lucide-react';
import MediaUploader from '@/app/components-admin/MediaUploader';

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');

interface Settings {
  companyName: string; tagline: string; logo: string;
  addressLine1: string; addressLine2: string; city: string; state: string; pincode: string;
  phone: string; email: string; website: string; gstin: string;
  defaultTaxPct: number; invoicePrefix: string; footerNote: string; termsNote: string; showTax: boolean;
}

const EMPTY: Settings = {
  companyName: '', tagline: '', logo: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  phone: '', email: '', website: '', gstin: '', defaultTaxPct: 0, invoicePrefix: 'INV',
  footerNote: '', termsNote: '', showTax: true,
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-gray-400 mt-1 block">{hint}</span>}
    </label>
  );
}

function SettingsForm() {
  const [s, setS] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/billing/settings')
      .then(r => r.json())
      .then(d => { if (d.success) setS({ ...EMPTY, ...d.data }); })
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { setS(p => ({ ...p, [k]: v })); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/billing/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(s),
      });
      const d = await res.json();
      if (d.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else alert(d.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-indigo-600" /></div>;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Billing Settings</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">These details appear on every invoice, receipt and PDF.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saved ? 'Saved' : 'Save Settings'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column — company + address + tax */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Company */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bcard p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="kpi-icon" style={{ background: '#eef2ff', color: '#4f46e5', width: 34, height: 34 }}><Building2 size={16} /></div>
              <h3 className="font-bold text-gray-900">Company Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company Name"><input className="bfield" value={s.companyName} onChange={e => set('companyName', e.target.value)} placeholder="WOW Lifestyle" /></Field>
              <Field label="Tagline"><input className="bfield" value={s.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Premium Toys & Collectibles" /></Field>
              <Field label="Phone"><input className="bfield" value={s.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 ..." /></Field>
              <Field label="Email"><input className="bfield" value={s.email} onChange={e => set('email', e.target.value)} placeholder="store@wowlifestyle.online" /></Field>
              <Field label="Website"><input className="bfield" value={s.website} onChange={e => set('website', e.target.value)} placeholder="wowlifestyle.online" /></Field>
              <Field label="GSTIN" hint="Shown on tax invoices"><input className="bfield" value={s.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} placeholder="33ABCDE1234F1Z5" /></Field>
            </div>
          </motion.div>

          {/* Address */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bcard p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a', width: 34, height: 34 }}><MapPin size={16} /></div>
              <h3 className="font-bold text-gray-900">Store Address</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Field label="Address Line 1"><input className="bfield" value={s.addressLine1} onChange={e => set('addressLine1', e.target.value)} placeholder="Shop no, street" /></Field></div>
              <div className="sm:col-span-2"><Field label="Address Line 2"><input className="bfield" value={s.addressLine2} onChange={e => set('addressLine2', e.target.value)} placeholder="Area, landmark" /></Field></div>
              <Field label="City"><input className="bfield" value={s.city} onChange={e => set('city', e.target.value)} /></Field>
              <Field label="State"><input className="bfield" value={s.state} onChange={e => set('state', e.target.value)} /></Field>
              <Field label="Pincode"><input className="bfield" value={s.pincode} onChange={e => set('pincode', e.target.value)} /></Field>
            </div>
          </motion.div>

          {/* Tax & invoice */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bcard p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="kpi-icon" style={{ background: '#fef3c7', color: '#d97706', width: 34, height: 34 }}><Percent size={16} /></div>
              <h3 className="font-bold text-gray-900">Tax &amp; Invoice</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Default GST %" hint="Pre-filled on new bills">
                <select className="bfield" value={s.defaultTaxPct} onChange={e => set('defaultTaxPct', Number(e.target.value))}>
                  {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
                </select>
              </Field>
              <Field label="Invoice Prefix" hint="e.g. INV → INV-202607-00001"><input className="bfield" value={s.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="INV" /></Field>
              <Field label="Show tax on invoice">
                <button onClick={() => set('showTax', !s.showTax)} className={`bfield flex items-center justify-between ${s.showTax ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`} style={{ cursor: 'pointer' }}>
                  {s.showTax ? 'Enabled' : 'Disabled'}
                  <span className={`w-9 h-5 rounded-full relative transition-colors ${s.showTax ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${s.showTax ? 'left-4' : 'left-0.5'}`} />
                  </span>
                </button>
              </Field>
              <div className="sm:col-span-3"><Field label="Footer Note"><input className="bfield" value={s.footerNote} onChange={e => set('footerNote', e.target.value)} placeholder="Thank you for your business!" /></Field></div>
              <div className="sm:col-span-3"><Field label="Terms / Note"><input className="bfield" value={s.termsNote} onChange={e => set('termsNote', e.target.value)} placeholder="Goods once sold are not returnable." /></Field></div>
            </div>
          </motion.div>
        </div>

        {/* Right column — logo + live preview */}
        <div className="flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bcard p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7', width: 34, height: 34 }}><ImageIcon size={16} /></div>
              <h3 className="font-bold text-gray-900">Company Logo</h3>
            </div>
            <MediaUploader
              accept="image"
              variant="dropzone"
              folder="brands"
              value={s.logo}
              label="Upload company logo"
              onUploaded={(url) => set('logo', url)}
            />
          </motion.div>

          {/* Live preview */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bcard p-5">
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={15} className="text-gray-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Invoice Preview</span>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-2">
                {s.logo
                  ? <img src={s.logo} alt="" className="w-9 h-9 object-contain rounded-lg" />
                  : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black" style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>₹</div>}
                <div>
                  <div className="text-sm font-black text-gray-900 leading-tight">{s.companyName || 'Company Name'}</div>
                  <div className="text-[10px] text-gray-500">{s.tagline || 'Tagline'}</div>
                </div>
              </div>
              <div className="text-[10.5px] text-gray-500 leading-snug">
                {[s.addressLine1, s.addressLine2].filter(Boolean).join(', ')}<br />
                {[s.city, s.state, s.pincode].filter(Boolean).join(', ')}<br />
                {s.phone && <>Ph: {s.phone}<br /></>}
                {s.gstin && <>GSTIN: <b>{s.gstin}</b></>}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return <SettingsForm />;
}

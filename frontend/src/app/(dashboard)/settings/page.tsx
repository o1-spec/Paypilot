'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { Shield, Key, Building2, Server, Save, Copy, Check } from 'lucide-react';

const INPUT = 'w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold';
const LABEL = 'block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1';

const SECTIONS = [
  { id: 'profile', icon: Building2, label: 'Merchant Profile' },
  { id: 'provider', icon: Server, label: 'Nomba Provider Setting' },
  { id: 'keys', icon: Key, label: 'API Webhook Keys' },
];

export default function SettingsPage() {
  const [active, setActive] = useState('profile');
  const [businessName, setBusinessName] = useState('Grace Foods Enterprises');
  const [email, setEmail] = useState('info@gracefoods.ng');
  const [phone, setPhone] = useState('+234 801 111 2222');
  const [provider, setProvider] = useState('MockNombaProvider');
  const [webhookUrl] = useState('http://localhost:8000/api/webhooks/nomba/');
  const [webhookSecret] = useState('whsec_nomba_reconciliation_sig_key_2026');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.email) setEmail(parsed.email);
      } catch {}
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F6F1]">
      <TopNavbar title="Settings & Integration" />

      <main className="flex-1 p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Settings</h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">Manage merchant profiles, virtual account providers, and webhook integration secrets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar nav */}
          <div className="space-y-1">
            {SECTIONS.map(sec => {
              const Icon = sec.icon;
              const isActive = active === sec.id;
              return (
                <button key={sec.id} onClick={() => setActive(sec.id)}
                  className={`flex items-center gap-3 w-full text-left rounded-xl px-4 py-3 text-xs font-bold transition-all ${isActive ? 'bg-[#0F172A] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#F0EDE8] hover:text-[#0F172A]'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-[#94A3B8]'}`} />
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="md:col-span-3 space-y-5">

            {active === 'profile' && (
              <div className="rounded-2xl border border-[#E5E2DC] bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-[#E5E2DC] pb-4">
                  <div className="rounded-xl bg-amber-50 p-2 border border-amber-200 text-amber-600 shadow-sm"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Business Profile</h3>
                    <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">Edit company contact data.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={LABEL}>Business Legal Name</label><input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className={INPUT} /></div>
                  <div><label className={LABEL}>Support Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} /></div>
                  <div className="sm:col-span-2"><label className={LABEL}>Contact Phone</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={INPUT} /></div>
                </div>
              </div>
            )}

            {active === 'provider' && (
              <div className="rounded-2xl border border-[#E5E2DC] bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-[#E5E2DC] pb-4">
                  <div className="rounded-xl bg-[#FAFAF8] p-2 border border-[#E5E2DC] text-[#64748B] shadow-sm"><Server className="h-5 w-5" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Virtual Account Provider</h3>
                    <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">Toggle provisioning API credentials.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div><label className={LABEL}>Active Provider Profile</label>
                    <select value={provider} onChange={e => setProvider(e.target.value)} className={INPUT}>
                      <option value="MockNombaProvider">Mock Nomba Sandbox Provider (Providus Mapping)</option>
                      <option value="WemaProvider">Wema API Live Provider (Stage 2 roadmap)</option>
                      <option value="NombaLiveProvider">Nomba Dedicated API Live Provider (Stage 2 roadmap)</option>
                    </select>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-[10px] text-amber-800 leading-normal font-medium">
                    💡 In sandbox testing, any provision call generates a Providus Bank account prefix. Switch to live providers to issue real accounts dynamically.
                  </div>
                </div>
              </div>
            )}

            {active === 'keys' && (
              <div className="rounded-2xl border border-[#E5E2DC] bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-[#E5E2DC] pb-4">
                  <div className="rounded-xl bg-[#FAFAF8] p-2 border border-[#E5E2DC] text-[#64748B] shadow-sm"><Key className="h-5 w-5" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Webhook Keys</h3>
                    <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">Reconciliation triggers target endpoints.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div><label className={LABEL}>Nomba Endpoint Target</label>
                    <input type="text" readOnly value={webhookUrl} className="w-full rounded-xl border border-[#E5E2DC] bg-[#F0EDE8] text-[#64748B] text-xs py-2.5 px-3.5 outline-none font-mono" />
                  </div>
                  <div><label className={LABEL}>Signing Secret Key</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={webhookSecret} className="flex-1 rounded-xl border border-[#E5E2DC] bg-[#F0EDE8] text-[#64748B] text-xs py-2.5 px-3.5 outline-none font-mono" />
                      <button onClick={handleCopy} className="btn-press rounded-xl border border-[#E5E2DC] hover:bg-[#FAFAF8] px-4 text-xs font-bold text-[#64748B] transition-colors inline-flex items-center gap-1.5">
                        {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={handleSave} className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-neutral-800 active:bg-black text-xs font-bold text-white py-3 px-6 shadow-md transition-all">
                {saved ? <><Check className="h-4 w-4 text-amber-400" /> Saved!</> : <><Save className="h-4 w-4" /> Save Configurations</>}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

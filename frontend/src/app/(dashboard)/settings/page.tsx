'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import PageHeader from '@/components/PageHeader';
import { Shield, Key, Building2, Server, Save } from 'lucide-react';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('Grace Foods Enterprises');
  const [email, setEmail] = useState('info@gracefoods.ng');
  const [phone, setPhone] = useState('+234 801 111 2222');
  const [provider, setProvider] = useState('MockNombaProvider');
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:8000/api/webhooks/nomba/');
  const [webhookSecret, setWebhookSecret] = useState('whsec_nomba_reconciliation_sig_key_2026');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.email) setEmail(parsed.email);
      } catch (e) {}
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Settings & Integration" />

      <main className="flex-1 p-8 max-w-5xl w-full mx-auto space-y-8">
        <PageHeader 
          title="Settings" 
          description="Manage merchant business profiles, virtual accounts providers, and webhook integration secrets." 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Settings Navigation sidebar */}
          <div className="space-y-1">
            <button className="flex items-center gap-3 w-full text-left rounded-xl px-4 py-3 text-xs font-bold bg-slate-950 text-white shadow-sm">
              <Building2 className="h-4.5 w-4.5" />
              Merchant Profile
            </button>
            <button className="flex items-center gap-3 w-full text-left rounded-xl px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
              <Server className="h-4.5 w-4.5 text-slate-400" />
              Nomba Provider Setting
            </button>
            <button className="flex items-center gap-3 w-full text-left rounded-xl px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
              <Key className="h-4.5 w-4.5 text-slate-400" />
              API Webhook Keys
            </button>
          </div>

          {/* Settings Forms block */}
          <div className="md:col-span-2 space-y-6">
            {/* 1. Business Profile Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100 text-slate-500 shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Business Profile</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Edit company contact data.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Business Legal Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Support Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 2. Provider Settings */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100 text-slate-500 shadow-sm">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Virtual Account Provider</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Toggle provisioning API credentials.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Active Provider Profile</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all font-semibold"
                  >
                    <option value="MockNombaProvider">Mock Nomba Sandbox Provider (Providus Mapping)</option>
                    <option value="WemaProvider">Wema API Live Provider (Stage 2 roadmap)</option>
                    <option value="NombaLiveProvider">Nomba Dedicated API Live Provider (Stage 2 roadmap)</option>
                  </select>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 text-[10px] text-slate-500 leading-normal">
                  💡 **Integration Tip**: In sandbox testing, any provision call generates a Providus Bank account prefix. Switch to live providers to issue real accounts dynamically.
                </div>
              </div>
            </div>

            {/* 3. API Webhook Credentials */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100 text-slate-500 shadow-sm">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Webhook Keys</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Reconciliation triggers target endpoints.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nomba Endpoint Target</label>
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs py-2.5 px-3.5 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Signing Secret Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookSecret}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs py-2.5 px-3.5 outline-none font-mono"
                    />
                    <button
                      onClick={handleCopy}
                      className="rounded-xl border border-slate-250 hover:bg-slate-50 active:bg-slate-100 px-4 text-xs font-bold text-slate-600 transition-colors"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 active:bg-black text-xs font-bold text-white py-3 px-6 shadow-md transition-all duration-150">
                <Save className="h-4.5 w-4.5 text-white" />
                Save Configurations
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerMerchant } from '@/lib/api';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await registerMerchant({
        username,
        email,
        password,
        business_name: businessName,
        phone,
      });
      const sessionData = {
        businessName: data.user.business_name,
        email: data.user.email,
        token: data.access,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('paypilot_demo_session', JSON.stringify(sessionData));
      router.push('/dashboard');
    } catch (e: any) {
      const data = e.response?.data;
      let msg = 'Failed to register merchant.';
      if (data) {
        if (data.email) msg = `Email: ${data.email[0]}`;
        else if (data.username) msg = `Username: ${data.username[0]}`;
        else if (data.detail) msg = data.detail;
        else if (data.error) msg = data.error;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FAFAF7] via-[#FCFAF8] to-[#F5F2EC] text-[#0F172A] flex flex-col justify-center items-center px-4 font-sans py-12">
      
      {/* Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #dfddd9 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white border border-[#E5E2DC] p-8 shadow-xl animate-zoom-in">
        
        {/* Header/Logo */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 shadow-sm shadow-amber-500/10">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[#0F172A]">Pay<span className="text-amber-500">Pilot</span></span>
              <span className="block text-[7px] font-bold text-[#64748B] tracking-wider uppercase">Sandbox Portal</span>
            </div>
          </Link>
          <Link 
            href="/"
            className="text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] border border-[#E5E2DC] px-3 py-1 rounded-full bg-[#FAFAF8] transition-colors"
          >
            Back Home
          </Link>
        </div>

        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#0F172A] mb-2">
          Create Account
        </h1>
        <p className="text-xs text-[#64748B] font-semibold mb-6">
          Set up a new developer sandbox workspace to manage your collection rails.
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 p-3.5 animate-fade-down">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. gracefoods"
                className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Business Name</label>
              <input 
                type="text" 
                required 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Grace Foods"
                className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. info@gracefoods.ng"
              className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Phone</label>
              <input 
                type="text" 
                required 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +2348000000000"
                className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 pl-3.5 pr-10 outline-none text-[#0F172A] transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B] hover:text-amber-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-press w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white py-3 shadow-md disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Creating account…' : 'Create Account'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-semibold text-[#64748B]">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-500 hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

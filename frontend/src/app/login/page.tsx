'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginMerchant } from '@/lib/api';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginMerchant({ email, password });
      const sessionData = {
        businessName: data.user.business_name,
        email: data.user.email,
        token: data.access,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('paypilot_demo_session', JSON.stringify(sessionData));
      toast(`Welcome back, ${data.user.business_name}!`, 'success');
      // short delay so toast is visible before navigation
      setTimeout(() => router.push('/dashboard'), 600);
    } catch (e: any) {
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.error ||
        'Incorrect email or password. Please try again.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = () => {
    setEmail('info@gracefoods.ng');
    setPassword('password');
    toast('Sandbox credentials pre-filled — click Sign In to continue.', 'info', 3500);
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#FAFAF7] via-[#FCFAF8] to-[#F5F2EC] text-[#0F172A] flex flex-col justify-center items-center px-4 font-sans">

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
          Sign In
        </h1>
        <p className="text-xs text-[#64748B] font-semibold mb-6">
          Access your dashboard ledger and manage virtual collections.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B] hover:text-amber-500 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-press w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white py-3 shadow-md disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Access Card */}
        <div
          onClick={handleQuickAccess}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickAccess()}
          className="mt-6 p-3.5 border border-[#E5E2DC] bg-[#FAFAF8] rounded-2xl text-left cursor-pointer hover:border-amber-500/60 hover:bg-amber-50/30 transition-all flex items-start gap-2.5"
        >
          <div className="mt-0.5">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-[10px] font-semibold text-[#64748B] leading-normal">
            <strong className="text-[#0F172A]">Quick Access Sandbox Session:</strong> <br />
            Email: <span className="text-[#0F172A] font-mono">info@gracefoods.ng</span> · Password: <span className="text-[#0F172A] font-mono">password</span> <br />
            <span className="text-amber-500 font-bold block mt-1">Click here to auto-fill credentials</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs font-semibold text-[#64748B]">
          Don't have an account?{' '}
          <Link href="/register" className="text-amber-500 hover:underline">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}

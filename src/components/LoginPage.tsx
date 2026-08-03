import React, { useState } from 'react';
import { Lock, Mail, Stethoscope, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@clinic.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@clinic.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0EA5E9]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-8 shadow-xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-[#0EA5E9] rounded-2xl flex items-center justify-center shadow-md text-white mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">Dental Clinic</h1>
          <p className="text-sm text-[#64748B] mt-1">Admin Portal & Staff Management</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm flex items-start gap-3 font-medium">
            <ShieldCheck className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold rounded-xl shadow-md transition-colors duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={fillDemo}
            className="w-full py-2.5 px-3 bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-xl text-xs text-[#0284C7] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#0EA5E9]" />
            Auto-Fill Admin Demo Credentials
          </button>
          <div className="text-center mt-3 text-[11px] text-[#64748B]">
            Demo Credentials: <span className="text-[#1E293B] font-mono font-medium">admin@clinic.com</span> /{' '}
            <span className="text-[#1E293B] font-mono font-medium">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

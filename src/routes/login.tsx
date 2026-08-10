import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LayoutGrid, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract returnTo from URL search query if available
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const returnTo = searchParams.get('returnTo') || '/';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('superdong_token', 'demo_token_superdong_admin_2026');
      localStorage.setItem('superdong_access_token', 'demo_token_superdong_admin_2026');
      localStorage.setItem(
        'superdong_user',
        JSON.stringify({
          name: 'Super Admin',
          email: email,
          role: 'admin',
        })
      );
      toast.success('Đăng nhập thành công!');
      navigate({ to: (returnTo.startsWith('/login') ? '/' : returnTo) as any });
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('superdong_token', 'demo_token_superdong_admin_2026');
      localStorage.setItem('superdong_access_token', 'demo_token_superdong_admin_2026');
      localStorage.setItem(
        'superdong_user',
        JSON.stringify({
          name: 'Super Admin',
          email: 'admin@admin.com',
          role: 'admin',
        })
      );
      toast.success('Đã tự động xác thực quyền Super Admin!');
      navigate({ to: (returnTo.startsWith('/login') ? '/' : returnTo) as any });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo Container matching VietAdmin */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <LayoutGrid className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Superdong Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Đăng nhập tài khoản quản trị hệ thống</p>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Quản Trị
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors text-sm font-mono"
                placeholder="admin@admin.com"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                placeholder="admin"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              'Đăng nhập Hệ thống'
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={16} className="text-emerald-500" />
              Truy cập nhanh với tài khoản Admin mặc định (admin@admin.com)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

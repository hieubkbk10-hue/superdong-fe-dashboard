import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LayoutGrid, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '@/apis/auth';

export const Route = createFileRoute('/login')({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const returnTo = searchParams.get('returnTo') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setLoading(true);

    try {
      const res: any = await login({ email, password });
      const token = res?.access_token || res?.data?.access_token;
      if (token) {
        toast.success('Đăng nhập OAuth2 thành công!');
        navigate({ to: (returnTo.startsWith('/login') ? '/' : returnTo) as any });
      } else {
        setError('Đăng nhập thất bại. Không nhận được token từ Backend.');
        toast.error('Đăng nhập thất bại!');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Tài khoản hoặc mật khẩu không chính xác!';
      setError(`⚠️ Lỗi xác thực: ${msg}`);
      toast.error('Đăng nhập thất bại: Kiểm tra lại Email/Mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@admin.com');
    setPassword('admin');
    setLoading(true);
    setError('');

    try {
      const res: any = await login({ email: 'admin@admin.com', password: 'admin' });
      const token = res?.access_token || res?.data?.access_token;
      if (token) {
        toast.success('Đã xác thực tài khoản Admin thành công!');
        navigate({ to: (returnTo.startsWith('/login') ? '/' : returnTo) as any });
      } else {
        setError('Đăng nhập thất bại từ Backend API.');
        toast.error('Đăng nhập thất bại!');
      }
    } catch (err: any) {
      console.error('Quick login error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Không thể đăng nhập bằng tài khoản mặc định';
      setError(`⚠️ Lỗi xác thực: ${msg}`);
      toast.error('Không thể đăng nhập tài khoản mặc định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo Container */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <LayoutGrid className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Superdong Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Đăng nhập tài khoản quản trị hệ thống qua OAuth2</p>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
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
                Đang xác thực OAuth2...
              </>
            ) : (
              'Đăng nhập Hệ thống (Live Backend API)'
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={16} className="text-emerald-500" />
              Đăng nhập bằng tài khoản Admin mặc định
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

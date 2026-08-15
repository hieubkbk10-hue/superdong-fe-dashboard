import React, { useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Mail, Lock, Eye, EyeOff, Headset, Loader2, ShieldCheck, Ship, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { login } from '@/apis/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAuthenticated, setStoredAuth } from '@/helpers/auth';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const returnTo = searchParams.get('returnTo') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const res: any = await login({ email, password });
      const token = res?.access_token || res?.data?.access_token;
      const user = res?.user || res?.data?.user;
      if (token) {
        setStoredAuth(token, user);
        toast.success('Đăng nhập hệ thống thành công!');
        navigate({ to: (returnTo.startsWith('/login') ? '/' : returnTo) as any });
      } else {
        setError('Đăng nhập thất bại. Không nhận được token xác thực từ Server Backend.');
        toast.error('Đăng nhập thất bại!');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Email hoặc mật khẩu không chính xác!';
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
      const user = res?.user || res?.data?.user;
      if (token) {
        setStoredAuth(token, user);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-slate-100 dark:bg-slate-950 font-sans">
      <div className="m-0 flex w-full max-w-5xl flex-col items-stretch overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl md:flex-row">
        
        {/* Left Side: Dark Brand Hero (Newmoon-Admin Style) */}
        <div className="hidden w-full max-w-md flex-col justify-between bg-slate-950 p-10 text-white md:flex">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Ship className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">SUPERDONG</span>
            </div>

            <div className="space-y-4 py-4">
              <h1 className="text-3xl font-bold leading-snug text-white">
                Chào mừng trở lại!
                <br />
                <span className="text-blue-400 font-bold">
                  Hệ thống Quản trị Vận hành Tàu Superdong
                </span>
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nền tảng quản lý tập trung toàn diện cho công ty tàu Superdong: Quản lý đội tàu, hải trình, chuyến tàu thực tế, mã khuyến mãi và kiểm soát vé.
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
            <div className="flex items-center justify-center rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
              <Headset className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Cần hỗ trợ kỹ thuật?</p>
              <p className="text-[11px] text-slate-400">Liên hệ bộ phận IT Superdong</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form (Newmoon-Admin Style) */}
        <div className="flex w-full flex-col justify-center p-6 md:p-12">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-6 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Ship className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">SUPERDONG</span>
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Đăng nhập hệ thống
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vui lòng sử dụng tài khoản quản trị được cấp để đăng nhập.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Quản Trị
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@admin.com"
                  className="pl-10 font-mono text-xs h-11 rounded-xl bg-slate-50 dark:bg-slate-950"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </Label>
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 text-xs h-11 rounded-xl bg-slate-50 dark:bg-slate-950"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xác thực...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

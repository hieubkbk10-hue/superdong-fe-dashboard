import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  showRequirements?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function PasswordInput({
  value,
  onChange,
  showRequirements = true,
  placeholder = '••••••••',
  id = 'password-input',
  className = '',
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const pwd = value || '';

  const requirements = [
    { label: 'Tối thiểu 8 ký tự', met: pwd.length >= 8 },
    { label: 'Chữ hoa (A-Z) & chữ thường (a-z)', met: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) },
    { label: 'Chữ số (0-9)', met: /[0-9]/.test(pwd) },
    { label: 'Ký tự đặc biệt (!@#$%...)', met: /[^a-zA-Z0-9]/.test(pwd) },
  ];

  return (
    <div className="space-y-2 w-full">
      <div className="relative flex items-center">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 text-sm h-9 font-mono rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showRequirements && pwd.length > 0 && (
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs space-y-1">
          <div className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] mb-1 uppercase tracking-wider">
            Yêu cầu độ mạnh mật khẩu Backend:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {requirements.map((req, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 text-[11.5px] transition-colors ${
                  req.met
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 font-normal'
                }`}
              >
                {req.met ? (
                  <span className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                  </span>
                ) : (
                  <span className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <X size={10} className="text-slate-400" />
                  </span>
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PasswordInput;

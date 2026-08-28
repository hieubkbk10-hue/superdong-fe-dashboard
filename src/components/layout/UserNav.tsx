import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { clearStoredAuth, getStoredUser } from '@/helpers/auth';

export const UserNav: React.FC = () => {
  const navigate = useNavigate();

  // Retrieve user info from storage or use defaults
  const user = React.useMemo(() => {
    const stored = getStoredUser();
    if (stored) return stored;
    return {
      name: 'Super Admin',
      email: 'admin@superdong.com.vn',
      role: 'Quản trị hệ thống',
    };
  }, []);


  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    clearStoredAuth();
    navigate({ to: '/login' as any });
  };



  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          title={user.name}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white dark:ring-slate-700">
              {initials || 'SD'}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          </div>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
            {user.name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1 bg-white dark:bg-slate-900">
        <DropdownMenuLabel className="font-normal p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">{user.name}</p>
            <p className="text-xs leading-none text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            <div className="pt-1.5">
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {user.role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="py-1">
          <DropdownMenuItem
            onClick={() => navigate({ to: '/settings' as any })}
            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Cài đặt hệ thống</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md font-medium"
        >
          <LogOut className="h-4 w-4 text-rose-500" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

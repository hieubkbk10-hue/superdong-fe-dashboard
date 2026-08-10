import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { User, Settings, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
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

export const UserNav: React.FC = () => {
  const navigate = useNavigate();

  // Retrieve user info from storage or use defaults
  const user = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('superdong_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return {
      name: 'Nguyễn Văn Đông',
      email: 'admin@superdong.com.vn',
      role: 'Quản trị viên',
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('superdong_token');
    localStorage.removeItem('superdong_user');
    navigate({ to: '/login' as any });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full p-1 pl-1.5 pr-2.5 hover:bg-accent/80 transition-all duration-200 focus:outline-none border border-transparent hover:border-border/60"
        >
          <Avatar className="h-8 w-8 border border-primary/20 ring-2 ring-primary/10">
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight">{user.name}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{user.role}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border shadow-xl p-1 bg-card">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-semibold leading-none">{user.name}</p>
            <p className="text-[11px] leading-none text-muted-foreground">{user.email}</p>
            <div className="pt-1">
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {user.role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => navigate({ to: '/settings' as any })}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Hồ sơ cá nhân</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate({ to: '/settings' as any })}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span>Bảo mật &amp; Mật khẩu</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate({ to: '/settings' as any })}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Cài đặt tài khoản</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-xs text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400 font-medium"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

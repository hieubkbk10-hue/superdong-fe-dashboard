import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background/80 hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
          title="Thay đổi giao diện"
        >
          <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
          <span className="sr-only">Chuyển đổi giao diện</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl border border-border shadow-lg p-1 bg-card">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            theme === 'light' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Sáng (Light)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            theme === 'dark' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Moon className="h-4 w-4 text-sky-400" />
          <span>Tối (Dark)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            theme === 'system' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Monitor className="h-4 w-4 text-gray-500" />
          <span>Hệ thống</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

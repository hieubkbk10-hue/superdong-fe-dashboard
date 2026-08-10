import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export const DateBox: React.FC<DateBoxProps> = ({
  value,
  onChange,
  className = '',
  wrapperClassName = '',
  disabled = false,
  ...props
}) => {
  return (
    <div className={cn("relative flex items-center w-full", wrapperClassName)}>
      <input
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "w-full h-10 px-3 text-sm font-mono text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
          className
        )}
        {...props}
      />
      <CalendarIcon className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none opacity-70" />
    </div>
  );
};

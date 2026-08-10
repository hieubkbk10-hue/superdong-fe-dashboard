import React, { useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateBoxProps {
  id?: string;
  value?: string; // YYYY-MM-DD
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DateBox: React.FC<DateBoxProps> = ({
  id,
  value = '',
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format YYYY-MM-DD to DD/MM/YYYY for Vietnamese presentation matching Newmoon-Admin
  const displayValue = React.useMemo(() => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value]);

  const handleClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch (_) {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex items-center justify-between w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className={cn("text-sm font-mono", displayValue ? "text-slate-800 dark:text-slate-200 font-semibold" : "text-slate-400")}>
        {displayValue || placeholder}
      </span>

      <CalendarIcon className="h-4 w-4 text-slate-400 opacity-70 shrink-0 ml-2" />

      {/* Hidden native input with opacity-0 */}
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
      />
    </div>
  );
};

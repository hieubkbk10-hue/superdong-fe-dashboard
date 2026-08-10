import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  return (
    <div className={cn("flex w-fit shrink-0 items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 shadow-2xs", wrapperClassName)}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("w-[240px] border-none px-0 text-[13px] shadow-none outline-none font-mono focus:ring-0 bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400", className)}
        {...props}
      />
      <Search className="w-4 h-4 text-slate-400 shrink-0" />
    </div>
  );
};

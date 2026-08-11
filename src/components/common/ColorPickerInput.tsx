import React from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export const ColorPickerInput: React.FC<ColorPickerInputProps> = ({
  value,
  onChange,
  placeholder = 'VD: #0284c7',
}) => {
  const pickerValue = isHexColor(value) ? value : '#2B7FFF';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <label className="h-10 w-12 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 cursor-pointer">
          <span
            className="block h-full w-full rounded-md border border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: value && isHexColor(value) ? value : 'transparent' }}
          />
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            aria-label="Chọn màu nhận diện"
          />
        </label>
        <div className="relative flex-1">
          <Palette size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        {value && isHexColor(value) ? 'Màu này sẽ được dùng để nhận diện hạng ghế trên sơ đồ ghế.' : 'Chưa chọn màu nhận diện.'}
      </p>
    </div>
  );
};

import React from 'react';
import { Save, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  message?: string;
}

export const UnsavedChangesBar: React.FC<UnsavedChangesBarProps> = ({
  isDirty,
  isSaving,
  onSave,
  onReset,
  message = 'Thay đổi chưa được lưu',
}) => {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 transition-all duration-300 ${
        isDirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
      }`}
    >
      <div className="p-3 rounded-xl bg-slate-900/90 dark:bg-slate-800/90 text-white backdrop-blur-md border border-slate-700/60 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-xs font-medium truncate">{message}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onReset}
            disabled={isSaving}
            className="text-xs text-slate-300 hover:text-white"
          >
            <Undo2 className="w-3.5 h-3.5 mr-1" />
            Hoàn tác
          </Button>

          <Button
            type="button"
            size="xs"
            onClick={onSave}
            disabled={isSaving}
            className="text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
};

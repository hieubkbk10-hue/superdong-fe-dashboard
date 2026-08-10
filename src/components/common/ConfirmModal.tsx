import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  variant?: 'default' | 'destructive';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  onConfirm,
  loading = false,
  variant = 'destructive',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] gap-4 p-6 sm:rounded-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            {variant === 'destructive' && <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription className="text-xs text-muted-foreground leading-relaxed">{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="gap-1.5"
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

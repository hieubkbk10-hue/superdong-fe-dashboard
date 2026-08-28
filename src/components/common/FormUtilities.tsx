import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Loader2,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Label } from '@/components/ui/label';

/* ==========================================================================
   1. AdminFormHeader - Header thanh điều hướng chuẩn cho Create & Edit
   ========================================================================== */
export interface AdminFormHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  backTo?: string;
  backLabel?: string;
  onBack?: () => void;
  badge?: React.ReactNode;
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
}

export const AdminFormHeader: React.FC<AdminFormHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  backTo,
  backLabel = 'Quay lại danh sách',
  onBack,
  badge,
  onClear,
  clearLabel = 'Làm sạch dữ liệu',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800/80',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {backTo ? (
          <Button
            variant="light"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            asChild
          >
            <Link to={backTo as any} title={backLabel}>
              <ArrowLeft size={16} className="text-slate-600 dark:text-slate-300" />
            </Link>
          </Button>
        ) : onBack ? (
          <Button
            variant="light"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={onBack}
            title={backLabel}
            type="button"
          >
            <ArrowLeft size={16} className="text-slate-600 dark:text-slate-300" />
          </Button>
        ) : null}

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 truncate">
            {Icon && <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end shrink-0">
        {onClear && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-1.5 text-xs text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 h-9 px-3 rounded-lg"
            title="Làm sạch toàn bộ ô nhập liệu về rỗng"
          >
            <RotateCcw size={13} className="text-slate-400" />
            {clearLabel}
          </Button>
        )}
        {badge}
      </div>
    </div>
  );
};

/* ==========================================================================
   2. FormSection & FormSectionBlock - Banner nhóm thông tin hiện đại
   ========================================================================== */
export interface FormSectionProps {
  title: string;
  children?: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
  actions?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  onAdd,
  addLabel = 'Thêm mới',
  className,
  actions,
}) => {
  return (
    <div
      className={cn(
        'bg-slate-100/70 dark:bg-slate-800/60 px-3.5 py-2 rounded-lg text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wide border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between select-none',
        className
      )}
    >
      <span>{title}</span>
      <div className="flex items-center gap-2 normal-case font-normal">
        {children}
        {actions}
        {onAdd && (
          <Button
            type="button"
            variant="primary"
            size="xs"
            onClick={onAdd}
            className="font-semibold gap-1 text-xs h-6 px-2.5 rounded-md"
          >
            + {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export interface FormSectionBlockProps {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  gridClassName?: string;
  actions?: React.ReactNode;
}

export const FormSectionBlock: React.FC<FormSectionBlockProps> = ({
  title,
  children,
  onAdd,
  addLabel,
  columns = 2,
  className,
  gridClassName,
  actions,
}) => {
  const gridColsClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : columns === 4
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className={cn('space-y-3.5', className)}>
      <FormSection title={title} onAdd={onAdd} addLabel={addLabel} actions={actions} />
      <div className={cn('grid gap-4', gridColsClass, gridClassName)}>{children}</div>
    </div>
  );
};

/* ==========================================================================
   3. FormField & Input/Select Components chuẩn Modern UI
   ========================================================================== */
export interface FormFieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  optional = false,
  helperText,
  error,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {optional && <span className="text-slate-400 font-normal text-[11px]">(Không bắt buộc)</span>}
        </Label>
      )}
      {children}
      {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
      {helperText && !error && (
        <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 font-normal">{helperText}</p>
      )}
    </div>
  );
};

export interface FormInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  wrapperClassName?: string;
  leftIcon?: React.ReactNode;
}

export const FormInputField: React.FC<FormInputFieldProps> = ({
  label,
  required,
  optional,
  helperText,
  error,
  wrapperClassName,
  leftIcon,
  className,
  id,
  ...props
}) => {
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      optional={optional}
      helperText={helperText}
      error={error}
      className={wrapperClassName}
    >
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            'w-full h-9 text-xs px-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none transition-all disabled:opacity-50',
            leftIcon && 'pl-9',
            error && 'border-rose-400 focus:border-rose-500',
            className
          )}
          {...props}
        />
      </div>
    </FormField>
  );
};

export interface FormSelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  wrapperClassName?: string;
  options?: { value: string | number; label: string }[];
}

export const FormSelectField: React.FC<FormSelectFieldProps> = ({
  label,
  required,
  optional,
  helperText,
  error,
  wrapperClassName,
  options,
  children,
  className,
  id,
  ...props
}) => {
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      optional={optional}
      helperText={helperText}
      error={error}
      className={wrapperClassName}
    >
      <select
        id={id}
        className={cn(
          'w-full h-9 text-xs px-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-none transition-all disabled:opacity-50 cursor-pointer',
          error && 'border-rose-400 focus:border-rose-500',
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    </FormField>
  );
};

/* ==========================================================================
   4. AdminFormCard - Khung Card duy nhất bọc form (Single Card rounded-lg)
   ========================================================================== */
export interface AdminFormCardProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  className?: string;
}

export const AdminFormCard: React.FC<AdminFormCardProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <form
      className={cn(
        'bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6 font-sans',
        className
      )}
      {...props}
    >
      {children}
    </form>
  );
};

/* ==========================================================================
   5. AdminFormActionBar - Thanh nút bấm dưới cùng với Dirty State thông minh
   ========================================================================== */
export interface AdminFormActionBarProps {
  mode?: 'create' | 'edit';
  isDirty?: boolean;
  isSubmitting?: boolean;
  cancelTo?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  savedLabel?: string;
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
  extraActions?: React.ReactNode;
}

export const AdminFormActionBar: React.FC<AdminFormActionBarProps> = ({
  mode = 'edit',
  isDirty = true,
  isSubmitting = false,
  cancelTo,
  onCancel,
  cancelLabel = 'Hủy Bỏ',
  submitLabel,
  savedLabel = 'Đã lưu',
  onClear,
  clearLabel = 'Làm sạch dữ liệu',
  className,
  extraActions,
}) => {
  const defaultSubmitLabel = mode === 'create' ? 'Lưu mới' : 'Lưu Thay Đổi';
  const resolvedSubmitLabel = submitLabel || defaultSubmitLabel;

  const isClean = mode === 'edit' && !isDirty;

  return (
    <div
      className={cn(
        'pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3',
        className
      )}
    >
      {mode === 'create' && onClear ? (
        <Button
          type="button"
          variant="light"
          onClick={onClear}
          className="w-full sm:w-auto text-slate-600 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 gap-1.5 text-xs h-9 px-3 rounded-lg"
        >
          <RotateCcw size={13} /> {clearLabel}
        </Button>
      ) : (
        <div className="hidden sm:block" />
      )}

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
        {extraActions}

        {cancelTo ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none h-9 px-4 rounded-lg text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
            asChild
          >
            <Link to={cancelTo as any}>{cancelLabel}</Link>
          </Button>
        ) : onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 sm:flex-none h-9 px-4 rounded-lg text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            {cancelLabel}
          </Button>
        ) : null}

        {isClean ? (
          <button
            type="button"
            disabled
            className="flex-1 sm:flex-none h-9 px-4 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 font-medium text-xs border border-slate-200 dark:border-slate-800 cursor-not-allowed select-none transition-all shadow-none text-center"
            title="Form chưa có thay đổi nào để cập nhật"
          >
            {savedLabel}
          </button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none h-9 px-4 rounded-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={14} />
                {resolvedSubmitLabel}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   6. useFormDirty Hook - Quản lý Dirty State chính xác giữa initial và current
   ========================================================================== */
export function useFormDirty<T extends Record<string, any>>(
  initialData: T | null | undefined,
  currentData: T,
  ignoredKeys: (keyof T | string)[] = ['reason', 'notes', 'expected_version']
) {
  const { isDirty, diffKeys } = useMemo(() => {
    if (!initialData) return { isDirty: false, diffKeys: [] };

    const keys = Object.keys(currentData);
    const diffs: string[] = [];

    for (const key of keys) {
      if (ignoredKeys.includes(key)) continue;

      const initialVal = (initialData as any)[key];
      const currentVal = (currentData as any)[key];

      // Handle arrays / objects
      if (typeof initialVal === 'object' || typeof currentVal === 'object') {
        if (JSON.stringify(initialVal) !== JSON.stringify(currentVal)) {
          diffs.push(key);
        }
        continue;
      }

      const normInit = initialVal === null || initialVal === undefined ? '' : String(initialVal).trim();
      const normCurr = currentVal === null || currentVal === undefined ? '' : String(currentVal).trim();

      if (normInit !== normCurr) {
        diffs.push(key);
      }
    }

    return {
      isDirty: diffs.length > 0,
      diffKeys: diffs,
    };
  }, [initialData, currentData, ignoredKeys]);

  return {
    isDirty,
    diffKeys,
  };
}

/* ==========================================================================
   7. generateDynamicAuditReason - Tự sinh chuỗi Audit Reason tự nhiên cho BE
   ========================================================================== */
export function generateDynamicAuditReason<T extends Record<string, any>>(options: {
  entityName: string;
  mode?: 'create' | 'edit';
  initialData?: T | null;
  currentData?: T;
  fieldLabels?: Record<string, string>;
  fallbackEntityId?: string | number;
}): string {
  const {
    entityName,
    mode = 'edit',
    initialData,
    currentData,
    fieldLabels = {},
  } = options;

  if (mode === 'create') {
    const name = currentData?.name || currentData?.code || '';
    return name
      ? `Tạo mới ${entityName} '${name}' từ dashboard vận hành`
      : `Tạo mới ${entityName} từ dashboard vận hành`;
  }

  if (!initialData || !currentData) {
    return `Cập nhật ${entityName} từ dashboard vận hành`;
  }

  const changedLabels: string[] = [];
  const keys = Object.keys(currentData);

  for (const key of keys) {
    if (['reason', 'notes', 'expected_version', 'version'].includes(key)) continue;

    const initialVal = (initialData as any)[key];
    const currentVal = (currentData as any)[key];

    const normInit = initialVal === null || initialVal === undefined ? '' : String(initialVal).trim();
    const normCurr = currentVal === null || currentVal === undefined ? '' : String(currentVal).trim();

    if (normInit !== normCurr) {
      const label = fieldLabels[key] || key;
      changedLabels.push(label);
    }
  }

  if (changedLabels.length === 0) {
    return `Cập nhật ${entityName} từ dashboard vận hành`;
  }

  if (changedLabels.length <= 3) {
    return `Cập nhật ${entityName}: Điều chỉnh ${changedLabels.join(', ')}`;
  }

  return `Cập nhật ${entityName}: Thay đổi ${changedLabels.slice(0, 3).join(', ')} và ${changedLabels.length - 3} thông tin khác`;
}

export { UnsavedChangesBar } from './UnsavedChangesBar';


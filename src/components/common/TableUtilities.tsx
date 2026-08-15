import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Columns3,
  Check,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { PaginationBar } from './PaginationBar';
import { useTablePreferencesStore } from '@/store/useTablePreferencesStore';

/* ==========================================================================
   1. SearchInput - Component tìm kiếm từ khóa dùng chung
   ========================================================================== */
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  showClear?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  className,
  wrapperClassName,
  showClear = true,
}) => (
  <div className={cn('relative w-full sm:w-64 md:w-80', wrapperClassName)}>
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full pl-9 pr-8 h-9 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all',
        className
      )}
    />
    {showClear && value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Xóa từ khóa tìm kiếm"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

/* ==========================================================================
   2. FilterSelect - Dropdown chọn bộ lọc (Trạng thái, Phân loại...)
   ========================================================================== */
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  searchable?: boolean;
  itemTypeLabel?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  align = 'left',
  searchable,
  itemTypeLabel = 'tuyến',
}) => {
  const [open, setOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(8);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder || 'Tất cả';
  const isSelected = Boolean(value && value !== 'all');

  const shouldSearch = searchable ?? options.length > 5;

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!filterSearch.trim()) return options;
    const q = filterSearch.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, filterSearch]);

  const displayedOptions = useMemo(() => {
    return filteredOptions.slice(0, displayCount);
  }, [filteredOptions, displayCount]);

  const hasMore = filteredOptions.length > displayedOptions.length;
  const remainingCount = filteredOptions.length - displayedOptions.length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 25 && hasMore) {
      setDisplayCount((prev) => prev + 8);
    }
  };

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFilterSearch('');
      setDisplayCount(8);
    }
  };

  return (
    <div className="relative inline-block text-left w-full sm:w-auto">
      {/* Mobile Native Select */}
      <div className="sm:hidden w-full">
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'w-full h-9 px-3 pr-8 rounded-lg border text-xs font-medium appearance-none bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500',
              isSelected
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
            )}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Desktop Popover Select (Smart Combobox) */}
      <div className="hidden sm:block">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpen(!open)}
          className={cn(
            'gap-1.5 h-9 px-3 text-xs sm:text-sm font-medium transition-all select-none whitespace-nowrap justify-between',
            isSelected
              ? 'border-blue-500/60 bg-blue-50/80 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300 font-semibold'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
            className
          )}
          title={displayLabel}
        >
          <span className="truncate max-w-[160px]">{displayLabel}</span>
          <ChevronDown size={13} className={cn('text-slate-400 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
        </Button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className={cn(
                'absolute top-full mt-1 min-w-[200px] max-w-[320px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-80 zoom-in-95 duration-100',
                align === 'right' ? 'right-0' : 'left-0'
              )}
            >
              {/* Search Box inside dropdown if searchable */}
              {shouldSearch && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Gõ để tìm kiếm..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Scrollable list with progressive load */}
              <div
                onScroll={handleScroll}
                className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-900 scrollbar-thin"
              >
                {displayedOptions.length === 0 ? (
                  <div className="px-3 py-3 text-center text-xs text-slate-400">
                    Không tìm thấy kết quả phù hợp
                  </div>
                ) : (
                  displayedOptions.map((opt) => {
                    const active = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer',
                          active
                            ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/70 dark:bg-blue-950/40'
                            : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {active && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    );
                  })
                )}

                {/* Notice at bottom if more items available */}
                {hasMore && (
                  <div
                    onClick={() => setDisplayCount((prev) => prev + 8)}
                    className="px-3 py-1.5 text-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800"
                  >
                    +{remainingCount} {itemTypeLabel} nữa (cuộn để tải thêm)
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   3. ColumnToggleDropdown - Dropdown ẩn/hiện cột của bảng
   ========================================================================== */
export interface ColumnToggleOption {
  key: string;
  label: string;
}

export interface ColumnToggleDropdownProps {
  columns: ColumnToggleOption[];
  visibleColumns: Record<string, boolean>;
  onChange: (key: string, visible: boolean) => void;
  onReset?: () => void;
}

export const ColumnToggleDropdown: React.FC<ColumnToggleDropdownProps> = ({
  columns,
  visibleColumns,
  onChange,
  onReset,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 h-9 px-3 text-xs sm:text-sm font-medium border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        title="Tuỳ chỉnh cột hiển thị"
      >
        <Columns3 size={14} className="text-slate-500 dark:text-slate-400" />
        <span className="hidden sm:inline">Cột</span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 p-2 space-y-1 animate-in fade-in-80 zoom-in-95 duration-100">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Cột hiển thị</span>
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Mặc định
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-0.5 pt-1">
              {columns.map((col) => {
                const isChecked = visibleColumns[col.key] !== false;
                return (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onChange(col.key, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ==========================================================================
   4. SortableHeader - Cột bảng hỗ trợ Sắp xếp Tăng / Giảm
   ========================================================================== */
export interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

export interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
  isFirst?: boolean;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  align = 'left',
  className,
  isFirst = false,
}) => {
  const isSorted = sortConfig.key === sortKey;
  const isAsc = isSorted && sortConfig.direction === 'asc';
  const isDesc = isSorted && sortConfig.direction === 'desc';

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors select-none group p-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap',
        isFirst && 'pl-6 pr-4',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        isSorted && 'text-blue-600 dark:text-blue-400 font-bold',
        className
      )}
    >
      <div
        className={cn(
          'inline-flex items-center gap-1.5',
          align === 'right' && 'justify-end w-full',
          align === 'center' && 'justify-center w-full'
        )}
      >
        <span>{label}</span>
        {isAsc ? (
          <ChevronUp size={14} className="text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
        ) : isDesc ? (
          <ChevronDown size={14} className="text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
        ) : (
          <ChevronsUpDown size={13} className="text-slate-400/60 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 shrink-0 transition-colors" />
        )}
      </div>
    </th>
  );
};

/* ==========================================================================
   5. Hook sắp xếp dữ liệu useSortableData
   ========================================================================== */
export function useSortableData<T>(items: T[], config: SortConfig) {
  return useMemo(() => {
    const sortableItems = [...items];
    if (config.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[config.key as keyof T] as string | number | undefined | null;
        const bVal = b[config.key as keyof T] as string | number | undefined | null;
        if (aVal == null || bVal == null) return 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return config.direction === 'asc'
            ? aVal.localeCompare(bVal, 'vi', { numeric: true, sensitivity: 'base' })
            : bVal.localeCompare(aVal, 'vi', { numeric: true, sensitivity: 'base' });
        }
        if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, config]);
}

/* ==========================================================================
   6. PageHeader - Component Tiêu đề trang, Subtitle & Nút thao tác góc phải
   ========================================================================== */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  statusBadge?: {
    label: string;
    variant?: 'success' | 'info' | 'warning' | 'danger';
  };
  apiError?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  createLink?: string;
  createLabel?: string;
  onCreateClick?: () => void;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  statusBadge,
  apiError,
  onRefresh,
  refreshing = false,
  createLink,
  createLabel = 'Thêm mới',
  onCreateClick,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          {title}
        </h1>
        {statusBadge && !apiError && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={13} /> {statusBadge.label}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      )}
    </div>

    {/* Top-Right Header Actions: Refresh & Create Buttons */}
    <div className="flex items-center gap-2 shrink-0">
      {actions}

      {onRefresh && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="gap-1.5 h-9 text-xs sm:text-sm font-medium border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={14} className={cn('text-slate-500 dark:text-slate-400', refreshing && 'animate-spin')} />
          <span>Làm mới</span>
        </Button>
      )}

      {createLink && (
        <Button
          size="sm"
          asChild
          className="gap-1.5 h-9 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
        >
          <Link to={createLink as any}>
            <Plus size={16} />
            <span>{createLabel}</span>
          </Link>
        </Button>
      )}

      {!createLink && onCreateClick && (
        <Button
          size="sm"
          onClick={onCreateClick}
          className="gap-1.5 h-9 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
        >
          <Plus size={16} />
          <span>{createLabel}</span>
        </Button>
      )}
    </div>
  </div>
);

/* ==========================================================================
   7. TableToolbar - Thanh công cụ lọc, tìm kiếm và ẩn/hiện cột
   ========================================================================== */
export interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  columns?: ColumnToggleOption[];
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (key: string, visible: boolean) => void;
  onColumnReset?: () => void;
  children?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterValue,
  onFilterChange,
  filterOptions,
  columns,
  visibleColumns,
  onColumnToggle,
  onColumnReset,
  children,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Left side: Search input */}
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />

      {/* Right side: Filters & Column Toggle */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {children}

        {filterOptions && onFilterChange && (
          <FilterSelect
            value={filterValue || 'all'}
            onChange={onFilterChange}
            options={filterOptions}
          />
        )}

        {columns && visibleColumns && onColumnToggle && (
          <ColumnToggleDropdown
            columns={columns}
            visibleColumns={visibleColumns}
            onChange={onColumnToggle}
            onReset={onColumnReset}
          />
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   8. AdminTablePage - MASTER CONTAINER COMPONENT ĐÓNG GÓI TOÀN BỘ LOGIC
   ========================================================================== */
export interface ColumnDef<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  sortable?: boolean;
}

export interface AdminTablePageProps<T> {
  // Title & Header Bar
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  statusBadge?: {
    label: string;
    variant?: 'success' | 'info' | 'warning' | 'danger';
  };

  // Alerts / Banners
  apiError?: string | null;
  banner?: React.ReactNode;

  // Search & Filter state
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];

  // Column Toggle
  columns: ColumnDef<T>[];
  columnStorageKey?: string;

  // Header Actions (Refresh & Create Link)
  onRefresh?: () => void;
  refreshing?: boolean;
  createLink?: string;
  createLabel?: string;
  onCreateClick?: () => void;

  // Table Data
  data: T[];
  loading?: boolean;
  emptyText?: string;
  keyExtractor: (item: T) => string;

  // Pagination State
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function AdminTablePage<T>({
  title,
  subtitle,
  icon: Icon,
  statusBadge,
  apiError,
  banner,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterValue,
  onFilterChange,
  filterOptions,
  columns,
  columnStorageKey,
  onRefresh,
  refreshing = false,
  createLink,
  createLabel,
  onCreateClick,
  data,
  loading = false,
  emptyText = 'Chưa có dữ liệu phù hợp với bộ lọc.',
  keyExtractor,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AdminTablePageProps<T>) {
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    });
  };

  const sortedData = useSortableData(data, sortConfig);

  // Column Toggle State
  const defaultVisibleColumns = useMemo(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((c) => {
      initial[c.key] = true;
    });
    return initial;
  }, [columns]);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    if (!columnStorageKey) return defaultVisibleColumns;
    try {
      const saved = localStorage.getItem(columnStorageKey);
      if (saved) return { ...defaultVisibleColumns, ...JSON.parse(saved) };
    } catch (_) {}
    return defaultVisibleColumns;
  });

  useEffect(() => {
    if (columnStorageKey) {
      try {
        localStorage.setItem(columnStorageKey, JSON.stringify(visibleColumns));
      } catch (_) {}
    }
  }, [visibleColumns, columnStorageKey]);

  const handleColumnToggle = (key: string, visible: boolean) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: visible }));
  };

  const columnToggleOptions = useMemo(
    () => columns.map((c) => ({ key: c.key, label: c.label })),
    [columns]
  );

  // Paginated Slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const visibleColumnDefs = useMemo(
    () => columns.filter((col) => visibleColumns[col.key] !== false),
    [columns, visibleColumns]
  );

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
      {/* Exported Reusable PageHeader Component */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        statusBadge={statusBadge}
        apiError={apiError}
        onRefresh={onRefresh}
        refreshing={refreshing}
        createLink={createLink}
        createLabel={createLabel}
        onCreateClick={onCreateClick}
      />

      {/* API Error Warning Alert */}
      {apiError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-medium flex items-center gap-2.5">
          <AlertTriangle size={18} className="shrink-0 text-rose-500" />
          <span>Không thể lấy dữ liệu từ Backend API: {apiError}. Vui lòng kiểm tra lại Server Backend!</span>
        </div>
      )}

      {/* Custom Banner / Alert Slot */}
      {banner}

      {/* Filter Bar (Search, Status Filter, Column Toggle) */}
      <TableToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filterValue={filterValue}
        onFilterChange={onFilterChange}
        filterOptions={filterOptions}
        columns={columnToggleOptions}
        visibleColumns={visibleColumns}
        onColumnToggle={handleColumnToggle}
        onColumnReset={() => setVisibleColumns(defaultVisibleColumns)}
      />

      {/* Data Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-800">
              <tr>
                {visibleColumnDefs.map((col, idx) => {
                  const isFirst = idx === 0;
                  const isSortable = col.sortable === true;
                  if (isSortable) {
                    return (
                      <SortableHeader
                        key={col.key}
                        label={col.label}
                        sortKey={col.key}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        align={col.align}
                        className={col.className}
                        isFirst={isFirst}
                      />
                    );
                  }
                  return (
                    <th
                      key={col.key}
                      className={cn(
                        'p-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap',
                        isFirst && 'pl-6 pr-4',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumnDefs.length} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    Đang tải dữ liệu từ Backend API...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumnDefs.length}
                    className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {visibleColumnDefs.map((col, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'p-3.5 whitespace-nowrap',
                            isFirst && 'pl-6 pr-4',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                            col.className
                          )}
                        >
                          {col.render(item)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Master Pagination Bar */}
        <PaginationBar
          totalItems={data.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   9. useTablePagination - Hook quản lý phân trang đồng bộ Zustand Persist
   ========================================================================== */
export function useTablePagination(tableKey: string = 'global', defaultPageSize: number = 10) {
  const { tablePageSizes, defaultPageSize: globalDefault, setTablePageSize } = useTablePreferencesStore();
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = tablePageSizes[tableKey] || globalDefault || defaultPageSize;

  const handlePageSizeChange = (newSize: number) => {
    setTablePageSize(tableKey, newSize);
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    onPageChange: setCurrentPage,
    onPageSizeChange: handlePageSizeChange,
  };
}


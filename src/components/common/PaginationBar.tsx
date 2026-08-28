import React from 'react';
import { Button } from '@/components/common/Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  entityLabel?: string;
}

export function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
  entityLabel = 'mục',
}) => {
  if (totalItems <= 0) return null;

  // Khi danh sách <= 10 mục: Hiển thị thanh đếm đơn giản, ẩn toàn bộ nút phân trang rườm rà
  if (totalItems <= 10) {
    return (
      <div
        className={cn(
          'px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-950/40',
          className
        )}
      >
        <div className="text-slate-600 dark:text-slate-300">
          Tổng cộng: <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> {entityLabel}
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const paginationItems = generatePaginationItems(currentPage, totalPages);

  return (
    <div
      className={cn(
        'px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950',
        className
      )}
    >
      {/* Left side: Range info & Page size select */}
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-slate-500 dark:text-slate-400">{entityLabel}/trang</span>
          </div>
        )}

        <div className="text-slate-700 dark:text-slate-300 font-medium">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {startItem}–{endItem}
          </span>
          <span className="text-slate-400 dark:text-slate-500"> / </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span> {entityLabel}
        </div>
      </div>

      {/* Right side: Page Number Pills & Navigation Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="Trang đầu"
        >
          <ChevronsLeft size={15} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Trang trước"
        >
          <ChevronLeft size={15} />
        </Button>

        {/* Mobile Compact Page Indicator */}
        <div className="sm:hidden px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-md">
          {currentPage} / {totalPages}
        </div>

        {/* Desktop Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {paginationItems.map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 select-none text-xs">
                  ...
                </span>
              );
            }
            const isCurrent = item === currentPage;
            return (
              <Button
                key={item}
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-8 min-w-[32px] px-2 rounded-md text-xs font-semibold transition-all',
                  isCurrent
                    ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white shadow-xs font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Trang sau"
        >
          <ChevronRight size={15} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Trang cuối"
        >
          <ChevronsRight size={15} />
        </Button>
      </div>
    </div>
  );
};


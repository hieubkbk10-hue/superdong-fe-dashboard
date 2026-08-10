import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
}) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className={`px-4 py-3 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center gap-2">
        <span>
          Hiển thị <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> trong tổng số <strong>{totalItems}</strong> mục
        </span>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5">
          <span>Số dòng/trang:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 px-2 bg-background border border-input rounded text-xs outline-none cursor-pointer focus:ring-1 focus:ring-ring"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </Button>

        <span className="px-3 font-semibold text-foreground">
          Trang {currentPage} / {totalPages}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Table as TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T = any> {
  header: React.ReactNode | string;
  accessor?: keyof T | string;
  id?: string;
  width?: string;
  cellClass?: string;
  headClass?: string;
  sortable?: boolean;
  visible?: boolean;
  cell?: (info: { row: T; value: any; index: number }) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  sortField?: string | null;
  sortOrder?: 'asc' | 'desc' | 'none';
  onSort?: (field: string) => void;
  emptyText?: string;
  className?: string;
}

export function DataTable<T = any>({
  columns,
  data,
  loading = false,
  sortField = null,
  sortOrder = 'none',
  onSort,
  emptyText = 'Không có dữ liệu',
  className = '',
}: DataTableProps<T>) {
  // Filter columns by visibility (default to true if undefined)
  const activeColumns = columns.filter((col) => col.visible !== false);

  const renderSortIndicator = (colId: string) => {
    if (sortField !== colId || sortOrder === 'none') {
      return <ArrowUpDown size={13} className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp size={14} className="text-primary font-bold" />
    ) : (
      <ChevronDown size={14} className="text-primary font-bold" />
    );
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <TableRoot className="w-full text-left text-sm table-fixed">
          {/* Render Colgroup for fixed widths */}
          <colgroup>
            {activeColumns.map((col, idx) => (
              <col key={col.id || idx} className={col.width || ''} />
            ))}
          </colgroup>

          {/* Table Header */}
          <TableHeader className="bg-muted/40 text-muted-foreground font-semibold border-b text-xs">
            <TableRow className="hover:bg-transparent">
              {activeColumns.map((col, idx) => {
                const colId = (col.id || col.accessor || String(idx)) as string;
                const isSortable = col.sortable && onSort;

                return (
                  <TableHead
                    key={colId}
                    onClick={() => isSortable && onSort(colId)}
                    className={cn(
                      "p-3.5 select-none font-semibold text-muted-foreground text-xs",
                      isSortable && "cursor-pointer hover:bg-muted/60 transition-colors group",
                      col.headClass
                    )}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="truncate">{col.header}</span>
                      {isSortable && renderSortIndicator(colId)}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y text-xs">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                  {activeColumns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="p-3.5">
                      <Skeleton className="h-5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/40 transition-colors">
                  {activeColumns.map((col, colIndex) => {
                    const value = col.accessor && typeof col.accessor === 'string' ? (row as any)[col.accessor] : undefined;
                    return (
                      <TableCell key={colIndex} className={cn("p-3.5 align-middle", col.cellClass)}>
                        {col.cell ? col.cell({ row, value, index: rowIndex }) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              // Empty State
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="p-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs font-medium text-muted-foreground">{emptyText}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableRoot>
      </div>
    </div>
  );
}

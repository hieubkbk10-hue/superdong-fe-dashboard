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
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';
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
    const isSorted = sortField === colId && sortOrder !== 'none';
    const isAsc = sortField === colId && sortOrder === 'asc';
    const isDesc = sortField === colId && sortOrder === 'desc';

    return (
      <div className="flex flex-col items-center justify-center shrink-0 ml-1">
        <ChevronUp
          size={11}
          className={cn(
            "transition-colors -mb-1",
            isAsc ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 opacity-60 group-hover:opacity-100"
          )}
        />
        <ChevronDown
          size={11}
          className={cn(
            "transition-colors",
            isDesc ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 opacity-60 group-hover:opacity-100"
          )}
        />
      </div>
    );
  };

  return (
    <div className={cn("custom-scrollbar overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs", className)}>
      <TableRoot className="w-full text-left text-[13px] border-collapse min-w-max">
        {/* Table Header (Newmoon-Admin Style: uppercase, text-[#4C5B67], bg-[#f9f9f9]) */}
        <TableHeader className="bg-[#F9FAFB] dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
          <TableRow className="hover:bg-transparent border-none">
            {activeColumns.map((col, idx) => {
              const colId = (col.id || col.accessor || String(idx)) as string;
              const isSortable = col.sortable && onSort;

              return (
                <TableHead
                  key={colId}
                  onClick={() => isSortable && onSort(colId)}
                  className={cn(
                    "px-3.5 py-3 select-none font-bold uppercase text-[12px] text-slate-600 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0",
                    col.width,
                    isSortable && "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group",
                    col.headClass
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <span className="truncate">{col.header}</span>
                    {isSortable && renderSortIndicator(colId)}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        {/* Table Body (Newmoon-Admin Cell Style) */}
        <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                {activeColumns.map((_, colIndex) => (
                  <TableCell key={colIndex} className="p-3.5 border-r border-slate-100 dark:border-slate-800/50 last:border-r-0">
                    <Skeleton className="h-5 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data && data.length > 0 ? (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                {activeColumns.map((col, colIndex) => {
                  const value = col.accessor && typeof col.accessor === 'string' ? (row as any)[col.accessor] : undefined;
                  return (
                    <TableCell
                      key={colIndex}
                      className={cn(
                        "px-3.5 py-3 align-middle text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/50 last:border-r-0",
                        col.cellClass
                      )}
                    >
                      {col.cell ? col.cell({ row, value, index: rowIndex }) : value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={activeColumns.length} className="p-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{emptyText}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableRoot>
    </div>
  );
}

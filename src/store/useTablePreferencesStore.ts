import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TablePreferencesState {
  defaultPageSize: number;
  tablePageSizes: Record<string, number>;
  tableVisibleColumns: Record<string, Record<string, boolean>>;
  setDefaultPageSize: (size: number) => void;
  setTablePageSize: (tableKey: string, size: number) => void;
  getPageSize: (tableKey?: string) => number;
  setTableVisibleColumns: (tableKey: string, columns: Record<string, boolean>) => void;
  getTableVisibleColumns: (tableKey?: string) => Record<string, boolean> | undefined;
}

export const useTablePreferencesStore = create<TablePreferencesState>()(
  persist(
    (set, get) => ({
      defaultPageSize: 10,
      tablePageSizes: {},
      tableVisibleColumns: {},
      setDefaultPageSize: (size: number) => set({ defaultPageSize: size }),
      setTablePageSize: (tableKey: string, size: number) =>
        set((state) => ({
          tablePageSizes: { ...state.tablePageSizes, [tableKey]: size },
        })),
      getPageSize: (tableKey?: string) => {
        if (!tableKey) return get().defaultPageSize;
        return get().tablePageSizes[tableKey] || get().defaultPageSize;
      },
      setTableVisibleColumns: (tableKey: string, columns: Record<string, boolean>) =>
        set((state) => ({
          tableVisibleColumns: {
            ...state.tableVisibleColumns,
            [tableKey]: columns,
          },
        })),
      getTableVisibleColumns: (tableKey?: string) => {
        if (!tableKey) return undefined;
        return get().tableVisibleColumns[tableKey];
      },
    }),
    {
      name: 'superdong_table_preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);


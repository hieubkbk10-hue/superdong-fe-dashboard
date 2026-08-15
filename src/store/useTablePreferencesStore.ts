import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TablePreferencesState {
  defaultPageSize: number;
  tablePageSizes: Record<string, number>;
  setDefaultPageSize: (size: number) => void;
  setTablePageSize: (tableKey: string, size: number) => void;
  getPageSize: (tableKey?: string) => number;
}

export const useTablePreferencesStore = create<TablePreferencesState>()(
  persist(
    (set, get) => ({
      defaultPageSize: 10,
      tablePageSizes: {},
      setDefaultPageSize: (size: number) => set({ defaultPageSize: size }),
      setTablePageSize: (tableKey: string, size: number) =>
        set((state) => ({
          tablePageSizes: { ...state.tablePageSizes, [tableKey]: size },
        })),
      getPageSize: (tableKey?: string) => {
        if (!tableKey) return get().defaultPageSize;
        return get().tablePageSizes[tableKey] || get().defaultPageSize;
      },
    }),
    {
      name: 'superdong_table_preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

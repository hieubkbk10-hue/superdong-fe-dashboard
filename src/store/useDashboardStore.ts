import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PeriodPreset = 'this_week' | 'next_week' | 'this_month' | 'next_month' | 'all_upcoming' | 'past' | 'all';
export type ViewMode = 'table' | 'calendar';

interface DashboardState {
  period: PeriodPreset;
  viewMode: ViewMode;
  setPeriod: (period: PeriodPreset) => void;
  setViewMode: (viewMode: ViewMode) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      period: 'this_week',
      viewMode: 'table', // Mặc định là Bảng chi tiết
      setPeriod: (period) => set({ period }),
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'superdong_dashboard_preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

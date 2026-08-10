import React, { useState } from 'react';
import {
  SeatMap,
  Deck,
  SeatCell,
  SeatStatus,
  SeatClass
} from '@/types';
import {
  BadgeCheck,
  Ban,
  Tv,
  Luggage,
  DoorClosed,
  Compass,
  CheckCircle2,
  Info,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SeatMapViewerProps {
  seatMap?: SeatMap;
  onSeatSelect?: (seat: SeatCell) => void;
  readOnly?: boolean;
  selectedSeatCode?: string;
  className?: string;
}

// Fallback/Default mock Seat Map if none passed
export const MOCK_SUPERDONG_SEATMAP: SeatMap = {
  id: 'sm-sd-01',
  boat_id: 'boat-01',
  boat_name: 'Superdong I (Tàu Cao Tốc)',
  name: 'Sơ đồ chuẩn Superdong 275 Ghế',
  version: 'v2.1',
  total_seats: 275,
  is_active: true,
  decks: [
    {
      id: 'deck-1',
      name: 'Tầng 1 (Khoang trệt)',
      level: 1,
      rows: 10,
      columns: 8,
      zones: [
        { id: 'zone-vip-1', name: 'Khoang VIP (Đầu tàu)', code: 'VIP-D1', color: 'amber' },
        { id: 'zone-std-1', name: 'Khoang Thường (Thân tàu)', code: 'STD-D1', color: 'sky' },
      ],
      cells: generateDeckCells(1, 10, 8)
    },
    {
      id: 'deck-2',
      name: 'Tầng 2 (Khoang thượng & Ngoài trời)',
      level: 2,
      rows: 8,
      columns: 8,
      zones: [
        { id: 'zone-biz-2', name: 'Khoang Thương Gia', code: 'BIZ-D2', color: 'purple' },
        { id: 'zone-out-2', name: 'Khoang Ngắm Cảnh Ngoài Trời', code: 'OUT-D2', color: 'emerald' },
      ],
      cells: generateDeckCells(2, 8, 8)
    }
  ]
};

// Helper generator for detailed grid
function generateDeckCells(deckLevel: number, rows: number, cols: number): SeatCell[] {
  const cells: SeatCell[] = [];
  const vipClass: SeatClass = { id: 'sc-vip', name: 'VIP', code: 'VIP', color: '#f59e0b', base_price_multiplier: 1.3 };
  const stdClass: SeatClass = { id: 'sc-std', name: 'Thường', code: 'STD', color: '#0284c7', base_price_multiplier: 1.0 };
  const bizClass: SeatClass = { id: 'sc-biz', name: 'Thương gia', code: 'BUSINESS', color: '#8b5cf6', base_price_multiplier: 1.5 };

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      // Row 1 middle cols: Facilities
      if (r === 1 && (c === 4 || c === 5)) {
        cells.push({ row: r, column: c, type: 'facility', facility_type: 'captain', label: 'Buồng lái' });
        continue;
      }
      // Aisle column 3 and column 6
      if (c === 3 || c === 6) {
        cells.push({ row: r, column: c, type: 'aisle', label: 'Lối đi' });
        continue;
      }
      // Facilities at rear
      if (r === rows && (c === 1 || c === 2)) {
        cells.push({ row: r, column: c, type: 'facility', facility_type: 'wc', label: 'Phòng WC' });
        continue;
      }
      if (r === rows && (c === 7 || c === 8)) {
        cells.push({ row: r, column: c, type: 'facility', facility_type: 'luggage', label: 'Hành lý' });
        continue;
      }
      if (r === 4 && (c === 1 || c === 8)) {
        cells.push({ row: r, column: c, type: 'facility', facility_type: 'exit', label: 'Cửa thoát hiểm' });
        continue;
      }

      // Seat letter prefix: A, B, C, D, E, F, G, H
      const charCode = 64 + r;
      const seatLetter = String.fromCharCode(charCode);
      const seatNum = c < 3 ? c : c < 6 ? c - 1 : c - 2;
      const seatCode = `${deckLevel === 1 ? 'T1' : 'T2'}-${seatLetter}${seatNum}`;

      // Status mix
      let status: SeatStatus = 'available';
      let passengerName: string | undefined;
      if ((r + c) % 7 === 0) status = 'booked';
      if ((r + c) % 11 === 0) status = 'held';
      if ((r + c) % 13 === 0) status = 'blocked';

      if (status === 'booked') {
        passengerName = `Nguyễn Văn ${String.fromCharCode(65 + (r * c) % 26)}`;
      }

      const seatClass = deckLevel === 1 
        ? (r <= 3 ? vipClass : stdClass)
        : (r <= 4 ? bizClass : stdClass);

      cells.push({
        id: `cell-${deckLevel}-${r}-${c}`,
        row: r,
        column: c,
        type: 'seat',
        seat_code: seatCode,
        label: seatCode,
        seat_class_id: seatClass.id,
        seat_class: seatClass,
        status,
        price: 330000 * (seatClass.base_price_multiplier || 1.0),
        passenger_name: passengerName,
        is_active: status !== 'blocked'
      });
    }
  }
  return cells;
}

export const SeatMapViewer: React.FC<SeatMapViewerProps> = ({
  seatMap = MOCK_SUPERDONG_SEATMAP,
  onSeatSelect,
  readOnly = false,
  selectedSeatCode,
  className = '',
}) => {
  const [activeDeckId, setActiveDeckId] = useState<string | number>(
    seatMap.decks?.[0]?.id || 'deck-1'
  );
  const [inspectedSeat, setInspectedSeat] = useState<SeatCell | null>(null);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [isCompact, setIsCompact] = useState<boolean>(false);

  const activeDeck = seatMap.decks?.find((d) => d.id === activeDeckId) || seatMap.decks?.[0];

  const handleSeatClick = (cell: SeatCell) => {
    if (cell.type !== 'seat') return;
    setInspectedSeat(cell);
    if (onSeatSelect) {
      onSeatSelect(cell);
    }
  };

  // Facility Icon helper
  const renderFacilityIcon = (facilityType?: string, label?: string) => {
    switch (facilityType) {
      case 'wc':
        return (
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 h-full w-full">
            <span className="text-[10px] font-bold tracking-tight uppercase">WC</span>
            <span className="text-[9px] text-muted-foreground">Nhà vệ sinh</span>
          </div>
        );
      case 'luggage':
        return (
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 h-full w-full">
            <Luggage className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium">Kho Hành lý</span>
          </div>
        );
      case 'tv':
        return (
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 h-full w-full">
            <Tv className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium">Tivi / TV</span>
          </div>
        );
      case 'exit':
        return (
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 h-full w-full">
            <DoorClosed className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-bold">Thoát hiểm</span>
          </div>
        );
      case 'captain':
        return (
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 h-full w-full">
            <Compass className="h-5 w-5 mb-0.5 animate-spin-slow" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Buồng Lái</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center p-2 rounded-xl bg-secondary text-secondary-foreground text-[10px] font-medium h-full w-full">
            {label || 'Tiện ích'}
          </div>
        );
    }
  };

  // Seat Status badge color styling
  const getSeatStyle = (cell: SeatCell) => {
    const isSelected = selectedSeatCode === cell.seat_code || inspectedSeat?.seat_code === cell.seat_code;
    const isFiltered = filterClass !== 'all' && cell.seat_class?.code !== filterClass;

    if (isFiltered) {
      return 'opacity-20 scale-95 border-dashed border-slate-300 bg-slate-100 dark:bg-slate-900 text-slate-400 pointer-events-none';
    }

    let baseStyle = 'transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex flex-col items-center justify-center rounded-xl p-1.5 border relative ';

    if (isSelected) {
      baseStyle += 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-background z-20 scale-105 ';
    }

    switch (cell.status) {
      case 'booked':
        return baseStyle + 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-500/25';
      case 'held':
        return baseStyle + 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25';
      case 'blocked':
      case 'maintenance':
        return baseStyle + 'bg-slate-200/60 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed';
      case 'available':
      default:
        if (cell.seat_class?.code === 'VIP') {
          return baseStyle + 'bg-amber-500/10 border-amber-400/50 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20';
        }
        if (cell.seat_class?.code === 'BUSINESS') {
          return baseStyle + 'bg-purple-500/10 border-purple-400/50 text-purple-900 dark:text-purple-200 hover:bg-purple-500/20';
        }
        return baseStyle + 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20';
    }
  };

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Header Controls & Deck Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">{seatMap.name}</h3>
                <Badge variant="outline" className="text-[10px] bg-sky-50 dark:bg-sky-950/50 text-sky-600 border-sky-300">
                  {seatMap.version || 'v1.0'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tàu: <span className="font-semibold text-foreground">{seatMap.boat_name || 'Superdong'}</span> &bull; Tổng công suất: <span className="font-bold text-emerald-600 dark:text-emerald-400">{seatMap.total_seats} Ghế</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by class */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterClass('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterClass === 'all' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterClass('VIP')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterClass === 'VIP' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Khoang VIP
              </button>
              <button
                type="button"
                onClick={() => setFilterClass('STD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterClass === 'STD' ? 'bg-sky-500 text-white font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Khoang Thường
              </button>
            </div>

            {/* Deck switcher */}
            {seatMap.decks && seatMap.decks.length > 1 && (
              <Tabs value={String(activeDeckId)} onValueChange={(val) => setActiveDeckId(val)}>
                <TabsList className="bg-muted rounded-xl">
                  {seatMap.decks.map((deck) => (
                    <TabsTrigger key={deck.id} value={String(deck.id)} className="text-xs rounded-lg">
                      {deck.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {/* Toggle compact view */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompact(!isCompact)}
              className="h-8 rounded-xl text-xs flex items-center gap-1.5"
            >
              {isCompact ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              <span>{isCompact ? 'Phóng to' : 'Thu nhỏ'}</span>
            </Button>
          </div>
        </div>

        {/* Legend status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900 text-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Chú thích:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Ghế trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-sky-500 inline-block"></span>
              <span>Đã bán / Đặt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block"></span>
              <span>Đang giữ chỗ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-slate-500 inline-block"></span>
              <span>Tạm khóa</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
              <span className="h-3 w-3 rounded-full bg-amber-400 border border-amber-600 inline-block"></span>
              <span className="text-amber-300 font-medium">Khoang VIP</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Rê chuột để xem thông tin chi tiết</span>
          </div>
        </div>

        {/* Interactive 2D Seat Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Visualizer Deck Canvas */}
          <div className="lg:col-span-3 border border-border rounded-2xl bg-card p-6 shadow-sm overflow-x-auto">
            {activeDeck ? (
              <div className="min-w-[580px] space-y-6">
                {/* Deck Heading & Bow Indicator */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 font-bold text-xs">
                      {activeDeck.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Lưới: {activeDeck.rows} Hàng &times; {activeDeck.columns} Cột
                    </span>
                  </div>
                  {/* Boat Bow direction indicator */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-500 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                    <Compass className="h-4 w-4" />
                    <span>MŨI TÀU (ĐẦU TÀU KHỞI HÀNH)</span>
                  </div>
                </div>

                {/* Zones listing */}
                {activeDeck.zones && activeDeck.zones.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeDeck.zones.map((zone) => (
                      <Badge key={zone.id} variant="secondary" className="text-[11px] py-1 px-3 border border-border">
                        {zone.name} ({zone.code})
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Dynamic Grid Layout */}
                <div
                  className="grid gap-2 my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 shadow-inner"
                  style={{
                    gridTemplateColumns: `repeat(${activeDeck.columns}, minmax(0, 1fr))`,
                  }}
                >
                  {activeDeck.cells?.map((cell, idx) => {
                    if (cell.type === 'aisle') {
                      return (
                        <div
                          key={`aisle-${idx}`}
                          className="flex items-center justify-center text-[10px] text-muted-foreground/40 font-mono select-none h-12 bg-slate-200/30 dark:bg-slate-800/20 rounded-lg border border-dashed border-slate-300/30"
                        >
                          LỐI ĐÌ
                        </div>
                      );
                    }

                    if (cell.type === 'facility') {
                      return (
                        <div key={`fac-${idx}`} className="h-12">
                          {renderFacilityIcon(cell.facility_type, cell.label)}
                        </div>
                      );
                    }

                    if (cell.type === 'empty') {
                      return <div key={`empty-${idx}`} className="h-12" />;
                    }

                    // Seat cell
                    return (
                      <Tooltip key={cell.id || `seat-${idx}`}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleSeatClick(cell)}
                            className={`${getSeatStyle(cell)} ${isCompact ? 'h-10' : 'h-13'}`}
                          >
                            <span className="font-extrabold text-xs tracking-tight">
                              {cell.seat_code || cell.label}
                            </span>
                            <span className="text-[9px] opacity-75 font-mono">
                              {cell.seat_class?.code || 'STD'}
                            </span>
                            {cell.status === 'booked' && (
                              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-slate-100 border-slate-800 p-3 rounded-xl shadow-xl max-w-xs">
                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-cyan-400 flex items-center justify-between gap-4">
                              <span>Mã ghế: {cell.seat_code}</span>
                              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                {cell.seat_class?.name || 'Ghế thường'}
                              </span>
                            </div>
                            <div className="text-slate-300">
                              Trạng thái:{' '}
                              <span className="font-semibold text-emerald-400">
                                {cell.status === 'available' ? 'Ghế trống' : cell.status === 'booked' ? 'Đã đặt' : cell.status === 'held' ? 'Đang giữ chỗ' : 'Tạm khóa'}
                              </span>
                            </div>
                            {cell.price && (
                              <div className="text-slate-300">
                                Giá vé: <span className="font-mono text-amber-300 font-bold">{cell.price.toLocaleString('vi-VN')} đ</span>
                              </div>
                            )}
                            {cell.passenger_name && (
                              <div className="text-slate-400 border-t border-slate-800 pt-1 mt-1 text-[11px]">
                                Hành khách: <span className="text-white font-medium">{cell.passenger_name}</span>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Boat Stern / Rear Indicator */}
                <div className="flex items-center justify-center pt-2 text-xs font-medium text-muted-foreground">
                  <span>DUÔI TÀU (ĐUÔI SAU)</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">Chưa có cấu hình tầng cho sơ đồ này</div>
            )}
          </div>

          {/* Seat Inspector / Details Side Panel */}
          <div className="border border-border rounded-2xl bg-card p-5 shadow-sm space-y-4 h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-500" />
                Chi tiết Ghế được chọn
              </h4>
              {inspectedSeat && (
                <Button variant="ghost" size="sm" onClick={() => setInspectedSeat(null)} className="h-6 text-[10px]">
                  Xóa chọn
                </Button>
              )}
            </div>

            {inspectedSeat ? (
              <div className="space-y-4 text-xs animate-in fade-in-50 duration-200">
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center space-y-1">
                  <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                    {inspectedSeat.seat_code}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-background font-semibold">
                      {inspectedSeat.seat_class?.name || 'Hạng Thường'}
                    </Badge>
                    <Badge
                      className={
                        inspectedSeat.status === 'available'
                          ? 'bg-emerald-500 text-white'
                          : inspectedSeat.status === 'booked'
                          ? 'bg-sky-500 text-white'
                          : 'bg-amber-500 text-white'
                      }
                    >
                      {inspectedSeat.status === 'available'
                        ? 'Trống'
                        : inspectedSeat.status === 'booked'
                        ? 'Đã đặt'
                        : 'Đang giữ'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2.5 rounded-xl border border-border p-3 bg-muted/30">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Vị trí tầng:</span>
                    <span className="font-semibold text-foreground">{activeDeck?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Hàng / Cột:</span>
                    <span className="font-mono text-foreground font-semibold">Hàng {inspectedSeat.row}, Cột {inspectedSeat.column}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Hệ số giá:</span>
                    <span className="font-mono text-foreground font-semibold">{inspectedSeat.seat_class?.base_price_multiplier || 1.0}x</span>
                  </div>
                  {inspectedSeat.price && (
                    <div className="flex items-center justify-between text-muted-foreground pt-2 border-t border-border">
                      <span>Giá vé niêm yết:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {inspectedSeat.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>

                {inspectedSeat.passenger_name && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                      Thông tin hành khách đã đặt
                    </span>
                    <p className="font-semibold text-sm">{inspectedSeat.passenger_name}</p>
                    <p className="text-[11px] text-muted-foreground">Trạng thái: Đã thanh toán & xuất vé</p>
                  </div>
                )}

                {!readOnly && (
                  <div className="pt-2 space-y-2">
                    <Button
                      className="w-full h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs"
                      onClick={() => onSeatSelect?.(inspectedSeat)}
                    >
                      Xác nhận chọn ghế {inspectedSeat.seat_code}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <BadgeCheck className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-xs">Nhấp vào một ghế trên sơ đồ 2D để xem chi tiết vị trí và giá bán.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SeatMapViewer;

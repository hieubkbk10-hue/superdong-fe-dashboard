import React, { useMemo, useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Check,
  Search,
  Layers,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Footprints,
} from 'lucide-react';
import { toast } from 'sonner';
import { Boat, SeatClass, SeatMap } from '@/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export type SeatMapPayload = {
  boat_id?: string | number;
  name: string;
  status: 'active' | 'inactive';
  expected_version?: number;
  decks: FormDeck[];
  zones: FormZone[];
  seats: FormSeat[];
  elements: FormElement[];
  reason?: string;
};

type FormDeck = { code: string; name: string; floor_order: number };
type FormZone = { deck_code: string; code: string; name: string; zone_order: number };
type FormSeat = { deck_code: string; zone_code: string; seat_class_id: string | number; seat_number: string; row: number; column: number };
type FormElement = { deck_code: string; zone_code?: string; type: 'aisle' | 'gap' | 'block'; row: number; column: number; width?: number; height?: number; label?: string };

type NamingPattern = 'row-col' | 'col-row2' | 'col-row' | 'prefix-row-col' | 'prefix-col-row2' | 'seq';
type LayoutPreset = '2-2' | '3-3' | '2-3-2' | 'vip-3' | 'custom';

type GeneratorState = {
  deck_code: string;
  zone_code: string;
  seat_class_id: string | number;
  preset: LayoutPreset;
  row_start: number;
  rows_count: number;
  columns: string[];
  aisle_after: string[];
  naming_pattern: NamingPattern;
  prefix: string;
};

type SeatMapFormProps = {
  mode: 'create' | 'edit';
  boats: Boat[];
  seatClasses: SeatClass[];
  initial?: SeatMapPayload;
  submitting: boolean;
  onSubmit: (payload: SeatMapPayload) => Promise<void>;
};

const ALL_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DRAFT_STORAGE_KEY = 'superdong_seatmap_draft_form';

const emptyGenerator: GeneratorState = {
  deck_code: '',
  zone_code: '',
  seat_class_id: '',
  preset: '3-3',
  row_start: 1,
  rows_count: 10,
  columns: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisle_after: ['C'],
  naming_pattern: 'row-col',
  prefix: '',
};

const inputClass =
  'h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all w-full';

const slugCode = (value: string, fallback: string) => {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || fallback;
};

export const mapSeatMapToPayload = (seatMap: SeatMap): SeatMapPayload => {
  const decks = (seatMap.decks || []).map((deck: any, index) => ({
    code: `deck-${deck.floor_order || index + 1}`,
    name: deck.name || '',
    floor_order: Number(deck.floor_order || index + 1),
  }));

  const zones: FormZone[] = [];
  const seats: FormSeat[] = [];
  const elements: FormElement[] = [];

  (seatMap.decks || []).forEach((deck: any, deckIndex) => {
    const deckCode = decks[deckIndex]?.code || `deck-${deckIndex + 1}`;
    (deck.zones || []).forEach((zone: any, zoneIndex: number) => {
      const zoneCode = slugCode(zone.name || '', `zone-${zone.zone_order || zoneIndex + 1}`);
      zones.push({
        deck_code: deckCode,
        code: zoneCode,
        name: zone.name || '',
        zone_order: Number(zone.zone_order || zoneIndex + 1),
      });
      (zone.seats || []).forEach((seat: any) => {
        seats.push({
          deck_code: deckCode,
          zone_code: zoneCode,
          seat_class_id: seat.seat_class_id || seat.seat_class?.id || '',
          seat_number: seat.seat_number || '',
          row: Number(seat.row || 1),
          column: Number(seat.column || 1),
        });
      });
    });

    (deck.elements || []).forEach((element: any) => {
      elements.push({
        deck_code: deckCode,
        type: element.type || 'block',
        row: Number(element.row || 1),
        column: Number(element.column || 1),
        width: Number(element.width || 1),
        height: Number(element.height || 1),
        label: element.label || '',
      });
    });
  });

  return {
    name: seatMap.name || '',
    status: seatMap.status === 'inactive' ? 'inactive' : 'active',
    expected_version: Number(seatMap.version || 1),
    boat_id: (seatMap as any).boat?.id || seatMap.boat_id,
    decks,
    zones,
    seats,
    elements,
    reason: '',
  };
};

const defaultPayload: SeatMapPayload = {
  name: '',
  status: 'active',
  boat_id: '',
  decks: [],
  zones: [],
  seats: [],
  elements: [],
  reason: '',
};

export function SeatMapForm({ mode, boats, seatClasses, initial, submitting, onSubmit }: SeatMapFormProps) {
  const [form, setForm] = useState<SeatMapPayload>(() => {
    if (initial) return initial;
    if (mode === 'create') {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // Ignore JSON error
      }
    }
    return defaultPayload;
  });

  const [generator, setGenerator] = useState<GeneratorState>(emptyGenerator);

  // Table filter & pagination state
  const [seatSearch, setSeatSearch] = useState('');
  const [filterDeck, setFilterDeck] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [seatPage, setSeatPage] = useState(1);
  const seatsPerPage = 20;

  const activeSeatClasses = useMemo(() => seatClasses.filter((sc) => sc.status !== 'inactive' && sc.is_active !== false), [seatClasses]);
  const seatClassById = useMemo(() => new Map(seatClasses.map((seatClass) => [String(seatClass.id), seatClass])), [seatClasses]);

  // Save form draft on F5
  useEffect(() => {
    if (mode === 'create') {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      } catch (e) {
        // Storage quota fallback
      }
    }
  }, [form, mode]);

  useEffect(() => {
    if (form.decks.length > 0 && !generator.deck_code) {
      setGenerator((prev) => ({ ...prev, deck_code: form.decks[0].code }));
    }
  }, [form.decks]);

  useEffect(() => {
    if (form.zones.length > 0) {
      const availableZones = form.zones.filter((z) => !generator.deck_code || z.deck_code === generator.deck_code);
      if (availableZones.length > 0 && (!generator.zone_code || !availableZones.some((z) => z.code === generator.zone_code))) {
        setGenerator((prev) => ({ ...prev, zone_code: availableZones[0].code }));
      }
    }
  }, [form.zones, generator.deck_code]);

  useEffect(() => {
    if (activeSeatClasses.length > 0 && !generator.seat_class_id) {
      setGenerator((prev) => ({ ...prev, seat_class_id: activeSeatClasses[0].id }));
    }
  }, [activeSeatClasses]);

  const updateDeck = (index: number, patch: Partial<FormDeck>) => {
    setForm((prev) => ({ ...prev, decks: prev.decks.map((item, idx) => (idx === index ? { ...item, ...patch } : item)) }));
  };

  const updateZone = (index: number, patch: Partial<FormZone>) => {
    setForm((prev) => ({ ...prev, zones: prev.zones.map((item, idx) => (idx === index ? { ...item, ...patch } : item)) }));
  };

  const updateSeat = (index: number, patch: Partial<FormSeat>) => {
    setForm((prev) => ({ ...prev, seats: prev.seats.map((item, idx) => (idx === index ? { ...item, ...patch } : item)) }));
  };

  const updateElement = (index: number, patch: Partial<FormElement>) => {
    setForm((prev) => ({ ...prev, elements: prev.elements.map((item, idx) => (idx === index ? { ...item, ...patch } : item)) }));
  };

  const addDeck = () => {
    const next = form.decks.length + 1;
    setForm((prev) => ({ ...prev, decks: [...prev.decks, { code: `deck-${next}`, name: `Tầng ${next}`, floor_order: next }] }));
  };

  const addZone = () => {
    if (form.decks.length === 0) {
      toast.error('Vui lòng thêm tầng trước khi thêm khu vực ghế');
      return;
    }
    const next = form.zones.length + 1;
    setForm((prev) => ({ ...prev, zones: [...prev.zones, { deck_code: prev.decks[0].code, code: `zone-${next}`, name: `Khu vực ${next}`, zone_order: next }] }));
  };

  const addSeat = () => {
    if (form.zones.length === 0 || activeSeatClasses.length === 0) {
      toast.error('Cần có khu vực ghế và hạng ghế đang áp dụng trước khi thêm ghế');
      return;
    }
    const zone = form.zones[0];
    setForm((prev) => ({
      ...prev,
      seats: [...prev.seats, { deck_code: zone.deck_code, zone_code: zone.code, seat_class_id: activeSeatClasses[0].id, seat_number: '', row: 1, column: 1 }],
    }));
  };

  const addElement = () => {
    if (form.decks.length === 0) {
      toast.error('Vui lòng thêm tầng trước khi thêm tiện ích');
      return;
    }
    setForm((prev) => ({
      ...prev,
      elements: [...prev.elements, { deck_code: prev.decks[0].code, type: 'block', row: 1, column: 1, width: 1, height: 1, label: '' }],
    }));
  };

  // Calculate generated layout matrix
  const calculatedGeneratedLayout = useMemo(() => {
    if (!generator.deck_code || !generator.zone_code || !generator.seat_class_id || generator.columns.length === 0 || generator.rows_count < 1) {
      return { seats: [], elements: [], totalSeats: 0, totalAisles: 0 };
    }

    const generatedSeats: FormSeat[] = [];
    const generatedElements: FormElement[] = [];

    const rowStart = Math.max(1, generator.row_start || 1);
    const rowEnd = rowStart + Math.max(1, generator.rows_count) - 1;
    let globalSeq = 1;

    for (let r = rowStart; r <= rowEnd; r++) {
      let colGridIndex = 1;
      generator.columns.forEach((colLetter) => {
        let seatNum = '';
        switch (generator.naming_pattern) {
          case 'row-col':
            seatNum = `${r}${colLetter}`;
            break;
          case 'col-row2':
            seatNum = `${colLetter}${String(r).padStart(2, '0')}`;
            break;
          case 'col-row':
            seatNum = `${colLetter}${r}`;
            break;
          case 'prefix-row-col':
            seatNum = `${generator.prefix}${r}${colLetter}`;
            break;
          case 'prefix-col-row2':
            seatNum = `${generator.prefix}${colLetter}${String(r).padStart(2, '0')}`;
            break;
          case 'seq':
            seatNum = `${generator.prefix}${String(globalSeq).padStart(2, '0')}`;
            break;
        }

        generatedSeats.push({
          deck_code: generator.deck_code,
          zone_code: generator.zone_code,
          seat_class_id: generator.seat_class_id,
          seat_number: seatNum,
          row: r,
          column: colGridIndex,
        });

        globalSeq++;
        colGridIndex++;

        if (generator.aisle_after.includes(colLetter)) {
          generatedElements.push({
            deck_code: generator.deck_code,
            zone_code: generator.zone_code,
            type: 'aisle',
            row: r,
            column: colGridIndex,
            width: 1,
            height: 1,
            label: 'Lối đi',
          });
          colGridIndex++;
        }
      });
    }

    return {
      seats: generatedSeats,
      elements: generatedElements,
      totalSeats: generatedSeats.length,
      totalAisles: generatedElements.length,
    };
  }, [generator]);

  const handleAppendSeats = () => {
    const { seats, elements } = calculatedGeneratedLayout;
    if (seats.length === 0) {
      toast.error('Vui lòng chọn tầng, khu vực và số hàng hợp lệ');
      return;
    }

    setForm((prev) => ({
      ...prev,
      seats: [...prev.seats, ...seats],
      elements: [...prev.elements, ...elements],
    }));

    toast.success(`Đã thêm ${seats.length} ghế mới vào sơ đồ`);
  };

  const handleOverwriteZoneSeats = () => {
    const { seats, elements } = calculatedGeneratedLayout;
    if (seats.length === 0) {
      toast.error('Vui lòng chọn tầng, khu vực và số hàng hợp lệ');
      return;
    }

    setForm((prev) => {
      const updatedSeats = prev.seats.filter((s) => s.zone_code !== generator.zone_code);
      const updatedElements = prev.elements.filter((e) => e.zone_code !== generator.zone_code);

      return {
        ...prev,
        seats: [...updatedSeats, ...seats],
        elements: [...updatedElements, ...elements],
      };
    });

    toast.success(`Đã ghi đè ${seats.length} ghế cho khu vực này`);
  };

  const handleClearZoneSeats = () => {
    if (!generator.zone_code) return;
    const count = form.seats.filter((s) => s.zone_code === generator.zone_code).length;
    if (count === 0) {
      toast.info('Khu vực này hiện chưa có ghế');
      return;
    }

    setForm((prev) => ({
      ...prev,
      seats: prev.seats.filter((s) => s.zone_code !== generator.zone_code),
      elements: prev.elements.filter((e) => e.zone_code !== generator.zone_code),
    }));

    toast.success(`Đã xóa ${count} ghế thuộc khu vực`);
  };

  const handleClearAllForm = () => {
    setForm(defaultPayload);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    toast.info('Đã làm sạch toàn bộ dữ liệu mẫu');
  };

  const validateAndSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'create' && !form.boat_id) {
      toast.error('Vui lòng chọn tàu cho sơ đồ ghế');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên sơ đồ ghế');
      return;
    }
    if (form.decks.length === 0 || form.zones.length === 0 || form.seats.length === 0) {
      toast.error('Sơ đồ ghế cần ít nhất 1 tầng, 1 khu vực và 1 ghế');
      return;
    }
    const layoutError = findLayoutError(form);
    if (layoutError) {
      toast.error(layoutError);
      return;
    }

    await onSubmit({ ...form, name: form.name.trim(), reason: form.reason?.trim() || undefined });
    if (mode === 'create') {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  const filteredSeats = useMemo(() => {
    return form.seats.filter((seat) => {
      if (filterDeck && seat.deck_code !== filterDeck) return false;
      if (filterZone && seat.zone_code !== filterZone) return false;
      if (seatSearch.trim() && !seat.seat_number.toLowerCase().includes(seatSearch.trim().toLowerCase())) return false;
      return true;
    });
  }, [form.seats, filterDeck, filterZone, seatSearch]);

  const totalSeatPages = Math.ceil(filteredSeats.length / seatsPerPage) || 1;
  const paginatedSeats = useMemo(() => {
    const start = (seatPage - 1) * seatsPerPage;
    return filteredSeats.slice(start, start + seatsPerPage);
  }, [filteredSeats, seatPage]);

  return (
    <form onSubmit={validateAndSubmit} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6 font-sans">
      {/* SECTION I */}
      <div className="space-y-3">
        <SectionBanner title="I. Thông tin sơ đồ">
          {mode === 'create' && (
            <Badge variant="secondary" className="text-[11px] font-normal lowercase italic">
              Tự động lưu nháp (F5 không mất)
            </Badge>
          )}
        </SectionBanner>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {mode === 'create' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tàu áp dụng <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.boat_id || ''}
                onChange={(e) => setForm({ ...form, boat_id: e.target.value })}
                className={inputClass}
                required
              >
                <option value="">Chọn tàu cao tốc</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.code} - {boat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tên sơ đồ ghế <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Sơ đồ ghế Superdong IX bản 2026"
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trạng thái áp dụng</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              className={inputClass}
            >
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lý do thao tác (Audit log)</label>
            <input
              value={form.reason || ''}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Không bắt buộc (VD: Cập nhật sơ đồ khoang dưới)"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* SECTION II: DECKS */}
      <div className="space-y-3">
        <SectionBanner title="II. Tầng / Khoang tàu" onAdd={addDeck} addLabel="Thêm tầng" />
        <SimpleTable
          headers={['Mã tầng', 'Tên tầng', 'Thứ tự tầng', '']}
          rows={form.decks.map((deck, index) => [
            <input
              value={deck.code}
              onChange={(e) => updateDeck(index, { code: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="VD: deck-1"
            />,
            <input
              value={deck.name}
              onChange={(e) => updateDeck(index, { name: e.target.value })}
              placeholder="VD: Khoang dưới"
              className={inputClass}
            />,
            <input
              type="number"
              value={deck.floor_order}
              onChange={(e) => updateDeck(index, { floor_order: Number(e.target.value) })}
              className={`${inputClass} w-24`}
            />,
            <IconDelete onClick={() => setForm((prev) => ({ ...prev, decks: prev.decks.filter((_, idx) => idx !== index) }))} />,
          ])}
        />
      </div>

      {/* SECTION III: ZONES */}
      <div className="space-y-3">
        <SectionBanner title="III. Khu vực ghế" onAdd={addZone} addLabel="Thêm khu vực" />
        <SimpleTable
          headers={['Tầng áp dụng', 'Mã khu vực', 'Tên khu vực', 'Thứ tự khu', '']}
          rows={form.zones.map((zone, index) => [
            <select
              value={zone.deck_code}
              onChange={(e) => updateZone(index, { deck_code: e.target.value })}
              className={inputClass}
            >
              {form.decks.map((deck) => (
                <option key={deck.code} value={deck.code}>
                  {deck.name || deck.code}
                </option>
              ))}
            </select>,
            <input
              value={zone.code}
              onChange={(e) => updateZone(index, { code: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="VD: zone-1"
            />,
            <input
              value={zone.name}
              onChange={(e) => updateZone(index, { name: e.target.value })}
              placeholder="VD: Khu phổ thông"
              className={inputClass}
            />,
            <input
              type="number"
              value={zone.zone_order}
              onChange={(e) => updateZone(index, { zone_order: Number(e.target.value) })}
              className={`${inputClass} w-24`}
            />,
            <IconDelete onClick={() => setForm((prev) => ({ ...prev, zones: prev.zones.filter((_, idx) => idx !== index) }))} />,
          ])}
        />
      </div>

      {/* SECTION IV: VISUAL QUICK SEAT GENERATOR */}
      <div className="space-y-3">
        <SectionBanner title="IV. Tạo nhanh ghế trực quan (Visual Quick Builder)">
          <Badge variant="blue" className="px-2.5 py-0.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Presets • Live Matrix Preview
          </Badge>
        </SectionBanner>

        <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
          {form.decks.length === 0 || form.zones.length === 0 || activeSeatClasses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-6 text-center text-xs text-amber-800 dark:text-amber-400 flex flex-col items-center gap-1.5">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="font-bold">Cần có ít nhất 1 Tầng, 1 Khu vực ghế và Hạng ghế để sử dụng công cụ tạo nhanh.</p>
              <p className="text-slate-500 dark:text-slate-400">Vui lòng thêm Tầng ở Mục II và Khu vực ở Mục III trước.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT CONFIG PANEL (7 COLS) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" /> 1. Cấu hình vị trí &amp; Mẫu sơ đồ
                  </h3>
                </div>

                {/* Target Deck, Zone, Seat Class */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tầng áp dụng</label>
                    <select
                      value={generator.deck_code}
                      onChange={(e) => setGenerator({ ...generator, deck_code: e.target.value })}
                      className={inputClass}
                    >
                      {form.decks.map((deck) => (
                        <option key={deck.code} value={deck.code}>
                          {deck.name || deck.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Khu vực ghế</label>
                    <select
                      value={generator.zone_code}
                      onChange={(e) => setGenerator({ ...generator, zone_code: e.target.value })}
                      className={inputClass}
                    >
                      {form.zones
                        .filter((z) => !generator.deck_code || z.deck_code === generator.deck_code)
                        .map((zone) => (
                          <option key={zone.code} value={zone.code}>
                            {zone.name || zone.code}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hạng ghế</label>
                    <select
                      value={String(generator.seat_class_id)}
                      onChange={(e) => setGenerator({ ...generator, seat_class_id: e.target.value })}
                      className={inputClass}
                    >
                      {activeSeatClasses.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.code} - {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Layout Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mẫu dãy ghế phổ biến (1-Click Presets)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <PresetCard
                      title="2-2 (4 cột)"
                      desc="A,B | C,D"
                      active={generator.preset === '2-2'}
                      onClick={() => setGenerator({ ...generator, preset: '2-2', columns: ['A', 'B', 'C', 'D'], aisle_after: ['B'] })}
                    />
                    <PresetCard
                      title="3-3 (6 cột)"
                      desc="A,B,C | D,E,F"
                      active={generator.preset === '3-3'}
                      onClick={() => setGenerator({ ...generator, preset: '3-3', columns: ['A', 'B', 'C', 'D', 'E', 'F'], aisle_after: ['C'] })}
                    />
                    <PresetCard
                      title="2-3-2 (7 cột)"
                      desc="A,B | C,D,E | F,G"
                      active={generator.preset === '2-3-2'}
                      onClick={() => setGenerator({ ...generator, preset: '2-3-2', columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], aisle_after: ['B', 'E'] })}
                    />
                    <PresetCard
                      title="VIP (3 cột)"
                      desc="A | B,C"
                      active={generator.preset === 'vip-3'}
                      onClick={() => setGenerator({ ...generator, preset: 'vip-3', columns: ['A', 'B', 'C'], aisle_after: ['A'] })}
                    />
                    <PresetCard
                      title="Tùy chỉnh"
                      desc="Tùy chọn cột"
                      active={generator.preset === 'custom'}
                      onClick={() => setGenerator({ ...generator, preset: 'custom' })}
                    />
                  </div>
                </div>

                {/* Grid Dimensions */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số lượng hàng ghế</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={generator.rows_count}
                        onChange={(e) => setGenerator({ ...generator, rows_count: Math.max(1, Number(e.target.value)) })}
                        className={`${inputClass} text-center font-bold text-blue-600 dark:text-blue-400`}
                      />
                      <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">hàng</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bắt đầu từ hàng số</label>
                    <input
                      type="number"
                      min={1}
                      value={generator.row_start}
                      onChange={(e) => setGenerator({ ...generator, row_start: Math.max(1, Number(e.target.value)) })}
                      className={`${inputClass} text-center font-semibold`}
                    />
                  </div>
                </div>

                {/* Columns Selection & Aisle Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Chọn danh sách cột &amp; Chèn lối đi giữa cột
                    </label>
                    <span className="text-[11px] text-slate-400">Click chữ cái để chọn | Click 🚶 để bật/tắt lối đi</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                    {ALL_COLUMNS.map((col) => {
                      const isColSelected = generator.columns.includes(col);
                      const hasAisle = generator.aisle_after.includes(col);

                      return (
                        <div key={col} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const newCols = isColSelected
                                ? generator.columns.filter((c) => c !== col)
                                : [...ALL_COLUMNS.filter((c) => generator.columns.includes(c) || c === col)];
                              setGenerator({ ...generator, preset: 'custom', columns: newCols });
                            }}
                            className={`h-8 w-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                              isColSelected
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {col}
                          </button>

                          {isColSelected && (
                            <button
                              type="button"
                              title={`Tự động chèn lối đi sau cột ${col}`}
                              onClick={() => {
                                const newAisles = hasAisle
                                  ? generator.aisle_after.filter((a) => a !== col)
                                  : [...generator.aisle_after, col];
                                setGenerator({ ...generator, preset: 'custom', aisle_after: newAisles });
                              }}
                              className={`h-8 px-1.5 ml-1 rounded text-[10px] font-bold border transition-all ${
                                hasAisle
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                                  : 'bg-white dark:bg-slate-900 text-slate-300 border-dashed border-slate-200 dark:border-slate-800 hover:text-slate-500'
                              }`}
                            >
                              🚶 {hasAisle ? 'Lối' : '+Lối'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Naming Rule Selection */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" /> 2. Quy tắc đặt tên mã ghế
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <NamingOptionCard
                      title="[Hàng][Cột]"
                      example="1A, 1B, 1C..."
                      subtitle="Tàu biển phổ biến"
                      active={generator.naming_pattern === 'row-col'}
                      onClick={() => setGenerator({ ...generator, naming_pattern: 'row-col' })}
                    />
                    <NamingOptionCard
                      title="[Cột][Hàng 2 số]"
                      example="A01, A02, B01..."
                      subtitle="Mã 2 chữ số"
                      active={generator.naming_pattern === 'col-row2'}
                      onClick={() => setGenerator({ ...generator, naming_pattern: 'col-row2' })}
                    />
                    <NamingOptionCard
                      title="[Cột][Hàng]"
                      example="A1, A2, B1..."
                      subtitle="Dạng số ngắn"
                      active={generator.naming_pattern === 'col-row'}
                      onClick={() => setGenerator({ ...generator, naming_pattern: 'col-row' })}
                    />
                    <NamingOptionCard
                      title="[Tiền tố]-[Hàng][Cột]"
                      example="T1-1A, T1-1B..."
                      subtitle="Theo tầng/khu"
                      active={generator.naming_pattern === 'prefix-row-col'}
                      onClick={() => setGenerator({ ...generator, naming_pattern: 'prefix-row-col' })}
                    />
                  </div>

                  {(generator.naming_pattern.startsWith('prefix') || generator.naming_pattern === 'seq') && (
                    <div className="bg-blue-50/60 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/60 flex items-center gap-3">
                      <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 whitespace-nowrap">
                        Tiền tố mã ghế (Prefix):
                      </label>
                      <input
                        value={generator.prefix}
                        onChange={(e) => setGenerator({ ...generator, prefix: e.target.value })}
                        placeholder="VD: T1- hoặc VIP-"
                        className={`${inputClass} font-mono uppercase bg-white dark:bg-slate-900`}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT LIVE 2D MATRIX PREVIEW & ACTIONS (5 COLS) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> 3. Live Grid Matrix (Xem trước)
                    </h3>
                    <Badge variant="blue" className="px-2 py-0.5 text-xs font-bold">
                      {calculatedGeneratedLayout.totalSeats} ghế
                    </Badge>
                  </div>

                  {/* Summary Banner */}
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>Dự kiến sinh {calculatedGeneratedLayout.totalSeats} ghế</span>
                      {calculatedGeneratedLayout.totalAisles > 0 && (
                        <span className="text-amber-700 dark:text-amber-400 font-normal">
                          ({calculatedGeneratedLayout.totalAisles} ô lối đi)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-700 dark:text-blue-400">
                      Tầng: <span className="font-semibold">{generator.deck_code}</span> | Khu:{' '}
                      <span className="font-semibold">{generator.zone_code}</span> | Hàng:{' '}
                      <span className="font-semibold">
                        {generator.row_start} đến {generator.row_start + Math.max(1, generator.rows_count) - 1}
                      </span>
                    </div>
                  </div>

                  {/* Live Matrix Rendering */}
                  <div className="max-h-[320px] overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/80 dark:bg-slate-950/60">
                    {calculatedGeneratedLayout.seats.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">Chọn cấu hình để xem trước lưới ghế</div>
                    ) : (
                      <div className="space-y-1.5">
                        {Array.from({ length: Math.min(10, generator.rows_count) }).map((_, rIdx) => {
                          const rowNum = generator.row_start + rIdx;
                          const rowSeats = calculatedGeneratedLayout.seats.filter((s) => s.row === rowNum);

                          return (
                            <div key={rowNum} className="flex items-center gap-1">
                              <span className="w-5 text-[10px] font-bold text-slate-400 text-right">{rowNum}</span>
                              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                                {generator.columns.map((colLetter) => {
                                  const seat = rowSeats.find((s) => s.seat_number.includes(colLetter));
                                  const hasAisle = generator.aisle_after.includes(colLetter);

                                  return (
                                    <React.Fragment key={colLetter}>
                                      <div
                                        className="h-7 min-w-9 px-1 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs truncate"
                                        title={`Ghế: ${seat?.seat_number || ''}`}
                                      >
                                        {seat?.seat_number || colLetter}
                                      </div>
                                      {hasAisle && (
                                        <div className="h-7 w-5 rounded border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-[9px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center">
                                          Lối
                                        </div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {generator.rows_count > 10 && (
                          <div className="text-center text-[10px] italic text-slate-400 pt-1">
                            ...và {generator.rows_count - 10} hàng tiếp theo
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-4">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAppendSeats}
                    className="w-full font-bold text-xs gap-1.5 h-9"
                  >
                    <Plus size={15} /> + Thêm {calculatedGeneratedLayout.totalSeats} ghế vào sơ đồ (Giữ ghế cũ)
                  </Button>

                  <Button
                    type="button"
                    variant="light"
                    onClick={handleOverwriteZoneSeats}
                    className="w-full text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 font-bold text-xs gap-1.5 h-9"
                  >
                    <RefreshCw size={14} /> 🔄 Ghi đè toàn bộ ghế khu vực "{generator.zone_code}"
                  </Button>

                  <button
                    type="button"
                    onClick={handleClearZoneSeats}
                    className="w-full py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Trash2 size={13} /> 🧹 Xóa sạch ghế khu vực "{generator.zone_code}"
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION V: SEATS LIST TABLE */}
      <div className="space-y-3">
        <SectionBanner title={`V. Danh sách ghế đã khai báo (${form.seats.length})`} onAdd={addSeat} addLabel="Thêm 1 ghế" />

        <div className="space-y-3">
          {/* FILTER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={seatSearch}
                  onChange={(e) => {
                    setSeatSearch(e.target.value);
                    setSeatPage(1);
                  }}
                  placeholder="Tìm mã ghế (VD: 1A)..."
                  className={`${inputClass} pl-8`}
                />
              </div>

              <select
                value={filterDeck}
                onChange={(e) => {
                  setFilterDeck(e.target.value);
                  setSeatPage(1);
                }}
                className={`${inputClass} w-36`}
              >
                <option value="">Tất cả tầng</option>
                {form.decks.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name || d.code}
                  </option>
                ))}
              </select>

              <select
                value={filterZone}
                onChange={(e) => {
                  setFilterZone(e.target.value);
                  setSeatPage(1);
                }}
                className={`${inputClass} w-36`}
              >
                <option value="">Tất cả khu vực</option>
                {form.zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.name || z.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Hiển thị {paginatedSeats.length} / {filteredSeats.length} ghế
            </div>
          </div>

          {/* TABLE */}
          <SimpleTable
            headers={['Tầng', 'Khu vực', 'Hạng ghế', 'Số ghế / Mã', 'Hàng', 'Cột', '']}
            rows={paginatedSeats.map((seat) => {
              const globalIndex = form.seats.findIndex((s) => s === seat);
              return [
                <select
                  value={seat.deck_code}
                  onChange={(e) => updateSeat(globalIndex, { deck_code: e.target.value })}
                  className={inputClass}
                >
                  {form.decks.map((deck) => (
                    <option key={deck.code} value={deck.code}>
                      {deck.code}
                    </option>
                  ))}
                </select>,
                <select
                  value={seat.zone_code}
                  onChange={(e) => updateSeat(globalIndex, { zone_code: e.target.value })}
                  className={inputClass}
                >
                  {form.zones
                    .filter((zone) => zone.deck_code === seat.deck_code)
                    .map((zone) => (
                      <option key={zone.code} value={zone.code}>
                        {zone.name || zone.code}
                      </option>
                    ))}
                </select>,
                <select
                  value={seat.seat_class_id}
                  onChange={(e) => updateSeat(globalIndex, { seat_class_id: e.target.value })}
                  className={`${inputClass} font-semibold`}
                >
                  {activeSeatClasses.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.code}
                    </option>
                  ))}
                </select>,
                <input
                  value={seat.seat_number}
                  onChange={(e) => updateSeat(globalIndex, { seat_number: e.target.value })}
                  className={`${inputClass} font-bold text-blue-600 dark:text-blue-400`}
                />,
                <input
                  type="number"
                  value={seat.row}
                  onChange={(e) => updateSeat(globalIndex, { row: Number(e.target.value) })}
                  className={`${inputClass} w-20`}
                />,
                <input
                  type="number"
                  value={seat.column}
                  onChange={(e) => updateSeat(globalIndex, { column: Number(e.target.value) })}
                  className={`${inputClass} w-20`}
                />,
                <IconDelete onClick={() => setForm((prev) => ({ ...prev, seats: prev.seats.filter((_, idx) => idx !== globalIndex) }))} />,
              ];
            })}
          />

          {/* PAGINATION */}
          {totalSeatPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>
                Trang {seatPage} trên {totalSeatPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="light"
                  size="icon"
                  disabled={seatPage === 1}
                  onClick={() => setSeatPage((prev) => Math.max(1, prev - 1))}
                  className="h-8 w-8"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  type="button"
                  variant="light"
                  size="icon"
                  disabled={seatPage === totalSeatPages}
                  onClick={() => setSeatPage((prev) => Math.min(totalSeatPages, prev + 1))}
                  className="h-8 w-8"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION VI: AISLES & UTILITIES */}
      <div className="space-y-3">
        <SectionBanner title="VI. Lối đi & Tiện ích (WC, Cầu thang)" onAdd={addElement} addLabel="Thêm tiện ích" />
        <SimpleTable
          headers={['Tầng', 'Loại tiện ích', 'Hàng', 'Cột', 'Số ô rộng', 'Nhãn hiển thị', '']}
          rows={form.elements.map((element, index) => [
            <select
              value={element.deck_code}
              onChange={(e) => updateElement(index, { deck_code: e.target.value })}
              className={inputClass}
            >
              {form.decks.map((deck) => (
                <option key={deck.code} value={deck.code}>
                  {deck.code}
                </option>
              ))}
            </select>,
            <select
              value={element.type}
              onChange={(e) => updateElement(index, { type: e.target.value as FormElement['type'] })}
              className={inputClass}
            >
              <option value="aisle">Lối đi</option>
              <option value="gap">Khoảng trống</option>
              <option value="block">Tiện ích (WC, Cầu thang)</option>
            </select>,
            <input
              type="number"
              value={element.row}
              onChange={(e) => updateElement(index, { row: Number(e.target.value) })}
              className={`${inputClass} w-20`}
            />,
            <input
              type="number"
              value={element.column}
              onChange={(e) => updateElement(index, { column: Number(e.target.value) })}
              className={`${inputClass} w-20`}
            />,
            <input
              type="number"
              value={element.width || 1}
              onChange={(e) => updateElement(index, { width: Number(e.target.value) })}
              className={`${inputClass} w-20`}
            />,
            <input
              value={element.label || ''}
              onChange={(e) => updateElement(index, { label: e.target.value })}
              placeholder="VD: WC"
              className={inputClass}
            />,
            <IconDelete onClick={() => setForm((prev) => ({ ...prev, elements: prev.elements.filter((_, idx) => idx !== index) }))} />,
          ])}
        />
      </div>

      {/* SECTION VII: VISUAL FULL PREVIEW */}
      <SeatMapPreview
        decks={form.decks}
        zones={form.zones}
        seats={form.seats}
        elements={form.elements}
        seatClassById={seatClassById}
      />

      {/* BOTTOM ACTION BAR */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        {mode === 'create' && (
          <Button
            type="button"
            variant="light"
            onClick={handleClearAllForm}
            className="text-slate-700 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 gap-1.5"
          >
            <RotateCcw size={15} /> Làm sạch dữ liệu
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to={'/seat-maps' as any}>Hủy bỏ</Link>
          </Button>
          <Button type="submit" variant="primary" disabled={submitting} className="font-bold gap-1.5">
            <Save size={16} /> {submitting ? 'Đang lưu...' : mode === 'create' ? 'Lưu sơ đồ ghế' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SectionBanner({ title, children, onAdd, addLabel }: { title: string; children?: React.ReactNode; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center justify-between">
      <span>{title}</span>
      <div className="flex items-center gap-2">
        {children}
        {onAdd && addLabel && (
          <Button type="button" variant="primary" size="xs" onClick={onAdd} className="font-bold gap-1">
            <Plus size={13} /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function PresetCard({ title, desc, active, onClick }: { title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg border text-left transition-all ${
        active
          ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-300 shadow-2xs ring-1 ring-blue-500'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="text-xs font-bold truncate">{title}</div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{desc}</div>
    </button>
  );
}

function NamingOptionCard({ title, example, subtitle, active, onClick }: { title: string; example: string; subtitle: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
        active
          ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-200 ring-1 ring-blue-500'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div>
        <div className="text-xs font-bold">{title}</div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold">{example}</div>
      </div>
      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{subtitle}</span>
    </button>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Chưa có dữ liệu. Bấm nút "+ Thêm" ở góc phải thanh tiêu đề để khai báo.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-max text-xs">
        <thead className="bg-slate-50 dark:bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3.5 py-2.5 text-left font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconDelete({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
      title="Xóa dòng"
    >
      <Trash2 size={15} />
    </button>
  );
}

function findLayoutError(form: SeatMapPayload) {
  const deckCodes = new Set(form.decks.map((deck) => deck.code));
  const zonesByKey = new Set(form.zones.map((zone) => `${zone.deck_code}:${zone.code}`));
  const occupiedByDeck = new Set<string>();

  for (const zone of form.zones) {
    if (!deckCodes.has(zone.deck_code)) return `Khu vực ${zone.code} đang tham chiếu tầng không tồn tại.`;
  }

  for (const seat of form.seats) {
    if (!zonesByKey.has(`${seat.deck_code}:${seat.zone_code}`)) return `Ghế ${seat.seat_number || 'chưa đặt số'} đang tham chiếu khu vực không tồn tại.`;
    const coordinateKey = `${seat.deck_code}:${seat.row}:${seat.column}`;
    if (occupiedByDeck.has(coordinateKey)) return `Trùng vị trí hàng ${seat.row}, cột ${seat.column} trong tầng ${seat.deck_code}. Mỗi ô trên cùng tầng chỉ chứa được một ghế hoặc tiện ích.`;
    occupiedByDeck.add(coordinateKey);
  }

  for (const element of form.elements) {
    if (!deckCodes.has(element.deck_code)) return `Tiện ích ${element.label || element.type} đang tham chiếu tầng không tồn tại.`;
    if (element.type === 'block' && !element.label?.trim()) return 'Tiện ích loại “Tiện ích” cần nhập nhãn, ví dụ WC hoặc Cầu thang.';
    const width = element.type === 'block' ? Number(element.width || 1) : 1;
    for (let column = Number(element.column); column < Number(element.column) + width; column += 1) {
      const coordinateKey = `${element.deck_code}:${element.row}:${column}`;
      if (occupiedByDeck.has(coordinateKey)) return `Tiện ích bị trùng vị trí hàng ${element.row}, cột ${column} trong tầng ${element.deck_code}.`;
      occupiedByDeck.add(coordinateKey);
    }
  }

  return null;
}

function SeatMapPreview({
  decks,
  zones,
  seats,
  elements,
  seatClassById,
}: {
  decks: FormDeck[];
  zones: FormZone[];
  seats: FormSeat[];
  elements: FormElement[];
  seatClassById: Map<string, SeatClass>;
}) {
  const sortedDecks = [...decks].sort((a, b) => a.floor_order - b.floor_order);

  return (
    <div className="space-y-3">
      <SectionBanner title="VII. Xem trước sơ đồ tổng thể (Full Layout Preview)" />
      <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800">
        {sortedDecks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Thêm tầng, khu vực và ghế để xem trước sơ đồ tổng thể.
          </div>
        ) : (
          sortedDecks.map((deck) => (
            <DeckPreview
              key={deck.code}
              deck={deck}
              zones={zones.filter((zone) => zone.deck_code === deck.code)}
              seats={seats.filter((seat) => seat.deck_code === deck.code)}
              elements={elements.filter((element) => element.deck_code === deck.code)}
              seatClassById={seatClassById}
            />
          ))
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" /> Ghế ngồi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800" /> Tiện ích (WC / Thang)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-dashed border-slate-300 bg-slate-50 dark:bg-slate-950 dark:border-slate-700 text-[9px] font-bold text-slate-400 flex items-center justify-center">
              Lối
            </span>{' '}
            Lối đi giữa các dãy
          </span>
        </div>
      </div>
    </div>
  );
}

function DeckPreview({
  deck,
  zones,
  seats,
  elements,
  seatClassById,
}: {
  deck: FormDeck;
  zones: FormZone[];
  seats: FormSeat[];
  elements: FormElement[];
  seatClassById: Map<string, SeatClass>;
}) {
  const maxRow = Math.max(1, ...seats.map((seat) => Number(seat.row || 1)), ...elements.map((element) => Number(element.row || 1)));
  const maxColumn = Math.max(
    1,
    ...seats.map((seat) => Number(seat.column || 1)),
    ...elements.map((element) => Number(element.column || 1) + Number(element.width || 1) - 1)
  );
  const seatByCoordinate = new Map(seats.map((seat) => [`${seat.row}:${seat.column}`, seat]));
  const elementsByCoordinate = new Map<string, FormElement>();

  elements.forEach((element) => {
    const width = element.type === 'block' ? Number(element.width || 1) : 1;
    for (let column = Number(element.column); column < Number(element.column) + width; column += 1) {
      elementsByCoordinate.set(`${element.row}:${column}`, element);
    }
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-xs">{deck.name || deck.code}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {zones.length} khu vực, {seats.length} ghế
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {zones.map((zone) => (
            <Badge key={zone.code} variant="blue" className="text-[11px]">
              {zone.name || zone.code}
            </Badge>
          ))}
        </div>
      </div>
      <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-3">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${maxColumn}, minmax(44px, 1fr))` }}>
          {Array.from({ length: maxRow }).flatMap((_, rowIndex) =>
            Array.from({ length: maxColumn }).map((__, columnIndex) => {
              const row = rowIndex + 1;
              const column = columnIndex + 1;
              const key = `${row}:${column}`;
              const seat = seatByCoordinate.get(key);
              const element = elementsByCoordinate.get(key);
              if (seat) {
                const seatClass = seatClassById.get(String(seat.seat_class_id));
                return (
                  <PreviewCell
                    key={key}
                    label={seat.seat_number || `${row}-${column}`}
                    title={seatClass ? `${seatClass.code} - ${seatClass.name}` : 'Chưa chọn hạng ghế'}
                    color={seatClass?.color}
                  />
                );
              }
              if (element) {
                const label = element.type === 'block' ? element.label || 'Tiện ích' : element.type === 'aisle' ? 'Lối' : 'Trống';
                return <PreviewCell key={key} label={label} variant={element.type === 'block' ? 'block' : 'gap'} />;
              }
              return <div key={key} className="h-9 rounded-md border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50" />;
            })
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewCell({ label, title, color, variant = 'seat' }: { label: string; title?: string; color?: string; variant?: 'seat' | 'block' | 'gap' }) {
  const style = variant === 'seat' && color ? { borderColor: color, color } : undefined;
  const className =
    variant === 'block'
      ? 'h-9 rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 px-2 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center truncate'
      : variant === 'gap'
      ? 'h-9 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 text-[10px] font-bold text-slate-400 flex items-center justify-center truncate'
      : 'h-9 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 px-2 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center truncate shadow-2xs';

  return (
    <div className={className} style={style} title={title || label}>
      {label}
    </div>
  );
}

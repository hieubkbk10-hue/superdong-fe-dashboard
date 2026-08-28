import React, { useMemo, useState, useEffect } from 'react';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Boat, SeatClass, SeatMap } from '@/types';
import { Button } from '@/components/common/Button';
import { AdminFormActionBar, UnsavedChangesBar } from '@/components/common/FormUtilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

export type FormDeck = { code: string; name: string; floor_order: number };
export type FormZone = { deck_code: string; code: string; name: string; zone_order: number };
export type FormSeat = { deck_code: string; zone_code: string; seat_class_id: string | number; seat_number: string; row: number; column: number };
export type FormElement = { deck_code: string; zone_code?: string; type: 'aisle' | 'gap' | 'block'; row: number; column: number; width?: number; height?: number; label?: string };

type NamingPattern = 'row-col' | 'col-row2' | 'col-row' | 'prefix-row-col' | 'prefix-col-row2' | 'seq';
type LayoutPreset = '3-3' | '2-2' | '2-3-2' | '2-4-2' | 'vip-2-1' | 'custom';

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

const PRESET_DEFINITIONS: Record<LayoutPreset, { label: string; desc: string; columns: string[]; aisle_after: string[] }> = {
  '3-3': {
    label: '3 - 3 (Tiêu chuẩn)',
    desc: '2 dãy 3 ghế: A B C [Lối] D E F',
    columns: ['A', 'B', 'C', 'D', 'E', 'F'],
    aisle_after: ['C'],
  },
  '2-2': {
    label: '2 - 2 (Khoang nhỏ)',
    desc: '2 dãy 2 ghế: A B [Lối] C D',
    columns: ['A', 'B', 'C', 'D'],
    aisle_after: ['B'],
  },
  '2-3-2': {
    label: '2 - 3 - 2 (Tàu lớn)',
    desc: '3 dãy: A B [Lối] C D E [Lối] F G',
    columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    aisle_after: ['B', 'E'],
  },
  '2-4-2': {
    label: '2 - 4 - 2 (Tàu rộng)',
    desc: '3 dãy rộng: A B [Lối] C D E F [Lối] G H',
    columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    aisle_after: ['B', 'F'],
  },
  'vip-2-1': {
    label: '2 - 1 (Khoang VIP)',
    desc: 'Dãy VIP: A B [Lối] C',
    columns: ['A', 'B', 'C'],
    aisle_after: ['B'],
  },
  custom: {
    label: 'Tùy chỉnh',
    desc: 'Tự chọn cột và vị trí lối đi',
    columns: ['A', 'B', 'C', 'D'],
    aisle_after: ['B'],
  },
};

const inputClass =
  'h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all w-full font-sans';

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
      const w = Math.max(1, Number(element.width || 1));
      const h = Math.max(1, Number(element.height || 1));
      const startCol = Number(element.column || 1);
      const startRow = Number(element.row || 1);

      for (let r = 0; r < h; r += 1) {
        for (let c = 0; c < w; c += 1) {
          elements.push({
            deck_code: deckCode,
            type: element.type || 'block',
            row: startRow + r,
            column: startCol + c,
            width: 1,
            height: 1,
            label: element.label || '',
          });
        }
      }
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
  decks: [
    { code: 'deck-1', name: 'Khoang dưới', floor_order: 1 },
  ],
  zones: [
    { deck_code: 'deck-1', code: 'eco', name: 'Khoang hành khách', zone_order: 1 },
  ],
  seats: [],
  elements: [],
  reason: '',
};

export function SeatMapForm({ mode, boats, seatClasses, initial, submitting, onSubmit }: SeatMapFormProps) {
  const [form, setForm] = useState<SeatMapPayload>(() => initial || defaultPayload);
  const [activeDeckCode, setActiveDeckCode] = useState<string>('');
  const [showQuickBuilder, setShowQuickBuilder] = useState<boolean>(() => mode === 'create' || (initial?.seats.length ?? 0) === 0);

  // Dialog Editing States
  const [editingSeat, setEditingSeat] = useState<{ seat: FormSeat; originalIndex: number } | null>(null);
  const [editingElement, setEditingElement] = useState<{ element: FormElement; originalIndex: number } | null>(null);
  const [addingCell, setAddingCell] = useState<{ deck_code: string; row: number; column: number } | null>(null);

  // Active seat classes
  const activeSeatClasses = useMemo(() => seatClasses.filter((sc) => sc.status === 'active'), [seatClasses]);
  const defaultSeatClassId = activeSeatClasses[0]?.id || '';

  const seatClassById = useMemo(() => {
    const map = new Map<string, SeatClass>();
    seatClasses.forEach((sc) => map.set(String(sc.id), sc));
    return map;
  }, [seatClasses]);

  // Sync active deck code
  useEffect(() => {
    if (form.decks.length > 0) {
      const exists = form.decks.some((d) => d.code === activeDeckCode);
      if (!exists || !activeDeckCode) {
        setActiveDeckCode(form.decks[0].code);
      }
    } else {
      setActiveDeckCode('');
    }
  }, [form.decks, activeDeckCode]);

  // Quick Builder Generator State
  const [generator, setGenerator] = useState<GeneratorState>({
    deck_code: '',
    zone_code: '',
    seat_class_id: defaultSeatClassId,
    preset: '3-3',
    row_start: 1,
    rows_count: 10,
    columns: PRESET_DEFINITIONS['3-3'].columns,
    aisle_after: PRESET_DEFINITIONS['3-3'].aisle_after,
    naming_pattern: 'row-col',
    prefix: '',
  });

  // Auto-sync generator deck & zone
  useEffect(() => {
    if (form.decks.length > 0) {
      const targetDeck = form.decks.find((d) => d.code === activeDeckCode) || form.decks[0];
      const targetZone = form.zones.find((z) => z.deck_code === targetDeck.code) || form.zones[0];
      setGenerator((prev) => ({
        ...prev,
        deck_code: targetDeck.code,
        zone_code: targetZone?.code || '',
        seat_class_id: prev.seat_class_id || defaultSeatClassId,
      }));
    }
  }, [form.decks, form.zones, activeDeckCode, defaultSeatClassId]);

  // Select Preset Handler
  const handleSelectPreset = (preset: LayoutPreset) => {
    const def = PRESET_DEFINITIONS[preset];
    setGenerator((prev) => ({
      ...prev,
      preset,
      columns: def.columns,
      aisle_after: def.aisle_after,
    }));
  };

  // Toggle Aisle After a Column
  const toggleAisle = (colLetter: string) => {
    setGenerator((prev) => {
      const exists = prev.aisle_after.includes(colLetter);
      const nextAisles = exists
        ? prev.aisle_after.filter((c) => c !== colLetter)
        : [...prev.aisle_after, colLetter];
      return { ...prev, aisle_after: nextAisles, preset: 'custom' };
    });
  };

  // Format seat name
  const formatSeatNumber = (rowNum: number, colLetter: string, pattern: NamingPattern, prefix: string, seqNum: number) => {
    const p = prefix.trim();
    switch (pattern) {
      case 'row-col':
        return `${rowNum}${colLetter}`;
      case 'col-row2':
        return `${colLetter}${String(rowNum).padStart(2, '0')}`;
      case 'col-row':
        return `${colLetter}${rowNum}`;
      case 'prefix-row-col':
        return p ? `${p}${rowNum}${colLetter}` : `${rowNum}${colLetter}`;
      case 'prefix-col-row2':
        return p ? `${p}${colLetter}${String(rowNum).padStart(2, '0')}` : `${colLetter}${String(rowNum).padStart(2, '0')}`;
      case 'seq':
        return p ? `${p}${seqNum}` : `${seqNum}`;
      default:
        return `${rowNum}${colLetter}`;
    }
  };

  // Calculate generated layout seats and aisles
  const calculatedGeneratedLayout = useMemo(() => {
    if (!generator.deck_code || !generator.zone_code || generator.columns.length === 0) {
      return { seats: [] as FormSeat[], elements: [] as FormElement[], totalSeats: 0, totalAisles: 0 };
    }

    const generatedSeats: FormSeat[] = [];
    const generatedElements: FormElement[] = [];
    const startRow = Math.max(1, generator.row_start);
    const count = Math.max(1, generator.rows_count);

    let globalSeq = 1;

    for (let r = 0; r < count; r += 1) {
      const currentRow = startRow + r;
      let currentGridCol = 1;

      for (let c = 0; c < generator.columns.length; c += 1) {
        const colLetter = generator.columns[c];
        const seatName = formatSeatNumber(
          currentRow,
          colLetter,
          generator.naming_pattern,
          generator.prefix,
          globalSeq
        );
        globalSeq += 1;

        generatedSeats.push({
          deck_code: generator.deck_code,
          zone_code: generator.zone_code,
          seat_class_id: generator.seat_class_id || defaultSeatClassId,
          seat_number: seatName,
          row: currentRow,
          column: currentGridCol,
        });

        currentGridCol += 1;

        if (generator.aisle_after.includes(colLetter)) {
          generatedElements.push({
            deck_code: generator.deck_code,
            zone_code: generator.zone_code,
            type: 'aisle',
            row: currentRow,
            column: currentGridCol,
            width: 1,
            height: 1,
            label: 'Lối đi',
          });
          currentGridCol += 1;
        }
      }
    }

    return {
      seats: generatedSeats,
      elements: generatedElements,
      totalSeats: generatedSeats.length,
      totalAisles: generatedElements.length,
    };
  }, [generator, defaultSeatClassId]);

  // Append generated seats to form
  const handleAppendSeats = () => {
    if (calculatedGeneratedLayout.seats.length === 0) {
      toast.error('Không có ghế nào được sinh ra');
      return;
    }

    const existingCoords = new Set(
      form.seats.filter((s) => s.deck_code === generator.deck_code).map((s) => `${s.row}:${s.column}`)
    );

    const colliding = calculatedGeneratedLayout.seats.filter((s) => existingCoords.has(`${s.row}:${s.column}`));
    if (colliding.length > 0) {
      toast.error(`Có ${colliding.length} vị trí toạ độ bị trùng với ghế cũ trên tầng. Hãy chọn hàng bắt đầu khác hoặc chọn "Ghi đè".`);
      return;
    }

    setForm((prev) => ({
      ...prev,
      seats: [...prev.seats, ...calculatedGeneratedLayout.seats],
      elements: [...prev.elements, ...calculatedGeneratedLayout.elements],
    }));

    toast.success(`Đã thêm ${calculatedGeneratedLayout.totalSeats} ghế vào sơ đồ`);
  };

  // Overwrite seats for zone
  const handleOverwriteZoneSeats = () => {
    if (!generator.zone_code) {
      toast.error('Vui lòng chọn khu vực cần ghi đè');
      return;
    }

    setForm((prev) => {
      const filteredSeats = prev.seats.filter((s) => s.zone_code !== generator.zone_code);
      const filteredElements = prev.elements.filter((e) => e.zone_code !== generator.zone_code);

      return {
        ...prev,
        seats: [...filteredSeats, ...calculatedGeneratedLayout.seats],
        elements: [...filteredElements, ...calculatedGeneratedLayout.elements],
      };
    });

    toast.success(`Đã ghi đè toàn bộ ghế thuộc khu vực "${generator.zone_code}"`);
  };

  // Clear zone seats
  const handleClearZoneSeats = () => {
    if (!generator.zone_code) return;
    const count = form.seats.filter((s) => s.zone_code === generator.zone_code).length;

    setForm((prev) => ({
      ...prev,
      seats: prev.seats.filter((s) => s.zone_code !== generator.zone_code),
      elements: prev.elements.filter((e) => e.zone_code !== generator.zone_code),
    }));

    toast.success(`Đã xóa ${count} ghế thuộc khu vực "${generator.zone_code}"`);
  };

  // Check dirty state
  const isDirty = useMemo(() => {
    if (mode === 'create') return true;
    if (!initial) return false;
    return (
      initial.name !== form.name ||
      initial.status !== form.status ||
      JSON.stringify(initial.decks) !== JSON.stringify(form.decks) ||
      JSON.stringify(initial.zones) !== JSON.stringify(form.zones) ||
      JSON.stringify(initial.seats) !== JSON.stringify(form.seats) ||
      JSON.stringify(initial.elements) !== JSON.stringify(form.elements)
    );
  }, [mode, initial, form]);

  // Validation and submit
  const validateAndSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'edit' && !isDirty) {
      toast.info('Dữ liệu hiện tại chưa có thay đổi nào cần lưu');
      return;
    }
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

    const autoReason = mode === 'create'
      ? `Tạo mới sơ đồ ghế ${form.name.trim()} từ dashboard vận hành`
      : `Cập nhật sơ đồ ghế ${form.name.trim()} (${form.seats.length} ghế) từ dashboard vận hành`;

    await onSubmit({ ...form, name: form.name.trim(), reason: autoReason });
  };

  const handleReset = () => {
    if (initial) {
      setForm(initial);
      toast.info('Đã khôi phục sơ đồ ghế ban đầu');
    }
  };

  const handleClearAllForm = () => {
    setForm(defaultPayload);
    toast.info('Đã làm sạch dữ liệu sơ đồ ghế');
  };

  // Deck Management Helpers
  const addDeck = () => {
    const nextOrder = form.decks.length + 1;
    const newDeck: FormDeck = {
      code: `deck-${nextOrder}`,
      name: `Khoang tầng ${nextOrder}`,
      floor_order: nextOrder,
    };
    const defaultZone: FormZone = {
      deck_code: newDeck.code,
      code: `zone-${nextOrder}-eco`,
      name: 'Khoang hành khách',
      zone_order: 1,
    };

    setForm((prev) => ({
      ...prev,
      decks: [...prev.decks, newDeck],
      zones: [...prev.zones, defaultZone],
    }));
    setActiveDeckCode(newDeck.code);
    toast.success(`Đã thêm ${newDeck.name}`);
  };

  const deleteDeck = (deckCode: string) => {
    if (form.decks.length <= 1) {
      toast.error('Sơ đồ cần ít nhất 1 tầng');
      return;
    }
    setForm((prev) => ({
      ...prev,
      decks: prev.decks.filter((d) => d.code !== deckCode),
      zones: prev.zones.filter((z) => z.deck_code !== deckCode),
      seats: prev.seats.filter((s) => s.deck_code !== deckCode),
      elements: prev.elements.filter((e) => e.deck_code !== deckCode),
    }));
    toast.info('Đã xóa tầng và các ghế thuộc tầng này');
  };

  // Zone Management Helpers
  const addZone = (deckCode: string) => {
    const count = form.zones.filter((z) => z.deck_code === deckCode).length + 1;
    const newZone: FormZone = {
      deck_code: deckCode,
      code: `zone-${slugCode(activeDeckCode, 'd')}-${count}`,
      name: `Khu vực ${count}`,
      zone_order: count,
    };
    setForm((prev) => ({
      ...prev,
      zones: [...prev.zones, newZone],
    }));
    toast.success(`Đã thêm ${newZone.name}`);
  };

  const deleteZone = (zoneCode: string) => {
    if (form.zones.length <= 1) {
      toast.error('Sơ đồ cần ít nhất 1 khu vực');
      return;
    }
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.code !== zoneCode),
      seats: prev.seats.filter((s) => s.zone_code !== zoneCode),
      elements: prev.elements.filter((e) => e.zone_code !== zoneCode),
    }));
    toast.info('Đã xóa khu vực');
  };

  // Single Cell Direct Actions
  const handleSaveSeatEdit = (updatedSeat: FormSeat) => {
    if (!editingSeat) return;
    setForm((prev) => {
      const nextSeats = [...prev.seats];
      nextSeats[editingSeat.originalIndex] = updatedSeat;
      return { ...prev, seats: nextSeats };
    });
    setEditingSeat(null);
    toast.success(`Đã cập nhật ghế ${updatedSeat.seat_number}`);
  };

  const handleDeleteSeat = (originalIndex: number) => {
    setForm((prev) => ({
      ...prev,
      seats: prev.seats.filter((_, idx) => idx !== originalIndex),
    }));
    setEditingSeat(null);
    toast.info('Đã xóa ghế');
  };

  const handleSaveElementEdit = (updatedElement: FormElement) => {
    if (!editingElement) return;
    setForm((prev) => {
      const nextElements = [...prev.elements];
      nextElements[editingElement.originalIndex] = updatedElement;
      return { ...prev, elements: nextElements };
    });
    setEditingElement(null);
    toast.success('Đã cập nhật tiện ích');
  };

  const handleDeleteElement = (originalIndex: number) => {
    setForm((prev) => ({
      ...prev,
      elements: prev.elements.filter((_, idx) => idx !== originalIndex),
    }));
    setEditingElement(null);
    toast.info('Đã xóa tiện ích');
  };

  // Active Deck Data
  const currentDeck = form.decks.find((d) => d.code === activeDeckCode) || form.decks[0];
  const deckSeats = useMemo(() => form.seats.filter((s) => s.deck_code === activeDeckCode), [form.seats, activeDeckCode]);
  const deckElements = useMemo(() => form.elements.filter((e) => e.deck_code === activeDeckCode), [form.elements, activeDeckCode]);
  const deckZones = useMemo(() => form.zones.filter((z) => z.deck_code === activeDeckCode), [form.zones, activeDeckCode]);

  return (
    <form onSubmit={validateAndSubmit} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6 font-sans">
      {/* SECTION I: GENERAL INFO */}
      <div className="space-y-3">
        <SectionBanner title="I. Thông tin sơ đồ" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mode === 'create' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tàu cao tốc áp dụng <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.boat_id || ''}
                onChange={(e) => setForm({ ...form, boat_id: e.target.value })}
                className={inputClass}
                required
              >
                <option value="">Chọn tàu cao tốc...</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.code} - {boat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tên sơ đồ ghế <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Sơ đồ Superdong IX (Chuẩn 252 ghế 2026)"
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1.5">
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
        </div>
      </div>

      {/* SECTION II: DECKS & ZONES COMPACT STUDIO */}
      <div className="space-y-3">
        <SectionBanner title="II. Cấu trúc Khoang / Tầng & Khu vực">
          <Button type="button" variant="light" size="xs" onClick={addDeck} className="h-7 text-xs font-bold bg-white dark:bg-slate-800">
            Thêm tầng tàu
          </Button>
        </SectionBanner>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Decks List Column */}
          <div className="md:col-span-5 space-y-2 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Danh sách tầng ({form.decks.length})
            </div>

            <div className="space-y-2">
              {form.decks.map((deck, dIdx) => {
                const isActive = deck.code === activeDeckCode;
                const deckSeatCount = form.seats.filter((s) => s.deck_code === deck.code).length;

                return (
                  <div
                    key={deck.code}
                    onClick={() => setActiveDeckCode(deck.code)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-xs ring-1 ring-blue-500/30 text-blue-900 dark:text-blue-200'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`h-6 w-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                        {deck.floor_order || dIdx + 1}
                      </div>
                      <input
                        value={deck.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            decks: prev.decks.map((d, i) => (i === dIdx ? { ...d, name: val } : d)),
                          }));
                        }}
                        placeholder="Tên tầng..."
                        className="h-7 px-2 text-xs font-bold rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent flex-1 font-sans"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {deckSeatCount} ghế
                      </span>
                      {form.decks.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDeck(deck.code);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                          title="Xóa tầng"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zones List Column for Selected Deck */}
          <div className="md:col-span-7 space-y-2 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Khu vực ghế thuộc {currentDeck?.name || 'Tầng đang chọn'} ({deckZones.length})</span>
              <button
                type="button"
                onClick={() => addZone(activeDeckCode)}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                + Thêm khu vực
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deckZones.map((zone) => {
                const zoneSeatCount = form.seats.filter((s) => s.zone_code === zone.code).length;

                return (
                  <div
                    key={zone.code}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={zone.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            zones: prev.zones.map((z) => (z.code === zone.code ? { ...z, name: val } : z)),
                          }));
                        }}
                        placeholder="Tên khu vực..."
                        className="h-6 px-1 text-xs font-bold rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent flex-1 font-sans"
                      />
                      {deckZones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteZone(zone.code)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                          title="Xóa khu vực"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">{zone.code}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{zoneSeatCount} ghế</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION III: STREAMLINED VISUAL QUICK BUILDER */}
      <div className="space-y-3 font-sans">
        <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-4 py-2.5 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center justify-between">
          <span>III. Công cụ tạo nhanh ghế hàng loạt (Quick Generator)</span>
          <button
            type="button"
            onClick={() => setShowQuickBuilder(!showQuickBuilder)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showQuickBuilder ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showQuickBuilder ? 'Thu gọn' : 'Mở công cụ sinh nhanh'}</span>
          </button>
        </div>

        {showQuickBuilder && (
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            {/* Step 1: Cabin Layout Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Chọn kiểu ma trận thân tàu (Preset)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {(Object.keys(PRESET_DEFINITIONS) as LayoutPreset[]).map((presetKey) => {
                  const def = PRESET_DEFINITIONS[presetKey];
                  const isSelected = generator.preset === presetKey;

                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => handleSelectPreset(presetKey)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{def.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {def.columns.length} ghế/hàng
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Preset Layout Summary */}
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>
                  Sơ đồ hiện tại: <strong className="text-slate-800 dark:text-slate-200">{PRESET_DEFINITIONS[generator.preset]?.desc || 'Tùy chỉnh'}</strong>
                </span>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {generator.columns.length} cột ghế
                </span>
              </div>
            </div>

            {/* Step 2: Target & Naming Settings */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Thiết lập thông số và số lượng hàng ghế
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tầng áp dụng</label>
                  <select
                    value={generator.deck_code}
                    onChange={(e) => {
                      const dCode = e.target.value;
                      const z = form.zones.find((zn) => zn.deck_code === dCode);
                      setGenerator({ ...generator, deck_code: dCode, zone_code: z?.code || '' });
                      setActiveDeckCode(dCode);
                    }}
                    className={inputClass}
                  >
                    {form.decks.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name || d.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Khu vực</label>
                  <select
                    value={generator.zone_code}
                    onChange={(e) => setGenerator({ ...generator, zone_code: e.target.value })}
                    className={inputClass}
                  >
                    {deckZones.map((z) => (
                      <option key={z.code} value={z.code}>
                        {z.name || z.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Hạng vé</label>
                  <select
                    value={generator.seat_class_id}
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kiểu đánh số ghế</label>
                  <select
                    value={generator.naming_pattern}
                    onChange={(e) => setGenerator({ ...generator, naming_pattern: e.target.value as NamingPattern })}
                    className={inputClass}
                  >
                    <option value="row-col">1A, 1B (Hàng - Cột)</option>
                    <option value="col-row2">A01, A02 (Cột - 2 Số)</option>
                    <option value="col-row">A1, A2 (Cột - 1 Số)</option>
                    <option value="prefix-row-col">VIP-1A (Có Tiền tố)</option>
                    <option value="seq">1, 2, 3... (Tăng dần)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Từ hàng</label>
                  <input
                    type="number"
                    min={1}
                    value={generator.row_start}
                    onChange={(e) => setGenerator({ ...generator, row_start: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Số lượng hàng ghế</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={generator.rows_count}
                    onChange={(e) => setGenerator({ ...generator, rows_count: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>

                {generator.naming_pattern.startsWith('prefix') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tiền tố (Prefix)</label>
                    <input
                      value={generator.prefix}
                      onChange={(e) => setGenerator({ ...generator, prefix: e.target.value })}
                      placeholder="VD: VIP- hoặc T1-"
                      className={`${inputClass} font-mono uppercase`}
                    />
                  </div>
                )}

                {/* Column Aisle Toggles */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>Vị trí lối đi (Bấm vào cột để bật/tắt lối đi sau cột)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {generator.columns.map((c) => {
                      const hasAisle = generator.aisle_after.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleAisle(c)}
                          className={`h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            hasAisle
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {c} {hasAisle ? '(Lối)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Generator Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dự kiến tạo: <span className="text-blue-600 dark:text-blue-400 font-bold">{calculatedGeneratedLayout.totalSeats} ghế</span>{' '}
                (Từ hàng {generator.row_start} đến hàng {generator.row_start + generator.rows_count - 1}, {generator.columns.length} cột ghế)
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAppendSeats}
                  className="font-bold h-9 text-xs px-4"
                >
                  Sinh {calculatedGeneratedLayout.totalSeats} ghế vào sơ đồ
                </Button>

                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  onClick={handleOverwriteZoneSeats}
                  className="text-amber-800 dark:text-amber-300 border-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 font-bold h-9 text-xs px-3.5"
                >
                  Ghi đè khu vực "{generator.zone_code}"
                </Button>

                <button
                  type="button"
                  onClick={handleClearZoneSeats}
                  className="px-3 py-1.5 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-all cursor-pointer"
                >
                  Xóa ghế khu vực
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION IV: INTERACTIVE CABIN MAP HERO WORKSPACE */}
      <div className="space-y-3">
        <SectionBanner title="IV. Bản đồ sơ đồ trực quan (Interactive Cabin Editor)">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
            Tổng: {form.seats.length} ghế
          </span>
        </SectionBanner>

        <InteractiveCabinCanvas
          deck={currentDeck}
          allDecks={form.decks}
          activeDeckCode={activeDeckCode}
          onSelectDeck={setActiveDeckCode}
          zones={deckZones}
          seats={deckSeats}
          elements={deckElements}
          seatClasses={activeSeatClasses}
          seatClassById={seatClassById}
          onSeatClick={(seat, originalIndex) => setEditingSeat({ seat, originalIndex })}
          onElementClick={(element, originalIndex) => setEditingElement({ element, originalIndex })}
          onEmptyCellClick={(row, column) => setAddingCell({ deck_code: activeDeckCode, row, column })}
          allSeats={form.seats}
        />
      </div>

      {/* MODAL 1: SEAT INSPECTOR / EDIT */}
      {editingSeat && (
        <SeatEditDialog
          seat={editingSeat.seat}
          zones={deckZones}
          seatClasses={activeSeatClasses}
          onSave={handleSaveSeatEdit}
          onDelete={() => handleDeleteSeat(editingSeat.originalIndex)}
          onClose={() => setEditingSeat(null)}
        />
      )}

      {/* MODAL 2: ELEMENT INSPECTOR / EDIT */}
      {editingElement && (
        <ElementEditDialog
          element={editingElement.element}
          onSave={handleSaveElementEdit}
          onDelete={() => handleDeleteElement(editingElement.originalIndex)}
          onClose={() => setEditingElement(null)}
        />
      )}

      {/* MODAL 3: ADD CELL DYNAMIC ACTION */}
      {addingCell && (
        <AddCellDialog
          cell={addingCell}
          zones={deckZones}
          seatClasses={activeSeatClasses}
          defaultSeatClassId={defaultSeatClassId}
          onAddSeat={(newSeat) => {
            setForm((prev) => ({ ...prev, seats: [...prev.seats, newSeat] }));
            setAddingCell(null);
            toast.success(`Đã thêm ghế ${newSeat.seat_number}`);
          }}
          onAddElement={(newElem) => {
            setForm((prev) => ({ ...prev, elements: [...prev.elements, newElem] }));
            setAddingCell(null);
            toast.success(`Đã thêm tiện ích "${newElem.label || newElem.type}"`);
          }}
          onClose={() => setAddingCell(null)}
        />
      )}

      {/* ACTION BAR */}
      {mode === 'create' ? (
        <AdminFormActionBar
          mode="create"
          isSubmitting={submitting}
          cancelTo="/seat-maps"
          submitLabel="Lưu sơ đồ ghế"
          onClear={handleClearAllForm}
          clearLabel="Làm sạch dữ liệu"
        />
      ) : (
        <UnsavedChangesBar
          isDirty={isDirty}
          isSaving={submitting}
          onSave={() => validateAndSubmit({ preventDefault: () => {} } as any)}
          onReset={handleReset}
        />
      )}
    </form>
  );
}

function SectionBanner({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2.5 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800 flex items-center justify-between font-sans">
      <span>{title}</span>
      {children}
    </div>
  );
}

/* ==========================================================================
   HERO WORKSPACE: InteractiveCabinCanvas
   ========================================================================== */
function InteractiveCabinCanvas({
  deck,
  allDecks,
  activeDeckCode,
  onSelectDeck,
  zones,
  seats,
  elements,
  seatClasses,
  seatClassById,
  onSeatClick,
  onElementClick,
  onEmptyCellClick,
  allSeats,
}: {
  deck?: FormDeck;
  allDecks: FormDeck[];
  activeDeckCode: string;
  onSelectDeck: (code: string) => void;
  zones: FormZone[];
  seats: FormSeat[];
  elements: FormElement[];
  seatClasses: SeatClass[];
  seatClassById: Map<string, SeatClass>;
  onSeatClick: (seat: FormSeat, originalIndex: number) => void;
  onElementClick: (element: FormElement, originalIndex: number) => void;
  onEmptyCellClick: (row: number, column: number) => void;
  allSeats: FormSeat[];
}) {
  if (!deck) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 font-sans">
        Vui lòng tạo ít nhất 1 Tầng ở Mục II để mở bản đồ trực quan.
      </div>
    );
  }

  // Calculate grid bounds
  const maxRow = Math.max(10, ...seats.map((s) => Number(s.row || 1)), ...elements.map((e) => Number(e.row || 1)));
  const maxColumn = Math.max(
    6,
    ...seats.map((s) => Number(s.column || 1)),
    ...elements.map((e) => Number(e.column || 1) + Number(e.width || 1) - 1)
  );

  const seatByCoordinate = new Map(seats.map((s) => [`${s.row}:${s.column}`, s]));
  const elementsByCoordinate = new Map<string, FormElement>();

  elements.forEach((element) => {
    const width = element.type === 'block' ? Number(element.width || 1) : 1;
    for (let column = Number(element.column); column < Number(element.column) + width; column += 1) {
      elementsByCoordinate.set(`${element.row}:${column}`, element);
    }
  });

  return (
    <div className="space-y-4 bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 font-sans">
      {/* Top Deck Tabs & Live Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
        {/* Deck Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {allDecks.map((d) => {
            const isSelected = d.code === activeDeckCode;
            const dSeatCount = allSeats.filter((s) => s.deck_code === d.code).length;

            return (
              <button
                key={d.code}
                type="button"
                onClick={() => onSelectDeck(d.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer font-sans ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{d.name || d.code}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                  {dSeatCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Legend Chips */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs">
          {seatClasses.map((sc) => (
            <div key={sc.id} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm border"
                style={{ backgroundColor: sc.color ? `${sc.color}25` : '#3b82f625', borderColor: sc.color || '#3b82f6' }}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                {sc.name || sc.code}
              </span>
            </div>
          ))}

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-amber-300 bg-amber-100 dark:bg-amber-950/60" />
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Tiện ích (WC, TV, Quầy bar...)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-dashed border-slate-300 bg-slate-100 dark:bg-slate-800" />
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Lối đi</span>
          </div>
        </div>
      </div>

      {/* Clean Grid Canvas Box */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 overflow-hidden">
        {/* Matrix Canvas Container */}
        <div className="overflow-auto pb-2 px-1">
          {/* Top Column Labels */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 shrink-0" />
            <div className="grid gap-1.5 flex-1" style={{ gridTemplateColumns: `repeat(${maxColumn}, minmax(44px, 1fr))` }}>
              {Array.from({ length: maxColumn }).map((_, cIdx) => (
                <div key={cIdx} className="text-center text-[11px] font-bold text-slate-400 uppercase font-mono">
                  {ALL_COLUMNS[cIdx] || `C${cIdx + 1}`}
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows */}
          <div className="space-y-1.5">
            {Array.from({ length: maxRow }).map((_, rIdx) => {
              const rowNum = rIdx + 1;
              const rowCells: React.ReactNode[] = [];

              let colIdx = 1;
              while (colIdx <= maxColumn) {
                const colNum = colIdx;
                const coordKey = `${rowNum}:${colNum}`;
                const seat = seatByCoordinate.get(coordKey);
                const element = elementsByCoordinate.get(coordKey);

                if (seat) {
                  const seatClass = seatClassById.get(String(seat.seat_class_id));
                  const seatIndex = allSeats.findIndex((s) => s === seat);

                  rowCells.push(
                    <div
                      key={coordKey}
                      onClick={() => onSeatClick(seat, seatIndex)}
                      className="h-10 rounded-lg border-2 font-bold text-xs flex flex-col items-center justify-center cursor-pointer transition-all shadow-2xs hover:scale-105 hover:shadow-md select-none group font-sans"
                      style={{
                        gridColumn: 'span 1',
                        borderColor: seatClass?.color || '#3b82f6',
                        backgroundColor: seatClass?.color ? `${seatClass.color}15` : '#3b82f615',
                        color: seatClass?.color || '#1d4ed8',
                      }}
                      title={`Ghế: ${seat.seat_number} (${seatClass?.name || 'Hạng ghế'})\nClick để chỉnh sửa hoặc xóa`}
                    >
                      <span className="leading-none">{seat.seat_number}</span>
                      <span className="text-[9px] font-normal opacity-80 leading-tight">
                        {seatClass?.code || 'Eco'}
                      </span>
                    </div>
                  );
                  colIdx += 1;
                } else if (element) {
                  const isBlock = element.type === 'block';
                  const isAisle = element.type === 'aisle';

                  if (isBlock) {
                    // Group consecutive block cells on this row with the exact same label
                    const groupElements: { element: FormElement; index: number; col: number }[] = [
                      { element, index: elements.findIndex((e) => e === element), col: colNum },
                    ];

                    let nextCol = colNum + 1;
                    while (nextCol <= maxColumn) {
                      const nextElem = elementsByCoordinate.get(`${rowNum}:${nextCol}`);
                      const nextSeat = seatByCoordinate.get(`${rowNum}:${nextCol}`);
                      if (
                        nextElem &&
                        nextElem.type === 'block' &&
                        (nextElem.label || '').trim().toLowerCase() === (element.label || '').trim().toLowerCase() &&
                        !nextSeat
                      ) {
                        groupElements.push({
                          element: nextElem,
                          index: elements.findIndex((e) => e === nextElem),
                          col: nextCol,
                        });
                        nextCol += 1;
                      } else {
                        break;
                      }
                    }

                    const span = groupElements.length;

                    rowCells.push(
                      <div
                        key={coordKey}
                        className="relative h-10 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs shadow-2xs font-sans select-none overflow-hidden group"
                        style={{ gridColumn: `span ${span}` }}
                      >
                        {/* 1 Single Centered Label across the whole merged block */}
                        <span className="pointer-events-none z-0 truncate tracking-wide font-bold px-2">
                          {element.label || 'Tiện ích'}
                        </span>

                        {/* Underlying independent click zones for each cell */}
                        <div
                          className="absolute inset-0 z-10 grid"
                          style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))` }}
                        >
                          {groupElements.map((item) => {
                            const colLetter = ALL_COLUMNS[item.col - 1] || `C${item.col}`;
                            return (
                              <div
                                key={item.col}
                                onClick={() => onElementClick(item.element, item.index)}
                                className="h-full hover:bg-amber-300/30 dark:hover:bg-amber-600/30 transition-all cursor-pointer"
                                title={`${item.element.label || 'Tiện ích'} (Hàng ${rowNum}, Cột ${colLetter})\nClick để chỉnh sửa hoặc xóa ô này`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );

                    colIdx += span;
                  } else {
                    // Aisle / Gap
                    const elemIndex = elements.findIndex((e) => e === element);
                    rowCells.push(
                      <div
                        key={coordKey}
                        onClick={() => onElementClick(element, elemIndex)}
                        className={`h-10 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all truncate px-1 select-none font-sans ${
                          isAisle
                            ? 'border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 text-[10px]'
                            : 'border border-dashed border-slate-200 dark:border-slate-800 text-slate-300'
                        }`}
                        style={{ gridColumn: 'span 1' }}
                        title={`${element.label || element.type}\nClick để sửa hoặc xóa`}
                      >
                        {isAisle ? 'Lối' : ''}
                      </div>
                    );
                    colIdx += 1;
                  }
                } else {
                  // Empty Cell
                  rowCells.push(
                    <div
                      key={coordKey}
                      onClick={() => onEmptyCellClick(rowNum, colNum)}
                      className="h-10 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all cursor-pointer font-sans"
                      style={{ gridColumn: 'span 1' }}
                      title="Ô trống. Click để đặt ghế hoặc thêm tiện ích"
                    >
                      <span className="text-xs font-light">+</span>
                    </div>
                  );
                  colIdx += 1;
                }
              }

              return (
                <div key={rowNum} className="flex items-center gap-2">
                  {/* Left Row Number Label */}
                  <div className="w-8 shrink-0 text-right text-xs font-bold text-slate-400 font-mono">
                    {rowNum}
                  </div>

                  {/* Row Cells */}
                  <div className="grid gap-1.5 flex-1" style={{ gridTemplateColumns: `repeat(${maxColumn}, minmax(44px, 1fr))` }}>
                    {rowCells}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODAL 1: SeatEditDialog
   ========================================================================== */
function SeatEditDialog({
  seat,
  zones,
  seatClasses,
  onSave,
  onDelete,
  onClose,
}: {
  seat: FormSeat;
  zones: FormZone[];
  seatClasses: SeatClass[];
  onSave: (seat: FormSeat) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [formSeat, setFormSeat] = useState<FormSeat>({ ...seat });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-5 font-sans">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            Chỉnh sửa Ghế #{seat.seat_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Mã / Số ghế</label>
            <input
              value={formSeat.seat_number}
              onChange={(e) => setFormSeat({ ...formSeat, seat_number: e.target.value.toUpperCase() })}
              placeholder="VD: 1A, VIP-01"
              className={`${inputClass} font-bold font-mono text-blue-600 dark:text-blue-400 uppercase`}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Hạng vé áp dụng</label>
            <div className="grid grid-cols-2 gap-2">
              {seatClasses.map((sc) => {
                const isSelected = String(formSeat.seat_class_id) === String(sc.id);
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setFormSeat({ ...formSeat, seat_class_id: sc.id })}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500 font-bold text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border shrink-0"
                      style={{ backgroundColor: sc.color || '#3b82f6', borderColor: sc.color || '#3b82f6' }}
                    />
                    <span className="truncate">{sc.code} - {sc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Khu vực ghế</label>
            <select
              value={formSeat.zone_code}
              onChange={(e) => setFormSeat({ ...formSeat, zone_code: e.target.value })}
              className={inputClass}
            >
              {zones.map((z) => (
                <option key={z.code} value={z.code}>
                  {z.name || z.code}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Vị trí Hàng (Row)</label>
              <input
                type="number"
                value={formSeat.row}
                onChange={(e) => setFormSeat({ ...formSeat, row: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Vị trí Cột (Col)</label>
              <input
                type="number"
                value={formSeat.column}
                onChange={(e) => setFormSeat({ ...formSeat, column: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onDelete}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Trash2 size={14} /> Xóa ghế này
          </button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="light" size="xs" onClick={onClose}>
              Hủy
            </Button>
            <Button type="button" variant="primary" size="xs" onClick={() => onSave(formSeat)} className="font-bold">
              Lưu thay đổi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================================================
   MODAL 2: ElementEditDialog (Single Cell Custom Feature Editor)
   ========================================================================== */
function ElementEditDialog({
  element,
  onSave,
  onDelete,
  onClose,
}: {
  element: FormElement;
  onSave: (element: FormElement) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [formElem, setFormElem] = useState<FormElement>({ ...element });
  const colLetter = ALL_COLUMNS[element.column - 1] || `C${element.column}`;
  const commonSuggestions = ['WC', 'Hành lý', 'TV', 'Cầu thang', 'Cửa thoát hiểm', 'Quầy bar', 'Kho hàng', 'Khu VIP'];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-5 font-sans">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            Chỉnh sửa Tiện ích #{formElem.label || formElem.type} (Hàng {formElem.row}, Cột {colLetter})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Loại thành phần</label>
            <select
              value={formElem.type}
              onChange={(e) => setFormElem({ ...formElem, type: e.target.value as any })}
              className={inputClass}
            >
              <option value="block">Khối chức năng / Tiện ích (WC, Quầy bar, Kho, TV...)</option>
              <option value="aisle">Lối đi giữa các dãy</option>
              <option value="gap">Khoảng trống không gian</option>
            </select>
          </div>

          {formElem.type === 'block' && (
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Tên / Nhãn tiện ích (Tùy ý)</label>
              <input
                value={formElem.label || ''}
                onChange={(e) => setFormElem({ ...formElem, label: e.target.value })}
                placeholder="Nhập tên bất kỳ: WC, Quầy bar, Kho, TV, Hành lý..."
                className={inputClass}
                autoFocus
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                {commonSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setFormElem({ ...formElem, label: sug })}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      formElem.label === sug
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Vị trí Hàng (Row)</label>
              <input
                type="number"
                value={formElem.row}
                onChange={(e) => setFormElem({ ...formElem, row: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Vị trí Cột (Col)</label>
              <input
                type="number"
                value={formElem.column}
                onChange={(e) => setFormElem({ ...formElem, column: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onDelete}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Trash2 size={14} /> Xóa ô tiện ích này
          </button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="light" size="xs" onClick={onClose}>
              Hủy
            </Button>
            <Button type="button" variant="primary" size="xs" onClick={() => onSave(formElem)} className="font-bold">
              Lưu thay đổi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================================================
   MODAL 3: AddCellDialog (Dynamic Custom Block / Seat / Aisle)
   ========================================================================== */
function AddCellDialog({
  cell,
  zones,
  seatClasses,
  defaultSeatClassId,
  onAddSeat,
  onAddElement,
  onClose,
}: {
  cell: { deck_code: string; row: number; column: number };
  zones: FormZone[];
  seatClasses: SeatClass[];
  defaultSeatClassId: string | number;
  onAddSeat: (seat: FormSeat) => void;
  onAddElement: (element: FormElement) => void;
  onClose: () => void;
}) {
  const colLetter = ALL_COLUMNS[cell.column - 1] || `C${cell.column}`;
  const suggestedSeatName = `${cell.row}${colLetter}`;

  const [activeTab, setActiveTab] = useState<'seat' | 'block' | 'aisle'>('seat');

  // Seat fields
  const [seatNumber, setSeatNumber] = useState(suggestedSeatName);
  const [seatClassId, setSeatClassId] = useState<string | number>(defaultSeatClassId);
  const [zoneCode, setZoneCode] = useState(zones[0]?.code || 'eco');

  // Block fields
  const [blockLabel, setBlockLabel] = useState('WC');

  const commonSuggestions = ['WC', 'Hành lý', 'TV', 'Cầu thang', 'Cửa thoát hiểm', 'Quầy bar', 'Kho hàng', 'Khu VIP'];

  const handleCreateSeat = () => {
    if (!seatNumber.trim()) {
      toast.error('Vui lòng nhập mã số ghế');
      return;
    }
    onAddSeat({
      deck_code: cell.deck_code,
      zone_code: zoneCode,
      seat_class_id: seatClassId,
      seat_number: seatNumber.trim().toUpperCase(),
      row: cell.row,
      column: cell.column,
    });
  };

  const handleCreateBlock = () => {
    if (!blockLabel.trim()) {
      toast.error('Vui lòng nhập tên tiện ích');
      return;
    }
    onAddElement({
      deck_code: cell.deck_code,
      type: 'block',
      row: cell.row,
      column: cell.column,
      width: 1,
      height: 1,
      label: blockLabel.trim(),
    });
  };

  const handleCreateAisle = () => {
    onAddElement({
      deck_code: cell.deck_code,
      type: 'aisle',
      row: cell.row,
      column: cell.column,
      width: 1,
      height: 1,
      label: 'Lối đi',
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-5 font-sans">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            Thêm mới tại Hàng {cell.row}, Cột {colLetter}
          </DialogTitle>
        </DialogHeader>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('seat')}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'seat'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ghế ngồi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('block')}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'block'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Khối tiện ích / Chức năng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aisle')}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'aisle'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Lối đi
          </button>
        </div>

        {/* Tab 1: Seat */}
        {activeTab === 'seat' && (
          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Mã số ghế</label>
              <input
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value.toUpperCase())}
                placeholder="VD: 1A, VIP-01"
                className={`${inputClass} font-bold font-mono text-blue-600 dark:text-blue-400 uppercase`}
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Hạng vé</label>
              <div className="grid grid-cols-2 gap-2">
                {seatClasses.map((sc) => {
                  const isSelected = String(seatClassId) === String(sc.id);
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setSeatClassId(sc.id)}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500 font-bold text-blue-900 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border shrink-0"
                        style={{ backgroundColor: sc.color || '#3b82f6', borderColor: sc.color || '#3b82f6' }}
                      />
                      <span className="truncate">{sc.code} - {sc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Khu vực</label>
              <select
                value={zoneCode}
                onChange={(e) => setZoneCode(e.target.value)}
                className={inputClass}
              >
                {zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.name || z.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <Button type="button" variant="primary" size="sm" onClick={handleCreateSeat} className="w-full font-bold">
                Thêm ghế {seatNumber}
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Custom Feature Block */}
        {activeTab === 'block' && (
          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Tên / Nhãn tiện ích (Tùy ý)</label>
              <input
                value={blockLabel}
                onChange={(e) => setBlockLabel(e.target.value)}
                placeholder="Nhập tên bất kỳ: WC, Quầy bar, Kho, TV, Hành lý..."
                className={inputClass}
                autoFocus
              />
              {/* Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                {commonSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setBlockLabel(sug)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      blockLabel === sug
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button type="button" variant="primary" size="sm" onClick={handleCreateBlock} className="w-full font-bold bg-amber-600 hover:bg-amber-700 text-white">
                Thêm khối tiện ích "{blockLabel || 'Mới'}" tại ô này
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Aisle */}
        {activeTab === 'aisle' && (
          <div className="space-y-3 py-3 text-xs text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Đặt ô tại Hàng {cell.row}, Cột {colLetter} làm ô Lối đi cho khách di chuyển.
            </p>
            <Button type="button" variant="light" size="sm" onClick={handleCreateAisle} className="w-full font-bold">
              Xác nhận đặt làm ô Lối đi
            </Button>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="light" size="xs" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    if (occupiedByDeck.has(coordinateKey)) return `Trùng vị trí hàng ${seat.row}, cột ${seat.column} trong tầng ${seat.deck_code}. Mỗi ô chỉ chứa được 1 ghế hoặc tiện ích.`;
    occupiedByDeck.add(coordinateKey);
  }

  for (const element of form.elements) {
    if (!deckCodes.has(element.deck_code)) return `Tiện ích ${element.label || element.type} đang tham chiếu tầng không tồn tại.`;
    if (element.type === 'block' && !element.label?.trim()) return 'Tiện ích cần nhập nhãn hiển thị.';
    const width = element.type === 'block' ? Number(element.width || 1) : 1;
    for (let column = Number(element.column); column < Number(element.column) + width; column += 1) {
      const coordinateKey = `${element.deck_code}:${element.row}:${column}`;
      if (occupiedByDeck.has(coordinateKey)) return `Tiện ích bị trùng vị trí hàng ${element.row}, cột ${column} trong tầng ${element.deck_code}.`;
      occupiedByDeck.add(coordinateKey);
    }
  }

  return null;
}

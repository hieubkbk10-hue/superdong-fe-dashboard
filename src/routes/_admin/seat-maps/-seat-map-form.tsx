import React, { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Boat, SeatClass, SeatMap } from '@/types';

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

type GeneratorState = {
  deck_code: string;
  zone_code: string;
  seat_class_id: string | number;
  prefix: string;
  row_from: string;
  row_to: string;
  columns: string;
};

type SeatMapFormProps = {
  mode: 'create' | 'edit';
  boats: Boat[];
  seatClasses: SeatClass[];
  initial?: SeatMapPayload;
  submitting: boolean;
  onSubmit: (payload: SeatMapPayload) => Promise<void>;
};

const emptyGenerator: GeneratorState = {
  deck_code: '',
  zone_code: '',
  seat_class_id: '',
  prefix: '',
  row_from: '1',
  row_to: '1',
  columns: 'A,B,C,D',
};

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
  const [form, setForm] = useState<SeatMapPayload>(initial || defaultPayload);
  const [generator, setGenerator] = useState<GeneratorState>(emptyGenerator);

  const activeSeatClasses = useMemo(() => seatClasses.filter((sc) => sc.status !== 'inactive' && sc.is_active !== false), [seatClasses]);

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
    setForm((prev) => ({ ...prev, decks: [...prev.decks, { code: `deck-${next}`, name: '', floor_order: next }] }));
  };

  const addZone = () => {
    if (form.decks.length === 0) {
      toast.error('Vui lòng thêm tầng trước khi thêm khu vực ghế');
      return;
    }
    const next = form.zones.length + 1;
    setForm((prev) => ({ ...prev, zones: [...prev.zones, { deck_code: prev.decks[0].code, code: `zone-${next}`, name: '', zone_order: next }] }));
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

  const generateSeats = () => {
    const rowFrom = Number(generator.row_from);
    const rowTo = Number(generator.row_to);
    const columns = generator.columns.split(',').map((item) => item.trim()).filter(Boolean);
    if (!generator.deck_code || !generator.zone_code || !generator.seat_class_id || rowFrom < 1 || rowTo < rowFrom || columns.length === 0) {
      toast.error('Vui lòng nhập đủ tầng, khu vực, hạng ghế, hàng và cột để tạo nhanh ghế');
      return;
    }

    const generated: FormSeat[] = [];
    for (let row = rowFrom; row <= rowTo; row += 1) {
      columns.forEach((columnLabel, columnIndex) => {
        generated.push({
          deck_code: generator.deck_code,
          zone_code: generator.zone_code,
          seat_class_id: generator.seat_class_id,
          seat_number: `${generator.prefix}${columnLabel}${String(row).padStart(2, '0')}`,
          row,
          column: columnIndex + 1,
        });
      });
    }
    setForm((prev) => ({ ...prev, seats: [...prev.seats, ...generated] }));
    toast.success(`Đã tạo ${generated.length} ghế`);
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
    await onSubmit({ ...form, name: form.name.trim(), reason: form.reason?.trim() || undefined });
  };

  return (
    <form onSubmit={validateAndSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      <div className="bg-[#EBF7FA] px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-700">I. Thông tin sơ đồ</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {mode === 'create' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tàu áp dụng <span className="text-red-500">*</span></label>
            <select value={form.boat_id || ''} onChange={(e) => setForm({ ...form, boat_id: e.target.value })} className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:border-blue-500 outline-none" required>
              <option value="">Chọn tàu</option>
              {boats.map((boat) => <option key={boat.id} value={boat.id}>{boat.code} - {boat.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên sơ đồ ghế <span className="text-red-500">*</span></label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Sơ đồ ghế Superdong IX bản 2026" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:border-blue-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:border-blue-500 outline-none">
            <option value="active">Đang áp dụng</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lý do thao tác</label>
          <input value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Không bắt buộc" className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:border-blue-500 outline-none" />
        </div>
      </div>

      <Section title="II. Tầng / khoang tàu" onAdd={addDeck} addLabel="Thêm tầng">
        <SimpleTable headers={['Mã tầng', 'Tên tầng', 'Thứ tự', '']} rows={form.decks.map((deck, index) => [
          <input value={deck.code} onChange={(e) => updateDeck(index, { code: e.target.value })} className="input" />,
          <input value={deck.name} onChange={(e) => updateDeck(index, { name: e.target.value })} placeholder="VD: Khoang dưới" className="input" />,
          <input type="number" value={deck.floor_order} onChange={(e) => updateDeck(index, { floor_order: Number(e.target.value) })} className="input" />,
          <IconDelete onClick={() => setForm((prev) => ({ ...prev, decks: prev.decks.filter((_, idx) => idx !== index) }))} />,
        ])} />
      </Section>

      <Section title="III. Khu vực ghế" onAdd={addZone} addLabel="Thêm khu vực">
        <SimpleTable headers={['Tầng', 'Mã khu', 'Tên khu vực', 'Thứ tự', '']} rows={form.zones.map((zone, index) => [
          <select value={zone.deck_code} onChange={(e) => updateZone(index, { deck_code: e.target.value })} className="input">{form.decks.map((deck) => <option key={deck.code} value={deck.code}>{deck.code}</option>)}</select>,
          <input value={zone.code} onChange={(e) => updateZone(index, { code: e.target.value })} className="input" />,
          <input value={zone.name} onChange={(e) => updateZone(index, { name: e.target.value })} placeholder="VD: Khu phổ thông" className="input" />,
          <input type="number" value={zone.zone_order} onChange={(e) => updateZone(index, { zone_order: Number(e.target.value) })} className="input" />,
          <IconDelete onClick={() => setForm((prev) => ({ ...prev, zones: prev.zones.filter((_, idx) => idx !== index) }))} />,
        ])} />
      </Section>

      <Section title="IV. Tạo nhanh ghế" addLabel="Tạo nhanh" onAdd={generateSeats}>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <SelectField value={generator.deck_code} onChange={(value) => setGenerator({ ...generator, deck_code: value })} options={form.decks.map((deck) => [deck.code, deck.code])} placeholder="Tầng" />
          <SelectField value={generator.zone_code} onChange={(value) => setGenerator({ ...generator, zone_code: value })} options={form.zones.filter((zone) => !generator.deck_code || zone.deck_code === generator.deck_code).map((zone) => [zone.code, zone.name || zone.code])} placeholder="Khu" />
          <SelectField value={String(generator.seat_class_id)} onChange={(value) => setGenerator({ ...generator, seat_class_id: value })} options={activeSeatClasses.map((sc) => [String(sc.id), `${sc.code} - ${sc.name}`])} placeholder="Hạng ghế" />
          <input value={generator.prefix} onChange={(e) => setGenerator({ ...generator, prefix: e.target.value })} placeholder="Tiền tố, VD: T1-" className="input" />
          <input value={generator.row_from} onChange={(e) => setGenerator({ ...generator, row_from: e.target.value.replace(/[^0-9]/g, '') })} placeholder="Từ hàng" className="input" />
          <input value={generator.row_to} onChange={(e) => setGenerator({ ...generator, row_to: e.target.value.replace(/[^0-9]/g, '') })} placeholder="Đến hàng" className="input" />
          <input value={generator.columns} onChange={(e) => setGenerator({ ...generator, columns: e.target.value })} placeholder="Cột: A,B,C,D" className="input md:col-span-6" />
        </div>
      </Section>

      <Section title={`V. Danh sách ghế (${form.seats.length})`} onAdd={addSeat} addLabel="Thêm ghế">
        <SimpleTable headers={['Tầng', 'Khu', 'Hạng ghế', 'Số ghế', 'Hàng', 'Cột', '']} rows={form.seats.map((seat, index) => [
          <select value={seat.deck_code} onChange={(e) => updateSeat(index, { deck_code: e.target.value })} className="input">{form.decks.map((deck) => <option key={deck.code} value={deck.code}>{deck.code}</option>)}</select>,
          <select value={seat.zone_code} onChange={(e) => updateSeat(index, { zone_code: e.target.value })} className="input">{form.zones.filter((zone) => zone.deck_code === seat.deck_code).map((zone) => <option key={zone.code} value={zone.code}>{zone.code}</option>)}</select>,
          <select value={seat.seat_class_id} onChange={(e) => updateSeat(index, { seat_class_id: e.target.value })} className="input">{activeSeatClasses.map((sc) => <option key={sc.id} value={sc.id}>{sc.code}</option>)}</select>,
          <input value={seat.seat_number} onChange={(e) => updateSeat(index, { seat_number: e.target.value })} className="input" />,
          <input type="number" value={seat.row} onChange={(e) => updateSeat(index, { row: Number(e.target.value) })} className="input" />,
          <input type="number" value={seat.column} onChange={(e) => updateSeat(index, { column: Number(e.target.value) })} className="input" />,
          <IconDelete onClick={() => setForm((prev) => ({ ...prev, seats: prev.seats.filter((_, idx) => idx !== index) }))} />,
        ])} />
      </Section>

      <Section title="VI. Lối đi / tiện ích" onAdd={addElement} addLabel="Thêm tiện ích">
        <SimpleTable headers={['Tầng', 'Loại', 'Hàng', 'Cột', 'Rộng', 'Nhãn', '']} rows={form.elements.map((element, index) => [
          <select value={element.deck_code} onChange={(e) => updateElement(index, { deck_code: e.target.value })} className="input">{form.decks.map((deck) => <option key={deck.code} value={deck.code}>{deck.code}</option>)}</select>,
          <select value={element.type} onChange={(e) => updateElement(index, { type: e.target.value as FormElement['type'] })} className="input"><option value="aisle">Lối đi</option><option value="gap">Khoảng trống</option><option value="block">Tiện ích</option></select>,
          <input type="number" value={element.row} onChange={(e) => updateElement(index, { row: Number(e.target.value) })} className="input" />,
          <input type="number" value={element.column} onChange={(e) => updateElement(index, { column: Number(e.target.value) })} className="input" />,
          <input type="number" value={element.width || 1} onChange={(e) => updateElement(index, { width: Number(e.target.value) })} className="input" />,
          <input value={element.label || ''} onChange={(e) => updateElement(index, { label: e.target.value })} placeholder="VD: WC" className="input" />,
          <IconDelete onClick={() => setForm((prev) => ({ ...prev, elements: prev.elements.filter((_, idx) => idx !== index) }))} />,
        ])} />
      </Section>

      <div className="p-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {mode === 'create' && (
          <button type="button" onClick={() => setForm(defaultPayload)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold flex items-center gap-2">
            <RotateCcw size={15} /> Làm sạch dữ liệu
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <Link to={'/seat-maps' as any} className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">Hủy bỏ</Link>
          <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-70">
            <Save size={16} /> {submitting ? 'Đang lưu...' : mode === 'create' ? 'Lưu sơ đồ ghế' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children, onAdd, addLabel }: { title: string; children: React.ReactNode; onAdd: () => void; addLabel: string }) {
  return <div><div className="bg-[#EBF7FA] px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center justify-between"><span>{title}</span><button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-white normal-case"><Plus size={13} />{addLabel}</button></div><div className="p-6 overflow-x-auto">{children}</div></div>;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) return <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Chưa có dữ liệu. Bấm nút thêm ở góc phải để khai báo.</div>;
  return <table className="w-full min-w-max text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{headers.map((header) => <th key={header} className="p-2 text-left">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, idx) => <tr key={idx}>{row.map((cell, cellIdx) => <td key={cellIdx} className="p-2">{cell}</td>)}</tr>)}</tbody></table>;
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (value: string) => void; options: (string | number)[][]; placeholder: string }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="input"><option value="">{placeholder}</option>{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>;
}

function IconDelete({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="p-2 rounded-md text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>;
}

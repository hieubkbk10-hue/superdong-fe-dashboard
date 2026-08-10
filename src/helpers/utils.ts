import { TripStatus, BookingStatus, PaymentStatus, TicketStatus, SeatCell, SeatStatus } from '../types';

// ==========================================
// 1. Currency Formatting
// ==========================================

/**
 * LOGIC: Định dạng số tiền VND theo chuẩn Việt Nam (e.g., 350.000 ₫)
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ==========================================
// 2. Date & Time Formatting
// ==========================================

/**
 * LOGIC: Định dạng chuỗi ngày (e.g. "10/08/2026")
 */
export function formatDate(dateString?: string | Date): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * LOGIC: Định dạng ngày giờ đầy đủ (e.g. "10/08/2026 14:30")
 */
export function formatDateTime(dateString?: string | Date): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * LOGIC: Định dạng giờ (e.g. "08:00")
 */
export function formatTime(timeString?: string | Date): string {
  if (!timeString) return '-';
  if (typeof timeString === 'string' && timeString.length === 5 && timeString.includes(':')) {
    return timeString; // "08:00"
  }
  const d = new Date(timeString);
  if (isNaN(d.getTime())) return typeof timeString === 'string' ? timeString : '-';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

// ==========================================
// 3. Seat Layout Helpers
// ==========================================

export interface ParsedSeatCode {
  deckPrefix?: string;
  rowLabel: string;
  seatNumber: number;
}

/**
 * UI: Phân tích mã ghế (e.g., "A12", "T1-B05") thành hàng và số ghế
 */
export function parseSeatCode(seatCode: string): ParsedSeatCode {
  if (!seatCode) {
    return { rowLabel: '', seatNumber: 0 };
  }
  const cleanCode = seatCode.trim();
  const parts = cleanCode.split('-');
  const codeToParse = parts.length > 1 ? parts[1] : parts[0];
  const deckPrefix = parts.length > 1 ? parts[0] : undefined;

  const match = codeToParse.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    return {
      deckPrefix,
      rowLabel: match[1].toUpperCase(),
      seatNumber: parseInt(match[2], 10),
    };
  }

  return {
    deckPrefix,
    rowLabel: cleanCode,
    seatNumber: 0,
  };
}

/**
 * UI: Lấy màu sắc biểu thị trạng thái ghế trên sơ đồ
 */
export function getSeatStatusColor(status: SeatStatus | 'aisle' | 'facility'): {
  bg: string;
  border: string;
  text: string;
} {
  switch (status) {
    case 'available':
      return { bg: '#E6F4EA', border: '#34A853', text: '#137333' };
    case 'held':
      return { bg: '#FEF7E0', border: '#FBBC04', text: '#B06000' };
    case 'booked':
      return { bg: '#E8F0FE', border: '#4285F4', text: '#1A73E8' };
    case 'blocked':
    case 'maintenance':
      return { bg: '#FCE8E6', border: '#EA4335', text: '#C5221F' };
    case 'aisle':
      return { bg: 'transparent', border: 'transparent', text: 'transparent' };
    case 'facility':
      return { bg: '#F1F3F4', border: '#BDC1C6', text: '#5F6368' };
    default:
      return { bg: '#F1F3F4', border: '#DADCE0', text: '#3C4043' };
  }
}

/**
 * LOGIC: Chuyển đổi danh sách phẳng SeatCell thành Ma trận 2D [hàng][cột]
 */
export function gridToMatrix(cells: SeatCell[], rows: number, columns: number): (SeatCell | null)[][] {
  const matrix: (SeatCell | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => null)
  );

  cells.forEach((cell) => {
    if (cell.row >= 0 && cell.row < rows && cell.column >= 0 && cell.column < columns) {
      matrix[cell.row][cell.column] = cell;
    }
  });

  return matrix;
}

/**
 * LOGIC: Tự động khởi tạo ma trận ô ghế cho sơ đồ tàu mới
 */
export function generateSeatGrid(rows: number, columns: number): SeatCell[] {
  const cells: SeatCell[] = [];
  for (let r = 0; r < rows; r++) {
    const rowChar = String.fromCharCode(65 + r); // A, B, C...
    for (let c = 0; c < columns; c++) {
      const isAisle = c === Math.floor(columns / 2);
      const seatNum = (c < Math.floor(columns / 2) ? c + 1 : c).toString().padStart(2, '0');
      cells.push({
        row: r,
        column: c,
        type: isAisle ? 'aisle' : 'seat',
        label: isAisle ? '' : `${rowChar}${seatNum}`,
        seat_code: isAisle ? undefined : `${rowChar}${seatNum}`,
        is_active: true,
      });
    }
  }
  return cells;
}

// ==========================================
// 4. Status Badge Color Mapping Helpers
// ==========================================

export interface StatusBadgeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * UI: Lấy cấu hình badge cho trạng thái chuyến tàu (Trip)
 */
export function getTripStatusBadge(status: TripStatus): StatusBadgeConfig {
  switch (status) {
    case 'open':
      return { label: 'Đang mở bán', color: '#137333', bgColor: '#E6F4EA', borderColor: '#A8DADC' };
    case 'closed':
      return { label: 'Đã đóng vé', color: '#B06000', bgColor: '#FEF7E0', borderColor: '#FFE0B2' };
    case 'departed':
      return { label: 'Đã xuất bến', color: '#1A73E8', bgColor: '#E8F0FE', borderColor: '#BBDEFB' };
    case 'completed':
      return { label: 'Hoàn tất', color: '#5F6368', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
    case 'cancelled':
      return { label: 'Đã hủy', color: '#C5221F', bgColor: '#FCE8E6', borderColor: '#FFCDD2' };
    default:
      return { label: status, color: '#3C4043', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
  }
}

/**
 * UI: Lấy cấu hình badge cho trạng thái đơn đặt vé (Booking)
 */
export function getBookingStatusBadge(status: BookingStatus): StatusBadgeConfig {
  switch (status) {
    case 'pending':
      return { label: 'Chờ xác nhận', color: '#B06000', bgColor: '#FEF7E0', borderColor: '#FFE0B2' };
    case 'confirmed':
      return { label: 'Đã xác nhận', color: '#1A73E8', bgColor: '#E8F0FE', borderColor: '#BBDEFB' };
    case 'paid':
      return { label: 'Đã thanh toán', color: '#137333', bgColor: '#E6F4EA', borderColor: '#C8E6C9' };
    case 'cancelled':
      return { label: 'Đã hủy', color: '#5F6368', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
    case 'refunded':
      return { label: 'Đã hoàn tiền', color: '#C5221F', bgColor: '#FCE8E6', borderColor: '#FFCDD2' };
    case 'partially_refunded':
      return { label: 'Hoàn tiền một phần', color: '#A142F4', bgColor: '#F3E8FD', borderColor: '#E1BEE7' };
    default:
      return { label: status, color: '#3C4043', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
  }
}

/**
 * UI: Lấy cấu hình badge cho trạng thái thanh toán (Payment)
 */
export function getPaymentStatusBadge(status: PaymentStatus): StatusBadgeConfig {
  switch (status) {
    case 'unpaid':
      return { label: 'Chưa thanh toán', color: '#C5221F', bgColor: '#FCE8E6', borderColor: '#FFCDD2' };
    case 'paid':
      return { label: 'Đã thanh toán', color: '#137333', bgColor: '#E6F4EA', borderColor: '#C8E6C9' };
    case 'partially_paid':
      return { label: 'Thanh toán 1 phần', color: '#B06000', bgColor: '#FEF7E0', borderColor: '#FFE0B2' };
    case 'refunded':
      return { label: 'Đã hoàn tiền', color: '#5F6368', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
    default:
      return { label: status, color: '#3C4043', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
  }
}

/**
 * UI: Lấy cấu hình badge cho trạng thái vé (Ticket)
 */
export function getTicketStatusBadge(status: TicketStatus): StatusBadgeConfig {
  switch (status) {
    case 'valid':
      return { label: 'Hợp lệ', color: '#137333', bgColor: '#E6F4EA', borderColor: '#C8E6C9' };
    case 'used':
      return { label: 'Đã sử dụng', color: '#1A73E8', bgColor: '#E8F0FE', borderColor: '#BBDEFB' };
    case 'cancelled':
      return { label: 'Đã hủy', color: '#5F6368', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
    case 'refunded':
      return { label: 'Đã hoàn vé', color: '#C5221F', bgColor: '#FCE8E6', borderColor: '#FFCDD2' };
    default:
      return { label: status, color: '#3C4043', bgColor: '#F1F3F4', borderColor: '#E0E0E0' };
  }
}

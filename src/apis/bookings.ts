import api from '../constants/api';
import { ApiResponse, PaginatedResponse, Booking } from '../types';

export interface SeatReassignment {
  traveler_id: string | number;
  new_seat_code: string;
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK1001',
    booking_code: 'SD20260827RG01',
    status: 'confirmed',
    booker: {
      name: 'Trần Mạnh Hiếu',
      email: 'hieu.tran@example.com',
      phone: '0912345678',
      id_card: '079201004567',
    },
    travelers: [
      {
        id: 'TRV1',
        full_name: 'Trần Mạnh Hiếu',
        id_number: '079201004567',
        traveler_type_id: 'TT_ADULT',
        seat_code: 'A01',
        ticket_code: 'TK-2026-001',
      },
      {
        id: 'TRV2',
        full_name: 'Nguyễn Thị Mai',
        id_number: '079202008912',
        traveler_type_id: 'TT_ADULT',
        seat_code: 'A02',
        ticket_code: 'TK-2026-002',
      },
    ],
    total_amount: 680000,
    final_amount: 680000,
    payment_status: 'paid',
    created_at: '2026-08-27T08:30:00.000Z',
  },
  {
    id: 'BK1002',
    booking_code: 'SD20260827PQ02',
    status: 'pending',
    booker: {
      name: 'Lê Hoàng Long',
      email: 'long.le@example.com',
      phone: '0987654321',
      id_card: '083200001234',
    },
    travelers: [
      {
        id: 'TRV3',
        full_name: 'Lê Hoàng Long',
        id_number: '083200001234',
        traveler_type_id: 'TT_ADULT',
        seat_code: 'B05',
        ticket_code: 'TK-2026-003',
      },
    ],
    total_amount: 340000,
    final_amount: 340000,
    payment_status: 'unpaid',
    created_at: '2026-08-27T09:15:00.000Z',
  },
  {
    id: 'BK1003',
    booking_code: 'SD20260826HT03',
    status: 'paid',
    booker: {
      name: 'Phạm Thị Thúy',
      email: 'thuy.pham@example.com',
      phone: '0903112233',
      id_card: '089201009876',
    },
    travelers: [
      {
        id: 'TRV4',
        full_name: 'Phạm Thị Thúy',
        id_number: '089201009876',
        traveler_type_id: 'TT_ADULT',
        seat_code: 'C10',
        ticket_code: 'TK-2026-004',
      },
      {
        id: 'TRV5',
        full_name: 'Phạm Văn Nam',
        id_number: '089203001122',
        traveler_type_id: 'TT_CHILD',
        seat_code: 'C11',
        ticket_code: 'TK-2026-005',
      },
      {
        id: 'TRV6',
        full_name: 'Nguyễn Thị Hoa',
        id_number: '089195007788',
        traveler_type_id: 'TT_SENIOR',
        seat_code: 'C12',
        ticket_code: 'TK-2026-006',
      },
    ],
    total_amount: 860000,
    final_amount: 860000,
    payment_status: 'paid',
    created_at: '2026-08-26T14:20:00.000Z',
  },
  {
    id: 'BK1004',
    booking_code: 'SD20260825CD04',
    status: 'cancelled',
    booker: {
      name: 'Võ Minh Quân',
      email: 'quan.vo@example.com',
      phone: '0938445566',
    },
    travelers: [
      {
        id: 'TRV7',
        full_name: 'Võ Minh Quân',
        traveler_type_id: 'TT_ADULT',
        seat_code: 'D01',
      },
    ],
    total_amount: 520000,
    final_amount: 520000,
    payment_status: 'refunded',
    created_at: '2026-08-25T11:00:00.000Z',
  },
  {
    id: 'BK1005',
    booking_code: 'SD20260825ST05',
    status: 'paid',
    booker: {
      name: 'Đặng Thanh Tâm',
      email: 'tam.dang@example.com',
      phone: '0977889900',
    },
    travelers: [
      {
        id: 'TRV8',
        full_name: 'Đặng Thanh Tâm',
        traveler_type_id: 'TT_ADULT',
        seat_code: 'E08',
      },
    ],
    total_amount: 320000,
    final_amount: 320000,
    payment_status: 'paid',
    created_at: '2026-08-25T16:45:00.000Z',
  },
];

/**
 * LOGIC: Lấy danh sách booking (có lọc theo mã, ngày, trạng thái...)
 */
export async function getBookings(params?: Record<string, any>): Promise<PaginatedResponse<Booking>> {
  try {
    const response = await api.get<PaginatedResponse<Booking>>('/bookings', { params });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data;
    }
    return {
      data: MOCK_BOOKINGS,
      meta: {
        pagination: {
          total: MOCK_BOOKINGS.length,
          count: MOCK_BOOKINGS.length,
          per_page: 20,
          current_page: 1,
          total_pages: 1,
        },
      },
    };
  } catch (error: any) {
    console.warn('GET /bookings error, using mock fallback data:', error?.message);
    return {
      data: MOCK_BOOKINGS,
      meta: {
        pagination: {
          total: MOCK_BOOKINGS.length,
          count: MOCK_BOOKINGS.length,
          per_page: 20,
          current_page: 1,
          total_pages: 1,
        },
      },
    };
  }
}

/**
 * LOGIC: Tìm kiếm booking theo mã booking_code hoặc id
 */
export async function findBooking(codeOrId: string | number): Promise<ApiResponse<Booking>> {
  const response = await api.get<ApiResponse<Booking>>(`/bookings/${codeOrId}`);
  return response.data;
}

/**
 * LOGIC: Lấy danh sách đơn hàng của một người dùng cụ thể
 */
export async function listUserBookings(
  userId: string | number,
  params?: Record<string, any>
): Promise<PaginatedResponse<Booking>> {
  const response = await api.get<PaginatedResponse<Booking>>(`/users/${userId}/bookings`, { params });
  return response.data;
}

/**
 * LOGIC: Điều chuyển / đổi ghế cho hành khách trong đơn hàng
 */
export async function reassignSeats(
  bookingId: string | number,
  reassignments: SeatReassignment[]
): Promise<ApiResponse<Booking>> {
  const response = await api.post<ApiResponse<Booking>>(`/bookings/${bookingId}/reassign-seats`, {
    reassignments,
  });
  return response.data;
}

/**
 * LOGIC: Tạo booking mới
 */
export async function createBooking(data: Partial<Booking>): Promise<ApiResponse<Booking>> {
  const response = await api.post<ApiResponse<Booking>>('/bookings', data);
  return response.data;
}

/**
 * LOGIC: Cập nhật thông tin booking
 */
export async function updateBooking(id: string | number, data: Partial<Booking>): Promise<ApiResponse<Booking>> {
  const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}`, data);
  return response.data;
}

export default {
  getBookings,
  findBooking,
  listUserBookings,
  reassignSeats,
  createBooking,
  updateBooking,
};

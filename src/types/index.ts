/**
 * Superdong Admin Dashboard - Master TypeScript Types
 * 
 * @package Superdong Admin
 */

// ==========================================
// 1. Core & API Response Types
// ==========================================

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
  success?: boolean;
}

export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  links?: Record<string, string>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta?: {
    pagination?: PaginationMeta;
  };
}

// ==========================================
// 2. User, Role, Permission
// ==========================================

export interface Permission {
  id: string | number;
  name: string;
  display_name?: string;
  description?: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string | number;
  name: string;
  guard_name?: string;
  display_name?: string;
  description?: string;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  roles?: Role[];
  permissions?: Permission[];
  avatar_url?: string;
  birth?: string;
  birthday?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 3. Boat & Seat Map
// ==========================================

export interface SeatClass {
  id: string | number;
  name: string;
  code: string; // e.g. 'STANDARD', 'VIP', 'BUSINESS'
  price?: number;
  status?: 'active' | 'inactive';
  color?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
  base_price_multiplier?: number;
  description?: string;
  is_active?: boolean;
}

export type SeatCellType = 'seat' | 'aisle' | 'empty' | 'facility' | 'door';

export interface SeatCell {
  id?: string | number;
  row: number;
  column: number;
  type: SeatCellType;
  label?: string; // e.g. "A01"
  seat_code?: string;
  seat_class_id?: string | number;
  seat_class?: SeatClass;
  is_active?: boolean;
  facility_type?: 'wc' | 'luggage' | 'tv' | 'bar' | 'exit' | 'captain';
  status?: SeatStatus;
  price?: number;
  passenger_name?: string;
}

export interface Zone {
  id: string | number;
  name: string;
  code: string;
  deck_id?: string | number;
  color?: string;
  cells?: SeatCell[];
}

export interface Deck {
  id: string | number;
  name: string; // e.g. "Tầng 1 (Trệt)", "Tầng 2 (Lầu)"
  level: number;
  boat_id?: string | number;
  rows: number;
  columns: number;
  zones?: Zone[];
  cells?: SeatCell[];
}

export interface SeatMap {
  id: string | number;
  boat_id?: string | number;
  boat?: {
    id: string | number;
    code: string;
    name: string;
  };
  boat_name?: string;
  name: string;
  version?: string | number;
  status?: 'active' | 'inactive';
  decks: Deck[];
  total_seats?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SeatStatus = 'available' | 'held' | 'booked' | 'blocked' | 'maintenance';

export interface Seat {
  id: string | number;
  code: string;
  label: string;
  deck_id: string | number;
  seat_class_id: string | number;
  seat_class?: SeatClass;
  row: number;
  column: number;
  status: SeatStatus;
  price?: number;
}

export interface Boat {
  id: string | number;
  name: string;
  code: string;
  capacity: number;
  total_capacity?: number;
  speed?: string | number;
  is_express?: boolean;
  status: 'active' | 'maintenance' | 'inactive';
  seat_maps?: SeatMap[];
  active_seat_map_id?: string | number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 4. Location, Route, Journey
// ==========================================

export interface Location {
  id: string | number;
  name: string;
  code: string; // e.g. "RG", "PQ", "HT", "ND", "ST", "CD"
  status?: 'active' | 'inactive';
  city?: string;
  address?: string;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Route {
  id: string | number;
  code?: string;
  name?: string;
  status?: 'active' | 'inactive';
  stops?: {
    data?: RouteStop[];
  } | RouteStop[];
  origin_location_id?: string | number;
  destination_location_id?: string | number;
  origin_location?: Location;
  destination_location?: Location;
  distance_km?: number;
  estimated_duration_minutes?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RouteStop {
  id: string | number;
  route_id?: string | number;
  location_id: string | number;
  stop_order: number;
  location?: {
    data?: Location;
  } | Location;
  created_at?: string;
  updated_at?: string;
}

export interface Journey {
  id: string | number;
  object?: 'Journey';
  name?: string;
  code?: string;
  route_id: string | number;
  from_location_id?: string | number;
  to_location_id?: string | number;
  route?: {
    data?: Route;
  } | Route;
  from_location?: {
    data?: Location;
  } | Location;
  to_location?: {
    data?: Location;
  } | Location;
  status?: 'active' | 'inactive';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 5. Schedule & Trip
// ==========================================

export interface Schedule {
  id: string | number;
  name?: string;
  code?: string;
  route_id?: string | number;
  route?: Route;
  journey_id?: string | number;
  journey?: Journey;
  boat_id?: string | number;
  boat?: Boat;
  departure_time?: string;
  arrival_time?: string;
  start_time?: string;
  end_time?: string;
  days_of_week?: number[] | string[];
  recurrence?: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'none';
  is_active?: boolean;
  status?: string;
  effective_from?: string;
  effective_to?: string;
  created_at?: string;
  updated_at?: string;
}

export type TripStatus = 'draft' | 'selling' | 'closed' | 'started' | 'completed' | 'cancelled' | 'open' | 'departed';

export interface Trip {
  id: string | number;
  object?: string;
  schedule_id?: string | number | null;
  journey_id?: string | number;
  route_id: string | number;
  route?: Route;
  boat_id: string | number;
  boat?: Boat;
  start_at?: string;
  end_at?: string;
  departure_time?: string;
  arrival_time?: string;
  status: TripStatus;
  shuttle_phone?: string | null;
  version?: number;
  available_seats?: number;
  total_seats?: number;
  price_override?: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}


// ==========================================
// 6. Booking, Traveler, SeatHold
// ==========================================

export interface Booker {
  name: string;
  email: string;
  phone: string;
  id_card?: string;
  address?: string;
}

export interface Traveler {
  id?: string | number;
  full_name: string;
  id_number?: string;
  traveler_type_id: string | number;
  traveler_type?: TravelerType;
  seat_code?: string;
  ticket_code?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  price?: number;
}

export interface SeatHold {
  id: string | number;
  trip_id: string | number;
  seat_code: string;
  user_id?: string | number;
  session_id?: string;
  expires_at: string;
  created_at?: string;
}

export interface BookingTrip {
  id: string | number;
  booking_id: string | number;
  trip_id: string | number;
  trip?: Trip;
  departure_time: string;
  origin_location?: Location;
  destination_location?: Location;
}

export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'refunded' | 'partially_refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';

export interface Booking {
  id: string | number;
  booking_code: string;
  status: BookingStatus;
  booker: Booker;
  travelers: Traveler[];
  booking_trips?: BookingTrip[];
  total_amount: number;
  discount_amount?: number;
  final_amount: number;
  payment_status: PaymentStatus;
  coupon_code?: string;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 7. Ticket, CheckIn, QRResolution
// ==========================================

export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded';

export interface Ticket {
  id: string | number;
  ticket_code: string;
  booking_id: string | number;
  booking_code: string;
  trip_id: string | number;
  trip?: Trip;
  seat_code: string;
  traveler_name: string;
  traveler_type_name?: string;
  traveler_id_number?: string;
  status: TicketStatus;
  qr_code: string;
  checked_in_at?: string;
  checked_in_by?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface CheckIn {
  id: string | number;
  ticket_id: string | number;
  ticket_code: string;
  trip_id: string | number;
  checked_in_at: string;
  checked_in_by_user_id: string | number;
  location_id?: string | number;
  status: 'success' | 'reversed';
}

export interface QRResolution {
  valid: boolean;
  ticket?: Ticket;
  error_message?: string;
  resolution_type?: 'valid_ticket' | 'already_checked_in' | 'expired' | 'invalid';
}

// ==========================================
// 8. Payment & Office Payment
// ==========================================

export type PaymentMethod = 'vnpay' | 'momo' | 'cash' | 'office_bank_transfer' | 'credit_card' | 'counter_cash' | 'vietqr';
export type PaymentTransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'completed';

export interface Payment {
  id: string | number;
  booking_id: string | number;
  booking_code?: string;
  amount: number;
  payment_method: PaymentMethod;
  gateway?: string;
  transaction_reference?: string;
  status: PaymentTransactionStatus;
  confirmed_by_user_id?: string | number;
  confirmed_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfficePaymentConfirm {
  booking_id?: string | number;
  booking_code?: string;
  amount: number;
  payment_method?: 'cash' | 'office_bank_transfer' | 'counter_cash';
  counter_location?: string;
  reference_number?: string;
  note?: string;
}

// ==========================================
// 9. Pricing, TravelerType, Coupon
// ==========================================

export interface TravelerType {
  id: string | number;
  name: string;
  code: string;
  discount_percentage?: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Coupon {
  id: string | number;
  code: string;
  name?: string;
  description?: string;
  type?: 'percentage' | 'fixed_amount';
  discount_type?: 'percentage' | 'fixed_amount';
  value?: number;
  discount_value?: number;
  min_booking_amount?: number;
  min_booking_amount_vnd?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count?: number;
  valid_from?: string;
  valid_until?: string;
  effective_from?: string;
  effective_to?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PricingRule {
  id: string | number;
  route_id?: string | number;
  seat_class_id?: string | number;
  traveler_type_id?: string | number;
  base_price: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 10. Booking Changes & Refunds
// ==========================================

export type BookingChangeType = 'reschedule' | 'seat_change' | 'cancellation' | 'traveler_info';
export type ChangeReviewStatus = 'pending' | 'approved' | 'rejected';

export interface BookingChange {
  id: string | number;
  booking_id: string | number;
  booking_code: string;
  change_type: BookingChangeType;
  requested_by?: string;
  reason?: string;
  status: ChangeReviewStatus;
  details?: Record<string, any>;
  reviewed_by?: string | number;
  reviewed_at?: string;
  created_at: string;
}

export interface RefundRequest {
  id: string | number;
  booking_id: string | number;
  booking_code: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processed_at?: string;
  notes?: string;
  created_at: string;
}

// ==========================================
// 11. Audit & System Settings
// ==========================================

export interface AuditRecord {
  id: string | number;
  user_id?: string | number;
  user_name?: string;
  action: string;
  module: string;
  description: string;
  ip_address?: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  created_at: string;
}

export interface SystemSetting {
  id: string | number;
  key: string;
  value: string;
  group?: string;
  description?: string;
  updated_at?: string;
}

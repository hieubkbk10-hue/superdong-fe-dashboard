/**
 * React Query Key Constants for Superdong Admin Dashboard
 */

export const QUERY_KEYS = {
  // Auth
  AUTH: {
    ALL: ['auth'] as const,
    PROFILE: ['auth', 'profile'] as const,
    PERMISSIONS: ['auth', 'permissions'] as const,
  },

  // Boats
  BOATS: {
    ALL: ['boats'] as const,
    LIST: (params?: Record<string, any>) => ['boats', 'list', params] as const,
    DETAIL: (id: string | number) => ['boats', 'detail', id] as const,
    SEAT_MAP: (boatId: string | number) => ['boats', 'seat-map', boatId] as const,
    SEAT_CLASSES: ['boats', 'seat-classes'] as const,
  },

  // Journeys & Locations
  JOURNEYS: {
    ALL: ['journeys'] as const,
    LOCATIONS: (params?: Record<string, any>) => ['journeys', 'locations', params] as const,
    ADMIN_LOCATIONS: (params?: Record<string, any>) => ['journeys', 'admin-locations', params] as const,
    LIST: (params?: Record<string, any>) => ['journeys', 'list', params] as const,
    DETAIL: (id: string | number) => ['journeys', 'detail', id] as const,
  },

  // Trips & Schedules
  TRIPS: {
    ALL: ['trips'] as const,
    LIST: (params?: Record<string, any>) => ['trips', 'list', params] as const,
    DETAIL: (id: string | number) => ['trips', 'detail', id] as const,
    SCHEDULES: (params?: Record<string, any>) => ['trips', 'schedules', params] as const,
  },

  // Bookings
  BOOKINGS: {
    ALL: ['bookings'] as const,
    LIST: (params?: Record<string, any>) => ['bookings', 'list', params] as const,
    DETAIL: (idOrCode: string | number) => ['bookings', 'detail', idOrCode] as const,
    USER_BOOKINGS: (userId: string | number, params?: Record<string, any>) => ['bookings', 'user', userId, params] as const,
    CHANGES_QUEUE: (params?: Record<string, any>) => ['bookings', 'changes-queue', params] as const,
  },

  // Ticketing
  TICKETING: {
    ALL: ['ticketing'] as const,
    DETAIL: (idOrCode: string | number) => ['ticketing', 'detail', idOrCode] as const,
    CHECK_IN_LOGS: (params?: Record<string, any>) => ['ticketing', 'check-in-logs', params] as const,
  },

  // Payments
  PAYMENTS: {
    ALL: ['payments'] as const,
    STATUS: (paymentId: string | number) => ['payments', 'status', paymentId] as const,
    HISTORY: (bookingId: string | number) => ['payments', 'history', bookingId] as const,
  },

  // Pricing & Discounts
  PRICING: {
    ALL: ['pricing'] as const,
    TRAVELER_TYPES: ['pricing', 'traveler-types'] as const,
    COUPONS: (params?: Record<string, any>) => ['pricing', 'coupons', params] as const,
    RULES: (params?: Record<string, any>) => ['pricing', 'rules', params] as const,
  },

  // Users & Permissions
  USERS: {
    ALL: ['users'] as const,
    LIST: (params?: Record<string, any>) => ['users', 'list', params] as const,
    DETAIL: (id: string | number) => ['users', 'detail', id] as const,
    ROLES: ['users', 'roles'] as const,
    PERMISSIONS: ['users', 'permissions'] as const,
  },

  // Settings
  SETTINGS: {
    ALL: ['settings'] as const,
    LIST: ['settings', 'list'] as const,
  },

  // Audit Logs
  AUDITS: {
    ALL: ['audits'] as const,
    LIST: (params?: Record<string, any>) => ['audits', 'list', params] as const,
  },
} as const;

export default QUERY_KEYS;

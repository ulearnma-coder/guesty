// Enum for reservation status. Using an enum provides type safety and autocompletion.
export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  PAID = 'PAID',
}

// Using an object for views allows for easy iteration and type creation.
// Reordered to create a logical flow in the sidebar.
export const VIEWS = {
    DASHBOARD: 'dashboard',
    CALENDAR: 'calendar',
    RESERVATIONS: 'reservations',
    LAYOUT: 'layout',
    SETTINGS: 'settings',
    FINANCIALS: 'financials', // New view for financial reports
} as const;
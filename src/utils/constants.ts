export const APP_NAME = 'IIMS'

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

export const ADMIN_ROLES = ['Super Admin', 'Inventory Manager', 'Order Manager'] as const

export const STOCK_THRESHOLDS = {
  low: 15,
  critical: 5,
} as const

export const DEFAULT_PAGE_SIZE = 10


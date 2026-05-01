import type { ORDER_STATUSES, ADMIN_ROLES } from '@/utils/constants'

// Mirrors ER diagram; camelCase field names align to provided examples.

export interface CustomerAccount {
  customerId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  username: string
  password: string
  address: string
  createdAt: string
  isActive: boolean
}

export type AdminRole = (typeof ADMIN_ROLES)[number]

export interface AdminAccount {
  adminId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  username: string
  password: string
  role: AdminRole
  createdAt: string
  isActive: boolean
}

export interface Category {
  categoryId: string
  categoryName: string
  description: string
}

export interface Product {
  productId: string
  name: string
  price: number
  stockQty: number
  categoryId: string
  category?: Category
}

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface Order {
  orderId: string
  customerId: string
  customer?: CustomerAccount
  processedBy?: string
  admin?: AdminAccount
  datetime: string
  status: OrderStatus
  items?: OrderItem[]
}

export interface OrderItem {
  orderId: string
  productId: string
  product?: Product
  quantity: number
}

export type AdminProductAction = 'created' | 'updated' | 'deleted' | 'restocked'

export interface AdminProductAudit {
  adminId: string
  productId: string
  action: AdminProductAction
  actionDatetime: string
}


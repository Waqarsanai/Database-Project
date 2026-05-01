import type { AdminAccount, AdminProductAudit, Category, CustomerAccount, Order, OrderItem, Product } from '@/types/entities'
import * as seed from '@/mocks/seed'

export interface MockDb {
  products: Product[]
  categories: Category[]
  orders: Order[]
  orderItems: OrderItem[]
  customers: CustomerAccount[]
  admins: AdminAccount[]
  audit: AdminProductAudit[]
}

export const db: MockDb = {
  products: structuredClone(seed.products),
  categories: structuredClone(seed.categories),
  orders: structuredClone(seed.orders),
  orderItems: structuredClone(seed.orderItems),
  customers: structuredClone(seed.customers),
  admins: structuredClone(seed.admins),
  audit: structuredClone(seed.audit),
}


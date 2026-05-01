import type {
  AdminAccount,
  AdminProductAudit,
  Category,
  CustomerAccount,
  Order,
  OrderItem,
  Product,
} from '@/types/entities'
import { ORDER_STATUSES, ADMIN_ROLES } from '@/utils/constants'

function id(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, '0')}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const categories: Category[] = [
  { categoryId: id('cat', 1), categoryName: 'Beverages', description: 'Drinks, juices, and water' },
  { categoryId: id('cat', 2), categoryName: 'Snacks', description: 'Chips, nuts, and quick bites' },
  { categoryId: id('cat', 3), categoryName: 'Household', description: 'Cleaning and home essentials' },
  { categoryId: id('cat', 4), categoryName: 'Personal Care', description: 'Grooming and hygiene' },
  { categoryId: id('cat', 5), categoryName: 'Stationery', description: 'Office and school supplies' },
]

export const products: Product[] = Array.from({ length: 24 }).map((_, i) => {
  const c = categories[i % categories.length]!
  const base = 4 + (i % 7) * 1.75
  const stock = i % 9 === 0 ? 0 : i % 7 === 0 ? 4 : i % 5 === 0 ? 12 : 40 + (i % 8) * 6
  return {
    productId: id('prod', i + 1),
    name: `${c.categoryName} Item ${i + 1}`,
    price: Number((base + (i % 3) * 2.1).toFixed(2)),
    stockQty: stock,
    categoryId: c.categoryId,
    category: c,
  }
})

export const customers: CustomerAccount[] = Array.from({ length: 12 }).map((_, i) => ({
  customerId: id('cust', i + 1),
  firstName: ['Ava', 'Noah', 'Mia', 'Liam', 'Zara', 'Omar', 'Sara', 'Yusuf', 'Nina', 'Ethan', 'Hana', 'Adam'][i]!,
  lastName: ['Khan', 'Ali', 'Singh', 'Patel', 'Chen', 'Rahman', 'Wong', 'Ahmed', 'Ibrahim', 'Lee', 'Santos', 'Hughes'][i]!,
  email: `customer${i + 1}@iims.dev`,
  phone: `+1-555-01${String(i + 10).padStart(2, '0')}`,
  username: `customer${i + 1}`,
  password: 'Password123!',
  address: `${100 + i} Market Street, Suite ${i + 1}`,
  createdAt: daysAgo(60 - i * 3),
  isActive: i % 9 !== 0,
}))

export const admins: AdminAccount[] = Array.from({ length: 5 }).map((_, i) => ({
  adminId: id('admin', i + 1),
  firstName: ['Priya', 'James', 'Fatima', 'Henry', 'Aisha'][i]!,
  lastName: ['Shah', 'Miller', 'Hassan', 'Nguyen', 'Rahim'][i]!,
  email: `admin${i + 1}@iims.dev`,
  phone: `+1-555-90${i + 1}0`,
  username: `admin${i + 1}`,
  password: 'AdminPass123!',
  role: ADMIN_ROLES[i % ADMIN_ROLES.length]!,
  createdAt: daysAgo(180 - i * 12),
  isActive: true,
}))

export const orders: Order[] = Array.from({ length: 16 }).map((_, i) => {
  const customer = customers[i % customers.length]!
  const processed = i % 4 === 0 ? undefined : admins[i % admins.length]!
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length]!
  return {
    orderId: id('ord', i + 1),
    customerId: customer.customerId,
    customer,
    processedBy: processed?.adminId,
    admin: processed,
    datetime: daysAgo(20 - i),
    status,
  }
})

export const orderItems: OrderItem[] = orders.flatMap((o, idx) => {
  const count = 2 + (idx % 4)
  return Array.from({ length: count }).map((_, i) => {
    const p = products[(idx * 3 + i * 2) % products.length]!
    return { orderId: o.orderId, productId: p.productId, product: p, quantity: 1 + ((idx + i) % 3) }
  })
})

export const audit: AdminProductAudit[] = Array.from({ length: 60 }).map((_, i) => {
  const admin = admins[i % admins.length]!
  const product = products[i % products.length]!
  const action = (['created', 'updated', 'restocked', 'updated', 'updated', 'restocked'] as const)[i % 6]!
  return {
    adminId: admin.adminId,
    productId: product.productId,
    action,
    actionDatetime: daysAgo(45 - (i % 30)),
  }
})


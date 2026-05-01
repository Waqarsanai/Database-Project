import { http, HttpResponse } from 'msw'
import { db } from '@/mocks/db'
import { includesText, paginate, parseListParams } from '@/mocks/utils'
import { STOCK_THRESHOLDS } from '@/utils/constants'
import type { AppRole, AuthSession } from '@/types/auth'
import type { OrderStatus, Product } from '@/types/entities'

function json(data: any, init?: ResponseInit) {
  return HttpResponse.json(data, init)
}

function base64url(input: string) {
  return btoa(input).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function mockJwt(role: AppRole, sub: string) {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      sub,
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  )
  return `${header}.${payload}.`
}

function orderTotal(orderId: string) {
  const items = db.orderItems.filter((i) => i.orderId === orderId)
  return items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0)
}

export const handlers = [
  // Auth
  http.post('/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string; role: AppRole }
    const { username, password, role } = body

    if (role === 'admin') {
      const admin = db.admins.find((a) => a.username === username && a.password === password)
      if (!admin) return json({ message: 'Invalid admin credentials' }, { status: 401 })
      const session: AuthSession = {
        token: mockJwt('admin', admin.adminId),
        refreshToken: `mock-rt-${admin.adminId}`,
        role: 'admin',
        user: { id: admin.adminId, firstName: admin.firstName, lastName: admin.lastName, email: admin.email, username: admin.username },
      }
      return json(session)
    }

    const customer = db.customers.find((c) => c.username === username && c.password === password)
    if (!customer) return json({ message: 'Invalid customer credentials' }, { status: 401 })
    const session: AuthSession = {
      token: mockJwt('customer', customer.customerId),
      refreshToken: `mock-rt-${customer.customerId}`,
      role: 'customer',
      user: { id: customer.customerId, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, username: customer.username },
    }
    return json(session)
  }),

  http.post('/auth/register', async ({ request }) => {
    const body = (await request.json()) as any
    const exists = db.customers.some((c) => c.username === body.username || c.email === body.email)
    if (exists) return json({ message: 'Account already exists' }, { status: 409 })
    const customerId = `cust-${String(db.customers.length + 1).padStart(4, '0')}`
    const customer = {
      customerId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      username: body.username,
      password: body.password,
      address: body.address,
      createdAt: new Date().toISOString(),
      isActive: true,
    }
    db.customers.unshift(customer)
    const session: AuthSession = {
      token: mockJwt('customer', customerId),
      refreshToken: `mock-rt-${customerId}`,
      role: 'customer',
      user: { id: customerId, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, username: customer.username },
    }
    return json(session, { status: 201 })
  }),

  http.post('/auth/logout', () => json({ ok: true as const })),
  http.post('/auth/refresh', () => json({ message: 'Refresh not implemented in mock' }, { status: 501 })),

  // Categories
  http.get('/categories', ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, search, sortBy, order } = parseListParams(url)
    let all = [...db.categories]
    all = all.filter((c) => includesText(c.categoryName, search) || includesText(c.description, search))
    if (sortBy) {
      all.sort((a: any, b: any) => {
        const av = a[sortBy]
        const bv = b[sortBy]
        const res = String(av ?? '').localeCompare(String(bv ?? ''))
        return order === 'asc' ? res : -res
      })
    }
    return json(paginate(all, page, limit))
  }),

  http.post('/categories', async ({ request }) => {
    const body = (await request.json()) as { categoryName: string; description: string }
    const categoryId = `cat-${String(db.categories.length + 1).padStart(4, '0')}`
    const cat = { categoryId, categoryName: body.categoryName, description: body.description }
    db.categories.unshift(cat)
    return json(cat, { status: 201 })
  }),

  http.put('/categories/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<{ categoryName: string; description: string }>
    const id = String(params.id)
    const idx = db.categories.findIndex((c) => c.categoryId === id)
    if (idx < 0) return json({ message: 'Category not found' }, { status: 404 })
    db.categories[idx] = { ...db.categories[idx]!, ...body }
    return json(db.categories[idx]!)
  }),

  http.delete('/categories/:id', ({ params }) => {
    const id = String(params.id)
    db.categories = db.categories.filter((c) => c.categoryId !== id)
    db.products = db.products.map((p) => (p.categoryId === id ? { ...p, categoryId: db.categories[0]!.categoryId } : p))
    return json({ ok: true as const })
  }),

  // Products
  http.get('/products', ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, search, sortBy, order } = parseListParams(url)
    const categoryId = url.searchParams.get('categoryId') ?? undefined
    const stock = url.searchParams.get('stock') as any

    let all = [...db.products].map((p) => ({ ...p, category: db.categories.find((c) => c.categoryId === p.categoryId) }))
    if (categoryId) all = all.filter((p) => p.categoryId === categoryId)
    if (stock === 'out_of_stock') all = all.filter((p) => p.stockQty === 0)
    if (stock === 'low_stock') all = all.filter((p) => p.stockQty > 0 && p.stockQty < STOCK_THRESHOLDS.low)
    if (stock === 'in_stock') all = all.filter((p) => p.stockQty >= STOCK_THRESHOLDS.low)

    all = all.filter((p) => includesText(p.name, search) || includesText(p.productId, search))

    if (sortBy) {
      all.sort((a: any, b: any) => {
        const av = a[sortBy]
        const bv = b[sortBy]
        const res = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''))
        return order === 'asc' ? res : -res
      })
    }

    return json(paginate(all, page, limit))
  }),

  http.get('/products/:id', ({ params }) => {
    const id = String(params.id)
    const p = db.products.find((x) => x.productId === id)
    if (!p) return json({ message: 'Product not found' }, { status: 404 })
    return json({ ...p, category: db.categories.find((c) => c.categoryId === p.categoryId) })
  }),

  http.post('/products', async ({ request }) => {
    const body = (await request.json()) as { name: string; price: number; stockQty: number; categoryId: string }
    const productId = `prod-${String(db.products.length + 1).padStart(4, '0')}`
    const p: Product = { productId, ...body, category: db.categories.find((c) => c.categoryId === body.categoryId) }
    db.products.unshift(p)
    return json(p, { status: 201 })
  }),

  http.put('/products/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as Partial<Product>
    const idx = db.products.findIndex((p) => p.productId === id)
    if (idx < 0) return json({ message: 'Product not found' }, { status: 404 })
    db.products[idx] = { ...db.products[idx]!, ...body }
    return json({ ...db.products[idx]!, category: db.categories.find((c) => c.categoryId === db.products[idx]!.categoryId) })
  }),

  http.delete('/products/:id', ({ params }) => {
    const id = String(params.id)
    db.products = db.products.filter((p) => p.productId !== id)
    return json({ ok: true as const })
  }),

  // Orders
  http.get('/orders', ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, search, sortBy, order } = parseListParams(url)
    const status = url.searchParams.get('status') as OrderStatus | null
    const customerId = url.searchParams.get('customerId')

    let all = [...db.orders].map((o) => ({
      ...o,
      customer: db.customers.find((c) => c.customerId === o.customerId),
      admin: o.processedBy ? db.admins.find((a) => a.adminId === o.processedBy) : undefined,
      items: db.orderItems.filter((i) => i.orderId === o.orderId),
    }))
    if (status) all = all.filter((o) => o.status === status)
    if (customerId) all = all.filter((o) => o.customerId === customerId)
    all = all.filter((o) => includesText(o.orderId, search) || includesText(o.customer?.firstName, search) || includesText(o.customer?.lastName, search))

    if (sortBy) {
      all.sort((a: any, b: any) => {
        const av = a[sortBy]
        const bv = b[sortBy]
        const res = String(av ?? '').localeCompare(String(bv ?? ''))
        return order === 'asc' ? res : -res
      })
    }

    return json(paginate(all, page, limit))
  }),

  http.get('/orders/:id', ({ params }) => {
    const id = String(params.id)
    const o = db.orders.find((x) => x.orderId === id)
    if (!o) return json({ message: 'Order not found' }, { status: 404 })
    const items = db.orderItems.filter((i) => i.orderId === id)
    return json({
      ...o,
      customer: db.customers.find((c) => c.customerId === o.customerId),
      admin: o.processedBy ? db.admins.find((a) => a.adminId === o.processedBy) : undefined,
      items,
    })
  }),

  http.get('/orders/:id/items', ({ params }) => {
    const id = String(params.id)
    return json(db.orderItems.filter((i) => i.orderId === id))
  }),

  http.post('/orders', async ({ request }) => {
    const body = (await request.json()) as { customerId: string; items: Array<{ productId: string; quantity: number }>; address: string }
    const orderId = `ord-${String(db.orders.length + 1).padStart(4, '0')}`
    const order = {
      orderId,
      customerId: body.customerId,
      processedBy: undefined,
      datetime: new Date().toISOString(),
      status: 'pending' as const,
    }
    db.orders.unshift(order as any)
    body.items.forEach((it) => {
      const p = db.products.find((x) => x.productId === it.productId)
      if (!p) return
      db.orderItems.push({ orderId, productId: it.productId, product: p, quantity: it.quantity })
      p.stockQty = Math.max(0, p.stockQty - it.quantity)
    })
    return json({ ...order, items: db.orderItems.filter((i) => i.orderId === orderId) }, { status: 201 })
  }),

  http.put('/orders/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as any
    const idx = db.orders.findIndex((o) => o.orderId === id)
    if (idx < 0) return json({ message: 'Order not found' }, { status: 404 })
    db.orders[idx] = { ...db.orders[idx]!, ...body }
    return json(db.orders[idx]!)
  }),

  http.patch('/orders/:id/status', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as { status: OrderStatus }
    const idx = db.orders.findIndex((o) => o.orderId === id)
    if (idx < 0) return json({ message: 'Order not found' }, { status: 404 })
    db.orders[idx] = { ...db.orders[idx]!, status: body.status }
    return json(db.orders[idx]!)
  }),

  // Customers
  http.get('/customers', ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, search } = parseListParams(url)
    let all = [...db.customers]
    all = all.filter((c) => includesText(c.firstName, search) || includesText(c.lastName, search) || includesText(c.email, search) || includesText(c.username, search))
    return json(paginate(all, page, limit))
  }),

  http.get('/customers/:id', ({ params }) => {
    const id = String(params.id)
    const c = db.customers.find((x) => x.customerId === id)
    if (!c) return json({ message: 'Customer not found' }, { status: 404 })
    return json(c)
  }),

  http.put('/customers/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as any
    const idx = db.customers.findIndex((c) => c.customerId === id)
    if (idx < 0) return json({ message: 'Customer not found' }, { status: 404 })
    db.customers[idx] = { ...db.customers[idx]!, ...body }
    return json(db.customers[idx]!)
  }),

  http.patch('/customers/:id/status', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as { isActive: boolean }
    const idx = db.customers.findIndex((c) => c.customerId === id)
    if (idx < 0) return json({ message: 'Customer not found' }, { status: 404 })
    db.customers[idx] = { ...db.customers[idx]!, isActive: body.isActive }
    return json(db.customers[idx]!)
  }),

  // Admins
  http.get('/admins', ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, search } = parseListParams(url)
    let all = [...db.admins]
    all = all.filter((a) => includesText(a.firstName, search) || includesText(a.lastName, search) || includesText(a.email, search) || includesText(a.username, search))
    return json(paginate(all, page, limit))
  }),

  http.get('/admins/:id', ({ params }) => {
    const id = String(params.id)
    const a = db.admins.find((x) => x.adminId === id)
    if (!a) return json({ message: 'Admin not found' }, { status: 404 })
    return json(a)
  }),

  http.put('/admins/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as any
    const idx = db.admins.findIndex((a) => a.adminId === id)
    if (idx < 0) return json({ message: 'Admin not found' }, { status: 404 })
    db.admins[idx] = { ...db.admins[idx]!, ...body }
    return json(db.admins[idx]!)
  }),

  http.post('/admins', async ({ request }) => {
    const body = (await request.json()) as any
    const adminId = `admin-${String(db.admins.length + 1).padStart(4, '0')}`
    const admin = {
      adminId,
      firstName: body.firstName ?? 'New',
      lastName: body.lastName ?? 'Admin',
      email: body.email ?? `new-admin-${adminId}@iims.dev`,
      phone: body.phone ?? '+1-555-0000',
      username: body.username,
      password: body.password,
      role: body.role,
      createdAt: new Date().toISOString(),
      isActive: true,
    }
    db.admins.unshift(admin)
    return json(admin, { status: 201 })
  }),

  // Admin audit
  http.get('/admin-products/audit', ({ request }) => {
    const url = new URL(request.url)
    const { page, limit, search } = parseListParams(url)
    let all = [...db.audit].map((a) => ({
      ...a,
      adminName: db.admins.find((x) => x.adminId === a.adminId)?.firstName,
      productName: db.products.find((x) => x.productId === a.productId)?.name,
    }))
    all = all.filter((r) => includesText(r.adminName, search) || includesText(r.productName, search))
    return json(paginate(all, page, limit))
  }),

  // Analytics (realistic-enough aggregates over mock db)
  http.get('/analytics/low-stock', () => {
    const low = db.products.filter((p) => p.stockQty > 0 && p.stockQty < STOCK_THRESHOLDS.low).map((p) => p.productId)
    const critical = db.products.filter((p) => p.stockQty > 0 && p.stockQty < STOCK_THRESHOLDS.critical).map((p) => p.productId)
    const out = db.products.filter((p) => p.stockQty === 0).map((p) => p.productId)
    return json([...new Set([...critical, ...low, ...out])])
  }),

  http.get('/analytics/top-products', () => {
    const byProd = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>()
    db.orderItems.forEach((it) => {
      const p = it.product ?? db.products.find((x) => x.productId === it.productId)
      if (!p) return
      const cur = byProd.get(p.productId) ?? { productId: p.productId, name: p.name, quantity: 0, revenue: 0 }
      cur.quantity += it.quantity
      cur.revenue += it.quantity * p.price
      byProd.set(p.productId, cur)
    })
    const rows = [...byProd.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5).map((r) => ({ ...r, revenue: Number(r.revenue.toFixed(2)) }))
    return json(rows)
  }),

  http.get('/analytics/sales', () => {
    // last 30 days synthetic from orders
    const points = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const date = d.toISOString().slice(0, 10)
      const dayOrders = db.orders.filter((o) => o.datetime.slice(0, 10) === date)
      const revenue = dayOrders.reduce((sum, o) => sum + orderTotal(o.orderId), 0)
      return { date, revenue: Number(revenue.toFixed(2)), orders: dayOrders.length }
    })
    return json(points)
  }),

  http.get('/analytics/category-performance', () => {
    const map = new Map<string, { categoryId: string; categoryName: string; revenue: number; units: number }>()
    db.orderItems.forEach((it) => {
      const p = it.product ?? db.products.find((x) => x.productId === it.productId)
      if (!p) return
      const cat = db.categories.find((c) => c.categoryId === p.categoryId)
      if (!cat) return
      const cur = map.get(cat.categoryId) ?? { categoryId: cat.categoryId, categoryName: cat.categoryName, revenue: 0, units: 0 }
      cur.units += it.quantity
      cur.revenue += it.quantity * p.price
      map.set(cat.categoryId, cur)
    })
    return json([...map.values()].map((r) => ({ ...r, revenue: Number(r.revenue.toFixed(2)) })))
  }),

  http.get('/analytics/demand-forecast', ({ request }) => {
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId') ?? db.products[0]!.productId
    const base = 8 + (Number(productId.replace(/\D/g, '')) % 10)
    const points = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const demand = base + Math.sin(i / 4) * 2 + (i % 7 === 0 ? 2 : 0)
      return {
        date: d.toISOString().slice(0, 10),
        demand: Number(demand.toFixed(1)),
        lower: Number((demand * 0.8).toFixed(1)),
        upper: Number((demand * 1.2).toFixed(1)),
      }
    })
    return json(points)
  }),

  http.get('/analytics/recommendations', () => {
    const pairs = [
      { a: db.products[0]!, b: db.products[3]!, supportPct: 6.2, confidencePct: 34.5 },
      { a: db.products[2]!, b: db.products[7]!, supportPct: 5.4, confidencePct: 29.1 },
      { a: db.products[5]!, b: db.products[1]!, supportPct: 4.7, confidencePct: 25.8 },
      { a: db.products[9]!, b: db.products[4]!, supportPct: 4.2, confidencePct: 22.7 },
      { a: db.products[11]!, b: db.products[8]!, supportPct: 3.9, confidencePct: 19.4 },
    ].map(({ a, b, supportPct, confidencePct }) => ({
      productAId: a.productId,
      productAName: a.name,
      productBId: b.productId,
      productBName: b.name,
      supportPct,
      confidencePct,
    }))
    return json(pairs)
  }),

  http.get('/analytics/recommendations-ids', ({ request }) => {
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')
    const customerId = url.searchParams.get('customerId')
    const idx = productId
      ? db.products.findIndex((p) => p.productId === productId)
      : customerId
        ? Number(customerId.replace(/\D/g, '')) % db.products.length
        : 0
    const ids = Array.from({ length: 10 }).map((_, i) => db.products[(idx + i * 3) % db.products.length]!.productId)
    return json({ customerId: customerId ?? undefined, productIds: ids })
  }),

  http.get('/analytics/low-stock-forecast', () => {
    const rows = db.products
      .map((p) => {
        const avgDailySales = 0.6 + ((Number(p.productId.replace(/\D/g, '')) % 10) / 10) * 3.2
        const daysRemaining = avgDailySales > 0 ? p.stockQty / avgDailySales : Infinity
        return { productId: p.productId, name: p.name, stockQty: p.stockQty, avgDailySales: Number(avgDailySales.toFixed(2)), daysRemaining: Number(daysRemaining.toFixed(1)) }
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 12)
    return json(rows)
  }),
]


import { apiClient } from '@/api'
import type { Order, OrderItem, OrderStatus } from '@/types/entities'
import type { ListQueryParams, PaginatedResponse } from '@/types/pagination'

export interface OrdersQueryParams extends ListQueryParams {
  status?: OrderStatus
  from?: string
  to?: string
  customerId?: string
}

export interface CreateOrderDTO {
  customerId: string
  items: Array<{ productId: string; quantity: number }>
  address: string
}

export const getOrders = (params: OrdersQueryParams): Promise<PaginatedResponse<Order>> =>
  apiClient.get('/orders', { params }).then((r) => r.data)

export const getOrderById = (id: string): Promise<Order> =>
  apiClient.get(`/orders/${id}`).then((r) => r.data)

export const createOrder = (body: CreateOrderDTO): Promise<Order> =>
  apiClient.post('/orders', body).then((r) => r.data)

export const updateOrder = (id: string, body: Partial<Order>): Promise<Order> =>
  apiClient.put(`/orders/${id}`, body).then((r) => r.data)

export const patchOrderStatus = (
  id: string,
  status: OrderStatus,
): Promise<Order> => apiClient.patch(`/orders/${id}/status`, { status }).then((r) => r.data)

export const getOrderItems = (orderId: string): Promise<OrderItem[]> =>
  apiClient.get(`/orders/${orderId}/items`).then((r) => r.data)


import { apiClient } from '@/api'
import type { CustomerAccount } from '@/types/entities'
import type { ListQueryParams, PaginatedResponse } from '@/types/pagination'

export interface CustomersQueryParams extends ListQueryParams {
  isActive?: boolean
}

export const getCustomers = (
  params: CustomersQueryParams,
): Promise<PaginatedResponse<CustomerAccount>> =>
  apiClient.get('/customers', { params }).then((r) => r.data)

export const getCustomerById = (id: string): Promise<CustomerAccount> =>
  apiClient.get(`/customers/${id}`).then((r) => r.data)

export const updateCustomer = (
  id: string,
  body: Partial<CustomerAccount>,
): Promise<CustomerAccount> => apiClient.put(`/customers/${id}`, body).then((r) => r.data)

export const patchCustomerStatus = (
  id: string,
  isActive: boolean,
): Promise<CustomerAccount> =>
  apiClient.patch(`/customers/${id}/status`, { isActive }).then((r) => r.data)


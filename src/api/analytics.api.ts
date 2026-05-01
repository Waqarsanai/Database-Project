import { apiClient } from '@/api'
import type {
  CategoryPerformancePoint,
  DemandForecastPoint,
  LowStockForecastRow,
  MarketBasketPair,
  RecommendationsResponse,
  SalesPoint,
  TopProductPoint,
} from '@/types/analytics'
import type { ListQueryParams } from '@/types/pagination'

export interface AnalyticsQueryParams extends ListQueryParams {
  from?: string
  to?: string
  period?: 'day' | 'week' | 'month'
}

export const getSalesAnalytics = (params: AnalyticsQueryParams): Promise<SalesPoint[]> =>
  apiClient.get('/analytics/sales', { params }).then((r) => r.data)

export const getTopProducts = (params: AnalyticsQueryParams): Promise<TopProductPoint[]> =>
  apiClient.get('/analytics/top-products', { params }).then((r) => r.data)

export const getCategoryPerformance = (
  params: AnalyticsQueryParams,
): Promise<CategoryPerformancePoint[]> =>
  apiClient.get('/analytics/category-performance', { params }).then((r) => r.data)

export const getDemandForecast = (
  productId: string,
  params: AnalyticsQueryParams,
): Promise<DemandForecastPoint[]> =>
  apiClient.get('/analytics/demand-forecast', { params: { ...params, productId } }).then((r) => r.data)

export const getMarketBasket = (params: AnalyticsQueryParams): Promise<MarketBasketPair[]> =>
  apiClient.get('/analytics/recommendations', { params }).then((r) => r.data)

export const getLowStock = (params: AnalyticsQueryParams): Promise<string[]> =>
  apiClient.get('/analytics/low-stock', { params }).then((r) => r.data)

export const getLowStockForecast = (
  params: AnalyticsQueryParams,
): Promise<LowStockForecastRow[]> =>
  apiClient.get('/analytics/low-stock-forecast', { params }).then((r) => r.data)

export const getRecommendations = (
  params: { customerId?: string; productId?: string } & AnalyticsQueryParams,
): Promise<RecommendationsResponse> =>
  apiClient.get('/analytics/recommendations-ids', { params }).then((r) => r.data)


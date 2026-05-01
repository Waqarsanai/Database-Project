export interface SalesPoint {
  date: string
  revenue: number
  orders: number
}

export interface TopProductPoint {
  productId: string
  name: string
  quantity: number
  revenue: number
}

export interface CategoryPerformancePoint {
  categoryId: string
  categoryName: string
  revenue: number
  units: number
}

export interface DemandForecastPoint {
  date: string
  demand: number
  lower: number
  upper: number
}

export interface MarketBasketPair {
  productAId: string
  productAName: string
  productBId: string
  productBName: string
  supportPct: number
  confidencePct: number
}

export interface LowStockForecastRow {
  productId: string
  name: string
  stockQty: number
  avgDailySales: number
  daysRemaining: number
}

export interface RecommendationsResponse {
  customerId?: string
  productIds: string[]
}


import type { Product } from '@/types/entities'
import { ProductCard } from '@/components/shared/ProductCard'

export function RecommendationCarousel({ products }: { products: Product[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex min-w-max gap-5 py-1">
        {products.map((p) => (
          <div key={p.productId} className="w-[290px] shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  )
}

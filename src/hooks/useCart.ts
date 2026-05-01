import { useMemo } from 'react'
import { cartStore } from '@/store/cartStore'

export function useCart() {
  const items = cartStore((s) => s.items)
  const addItem = cartStore((s) => s.addItem)
  const removeItem = cartStore((s) => s.removeItem)
  const updateQty = cartStore((s) => s.updateQty)
  const clearCart = cartStore((s) => s.clearCart)
  const subtotal = cartStore((s) => s.subtotal)
  const totalItems = cartStore((s) => s.totalItems)

  return useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      subtotal: subtotal(),
      totalItems: totalItems(),
    }),
    [items, addItem, removeItem, updateQty, clearCart, subtotal, totalItems],
  )
}


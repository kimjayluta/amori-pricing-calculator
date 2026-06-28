import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getProductsWithPricing } from '@/actions/products'
import { ProductsTable } from '@/components/products/products-table'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'

export default async function ProductsPage() {
  const result = await getProductsWithPricing()

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your product catalog.
          </p>
        </div>
        <Link
          href="/products/new"
          className={buttonVariants()}
        >
          <Plus className="size-4" />
          Add Product
        </Link>
      </div>

      {result.success ? (
        <ProductsTable products={result.data} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Failed to load products. Please try again.
        </p>
      )}
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { getProduct } from '@/actions/products'
import { getPricingVersions } from '@/actions/pricing'
import { VersionsTable } from '@/components/pricing/versions-table'
import { buttonVariants } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ productId: string }>
}

export default async function PricingHistoryPage({ params }: PageProps) {
  const { productId } = await params
  const productIdNum = parseInt(productId, 10)
  if (isNaN(productIdNum)) notFound()

  const [productResult, versionsResult] = await Promise.all([
    getProduct(productIdNum),
    getPricingVersions(productIdNum),
  ])

  if (!productResult.success) notFound()
  const product = productResult.data
  const versions = versionsResult.success ? versionsResult.data : []

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 p-8">
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Products
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-sm text-muted-foreground">
            {versions.length} pricing version{versions.length !== 1 ? 's' : ''}
            {product.category ? ` · ${product.category}` : ''}
          </p>
        </div>
        <Link
          href={`/pricing/${productIdNum}/new`}
          className={buttonVariants()}
        >
          <Plus className="size-4" />
          New Version
        </Link>
      </div>

      <VersionsTable versions={versions} productId={productIdNum} />
    </div>
  )
}

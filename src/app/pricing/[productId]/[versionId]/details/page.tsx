import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getProduct } from '@/actions/products'
import { getPricingVersion } from '@/actions/pricing'
import { VersionDetail } from '@/components/pricing/version-detail'

interface PageProps {
  params: Promise<{ productId: string; versionId: string }>
}

export default async function VersionDetailPage({ params }: PageProps) {
  const { productId, versionId } = await params
  const productIdNum = parseInt(productId, 10)
  const versionIdNum = parseInt(versionId, 10)

  if (isNaN(productIdNum) || isNaN(versionIdNum)) notFound()

  const [productResult, versionResult] = await Promise.all([
    getProduct(productIdNum),
    getPricingVersion(versionIdNum),
  ])

  if (!productResult.success || !versionResult.success) notFound()

  const product = productResult.data
  const version = versionResult.data

  // Guard: version must belong to this product
  if (version.product_id !== productIdNum) notFound()

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 p-8">
      {/* Breadcrumb */}
      <div data-print-hide className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronLeft className="size-3.5 rotate-180" />
          <Link
            href={`/pricing/${productIdNum}`}
            className="hover:text-foreground"
          >
            {product.name}
          </Link>
          <ChevronLeft className="size-3.5 rotate-180" />
          <span className="text-foreground">{version.version_name}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {version.version_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {product.name}
          {product.category ? ` · ${product.category}` : ''}
        </p>
      </div>

      <VersionDetail product={product} version={version} />
    </div>
  )
}

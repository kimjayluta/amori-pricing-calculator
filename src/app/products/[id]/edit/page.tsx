import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { getProduct } from '@/actions/products'
import { getPricingVersions } from '@/actions/pricing'
import { ProductForm } from '@/components/products/product-form'
import { VersionsTable } from '@/components/pricing/versions-table'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const productId = parseInt(id, 10)

  if (isNaN(productId)) notFound()

  const [productResult, versionsResult] = await Promise.all([
    getProduct(productId),
    getPricingVersions(productId),
  ])

  if (!productResult.success) notFound()

  const product = productResult.data
  const versions = versionsResult.success ? versionsResult.data : []

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 p-8">
      <Link
        href="/products"
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        <ChevronLeft className="size-4" />
        Back to Products
      </Link>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
          <CardDescription>{product.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={{
              id: product.id,
              name: product.name,
              category: product.category,
              description: product.description,
              dimensions: product.dimensions,
              image_url: product.image_url,
            }}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pricing Versions</h2>
          <Link
            href={`/pricing/${productId}/new`}
            className={buttonVariants({ size: 'sm' })}
          >
            <Plus className="size-4" />
            New Version
          </Link>
        </div>
        <VersionsTable versions={versions} productId={productId} />
      </div>
    </div>
  )
}

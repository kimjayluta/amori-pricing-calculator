import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getProduct } from '@/actions/products'
import { ProductForm } from '@/components/products/product-form'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const productId = parseInt(id, 10)

  if (isNaN(productId)) notFound()

  const result = await getProduct(productId)
  if (!result.success) notFound()

  const product = result.data

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link
        href="/products"
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        <ChevronLeft className="size-4" />
        Back to Products
      </Link>

      <Card>
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
    </div>
  )
}

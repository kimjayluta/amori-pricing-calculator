import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/products/product-form'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NewProductPage() {
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
          <CardTitle>New Product</CardTitle>
          <CardDescription>
            Fill in the product details. After saving you&apos;ll be taken to set up pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  )
}

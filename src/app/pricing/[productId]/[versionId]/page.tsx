import { notFound } from 'next/navigation'
import { getProduct } from '@/actions/products'
import { getPricingVersion } from '@/actions/pricing'
import { getLibraryMaterials } from '@/actions/material-library'
import { PricingCalculator } from '@/components/pricing/pricing-calculator'

interface PageProps {
  params: Promise<{ productId: string; versionId: string }>
}

export default async function PricingPage({ params }: PageProps) {
  const { productId, versionId } = await params
  const productIdNum = parseInt(productId, 10)
  if (isNaN(productIdNum)) notFound()

  const [productResult, libraryResult] = await Promise.all([
    getProduct(productIdNum),
    getLibraryMaterials(),
  ])

  if (!productResult.success) notFound()

  const isNew = versionId === 'new'
  let existingVersion = null

  if (!isNew) {
    const versionIdNum = parseInt(versionId, 10)
    if (isNaN(versionIdNum)) notFound()
    const vr = await getPricingVersion(versionIdNum)
    if (!vr.success) notFound()
    existingVersion = vr.data
  }

  return (
    <PricingCalculator
      key={versionId}
      product={productResult.data}
      existingVersion={existingVersion}
      libraryMaterials={libraryResult.success ? libraryResult.data : []}
      productId={productIdNum}
      isNew={isNew}
    />
  )
}

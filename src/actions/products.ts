'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

const ok = <T>(data: T) => ({ success: true as const, data })
const fail = (error: string) => ({ success: false as const, error })

export type ProductInput = {
  name: string
  category: string
  description?: string | null
  dimensions?: string | null
  image_url?: string | null
}

export async function getProducts() {
  try {
    const data = await prisma.product.findMany({
      where: { is_archived: false },
      include: { _count: { select: { pricing_versions: true } } },
      orderBy: { created_at: 'desc' },
    })
    return ok(data)
  } catch {
    return fail('Failed to fetch products')
  }
}

export async function getProduct(id: number) {
  try {
    const data = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        pricing_versions: { orderBy: { created_at: 'desc' } },
      },
    })
    return ok(data)
  } catch {
    return fail('Product not found')
  }
}

export async function createProduct(data: ProductInput) {
  try {
    const product = await prisma.product.create({ data })
    revalidatePath('/')
    return ok(product)
  } catch {
    return fail('Failed to create product')
  }
}

export async function updateProduct(id: number, data: Partial<ProductInput>) {
  try {
    const product = await prisma.product.update({ where: { id }, data })
    revalidatePath('/')
    return ok(product)
  } catch {
    return fail('Failed to update product')
  }
}

export async function archiveProduct(id: number) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { is_archived: true },
    })
    revalidatePath('/')
    return ok(product)
  } catch {
    return fail('Failed to archive product')
  }
}

export async function restoreProduct(id: number) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { is_archived: false },
    })
    revalidatePath('/')
    return ok(product)
  } catch {
    return fail('Failed to restore product')
  }
}

export async function duplicateProduct(id: number) {
  try {
    const original = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        pricing_versions: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: { materials: true },
        },
      },
    })

    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      pricing_versions,
      ...productData
    } = original

    const newProduct = await prisma.product.create({
      data: { ...productData, name: `${productData.name} (Copy)`, is_archived: false },
    })

    const source = pricing_versions[0]
    if (source) {
      const {
        id: _vid,
        product_id: _pid,
        created_at: _vca,
        materials,
        ...versionData
      } = source

      await prisma.pricingVersion.create({
        data: {
          ...versionData,
          product_id: newProduct.id,
          materials: {
            create: materials.map(
              ({ id: _mid, pricing_version_id: _pvid, created_at: _mca, ...mat }) => mat,
            ),
          },
        },
      })
    }

    revalidatePath('/')
    return ok(newProduct)
  } catch {
    return fail('Failed to duplicate product')
  }
}

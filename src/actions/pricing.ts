'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

const ok = <T>(data: T) => ({ success: true as const, data })
const fail = (error: string) => ({ success: false as const, error })

export type PricingVersionInput = {
  version_name: string
  labor_cost: number
  overhead_percentage: number
  overhead_cost: number
  contingency_percentage: number
  contingency_cost: number
  target_margin: number
  materials_total: number
  total_product_cost: number
  suggested_selling_price: number
  final_selling_price: number
  profit: number
  actual_margin: number
}

export async function getPricingVersions(productId: number) {
  try {
    const data = await prisma.pricingVersion.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
    })
    return ok(data)
  } catch {
    return fail('Failed to fetch pricing versions')
  }
}

export async function getPricingVersion(id: number) {
  try {
    const data = await prisma.pricingVersion.findUniqueOrThrow({
      where: { id },
      include: { materials: { orderBy: { created_at: 'asc' } } },
    })
    return ok(data)
  } catch {
    return fail('Pricing version not found')
  }
}

export async function createPricingVersion(productId: number, data: PricingVersionInput) {
  try {
    const version = await prisma.pricingVersion.create({
      data: { ...data, product_id: productId },
    })
    revalidatePath('/')
    return ok(version)
  } catch {
    return fail('Failed to create pricing version')
  }
}

export async function updatePricingVersion(id: number, data: Partial<PricingVersionInput>) {
  try {
    const version = await prisma.pricingVersion.update({ where: { id }, data })
    revalidatePath('/')
    return ok(version)
  } catch {
    return fail('Failed to update pricing version')
  }
}

export async function deletePricingVersion(id: number) {
  try {
    await prisma.pricingVersion.delete({ where: { id } })
    revalidatePath('/')
    return ok({ id })
  } catch {
    return fail('Failed to delete pricing version')
  }
}

export async function duplicatePricingVersion(id: number) {
  try {
    const original = await prisma.pricingVersion.findUniqueOrThrow({
      where: { id },
      include: { materials: true },
    })

    const { id: _id, created_at: _ca, materials, ...versionData } = original

    const newVersion = await prisma.pricingVersion.create({
      data: {
        ...versionData,
        version_name: `${versionData.version_name} (Copy)`,
        materials: {
          create: materials.map(
            ({ id: _mid, pricing_version_id: _pvid, created_at: _mca, ...mat }) => mat,
          ),
        },
      },
    })

    revalidatePath('/')
    return ok(newVersion)
  } catch {
    return fail('Failed to duplicate pricing version')
  }
}

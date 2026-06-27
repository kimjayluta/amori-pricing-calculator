'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

const ok = <T>(data: T) => ({ success: true as const, data })
const fail = (error: string) => ({ success: false as const, error })

export type MaterialInput = {
  name: string
  unit_type: string
  costing_price: number
  quantity: number
  wastage_percentage: number
  wastage_cost: number
  total_cost: number
}

export async function getMaterials(pricingVersionId: number) {
  try {
    const data = await prisma.material.findMany({
      where: { pricing_version_id: pricingVersionId },
      orderBy: { created_at: 'asc' },
    })
    return ok(data)
  } catch {
    return fail('Failed to fetch materials')
  }
}

export async function createMaterial(pricingVersionId: number, data: MaterialInput) {
  try {
    const material = await prisma.material.create({
      data: { ...data, pricing_version_id: pricingVersionId },
    })
    revalidatePath('/')
    return ok(material)
  } catch {
    return fail('Failed to create material')
  }
}

export async function updateMaterial(id: number, data: Partial<MaterialInput>) {
  try {
    const material = await prisma.material.update({ where: { id }, data })
    revalidatePath('/')
    return ok(material)
  } catch {
    return fail('Failed to update material')
  }
}

export async function deleteMaterial(id: number) {
  try {
    await prisma.material.delete({ where: { id } })
    revalidatePath('/')
    return ok({ id })
  } catch {
    return fail('Failed to delete material')
  }
}

export async function duplicateMaterial(id: number) {
  try {
    const original = await prisma.material.findUniqueOrThrow({ where: { id } })
    const { id: _id, created_at: _ca, ...materialData } = original
    const material = await prisma.material.create({ data: materialData })
    revalidatePath('/')
    return ok(material)
  } catch {
    return fail('Failed to duplicate material')
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

const ok = <T>(data: T) => ({ success: true as const, data })
const fail = (error: string) => ({ success: false as const, error })

export type LibraryMaterialInput = {
  name: string
  category: string
  default_price: number
  unit: string
  supplier?: string | null
  notes?: string | null
}

export async function getLibraryMaterials(search?: string) {
  try {
    const data = await prisma.materialLibrary.findMany({
      where: search
        ? { OR: [{ name: { contains: search } }, { category: { contains: search } }] }
        : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return ok(data)
  } catch {
    return fail('Failed to fetch library materials')
  }
}

export async function createLibraryMaterial(data: LibraryMaterialInput) {
  try {
    const material = await prisma.materialLibrary.create({ data })
    revalidatePath('/')
    return ok(material)
  } catch {
    return fail('Failed to create library material')
  }
}

export async function updateLibraryMaterial(id: number, data: Partial<LibraryMaterialInput>) {
  try {
    const material = await prisma.materialLibrary.update({ where: { id }, data })
    revalidatePath('/')
    return ok(material)
  } catch {
    return fail('Failed to update library material')
  }
}

export async function deleteLibraryMaterial(id: number) {
  try {
    await prisma.materialLibrary.delete({ where: { id } })
    revalidatePath('/')
    return ok({ id })
  } catch {
    return fail('Failed to delete library material')
  }
}

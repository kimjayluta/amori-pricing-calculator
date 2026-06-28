'use server'

import { prisma } from '@/lib/prisma'

const ok = <T>(data: T) => ({ success: true as const, data })
const fail = (error: string) => ({ success: false as const, error })

export type MostProfitableItem = {
  id: number
  name: string
  category: string
  profit: number
  actual_margin: number
  final_selling_price: number
}

export type RecentProductItem = {
  id: number
  name: string
  category: string
  created_at: Date
  version_count: number
}

export type DashboardStats = {
  total_products: number
  avg_margin: number | null
  avg_selling_price: number | null
  avg_product_cost: number | null
  products_below_thirty: number
  most_profitable: MostProfitableItem[]
  recent_products: RecentProductItem[]
}

export async function getDashboardStats() {
  try {
    const products = await prisma.product.findMany({
      where: { is_archived: false },
      include: {
        pricing_versions: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        _count: { select: { pricing_versions: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    const withVersion = products.filter(p => p.pricing_versions.length > 0)

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null

    const avgMargin = avg(withVersion.map(p => p.pricing_versions[0].actual_margin))
    const avgSellingPrice = avg(
      withVersion.map(p => p.pricing_versions[0].final_selling_price),
    )
    const avgProductCost = avg(
      withVersion.map(p => p.pricing_versions[0].total_product_cost),
    )
    const productsBelowThirty = withVersion.filter(
      p => p.pricing_versions[0].actual_margin < 30,
    ).length

    const mostProfitable: MostProfitableItem[] = [...withVersion]
      .sort((a, b) => b.pricing_versions[0].profit - a.pricing_versions[0].profit)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        profit: p.pricing_versions[0].profit,
        actual_margin: p.pricing_versions[0].actual_margin,
        final_selling_price: p.pricing_versions[0].final_selling_price,
      }))

    const recentProducts: RecentProductItem[] = products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      created_at: p.created_at,
      version_count: p._count.pricing_versions,
    }))

    return ok({
      total_products: products.length,
      avg_margin: avgMargin,
      avg_selling_price: avgSellingPrice,
      avg_product_cost: avgProductCost,
      products_below_thirty: productsBelowThirty,
      most_profitable: mostProfitable,
      recent_products: recentProducts,
    } satisfies DashboardStats)
  } catch {
    return fail('Failed to load dashboard data')
  }
}

export type Material = { total_cost: number }

export type MarginStatus = 'danger' | 'warning' | 'good' | 'great' | 'excellent'

const r2 = (n: number) => Math.round(n * 100) / 100

export function computeWastageCost(
  cost: number,
  quantity: number,
  wastagePercent: number,
): number {
  return r2(cost * quantity * (wastagePercent / 100))
}

export function computeTotalMaterialCost(
  cost: number,
  quantity: number,
  wastageCost: number,
): number {
  return r2(cost * quantity + wastageCost)
}

export function computeMaterialsTotal(materials: Material[]): number {
  return r2(materials.reduce((sum, m) => sum + m.total_cost, 0))
}

// (Materials + Labor) × Overhead %
export function computeOverhead(
  materialsTotal: number,
  labor: number,
  overheadPercent: number,
): number {
  return r2((materialsTotal + labor) * (overheadPercent / 100))
}

// (Materials + Labor + Overhead) × Contingency %
export function computeContingency(
  materialsTotal: number,
  labor: number,
  overhead: number,
  contingencyPercent: number,
): number {
  return r2((materialsTotal + labor + overhead) * (contingencyPercent / 100))
}

export function computeTotalProductCost(
  materialsTotal: number,
  labor: number,
  overhead: number,
  contingency: number,
): number {
  return r2(materialsTotal + labor + overhead + contingency)
}

// Margin-based divisor: price = cost ÷ (1 − margin)
export function computeSuggestedSellingPrice(
  totalCost: number,
  targetMargin: number,
): number {
  return r2(totalCost / (1 - targetMargin / 100))
}

export function computeProfit(sellingPrice: number, totalCost: number): number {
  return r2(sellingPrice - totalCost)
}

// Profit ÷ Selling Price × 100  (margin is always against selling price, never cost)
export function computeActualMargin(profit: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0
  return r2((profit / sellingPrice) * 100)
}

export function getMarginStatus(margin: number): MarginStatus {
  if (margin < 30) return 'danger'
  if (margin < 40) return 'warning'
  if (margin <= 45) return 'good'
  if (margin <= 50) return 'great'
  return 'excellent'
}

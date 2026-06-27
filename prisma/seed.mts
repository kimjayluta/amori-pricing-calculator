import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.materialLibrary.createMany({
    data: [
      {
        name: 'Oak Wood Plank',
        category: 'Wood',
        default_price: 45.0,
        unit: 'board',
        supplier: 'TimberCo',
        notes: '2" x 8" x 8ft kiln-dried oak',
      },
      {
        name: 'Pine Wood Plank',
        category: 'Wood',
        default_price: 18.5,
        unit: 'board',
        supplier: 'TimberCo',
        notes: '2" x 6" x 8ft standard pine',
      },
      {
        name: 'Mahogany Board',
        category: 'Wood',
        default_price: 68.0,
        unit: 'board',
        supplier: 'ExoticWoods PH',
        notes: '1" x 10" x 8ft premium mahogany',
      },
      {
        name: 'Steel Rod 10mm',
        category: 'Metal',
        default_price: 8.5,
        unit: 'meter',
        supplier: 'SteelMart',
        notes: 'Round bar, Grade 40',
      },
      {
        name: 'Steel Sheet 1.2mm',
        category: 'Metal',
        default_price: 22.0,
        unit: 'sqft',
        supplier: 'SteelMart',
        notes: 'Cold-rolled, galvanized',
      },
      {
        name: 'Galvanized Wood Screws #10',
        category: 'Hardware',
        default_price: 0.45,
        unit: 'piece',
        supplier: 'FastenerHub',
        notes: '3" length, pack of 100 available',
      },
      {
        name: 'Metal L-Bracket 3"',
        category: 'Hardware',
        default_price: 3.5,
        unit: 'piece',
        supplier: 'FastenerHub',
        notes: 'Heavy-duty corner brace, zinc-plated',
      },
      {
        name: 'Wood Stain (Walnut)',
        category: 'Finishing',
        default_price: 12.0,
        unit: 'liter',
        supplier: 'PaintPro',
        notes: 'Oil-based penetrating stain',
      },
      {
        name: 'Polyurethane Varnish',
        category: 'Finishing',
        default_price: 15.0,
        unit: 'liter',
        supplier: 'PaintPro',
        notes: 'Gloss finish, water-resistant',
      },
      {
        name: 'Sandpaper 120-Grit',
        category: 'Abrasives',
        default_price: 1.5,
        unit: 'sheet',
        supplier: 'ToolDepot',
        notes: '9" x 11" aluminum oxide',
      },
    ],
  })

  // ─── Product 1: Wooden Dining Table ──────────────────────────────────────
  const diningMaterialsTotal = calcMaterials([
    { price: 45.0, qty: 8, wastage: 10 },  // Oak planks
    { price: 0.45, qty: 60, wastage: 5 },  // Screws
    { price: 12.0, qty: 2, wastage: 15 },  // Stain
    { price: 1.5, qty: 12, wastage: 0 },   // Sandpaper
  ])

  await prisma.product.create({
    data: {
      name: 'Wooden Dining Table',
      category: 'Wood Furniture',
      description: '6-seater solid oak dining table with tapered legs',
      dimensions: '180cm L x 90cm W x 76cm H',
      image_url: null,
      pricing_versions: {
        create: buildVersion('v1 - Standard', diningMaterialsTotal, {
          laborCost: 1200,
          overheadPct: 15,
          contingencyPct: 10,
          targetMargin: 35,
          materials: [
            { name: 'Oak Wood Plank', unit_type: 'board', costing_price: 45.0, quantity: 8, wastage_percentage: 10 },
            { name: 'Galvanized Wood Screws #10', unit_type: 'piece', costing_price: 0.45, quantity: 60, wastage_percentage: 5 },
            { name: 'Wood Stain (Walnut)', unit_type: 'liter', costing_price: 12.0, quantity: 2, wastage_percentage: 15 },
            { name: 'Sandpaper 120-Grit', unit_type: 'sheet', costing_price: 1.5, quantity: 12, wastage_percentage: 0 },
          ],
        }),
      },
    },
  })

  // ─── Product 2: Steel Bookshelf ──────────────────────────────────────────
  const shelfMaterialsTotal = calcMaterials([
    { price: 22.0, qty: 20, wastage: 8 },  // Steel sheet
    { price: 8.5, qty: 6, wastage: 5 },    // Steel rod
    { price: 3.5, qty: 16, wastage: 0 },   // L-brackets
  ])

  await prisma.product.create({
    data: {
      name: 'Steel Bookshelf',
      category: 'Metal Furniture',
      description: '5-tier industrial steel bookshelf with powder-coat finish',
      dimensions: '90cm W x 30cm D x 180cm H',
      image_url: null,
      pricing_versions: {
        create: buildVersion('v1 - Standard', shelfMaterialsTotal, {
          laborCost: 800,
          overheadPct: 20,
          contingencyPct: 8,
          targetMargin: 30,
          materials: [
            { name: 'Steel Sheet 1.2mm', unit_type: 'sqft', costing_price: 22.0, quantity: 20, wastage_percentage: 8 },
            { name: 'Steel Rod 10mm', unit_type: 'meter', costing_price: 8.5, quantity: 6, wastage_percentage: 5 },
            { name: 'Metal L-Bracket 3"', unit_type: 'piece', costing_price: 3.5, quantity: 16, wastage_percentage: 0 },
          ],
        }),
      },
    },
  })

  // ─── Product 3: Wooden Coffee Table ─────────────────────────────────────
  const coffeeMaterialsTotal = calcMaterials([
    { price: 18.5, qty: 4, wastage: 10 },  // Pine planks
    { price: 8.5, qty: 4, wastage: 5 },    // Steel rod legs
    { price: 15.0, qty: 1, wastage: 20 },  // Varnish
    { price: 1.5, qty: 8, wastage: 0 },    // Sandpaper
  ])

  await prisma.product.create({
    data: {
      name: 'Wooden Coffee Table',
      category: 'Wood Furniture',
      description: 'Low-profile pine coffee table with steel hairpin legs',
      dimensions: '120cm L x 60cm W x 45cm H',
      image_url: null,
      pricing_versions: {
        create: buildVersion('v1 - Standard', coffeeMaterialsTotal, {
          laborCost: 600,
          overheadPct: 15,
          contingencyPct: 10,
          targetMargin: 40,
          materials: [
            { name: 'Pine Wood Plank', unit_type: 'board', costing_price: 18.5, quantity: 4, wastage_percentage: 10 },
            { name: 'Steel Rod 10mm', unit_type: 'meter', costing_price: 8.5, quantity: 4, wastage_percentage: 5 },
            { name: 'Polyurethane Varnish', unit_type: 'liter', costing_price: 15.0, quantity: 1, wastage_percentage: 20 },
            { name: 'Sandpaper 120-Grit', unit_type: 'sheet', costing_price: 1.5, quantity: 8, wastage_percentage: 0 },
          ],
        }),
      },
    },
  })

  console.log('✔ Seed complete')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcMaterials(items: { price: number; qty: number; wastage: number }[]) {
  return items.reduce((sum, { price, qty, wastage }) => {
    const base = price * qty
    const wasteCost = base * (wastage / 100)
    return sum + base + wasteCost
  }, 0)
}

type MaterialRow = {
  name: string
  unit_type: string
  costing_price: number
  quantity: number
  wastage_percentage: number
}

function buildVersion(
  versionName: string,
  materialsTotal: number,
  opts: {
    laborCost: number
    overheadPct: number
    contingencyPct: number
    targetMargin: number
    materials: MaterialRow[]
  }
) {
  const overheadCost = round(materialsTotal * (opts.overheadPct / 100))
  const afterOverhead = materialsTotal + opts.laborCost + overheadCost
  const contingencyCost = round(afterOverhead * (opts.contingencyPct / 100))
  const totalProductCost = round(afterOverhead + contingencyCost)
  const suggestedSellingPrice = round(totalProductCost / (1 - opts.targetMargin / 100))
  const profit = round(suggestedSellingPrice - totalProductCost)
  const actualMargin = round((profit / suggestedSellingPrice) * 100)

  return {
    version_name: versionName,
    labor_cost: opts.laborCost,
    overhead_percentage: opts.overheadPct,
    overhead_cost: overheadCost,
    contingency_percentage: opts.contingencyPct,
    contingency_cost: contingencyCost,
    target_margin: opts.targetMargin,
    materials_total: round(materialsTotal),
    total_product_cost: totalProductCost,
    suggested_selling_price: suggestedSellingPrice,
    final_selling_price: suggestedSellingPrice,
    profit,
    actual_margin: actualMargin,
    materials: {
      create: opts.materials.map((m) => {
        const base = m.costing_price * m.quantity
        const wasteCost = round(base * (m.wastage_percentage / 100))
        return {
          name: m.name,
          unit_type: m.unit_type,
          costing_price: m.costing_price,
          quantity: m.quantity,
          wastage_percentage: m.wastage_percentage,
          wastage_cost: wasteCost,
          total_cost: round(base + wasteCost),
        }
      }),
    },
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

main().catch(console.error).finally(() => prisma.$disconnect())

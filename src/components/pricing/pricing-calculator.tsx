'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  computeWastageCost,
  computeTotalMaterialCost,
  computeMaterialsTotal,
  computeOverhead,
  computeContingency,
  computeTotalProductCost,
  computeSuggestedSellingPrice,
  computeProfit,
  computeActualMargin,
  getMarginStatus,
  type MarginStatus,
} from '@/lib/pricing-engine'
import { formatPeso, formatPercent, cn } from '@/lib/utils'
import { createPricingVersion, updatePricingVersion } from '@/actions/pricing'
import { createMaterial, deleteMaterial } from '@/actions/materials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  Plus,
  Copy,
  Trash2,
  BookOpen,
  Loader2,
  RotateCcw,
  Search,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Row = {
  _key: string
  id?: number
  name: string
  unit_type: string
  costing_price: number
  quantity: number
  wastage_percentage: number
  wastage_cost: number
  total_cost: number
}

type LibraryMaterial = {
  id: number
  name: string
  category: string
  default_price: number
  unit: string
}

type ExistingMaterial = {
  id: number
  name: string
  unit_type: string
  costing_price: number
  quantity: number
  wastage_percentage: number
  wastage_cost: number
  total_cost: number
}

type ExistingVersion = {
  id: number
  version_name: string
  labor_cost: number
  overhead_percentage: number
  contingency_percentage: number
  target_margin: number
  suggested_selling_price: number
  final_selling_price: number
  materials: ExistingMaterial[]
}

type PricingVersion = { id: number; version_name: string; created_at: Date }

type Product = {
  id: number
  name: string
  category: string
  pricing_versions: PricingVersion[]
}

export type PricingCalculatorProps = {
  product: Product
  existingVersion: ExistingVersion | null
  libraryMaterials: LibraryMaterial[]
  productId: number
  isNew: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN_PRESETS = [30, 35, 40, 45, 50] as const
type MarginPreset = (typeof MARGIN_PRESETS)[number]

const UNIT_TYPES = [
  'board', 'sheet', 'sqft', 'piece', 'meter',
  'liter', 'kg', 'set', 'pair', 'roll', 'bag', 'can',
]

const MARGIN_BADGE: Record<MarginStatus, string> = {
  danger:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  good:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  great:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  excellent: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _keyId = 0
const genKey = () => `row-${++_keyId}`

function buildRow(overrides?: Partial<Omit<Row, '_key' | 'wastage_cost' | 'total_cost'>>): Row {
  const base = {
    name: '',
    unit_type: 'piece',
    costing_price: 0,
    quantity: 1,
    wastage_percentage: 0,
    ...overrides,
  }
  const wastage_cost = computeWastageCost(base.costing_price, base.quantity, base.wastage_percentage)
  const total_cost = computeTotalMaterialCost(base.costing_price, base.quantity, wastage_cost)
  return { _key: genKey(), ...base, wastage_cost, total_cost }
}

function recompute(row: Row): Row {
  const wastage_cost = computeWastageCost(row.costing_price, row.quantity, row.wastage_percentage)
  const total_cost = computeTotalMaterialCost(row.costing_price, row.quantity, wastage_cost)
  return { ...row, wastage_cost, total_cost }
}

function getInitialPreset(margin: number): MarginPreset | 'custom' {
  return (MARGIN_PRESETS as readonly number[]).includes(margin)
    ? (margin as MarginPreset)
    : 'custom'
}

// ─── Library Dialog ───────────────────────────────────────────────────────────

function LibraryDialog({
  open,
  onClose,
  materials,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  materials: LibraryMaterial[]
  onAdd: (m: LibraryMaterial) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return materials
    const q = search.toLowerCase()
    return materials.filter(
      m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
    )
  }, [materials, search])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, LibraryMaterial[]>()
    for (const m of filtered) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return map
  }, [filtered])

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg flex flex-col gap-3" style={{ maxHeight: '85vh' }}>
        <DialogHeader>
          <DialogTitle>Import from Material Library</DialogTitle>
          <DialogDescription>
            Click a material to add it to the materials list.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search materials…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {grouped.size === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No materials found.
            </p>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {category}
                </p>
                <div className="space-y-0.5">
                  {items.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { onAdd(m); onClose() }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.unit}</p>
                      </div>
                      <span className="ml-4 shrink-0 font-mono tabular-nums text-muted-foreground">
                        {formatPeso(m.default_price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PricingCalculator({
  product,
  existingVersion,
  libraryMaterials,
  productId,
  isNew,
}: PricingCalculatorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const initialIdsRef = useRef<number[]>(
    existingVersion?.materials.map(m => m.id) ?? [],
  )

  // ── Material rows ────────────────────────────────────────────────────────
  const [rows, setRows] = useState<Row[]>(() =>
    existingVersion?.materials.length
      ? existingVersion.materials.map(m =>
          buildRow({ id: m.id, name: m.name, unit_type: m.unit_type,
            costing_price: m.costing_price, quantity: m.quantity,
            wastage_percentage: m.wastage_percentage }),
        )
      : [buildRow()],
  )

  // ── Pricing inputs ───────────────────────────────────────────────────────
  const [laborCost, setLaborCost] = useState(existingVersion?.labor_cost ?? 0)
  const [overheadPct, setOverheadPct] = useState(() => {
    if (existingVersion) return existingVersion.overhead_percentage
    if (typeof window !== 'undefined') {
      const v = parseFloat(localStorage.getItem('amori:overhead_pct') ?? '')
      if (!isNaN(v)) return v
    }
    return 15
  })
  const [contingencyPct, setContingencyPct] = useState(() => {
    if (existingVersion) return existingVersion.contingency_percentage
    if (typeof window !== 'undefined') {
      const v = parseFloat(localStorage.getItem('amori:contingency_pct') ?? '')
      if (!isNaN(v)) return v
    }
    return 10
  })
  const defaultMargin = (() => {
    if (existingVersion) return existingVersion.target_margin
    if (typeof window !== 'undefined') {
      const v = parseFloat(localStorage.getItem('amori:target_margin') ?? '')
      if (!isNaN(v)) return v
    }
    return 35
  })()
  const [marginPreset, setMarginPreset] = useState<MarginPreset | 'custom'>(
    existingVersion ? getInitialPreset(existingVersion.target_margin) : getInitialPreset(defaultMargin),
  )
  const [customMargin, setCustomMargin] = useState(defaultMargin)
  const [finalPriceOverride, setFinalPriceOverride] = useState<number | null>(
    existingVersion &&
    existingVersion.final_selling_price !== existingVersion.suggested_selling_price
      ? existingVersion.final_selling_price
      : null,
  )
  const [versionName, setVersionName] = useState(
    existingVersion?.version_name ?? `v${product.pricing_versions.length + 1} - Standard`,
  )
  const [libraryOpen, setLibraryOpen] = useState(false)

  // ── Live calculations ────────────────────────────────────────────────────
  const c = useMemo(() => {
    const materialsTotal  = computeMaterialsTotal(rows)
    const overheadCost    = computeOverhead(materialsTotal, laborCost, overheadPct)
    const contingencyCost = computeContingency(materialsTotal, laborCost, overheadCost, contingencyPct)
    const totalCost       = computeTotalProductCost(materialsTotal, laborCost, overheadCost, contingencyCost)
    const effectiveMargin = marginPreset === 'custom' ? customMargin : marginPreset
    const suggestedPrice  = computeSuggestedSellingPrice(totalCost, effectiveMargin)
    const finalPrice      = finalPriceOverride ?? suggestedPrice
    const profit          = computeProfit(finalPrice, totalCost)
    const actualMargin    = computeActualMargin(profit, finalPrice)
    return {
      materialsTotal, overheadCost, contingencyCost, totalCost,
      effectiveMargin, suggestedPrice, finalPrice, profit, actualMargin,
      marginStatus: getMarginStatus(actualMargin),
    }
  }, [rows, laborCost, overheadPct, contingencyPct, marginPreset, customMargin, finalPriceOverride])

  // ── Row operations ───────────────────────────────────────────────────────
  function updateRow(key: string, updates: Partial<Omit<Row, '_key' | 'wastage_cost' | 'total_cost'>>) {
    setRows(prev =>
      prev.map(r => r._key !== key ? r : recompute({ ...r, ...updates })),
    )
  }

  function addRow() {
    setRows(prev => [...prev, buildRow()])
  }

  function duplicateRow(key: string) {
    setRows(prev => {
      const idx = prev.findIndex(r => r._key === key)
      if (idx === -1) return prev
      const copy = buildRow({
        name: prev[idx].name,
        unit_type: prev[idx].unit_type,
        costing_price: prev[idx].costing_price,
        quantity: prev[idx].quantity,
        wastage_percentage: prev[idx].wastage_percentage,
      })
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
  }

  function removeRow(key: string) {
    setRows(prev => (prev.length === 1 ? [buildRow()] : prev.filter(r => r._key !== key)))
  }

  function addFromLibrary(m: LibraryMaterial) {
    setRows(prev => [
      ...prev,
      buildRow({ name: m.name, unit_type: m.unit, costing_price: m.default_price }),
    ])
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!versionName.trim()) { toast.error('Version name is required'); return }

    const versionPayload = {
      version_name: versionName.trim(),
      labor_cost: laborCost,
      overhead_percentage: overheadPct,
      overhead_cost: c.overheadCost,
      contingency_percentage: contingencyPct,
      contingency_cost: c.contingencyCost,
      target_margin: c.effectiveMargin,
      materials_total: c.materialsTotal,
      total_product_cost: c.totalCost,
      suggested_selling_price: c.suggestedPrice,
      final_selling_price: c.finalPrice,
      profit: c.profit,
      actual_margin: c.actualMargin,
    }

    const matPayloads = rows
      .filter(r => r.name.trim())
      .map(r => ({
        name: r.name.trim(),
        unit_type: r.unit_type,
        costing_price: r.costing_price,
        quantity: r.quantity,
        wastage_percentage: r.wastage_percentage,
        wastage_cost: r.wastage_cost,
        total_cost: r.total_cost,
      }))

    startTransition(async () => {
      try {
        if (isNew) {
          const vr = await createPricingVersion(productId, versionPayload)
          if (!vr.success) { toast.error(vr.error); return }

          await Promise.all(matPayloads.map(m => createMaterial(vr.data.id, m)))

          toast.success('Pricing version created!')
          router.replace(`/pricing/${productId}/${vr.data.id}`)
        } else {
          const versionIdNum = existingVersion!.id
          const vr = await updatePricingVersion(versionIdNum, versionPayload)
          if (!vr.success) { toast.error(vr.error); return }

          await Promise.all(initialIdsRef.current.map(id => deleteMaterial(id)))
          const created = await Promise.all(matPayloads.map(m => createMaterial(versionIdNum, m)))
          initialIdsRef.current = created.flatMap(r => r.success ? [r.data.id] : [])

          toast.success('Pricing version updated!')
        }
      } catch {
        toast.error('An unexpected error occurred')
      }
    })
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  const cellCls = 'h-7 w-full rounded border-0 bg-transparent px-1 text-sm focus:bg-muted/50 focus:outline-none focus:ring-0'
  const cellClsR = cn(cellCls, 'text-right tabular-nums')

  const numInput = (
    value: number,
    onChange: (v: number) => void,
    {
      right = false,
      step = '0.01',
      min = '0',
      placeholder = '0',
      className = '',
    }: {
      right?: boolean
      step?: string
      min?: string
      placeholder?: string
      className?: string
    } = {},
  ) => (
    <input
      type="number"
      value={value || ''}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      step={step}
      min={min}
      placeholder={placeholder}
      className={cn(right ? cellClsR : cellCls, className)}
    />
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card px-8 py-4">
        <div className="mx-auto flex max-w-screen-xl items-center gap-3">
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Products
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{product.name}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">
            {isNew ? 'New Pricing Version' : (existingVersion?.version_name ?? 'Pricing')}
          </span>

          {product.pricing_versions.length > 0 && !isNew && (
            <span className="ml-auto text-xs text-muted-foreground">
              {product.pricing_versions.length} version
              {product.pricing_versions.length !== 1 ? 's' : ''} —{' '}
              {product.pricing_versions.map((v, i) => (
                <Link
                  key={v.id}
                  href={`/pricing/${productId}/${v.id}`}
                  className={cn(
                    'hover:underline',
                    v.id === existingVersion?.id
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {v.version_name}
                  {i < product.pricing_versions.length - 1 ? ', ' : ''}
                </Link>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Body: two-column */}
      <div className="flex-1 overflow-x-auto">
        <div className="mx-auto flex max-w-screen-xl gap-6 p-8 items-start">

          {/* ── LEFT: Materials ─────────────────────────────────────────── */}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Materials</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLibraryOpen(true)}
                >
                  <BookOpen className="size-3.5" />
                  From Library
                </Button>
                <Button type="button" size="sm" onClick={addRow}>
                  <Plus className="size-3.5" />
                  Add Row
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground" style={{ width: '200px', minWidth: '140px' }}>
                      Name
                    </th>
                    <th className="px-2 py-2.5 text-left font-medium text-muted-foreground" style={{ width: '88px' }}>
                      Unit
                    </th>
                    <th className="px-2 py-2.5 text-right font-medium text-muted-foreground" style={{ width: '96px' }}>
                      ₱ / Unit
                    </th>
                    <th className="px-2 py-2.5 text-right font-medium text-muted-foreground" style={{ width: '72px' }}>
                      Qty
                    </th>
                    <th className="px-2 py-2.5 text-right font-medium text-muted-foreground" style={{ width: '76px' }}>
                      Waste %
                    </th>
                    <th className="px-2 py-2.5 text-right font-medium text-muted-foreground" style={{ width: '96px' }}>
                      Waste ₱
                    </th>
                    <th className="px-2 py-2.5 text-right font-medium text-muted-foreground" style={{ width: '104px' }}>
                      Total ₱
                    </th>
                    <th className="w-[56px]" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row._key}
                      className="group border-b last:border-0 hover:bg-muted/30 focus-within:bg-muted/20"
                    >
                      {/* Name */}
                      <td className="px-3 py-1">
                        <input
                          type="text"
                          value={row.name}
                          onChange={e => updateRow(row._key, { name: e.target.value })}
                          placeholder={`Material ${idx + 1}`}
                          className={cn(cellCls, 'font-medium')}
                        />
                      </td>
                      {/* Unit */}
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.unit_type}
                          onChange={e => updateRow(row._key, { unit_type: e.target.value })}
                          list="unit-types"
                          className={cellCls}
                        />
                      </td>
                      {/* Price */}
                      <td className="px-2 py-1">
                        {numInput(row.costing_price, v => updateRow(row._key, { costing_price: v }), { right: true })}
                      </td>
                      {/* Qty */}
                      <td className="px-2 py-1">
                        {numInput(row.quantity, v => updateRow(row._key, { quantity: v }), { right: true, min: '0.01' })}
                      </td>
                      {/* Wastage % */}
                      <td className="px-2 py-1">
                        {numInput(row.wastage_percentage, v => updateRow(row._key, { wastage_percentage: v }), { right: true })}
                      </td>
                      {/* Waste ₱ — computed */}
                      <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                        {formatPeso(row.wastage_cost)}
                      </td>
                      {/* Total ₱ — computed */}
                      <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                        {formatPeso(row.total_cost)}
                      </td>
                      {/* Row actions */}
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Duplicate row"
                            onClick={() => duplicateRow(row._key)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete row"
                            onClick={() => removeRow(row._key)}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* datalist for unit suggestions */}
            <datalist id="unit-types">
              {UNIT_TYPES.map(u => <option key={u} value={u} />)}
            </datalist>

            {/* Materials total */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
              <span className="text-sm font-medium">Materials Total</span>
              <span className="font-mono text-base font-semibold tabular-nums">
                {formatPeso(c.materialsTotal)}
              </span>
            </div>
          </div>

          {/* ── RIGHT: Pricing Panel ─────────────────────────────────────── */}
          <div className="w-80 shrink-0 sticky top-8 self-start">
            <Card>
              <CardContent className="space-y-5 pt-5">

                {/* Labor */}
                <div className="space-y-1.5">
                  <Label htmlFor="labor">Labor Cost</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                    <Input
                      id="labor"
                      type="number"
                      value={laborCost || ''}
                      onChange={e => setLaborCost(parseFloat(e.target.value) || 0)}
                      className="pl-6"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Overhead */}
                <div className="space-y-1.5">
                  <Label htmlFor="overhead">Overhead %</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="overhead"
                        type="number"
                        value={overheadPct || ''}
                        onChange={e => setOverheadPct(parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                        placeholder="15"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">= </span>
                      <span className="font-mono text-sm tabular-nums">{formatPeso(c.overheadCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Contingency */}
                <div className="space-y-1.5">
                  <Label htmlFor="contingency">Contingency %</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="contingency"
                        type="number"
                        value={contingencyPct || ''}
                        onChange={e => setContingencyPct(parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                        placeholder="10"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">= </span>
                      <span className="font-mono text-sm tabular-nums">{formatPeso(c.contingencyCost)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Total product cost */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                  <span className="text-sm font-medium">Total Product Cost</span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatPeso(c.totalCost)}
                  </span>
                </div>

                {/* Target margin presets */}
                <div className="space-y-2">
                  <Label>Target Margin</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {MARGIN_PRESETS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setMarginPreset(p)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                          marginPreset === p
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:bg-muted',
                        )}
                      >
                        {p}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setMarginPreset('custom')}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        marginPreset === 'custom'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      Custom
                    </button>
                  </div>
                  {marginPreset === 'custom' && (
                    <div className="relative">
                      <Input
                        type="number"
                        value={customMargin || ''}
                        onChange={e => setCustomMargin(parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                        max="99"
                        placeholder="e.g. 42"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </div>

                {/* Suggested selling price */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Suggested Selling Price</Label>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {formatPeso(c.suggestedPrice)}
                  </p>
                </div>

                {/* Final selling price (overridable) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="final-price">Final Selling Price</Label>
                    {finalPriceOverride !== null && (
                      <button
                        type="button"
                        onClick={() => setFinalPriceOverride(null)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        title="Reset to suggested"
                      >
                        <RotateCcw className="size-3" />
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                    <Input
                      id="final-price"
                      type="number"
                      value={c.finalPrice || ''}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0
                        setFinalPriceOverride(v === c.suggestedPrice ? null : v)
                      }}
                      className={cn('pl-6', finalPriceOverride !== null && 'border-amber-400 focus-visible:border-amber-400')}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {finalPriceOverride !== null && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Manual override active
                    </p>
                  )}
                </div>

                <Separator />

                {/* Profit */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profit</span>
                  <span className={cn(
                    'font-mono text-sm font-semibold tabular-nums',
                    c.profit < 0 ? 'text-destructive' : 'text-foreground',
                  )}>
                    {formatPeso(c.profit)}
                  </span>
                </div>

                {/* Actual margin */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Actual Margin</span>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    MARGIN_BADGE[c.marginStatus],
                  )}>
                    {formatPercent(c.actualMargin)} · {c.marginStatus}
                  </span>
                </div>

                <Separator />

                {/* Version name */}
                <div className="space-y-1.5">
                  <Label htmlFor="version-name">Version Name</Label>
                  <Input
                    id="version-name"
                    value={versionName}
                    onChange={e => setVersionName(e.target.value)}
                    placeholder="e.g. v1 - Standard"
                  />
                </div>

                {/* Save button */}
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  {isNew ? 'Save Pricing Version' : 'Update Pricing Version'}
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Library dialog */}
      <LibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        materials={libraryMaterials}
        onAdd={addFromLibrary}
      />
    </div>
  )
}

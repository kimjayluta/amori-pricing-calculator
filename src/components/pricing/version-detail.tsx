'use client'

import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { formatPeso, formatPercent, cn } from '@/lib/utils'
import { MarginBadge } from '@/components/ui/margin-badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Printer, Download } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Material = {
  id: number
  name: string
  unit_type: string
  costing_price: number
  quantity: number
  wastage_percentage: number
  wastage_cost: number
  total_cost: number
}

type Version = {
  id: number
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
  created_at: Date
  materials: Material[]
}

type Product = {
  id: number
  name: string
  category: string
  dimensions: string | null
  description: string | null
}


// ─── Excel export ─────────────────────────────────────────────────────────────

function exportToExcel(product: Product, version: Version) {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summaryRows = [
    ['AMORI PRICING CALCULATOR', ''],
    ['', ''],
    ['Product', product.name],
    ['Category', product.category],
    ['Dimensions', product.dimensions ?? '—'],
    ['Version', version.version_name],
    ['Created', format(new Date(version.created_at), 'MMMM d, yyyy')],
    ['', ''],
    ['COST BREAKDOWN', ''],
    ['Materials Total', version.materials_total],
    ['Labor Cost', version.labor_cost],
    [`Overhead (${version.overhead_percentage}%)`, version.overhead_cost],
    [`Contingency (${version.contingency_percentage}%)`, version.contingency_cost],
    ['Total Product Cost', version.total_product_cost],
    ['', ''],
    ['PRICING SUMMARY', ''],
    ['Target Margin', version.target_margin / 100],
    ['Suggested Selling Price', version.suggested_selling_price],
    ['Final Selling Price', version.final_selling_price],
    ['Profit', version.profit],
    ['Actual Margin', version.actual_margin / 100],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows)

  // Column widths
  ws1['!cols'] = [{ wch: 28 }, { wch: 20 }]

  // Format number cells as peso (₱ is not standard; use number format)
  const pesoFmt = '₱#,##0.00'
  const pctFmt = '0.00%'
  const currencyRows = [10, 11, 12, 13, 14, 18, 19, 20, 21] // 1-indexed
  currencyRows.forEach(r => {
    const cell = ws1[XLSX.utils.encode_cell({ r, c: 1 })]
    if (cell) cell.z = pesoFmt
  })
  // Margin rows
  ;[17, 21].forEach(r => {
    const cell = ws1[XLSX.utils.encode_cell({ r, c: 1 })]
    if (cell) cell.z = pctFmt
  })

  XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

  // ── Sheet 2: Materials ────────────────────────────────────────────────────
  const materialHeaders = [
    'Name', 'Unit', '₱ / Unit', 'Quantity', 'Wastage %', 'Wastage ₱', 'Total ₱',
  ]
  const materialRows = version.materials.map(m => [
    m.name,
    m.unit_type,
    m.costing_price,
    m.quantity,
    m.wastage_percentage / 100,
    m.wastage_cost,
    m.total_cost,
  ])

  const ws2 = XLSX.utils.aoa_to_sheet([
    materialHeaders,
    ...materialRows,
    [],
    ['', '', '', '', 'Materials Total', '', version.materials_total],
  ])

  ws2['!cols'] = [
    { wch: 26 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 14 },
  ]

  // Format currency + percent columns for each material row
  version.materials.forEach((_, i) => {
    const r = i + 1
    ;[2, 5, 6].forEach(c => {
      const cell = ws2[XLSX.utils.encode_cell({ r, c })]
      if (cell) cell.z = pesoFmt
    })
    const pctCell = ws2[XLSX.utils.encode_cell({ r, c: 4 })]
    if (pctCell) pctCell.z = pctFmt
  })

  XLSX.utils.book_append_sheet(wb, ws2, 'Materials')

  // ── Download ──────────────────────────────────────────────────────────────
  const filename = `${product.name} - ${version.version_name}.xlsx`
    .replace(/[/\\?%*:|"<>]/g, '-')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Row component for cost breakdown ────────────────────────────────────────

function CostRow({
  label,
  value,
  highlight = false,
  sub = false,
}: {
  label: string
  value: string
  highlight?: boolean
  sub?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center justify-between',
      highlight ? 'rounded-lg bg-muted/60 px-3 py-2' : 'py-1.5',
    )}>
      <span className={cn('text-sm', sub ? 'text-muted-foreground' : highlight ? 'font-semibold' : '')}>
        {label}
      </span>
      <span className={cn(
        'font-mono tabular-nums text-sm',
        highlight ? 'font-bold' : sub ? 'text-muted-foreground' : 'font-medium',
      )}>
        {value}
      </span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function VersionDetail({
  product,
  version,
}: {
  product: Product
  version: Version
}) {
  const priceOverridden = version.final_selling_price !== version.suggested_selling_price

  return (
    <div>
      {/* Action bar — hidden during print */}
      <div data-print-hide className="mb-6 flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          Print
        </Button>
        <Button
          variant="outline"
          onClick={() => exportToExcel(product, version)}
        >
          <Download className="size-4" />
          Export Excel
        </Button>
      </div>

      {/* Print header — only visible when printing */}
      <div className="hidden print:block mb-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Amori Pricing Calculator</p>
        <h2 className="text-xl font-bold mt-1">{product.name}</h2>
        <p className="text-sm text-muted-foreground">{version.version_name} · {format(new Date(version.created_at), 'MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left 2/3: Cost breakdown + Materials ── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Cost Breakdown card */}
          <div className="rounded-xl border bg-card p-5 space-y-1">
            <h3 className="mb-3 text-sm font-semibold">Cost Breakdown</h3>

            <CostRow label="Materials" value={formatPeso(version.materials_total)} sub />
            <CostRow label="Labor" value={formatPeso(version.labor_cost)} sub />
            <CostRow
              label={`Overhead (${version.overhead_percentage}%)`}
              value={formatPeso(version.overhead_cost)}
              sub
            />
            <CostRow
              label={`Contingency (${version.contingency_percentage}%)`}
              value={formatPeso(version.contingency_cost)}
              sub
            />
            <div className="pt-1">
              <Separator />
            </div>
            <CostRow
              label="Total Product Cost"
              value={formatPeso(version.total_product_cost)}
              highlight
            />
          </div>

          {/* Materials table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold">
                Materials{' '}
                <span className="text-muted-foreground font-normal">
                  ({version.materials.length} item{version.materials.length !== 1 ? 's' : ''})
                </span>
              </h3>
            </div>
            {version.materials.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No materials recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Unit</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">₱ / Unit</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Waste %</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Waste ₱</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total ₱</th>
                    </tr>
                  </thead>
                  <tbody>
                    {version.materials.map(m => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{m.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{m.unit_type}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{formatPeso(m.costing_price)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{m.quantity}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                          {m.wastage_percentage > 0 ? `${m.wastage_percentage}%` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                          {formatPeso(m.wastage_cost)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">
                          {formatPeso(m.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td colSpan={6} className="px-4 py-2.5 text-sm font-medium">
                        Materials Total
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold">
                        {formatPeso(version.materials_total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right 1/3: Pricing summary ── */}
        <div className="space-y-4">

          {/* Pricing card */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Pricing Summary</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target Margin</span>
                <span className="font-medium">{version.target_margin}%</span>
              </div>

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Suggested Price</span>
                <span className="font-mono tabular-nums">
                  {formatPeso(version.suggested_selling_price)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className={cn(
                  'text-muted-foreground',
                  priceOverridden && 'text-amber-600 dark:text-amber-400 font-medium',
                )}>
                  Final Price{priceOverridden ? ' (override)' : ''}
                </span>
                <span className="font-mono tabular-nums font-semibold text-base">
                  {formatPeso(version.final_selling_price)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit</span>
                <span className={cn(
                  'font-mono tabular-nums font-semibold',
                  version.profit < 0 ? 'text-destructive' : '',
                )}>
                  {formatPeso(version.profit)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Actual Margin</span>
                <MarginBadge margin={version.actual_margin} showLabel />
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-xl border bg-card p-5 space-y-2 text-sm">
            <h3 className="font-semibold mb-3">Details</h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">{version.version_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(version.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Materials</span>
              <span>{version.materials.length} item{version.materials.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

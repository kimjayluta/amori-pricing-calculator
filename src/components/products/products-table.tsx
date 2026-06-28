'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { duplicateProduct, archiveProduct } from '@/actions/products'
import { getMarginStatus, type MarginStatus } from '@/lib/pricing-engine'
import { formatPeso, formatPercent, cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Eye, Pencil, Copy, Archive, Search, Loader2 } from 'lucide-react'

type PricingVersion = {
  actual_margin: number
  final_selling_price: number
}

export type ProductRow = {
  id: number
  name: string
  category: string
  dimensions: string | null
  created_at: Date
  pricing_versions: PricingVersion[]
}

const MARGIN_PILL: Record<MarginStatus, string> = {
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  good: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  great: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  excellent: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [archiveTarget, setArchiveTarget] = useState<{ id: number; name: string } | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [products, search])

  function handleDuplicate(id: number, name: string) {
    startTransition(async () => {
      const result = await duplicateProduct(id)
      if (result.success) {
        toast.success(`"${name}" duplicated`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleArchive(id: number, name: string) {
    setArchiveTarget(null)
    startTransition(async () => {
      const result = await archiveProduct(id)
      if (result.success) {
        toast.success(`"${name}" archived`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Latest Margin</TableHead>
                <TableHead>Latest Price</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {search
                      ? 'No products match your search.'
                      : 'No products yet. Click "Add Product" to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(product => {
                  const latest = product.pricing_versions[0]
                  const marginStatus = latest
                    ? getMarginStatus(latest.actual_margin)
                    : null

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.dimensions ?? '—'}
                      </TableCell>
                      <TableCell>
                        {latest && marginStatus ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              MARGIN_PILL[marginStatus],
                            )}
                          >
                            {formatPercent(latest.actual_margin)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono tabular-nums">
                        {latest ? (
                          formatPeso(latest.final_selling_price)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(product.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-0.5">
                            <Tooltip>
                              <TooltipTrigger
                                className={buttonVariants({
                                  variant: 'ghost',
                                  size: 'icon-sm',
                                })}
                                render={
                                  <Link href={`/products/${product.id}`} />
                                }
                              >
                                <Eye className="size-4" />
                              </TooltipTrigger>
                              <TooltipContent>View</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger
                                className={buttonVariants({
                                  variant: 'ghost',
                                  size: 'icon-sm',
                                })}
                                render={
                                  <Link href={`/products/${product.id}/edit`} />
                                }
                              >
                                <Pencil className="size-4" />
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={isPending}
                                    onClick={() =>
                                      handleDuplicate(product.id, product.name)
                                    }
                                  />
                                }
                              >
                                <Copy className="size-4" />
                              </TooltipTrigger>
                              <TooltipContent>Duplicate</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={isPending}
                                    onClick={() =>
                                      setArchiveTarget({
                                        id: product.id,
                                        name: product.name,
                                      })
                                    }
                                  />
                                }
                              >
                                <Archive className="size-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>Archive</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {products.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {products.length} product
            {products.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Dialog
        open={archiveTarget !== null}
        onOpenChange={open => !open && setArchiveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive product?</DialogTitle>
            <DialogDescription>
              <strong>"{archiveTarget?.name}"</strong> will be hidden from your
              catalog. You can restore it from the archived products list later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                archiveTarget &&
                handleArchive(archiveTarget.id, archiveTarget.name)
              }
            >
              {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

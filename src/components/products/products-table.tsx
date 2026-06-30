'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { deleteProduct } from '@/actions/products'
import { formatPeso, cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MarginBadge } from '@/components/ui/margin-badge'
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
import { Eye, Pencil, Trash2, Search, Loader2 } from 'lucide-react'

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


export function ProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [products, search])

  function handleDelete(id: number, name: string) {
    setDeleteTarget(null)
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (result.success) {
        toast.success(`"${name}" deleted`)
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
                        {latest ? (
                          <MarginBadge margin={latest.actual_margin} />
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
                                  <Link href={`/pricing/${product.id}`} />
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
                                      setDeleteTarget({
                                        id: product.id,
                                        name: product.name,
                                      })
                                    }
                                  />
                                }
                              >
                                <Trash2 className="size-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
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
        open={deleteTarget !== null}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              <strong>"{deleteTarget?.name}"</strong> and all its pricing versions
              will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                deleteTarget &&
                handleDelete(deleteTarget.id, deleteTarget.name)
              }
            >
              {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

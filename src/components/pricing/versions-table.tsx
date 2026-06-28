'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { duplicatePricingVersion, deletePricingVersion } from '@/actions/pricing'
import { formatPeso } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
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
import { Eye, Pencil, Copy, Trash2, Loader2 } from 'lucide-react'

type Version = {
  id: number
  version_name: string
  materials_total: number
  labor_cost: number
  overhead_cost: number
  contingency_cost: number
  total_product_cost: number
  final_selling_price: number
  profit: number
  actual_margin: number
  created_at: Date
}


export function VersionsTable({
  versions,
  productId,
}: {
  versions: Version[]
  productId: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  function handleDuplicate(id: number, name: string) {
    startTransition(async () => {
      const result = await duplicatePricingVersion(id)
      if (result.success) {
        toast.success(`"${name}" duplicated`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(id: number, name: string) {
    setDeleteTarget(null)
    startTransition(async () => {
      const result = await deletePricingVersion(id)
      if (result.success) {
        toast.success(`"${name}" deleted`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (versions.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        No pricing versions yet.{' '}
        <Link href={`/pricing/${productId}/new`} className="ml-1 underline underline-offset-2 hover:text-foreground">
          Create the first one.
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Materials</TableHead>
              <TableHead className="text-right">Labor</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map(v => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link
                      href={`/pricing/${productId}/${v.id}`}
                      className="font-medium hover:underline"
                    >
                      {v.version_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPeso(v.materials_total)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPeso(v.labor_cost)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPeso(v.total_product_cost)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-medium">
                    {formatPeso(v.final_selling_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <MarginBadge margin={v.actual_margin} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(v.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger
                            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                            render={<Link href={`/pricing/${productId}/${v.id}/details`} />}
                          >
                            <Eye className="size-4" />
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                            render={<Link href={`/pricing/${productId}/${v.id}`} />}
                          >
                            <Pencil className="size-4" />
                          </TooltipTrigger>
                          <TooltipContent>Edit in calculator</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={isPending}
                                onClick={() => handleDuplicate(v.id, v.version_name)}
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
                                onClick={() => setDeleteTarget({ id: v.id, name: v.version_name })}
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
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete pricing version?</DialogTitle>
            <DialogDescription>
              <strong>"{deleteTarget?.name}"</strong> and all its materials will be
              permanently deleted. This cannot be undone.
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
                deleteTarget && handleDelete(deleteTarget.id, deleteTarget.name)
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

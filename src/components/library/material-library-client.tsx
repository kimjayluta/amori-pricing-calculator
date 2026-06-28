'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  createLibraryMaterial,
  updateLibraryMaterial,
  deleteLibraryMaterial,
  type LibraryMaterialInput,
} from '@/actions/material-library'
import { formatPeso, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Search, Loader2, BookOpen } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Wood', 'Metal', 'Hardware', 'Fabric', 'Other'] as const
const UNITS = ['Sheet', 'Meter', 'Roll', 'Piece', 'Bar', 'Set', 'Kg', 'Liter'] as const

type LibraryMaterial = {
  id: number
  name: string
  category: string
  default_price: number
  unit: string
  supplier: string | null
  notes: string | null
  updated_at: Date
}

// ─── Blank form state ─────────────────────────────────────────────────────────

function blankForm(): LibraryMaterialInput & { id?: number } {
  return {
    name: '',
    category: 'Wood',
    default_price: 0,
    unit: 'Sheet',
    supplier: '',
    notes: '',
  }
}

// ─── Field row ────────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─── Material form dialog ─────────────────────────────────────────────────────

function MaterialFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: LibraryMaterialInput & { id?: number }
  onSaved: () => void
}) {
  const [form, setForm] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const isEdit = initial.id !== undefined

  // Sync form when dialog opens with new initial values
  useMemo(() => setForm(initial), [initial])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (form.default_price < 0) {
      toast.error('Price cannot be negative')
      return
    }

    const payload: LibraryMaterialInput = {
      name: form.name.trim(),
      category: form.category,
      default_price: Number(form.default_price),
      unit: form.unit,
      supplier: form.supplier?.trim() || null,
      notes: form.notes?.trim() || null,
    }

    startTransition(async () => {
      const result = isEdit && form.id !== undefined
        ? await updateLibraryMaterial(form.id, payload)
        : await createLibraryMaterial(payload)

      if (result.success) {
        toast.success(isEdit ? 'Material updated' : 'Material added')
        onOpenChange(false)
        onSaved()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-label={isEdit ? 'Edit material' : 'Add material'}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Material' : 'Add Material'}</DialogTitle>
        </DialogHeader>

        <form id="material-form" onSubmit={handleSubmit} className="grid gap-4 py-1">
          {/* Name */}
          <Field label="Name" htmlFor="mat-name" required>
            <Input
              id="mat-name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Plywood 3/4"
              autoFocus
            />
          </Field>

          {/* Category + Unit row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" htmlFor="mat-category">
              <Select value={form.category} onValueChange={v => set('category', v ?? form.category)}>
                <SelectTrigger id="mat-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Unit" htmlFor="mat-unit">
              <Select value={form.unit} onValueChange={v => set('unit', v ?? form.unit)}>
                <SelectTrigger id="mat-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Default Price */}
          <Field label="Default Price (₱)" htmlFor="mat-price" required>
            <Input
              id="mat-price"
              type="number"
              min={0}
              step={0.01}
              value={form.default_price}
              onChange={e => set('default_price', parseFloat(e.target.value) || 0)}
            />
          </Field>

          {/* Supplier */}
          <Field label="Supplier" htmlFor="mat-supplier">
            <Input
              id="mat-supplier"
              value={form.supplier ?? ''}
              onChange={e => set('supplier', e.target.value)}
              placeholder="Optional"
            />
          </Field>

          {/* Notes */}
          <Field label="Notes" htmlFor="mat-notes">
            <textarea
              id="mat-notes"
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
            />
          </Field>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="material-form" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Material'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: { id: number; name: string } | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!target) return
    startTransition(async () => {
      const result = await deleteLibraryMaterial(target.id)
      if (result.success) {
        toast.success(`"${target.name}" deleted`)
        onClose()
        onDeleted()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={target !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent aria-label="Delete material">
        <DialogHeader>
          <DialogTitle>Delete material?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">"{target?.name}"</strong> will be permanently
          removed from the library. Existing pricing versions are unaffected.
        </p>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function MaterialLibraryClient({
  initialMaterials,
}: {
  initialMaterials: LibraryMaterial[]
}) {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<LibraryMaterialInput & { id?: number }>(blankForm())

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  // Client-side filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return initialMaterials.filter(m => {
      const matchesSearch =
        !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      const matchesCategory =
        categoryFilter === 'all' || m.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [initialMaterials, search, categoryFilter])

  function openAdd() {
    setFormInitial(blankForm())
    setFormOpen(true)
  }

  function openEdit(m: LibraryMaterial) {
    setFormInitial({
      id: m.id,
      name: m.name,
      category: m.category,
      default_price: m.default_price,
      unit: m.unit,
      supplier: m.supplier ?? '',
      notes: m.notes ?? '',
    })
    setFormOpen(true)
  }

  function refresh() {
    router.refresh()
  }

  // Derive unique categories present in current data for the filter dropdown
  const presentCategories = useMemo(
    () => [...new Set(initialMaterials.map(m => m.category))].sort(),
    [initialMaterials],
  )

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder="Search name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {presentCategories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add button */}
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          New Material
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed">
          <div className="text-center space-y-1">
            <BookOpen className="size-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {initialMaterials.length === 0
                ? 'No materials in the library yet.'
                : 'No materials match your filters.'}
            </p>
            {initialMaterials.length === 0 && (
              <button
                onClick={openAdd}
                className="text-sm underline underline-offset-2 hover:text-foreground text-muted-foreground"
              >
                Add the first one.
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Default Price</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    <CategoryPill category={m.category} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPeso(m.default_price)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.unit}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.supplier ?? <span className="opacity-40">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(m.updated_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(m)}
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget({ id: m.id, name: m.name })}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Row count */}
      {initialMaterials.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {initialMaterials.length} material{initialMaterials.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Dialogs */}
      <MaterialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        onSaved={refresh}
      />
      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={refresh}
      />
    </>
  )
}

// ─── Category pill ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Wood:     'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Metal:    'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  Hardware: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Fabric:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Other:    'bg-muted text-muted-foreground',
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
    )}>
      {category}
    </span>
  )
}

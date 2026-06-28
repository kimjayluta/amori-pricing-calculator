'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createProduct, updateProduct } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ImageIcon, Loader2, Upload, X } from 'lucide-react'

export const PRODUCT_CATEGORIES = [
  'Wood Furniture',
  'Metal Furniture',
  'Upholstered Furniture',
  'Mixed Materials',
  'Outdoor Furniture',
  'Storage & Shelving',
  'Custom / Other',
] as const

type ExistingProduct = {
  id: number
  name: string
  category: string
  description?: string | null
  dimensions?: string | null
  image_url?: string | null
}

export function ProductForm({ product }: { product?: ExistingProduct }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [dimensions, setDimensions] = useState(product?.dimensions ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')

  const [errors, setErrors] = useState<{ name?: string; category?: string }>({})

  function validate() {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Product name is required'
    if (!category) next.category = 'Category is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name.trim(),
      category,
      dimensions: dimensions.trim() || null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
    }

    startTransition(async () => {
      if (product) {
        const result = await updateProduct(product.id, payload)
        if (result.success) {
          toast.success('Product updated')
          router.push('/products')
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createProduct(payload)
        if (result.success) {
          toast.success('Product created — add pricing now')
          router.push(`/pricing/${result.data.id}/new`)
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Name + Category */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
            }}
            placeholder="e.g. Solid Oak Dining Table"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={category}
            onValueChange={val => {
              if (val) {
                setCategory(val)
                if (errors.category) setErrors(prev => ({ ...prev, category: undefined }))
              }
            }}
          >
            <SelectTrigger
              id="category"
              className={cn('w-full', errors.category && 'border-destructive ring-destructive/20')}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
          )}
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-1.5">
        <Label htmlFor="dimensions">Dimensions</Label>
        <Input
          id="dimensions"
          value={dimensions}
          onChange={e => setDimensions(e.target.value)}
          placeholder="e.g. 180cm L × 90cm W × 76cm H"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the product..."
          className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <Label>Product Image (optional)</Label>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg or upload below"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Upload image file"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
          </Button>
          {imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Clear image"
              onClick={() => {
                setImageUrl('')
                if (fileRef.current) fileRef.current.value = ''
              }}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {imageUrl ? (
          <div className="mt-2 overflow-hidden rounded-lg border bg-muted/30 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Product preview"
              className="h-32 w-32 object-cover"
              onError={() => setImageUrl('')}
            />
          </div>
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-muted-foreground">
            <ImageIcon className="size-6" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/products')}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          {product ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-screen-xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <div className="rounded-xl border overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3 flex gap-6">
            {['Name', 'Category', 'Dimensions', 'Margin', 'Price', 'Created', ''].map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 border-b last:border-0 px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-7 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import { format } from 'date-fns'
import { getDashboardStats } from '@/actions/dashboard'
import { getMarginStatus } from '@/lib/pricing-engine'
import { formatPeso, formatPercent, cn } from '@/lib/utils'
import { MARGIN_TEXT } from '@/components/ui/margin-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MarginBadge } from '@/components/ui/margin-badge'
import type { MostProfitableItem, RecentProductItem } from '@/actions/dashboard'

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-screen-xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your business at a glance.</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  const result = await getDashboardStats()

  if (!result.success) {
    return (
      <p className="text-sm text-muted-foreground">Failed to load dashboard data.</p>
    )
  }

  const { data } = result

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Products" value={String(data.total_products)} />

        <StatCard
          title="Avg Margin"
          value={data.avg_margin !== null ? formatPercent(data.avg_margin) : '—'}
          valueClassName={
            data.avg_margin !== null
              ? MARGIN_TEXT[getMarginStatus(data.avg_margin)]
              : undefined
          }
          subtitle={
            data.avg_margin !== null ? getMarginStatus(data.avg_margin) : 'No data'
          }
        />

        <StatCard
          title="Avg Selling Price"
          value={data.avg_selling_price !== null ? formatPeso(data.avg_selling_price) : '—'}
        />

        <StatCard
          title="Avg Product Cost"
          value={data.avg_product_cost !== null ? formatPeso(data.avg_product_cost) : '—'}
        />

        <StatCard
          title="Below 30% Margin"
          value={String(data.products_below_thirty)}
          valueClassName={data.products_below_thirty > 0 ? 'text-red-500' : 'text-green-600'}
          subtitle={data.products_below_thirty > 0 ? 'Needs attention' : 'Looking good'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MostProfitableCard items={data.most_profitable} />
        <RecentProductsCard items={data.recent_products} />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-1.5 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  valueClassName,
  subtitle,
}: {
  title: string
  value: string
  valueClassName?: string
  subtitle?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-bold tracking-tight', valueClassName ?? 'text-foreground')}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs capitalize text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

function MostProfitableCard({ items }: { items: MostProfitableItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Most Profitable Products</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No products yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 text-right font-medium">Profit</th>
                <th className="pb-2 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="py-2.5">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatPeso(item.profit)}
                  </td>
                  <td className="py-2.5 text-right">
                    <MarginBadge margin={item.actual_margin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

function RecentProductsCard({ items }: { items: RecentProductItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Recent Products</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No products yet.</p>
        ) : (
          <ul className="divide-y">
            {items.map(item => (
              <li key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {item.version_count} version{item.version_count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}


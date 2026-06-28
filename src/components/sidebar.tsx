'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  BookOpen,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/library', label: 'Material Library', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col"
      style={{ backgroundColor: '#1A2E1A' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-[1.125rem]">
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded text-sm font-bold"
          style={{ backgroundColor: '#C9A84C', color: '#1A2E1A' }}
        >
          A
        </div>
        <div>
          <span
            className="text-sm font-semibold leading-none tracking-tight"
            style={{ color: '#C9A84C' }}
          >
            Amori
          </span>
          <span className="ml-1.5 text-xs font-medium text-white/40">Pricing</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-white/10 font-medium'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/90',
              )}
              style={isActive ? { color: '#C9A84C' } : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs text-white/25">Amori Furniture © 2026</p>
      </div>
    </aside>
  )
}

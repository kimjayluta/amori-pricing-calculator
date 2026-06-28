'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Sun, Moon, Monitor, Save, RotateCcw, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ─── localStorage keys ────────────────────────────────────────────────────────

export const SETTINGS_KEYS = {
  overhead:    'amori:overhead_pct',
  contingency: 'amori:contingency_pct',
  margin:      'amori:target_margin',
} as const

export const SETTINGS_DEFAULTS: Record<string, number> = {
  overhead:    15,
  contingency: 10,
  margin:      35,
}

function readNum(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const v = localStorage.getItem(key)
  const n = v !== null ? parseFloat(v) : NaN
  return isNaN(n) ? fallback : n
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// ─── Number field ─────────────────────────────────────────────────────────────

function NumField({
  id,
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  id: string
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          step={0.5}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── Theme picker ─────────────────────────────────────────────────────────────

const THEMES = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const

function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex gap-2">
      {THEMES.map(({ value, label, Icon }) => {
        const active = mounted ? theme === value : value === 'light'
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-xs transition-colors',
              active
                ? 'border-ring bg-muted font-medium'
                : 'border-border text-muted-foreground hover:bg-muted/50',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [overhead,    setOverhead]    = useState<number>(SETTINGS_DEFAULTS.overhead)
  const [contingency, setContingency] = useState<number>(SETTINGS_DEFAULTS.contingency)
  const [margin,      setMargin]      = useState<number>(SETTINGS_DEFAULTS.margin)
  const [loaded, setLoaded] = useState(false)

  // Hydrate from localStorage after mount
  useEffect(() => {
    setOverhead(readNum(SETTINGS_KEYS.overhead, SETTINGS_DEFAULTS.overhead))
    setContingency(readNum(SETTINGS_KEYS.contingency, SETTINGS_DEFAULTS.contingency))
    setMargin(readNum(SETTINGS_KEYS.margin, SETTINGS_DEFAULTS.margin))
    setLoaded(true)
  }, [])

  function save() {
    if (margin >= 100) {
      toast.error('Target margin must be less than 100%')
      return
    }
    localStorage.setItem(SETTINGS_KEYS.overhead,    String(overhead))
    localStorage.setItem(SETTINGS_KEYS.contingency, String(contingency))
    localStorage.setItem(SETTINGS_KEYS.margin,      String(margin))
    toast.success('Settings saved')
  }

  function reset() {
    setOverhead(SETTINGS_DEFAULTS.overhead)
    setContingency(SETTINGS_DEFAULTS.contingency)
    setMargin(SETTINGS_DEFAULTS.margin)
    localStorage.removeItem(SETTINGS_KEYS.overhead)
    localStorage.removeItem(SETTINGS_KEYS.contingency)
    localStorage.removeItem(SETTINGS_KEYS.margin)
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure default values and appearance preferences.
        </p>
      </div>

      <div className="space-y-8">

        {/* Pricing Defaults */}
        <Section
          title="Pricing Defaults"
          description="These values pre-fill new pricing versions. Changing them does not affect existing versions."
        >
          <div className={cn('space-y-4 transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}>
            <NumField
              id="s-overhead"
              label="Default Overhead"
              hint="Applied to Materials + Labor combined."
              value={overhead}
              onChange={setOverhead}
            />
            <NumField
              id="s-contingency"
              label="Default Contingency"
              hint="Applied to Materials + Labor + Overhead combined."
              value={contingency}
              onChange={setContingency}
            />
            <NumField
              id="s-margin"
              label="Default Target Margin"
              hint="The margin percentage used when computing the suggested selling price."
              value={margin}
              onChange={setMargin}
              max={99}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={!loaded}>
              <Save className="size-4" />
              Save Defaults
            </Button>
            <Button variant="outline" onClick={reset} disabled={!loaded}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </Section>

        <Separator />

        {/* Appearance */}
        <Section
          title="Appearance"
          description="Choose between light, dark, or system-matching theme."
        >
          <ThemePicker />
        </Section>

        <Separator />

        {/* Currency */}
        <Section
          title="Currency"
          description="The currency used throughout the app for all pricing calculations."
        >
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <span className="text-2xl leading-none">₱</span>
            <div>
              <p className="text-sm font-medium">Philippine Peso (PHP)</p>
              <p className="text-xs text-muted-foreground">All amounts are displayed in PHP (₱)</p>
            </div>
          </div>
        </Section>

        <Separator />

        {/* Data */}
        <Section
          title="Database"
          description="Your pricing data is stored in a local SQLite file."
        >
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">pricing.db location</p>
                <code className="block rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                  prisma/pricing.db
                </code>
                <p className="text-xs text-muted-foreground">
                  Back up this file to preserve all products, pricing versions, and materials.
                </p>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              To restore from backup, stop the app, replace the file, then restart.
            </p>
          </div>
        </Section>

      </div>
    </div>
  )
}

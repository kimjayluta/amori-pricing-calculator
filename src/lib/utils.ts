import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const pesoFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPeso(amount: number): string {
  return `₱${pesoFormatter.format(amount)}`
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`
}

export function roundToNearest(amount: number, nearest: number): number {
  return Math.round(amount / nearest) * nearest
}

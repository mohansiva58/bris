import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
    return new Date(date).toLocaleString()
}

export function getRiskColor(score: number): string {
    if (score >= 90) return 'text-red-600'
    if (score >= 75) return 'text-orange-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-green-600'
}

export function getRiskBadgeVariant(severity: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    if (severity === 'critical') return 'destructive'
    if (severity === 'high') return 'destructive'
    if (severity === 'medium') return 'secondary'
    return 'outline'
}

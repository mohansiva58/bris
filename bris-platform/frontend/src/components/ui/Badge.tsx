import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
}

const variantStyles = {
    default: 'bg-primary text-white',
    destructive: 'bg-red-600 text-white',
    outline: 'border border-gray-300 text-gray-700',
    secondary: 'bg-gray-200 text-gray-900',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                variantStyles[variant],
                className
            )}
            {...props}
        />
    )
}

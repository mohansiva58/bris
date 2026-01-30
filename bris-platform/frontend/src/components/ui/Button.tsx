import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
    size?: 'default' | 'sm' | 'lg'
}

const variantStyles = {
    default: 'bg-primary text-white hover:bg-primary/90',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'hover:bg-gray-100',
}

const sizeStyles = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-8',
}

export function Button({
    className,
    variant = 'default',
    size = 'default',
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        />
    )
}

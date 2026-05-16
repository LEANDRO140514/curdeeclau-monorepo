import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

type Variant = 'default' | 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantStyles: Record<Variant, string> = {
  default: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
  primary: 'bg-gradient-to-r from-primary to-accent text-black font-bold shadow-neon hover:shadow-neon-lg hover:-translate-y-0.5',
  outline: 'border-2 border-primary text-primary hover:bg-primary/10 hover:shadow-neon',
  ghost: 'text-white/50 hover:text-white hover:bg-white/5',
  danger: 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger/30',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-5 py-3 text-sm rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-3xl',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button

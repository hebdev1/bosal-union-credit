import Link from 'next/link'
import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'

interface LinkButtonProps
  extends VariantProps<typeof buttonVariants>,
    Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'> {
  className?: string
}

export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Link>
  )
}

interface AnchorButtonProps
  extends VariantProps<typeof buttonVariants>,
    Omit<React.ComponentPropsWithoutRef<'a'>, 'className'> {
  className?: string
}

export function AnchorButton({
  variant,
  size,
  className,
  children,
  ...props
}: AnchorButtonProps) {
  return (
    <a
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </a>
  )
}

import { Link } from '@tanstack/react-router'
import type { ComponentType, ReactNode } from 'react'

import { ICON_TONES, PILL_TONES } from './care-tones'
import type { ToneKey } from './care-tones'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FurParentRoute } from '../types'

export function Pill({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: ToneKey
  children: ReactNode
  className?: string
}) {
  return (
    <Badge
      className={cn(
        'shrink-0 gap-1 rounded-full border-transparent px-2.5 py-0.5 ring-1 ring-inset',
        'font-fp-sans text-[11px] font-semibold tracking-normal normal-case',
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </Badge>
  )
}

export function IconTile({
  icon: Icon,
  tone = 'primary',
  size = 'md',
  className,
}: {
  icon: ComponentType<{ className?: string }>
  tone?: ToneKey
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center',
        size === 'md' ? 'size-10 rounded-lg' : 'size-8 rounded-lg',
        ICON_TONES[tone],
        className,
      )}
    >
      <Icon className={size === 'md' ? 'size-5' : 'size-4'} />
    </span>
  )
}

export function CareCard({
  icon,
  iconTone = 'primary',
  title,
  subtitle,
  status,
  children,
  footer,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  iconTone?: ToneKey
  title: string
  subtitle: string
  status?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        'flex flex-col gap-0 rounded-xl border border-fp-border bg-white p-5',
        'shadow-fp-card transition-shadow hover:shadow-fp-elevated',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconTile icon={icon} tone={iconTone} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">
              {title}
            </h3>
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {status}
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-2.5">{children}</div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </Card>
  )
}

export function Inset({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-100 bg-slate-50/80 p-3.5',
        interactive && 'transition-colors hover:bg-slate-100/80',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      {children ? (
        <p className="mx-auto mt-1 max-w-xs text-[11px] text-slate-500">
          {children}
        </p>
      ) : null}
    </div>
  )
}

export function CardAction({
  children,
  to,
  onClick,
  disabled = false,
  className,
}: {
  children: ReactNode
  to?: FurParentRoute
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const styles = cn(
    'h-auto w-full justify-center gap-1.5 border border-slate-200 bg-white px-3 py-2',
    'font-fp-sans text-xs font-semibold text-slate-700 no-underline shadow-none',
    'transition-colors hover:bg-slate-50 hover:text-fp-brand-700',
    'focus-visible:ring-2 focus-visible:ring-fp-brand-500/30',
    disabled && 'cursor-progress opacity-70',
    className,
  )

  if (to) {
    return (
      <Button asChild variant="ghost" className={styles}>
        <Link to={to}>{children}</Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={styles}
    >
      {children}
    </Button>
  )
}

export function TextAction({
  children,
  to,
  onClick,
  disabled = false,
  className,
}: {
  children: ReactNode
  to?: FurParentRoute
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const styles = cn(
    'h-auto justify-start gap-1 rounded-md p-0 font-fp-sans text-[11px] font-semibold no-underline',
    'text-fp-brand-700 hover:bg-transparent hover:text-fp-brand-800 hover:underline',
    'focus-visible:ring-2 focus-visible:ring-fp-brand-500/30',
    disabled && 'cursor-progress opacity-70',
    className,
  )

  if (to) {
    return (
      <Button asChild variant="link" className={styles}>
        <Link to={to}>{children}</Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="link"
      onClick={onClick}
      disabled={disabled}
      className={styles}
    >
      {children}
    </Button>
  )
}

export function SectionHeading({
  icon: Icon,
  title,
  count,
  action,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  count?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-fp-brand-50 text-fp-brand-700">
            <Icon className="size-4" />
          </span>
        ) : null}
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {count ? <Pill>{count}</Pill> : null}
      </div>
      {action}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  to,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  to?: FurParentRoute
  className?: string
}) {
  const styles = cn(
    'h-auto items-center justify-center gap-1.5 rounded-lg bg-fp-brand-500 px-3.5 py-2',
    'font-fp-sans text-xs font-semibold text-white no-underline shadow-fp-subtle',
    'transition-colors hover:bg-fp-brand-700',
    'focus-visible:ring-2 focus-visible:ring-fp-brand-500/40',
    className,
  )

  if (to) {
    return (
      <Button asChild className={styles}>
        <Link to={to}>{children}</Link>
      </Button>
    )
  }

  return (
    <Button type="button" onClick={onClick} className={styles}>
      {children}
    </Button>
  )
}

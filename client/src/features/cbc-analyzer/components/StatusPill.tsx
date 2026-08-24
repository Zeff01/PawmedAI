import { STATUS_STYLES } from '../constants'
import type { AnalyteStatus, ResultStatus } from '../types'

type StatusPillProps = {
  status: AnalyteStatus | ResultStatus
  className?: string
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${style.pill} ${className}`}
    >
      {style.label}
    </span>
  )
}

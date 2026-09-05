import { BadgeCheck, Cpu, FileText, FolderHeart, Upload } from 'lucide-react'
import type { ComponentType } from 'react'

import { CardAction, CareCard, IconTile, Inset } from './primitives'
import { cn } from '@/lib/utils'
import type { CareStatus, PassportRecord } from '../types'

const PASSPORT_ICONS: Record<
  PassportRecord['icon'],
  ComponentType<{ className?: string }>
> = {
  chip: Cpu,
  verified: BadgeCheck,
  document: FileText,
}

export function PassportCard({
  passport,
  onUpload,
}: {
  passport: { status: CareStatus; records: Array<PassportRecord> }
  onUpload: () => void
}) {
  const { records } = passport

  return (
    <CareCard
      icon={FolderHeart}
      iconTone="neutral"
      title="ID & important papers"
      subtitle="Microchip, insurance, and files you might be asked for"
      footer={
        <CardAction onClick={onUpload}>
          <Upload className="size-3.5 text-slate-500" />
          Add a file
        </CardAction>
      }
    >
      {records.map((record) => {
        const RecordIcon = PASSPORT_ICONS[record.icon]
        return (
          <Inset
            key={record.label}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {record.label}
              </p>
              <p
                className={cn(
                  'truncate text-xs font-semibold text-slate-700',
                  record.mono && 'font-mono',
                )}
              >
                {record.value}
              </p>
            </div>
            <IconTile
              icon={RecordIcon}
              tone={record.icon === 'document' ? 'neutral' : 'primary'}
              size="sm"
            />
          </Inset>
        )
      })}
    </CareCard>
  )
}

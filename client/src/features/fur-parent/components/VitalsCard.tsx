import { ArrowDown, ArrowUp, Droplets, Plus, TrendingUp } from 'lucide-react'

import { CardAction, CareCard, EmptyState, Inset, Pill } from './primitives'
import { cn } from '@/lib/utils'
import type { VitalsSnapshot, WeightTrend } from '../types'

export function VitalsCard({
  vitals,
  petName,
  onLogWeight,
}: {
  vitals: VitalsSnapshot
  petName: string
  onLogWeight: () => void
}) {
  const { trend, gauge, status } = vitals

  return (
    <CareCard
      icon={TrendingUp}
      iconTone="primary"
      title="Weight"
      subtitle="How your pet&rsquo;s weight is changing"
      status={<Pill tone={status.tone}>{status.label}</Pill>}
      footer={
        <CardAction onClick={onLogWeight}>
          <Plus className="size-3.5 text-slate-500" />
          {trend ? `Log ${petName}’s weight` : `Log ${petName}’s first weight`}
        </CardAction>
      }
    >
      {trend ? <TrendPanel trend={trend} petName={petName} /> : null}

      {!trend ? (
        <EmptyState title="No weight saved yet">
          One number is all it takes to start — the chart appears once you save
          a second one.
        </EmptyState>
      ) : null}

      {gauge ? (
        <Inset>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <Droplets className="size-3.5 text-fp-brand-600" />
              {gauge.label}
            </span>
            <span className="font-semibold text-fp-brand-800">
              {gauge.readout}
            </span>
          </div>
          <div
            role="meter"
            aria-label={`${gauge.label} for ${petName}`}
            aria-valuenow={gauge.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={gauge.readout}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-fp-brand-600"
              style={{ width: `${gauge.percent}%` }}
            />
          </div>
        </Inset>
      ) : null}
    </CareCard>
  )
}

function TrendPanel({
  trend,
  petName,
}: {
  trend: WeightTrend
  petName: string
}) {
  const Arrow = trend.rising ? ArrowUp : ArrowDown
  const single = trend.points.length < 2

  return (
    <Inset className="p-3.5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="flex items-baseline">
          <span className="fp-figure text-slate-900">{trend.value}</span>
          <span className="ml-0.5 text-xs font-semibold text-slate-500">
            {trend.unit}
          </span>
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
            single
              ? 'text-slate-500'
              : trend.rising
                ? 'text-emerald-600'
                : 'text-fp-brand-700',
          )}
        >
          {single ? null : <Arrow className="size-3" />}
          {trend.change}
        </span>
      </div>

      <Sparkline trend={trend} petName={petName} />

      <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
        {axisLabels(trend).map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
    </Inset>
  )
}

function axisLabels(trend: WeightTrend): Array<string> {
  const points = trend.points
  if (points.length <= 4) return points.map((point) => point.label)

  const last = points.length - 1
  return [
    points[0].label,
    points[Math.round(last / 3)].label,
    points[Math.round((2 * last) / 3)].label,
    points[last].label,
  ]
}

const CHART = { width: 240, height: 40, pad: 5 }

function Sparkline({
  trend,
  petName,
}: {
  trend: WeightTrend
  petName: string
}) {
  const values = trend.points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  const inner = CHART.height - CHART.pad * 2

  const coords = trend.points.map((point, index) => {
    const x =
      trend.points.length === 1
        ? CHART.width
        : (index / (trend.points.length - 1)) * CHART.width
    const ratio = span === 0 ? 0.5 : (point.value - min) / span
    return { x, y: CHART.height - CHART.pad - ratio * inner }
  })

  const line = coords
    .map((point, index) => {
      if (index === 0) return `M${point.x},${point.y}`
      const previous = coords[index - 1]
      const mid = (previous.x + point.x) / 2
      return `C${mid},${previous.y} ${mid},${point.y} ${point.x},${point.y}`
    })
    .join(' ')

  const area = `${line} L${coords[coords.length - 1].x},${CHART.height} L${coords[0].x},${CHART.height} Z`
  const latest = coords[coords.length - 1]

  return (
    <div className="h-12 w-full pt-2">
      <svg
        role="img"
        aria-label={`${petName}’s weight: ${trend.value} ${trend.unit}, ${trend.change.toLowerCase()}`}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="fp-sparkline" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="1" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {coords.length > 1 ? (
          <>
            <path d={area} fill="url(#fp-sparkline)" />
            <path
              d={line}
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}

        <circle
          cx={latest.x}
          cy={latest.y}
          r="3.5"
          fill="#059669"
          stroke="#ffffff"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

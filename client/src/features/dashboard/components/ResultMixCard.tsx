type ResultMixCardProps = {
  normal: number
  abnormal: number
  isLoading: boolean
  windowDays: number
}

export function ResultMixCard({
  normal,
  abnormal,
  isLoading,
  windowDays,
}: ResultMixCardProps) {
  const total = normal + abnormal
  const normalShare = total ? Math.round((normal / total) * 100) : 0
  const abnormalShare = total ? 100 - normalShare : 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5">
      <h2 className="text-[14px] font-bold tracking-tight text-slate-900">
        Result mix
      </h2>
      <p className="mt-0.5 text-[11.5px] text-slate-400">
        Last {windowDays} days
      </p>

      {isLoading ? (
        <div className="mt-5 space-y-3" aria-hidden="true">
          <div className="h-2.5 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : total === 0 ? (
        <p className="mt-5 text-[12.5px] leading-relaxed text-slate-500">
          No results in this window yet. Once you save analyses, the split
          between normal and flagged panels appears here.
        </p>
      ) : (
        <>
          <div
            className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`${normalShare}% normal, ${abnormalShare}% flagged, across ${total} record${total === 1 ? '' : 's'}`}
          >
            <div
              className="bg-emerald-500"
              style={{ width: `${normalShare}%` }}
            />
            <div
              className="bg-amber-500"
              style={{ width: `${abnormalShare}%` }}
            />
          </div>

          <dl className="mt-4 space-y-2.5">
            <MixRow
              dot="bg-emerald-500"
              label="Normal"
              count={normal}
              share={normalShare}
            />
            <MixRow
              dot="bg-amber-500"
              label="Flagged"
              count={abnormal}
              share={abnormalShare}
            />
          </dl>
        </>
      )}
    </section>
  )
}

function MixRow({
  dot,
  label,
  count,
  share,
}: {
  dot: string
  label: string
  count: number
  share: number
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <dt className="flex-1 text-[12.5px] font-medium text-slate-600">
        {label}
      </dt>
      <dd className="text-[12.5px] font-bold text-slate-900 tabular-nums">
        {count}
        <span className="ml-1.5 font-semibold text-slate-400">{share}%</span>
      </dd>
    </div>
  )
}

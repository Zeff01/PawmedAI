import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <p className="sr-only" role="status">
        Loading your pets…
      </p>

      <Block className="h-52 rounded-2xl lg:h-40 xl:h-56" />
      <Block className="h-20 rounded-xl" />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <div className="flex flex-col gap-4">
            <Block className="h-8 w-56" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Block className="h-56" />
              <Block className="h-56" />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Block className="h-12 w-72" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Block className="h-64" />
              <Block className="h-64" />
            </div>
            <Block className="h-52" />
            <Block className="h-20" />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <Block className="h-96" />
          <Block className="h-56" />
        </div>
      </div>
    </div>
  )
}

function Block({ className }: { className?: string }) {
  return (
    <Skeleton
      aria-hidden
      className={`rounded-2xl bg-slate-200/60 ${className ?? ''}`}
    />
  )
}

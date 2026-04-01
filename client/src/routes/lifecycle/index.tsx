import { createFileRoute, Link } from '@tanstack/react-router'
import { Seo } from '@/components/Seo'

export const Route = createFileRoute('/lifecycle/')({
  component: LifeCycleNotesPage,
})

const currentStateItems = [
  {
    icon: '⚡',
    label: 'Known limitations',
    detail: 'Some results may be slower during peak traffic.',
  },
  {
    icon: '🐾',
    label: 'Feature coverage',
    detail: 'Not all conditions, breeds, or species are supported yet.',
  },
  {
    icon: '🔄',
    label: 'Data & availability',
    detail: 'Demo data may be reset during updates.',
  },
  {
    icon: '🩺',
    label: 'Accuracy disclaimer',
    detail: 'Use as decision support, not a sole diagnosis.',
  },
  {
    icon: '💬',
    label: 'Feedback channel',
    detail: 'Share issues and suggestions with the team.',
  },
]

function LifeCycleNotesPage() {
  const description = 'Lifecycle notes and release updates for Pawmed AI.'

  return (
    <section className="px-6 py-16 sm:py-20">
      <Seo
        title="Pawmed AI | Lifecycle Notes"
        description={description}
        canonicalPath="/lifecycle"
      />

      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-blue-500">
            Release Updates
          </p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            What's new with Pawmed AI?
          </h1>
          <p className="text-base text-slate-500">
            We keep this page up to date so you always know what's working,
            what's changing, and what to expect.
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50/50 p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm">
              ⚠️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-blue-700">
                  Beta Release
                </h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                  Active
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Minor issues may occur as we improve. If you see anything
                unusual, please share feedback with the team.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Features may change and data may be reset without notice. Avoid
                relying on it for urgent or mission-critical decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Current State
            </h2>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <p className="mb-5 text-sm text-slate-500">
            Here is what to expect today while we improve the platform:
          </p>
          <ul className="space-y-3">
            {currentStateItems.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm border border-slate-100">
                  {item.icon}
                </span>
                <div className="pt-0.5">
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}:{' '}
                  </span>
                  <span className="text-sm text-slate-500">{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </section>
  )
}

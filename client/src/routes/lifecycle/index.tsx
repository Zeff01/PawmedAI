import { createFileRoute, Link } from '@tanstack/react-router'
import { Seo } from '@/components/Seo'
import { buildBreadcrumbSchema } from '@/utils/seo-schema'

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
  const description =
    'Pawmed AI release notes: current beta status, supported features, known limitations, accuracy disclaimers, and how to share feedback with the team.'

  return (
    <section className="px-6 py-16 sm:py-20">
      <Seo
        title="Lifecycle Notes & Release Updates | Pawmed AI"
        description={description}
        keywords="pawmed ai release notes, pawmed changelog, veterinary AI updates, pawmed beta status, pawmed lifecycle, pawmed ai roadmap"
        canonicalPath="/lifecycle"
        ogImage="/images/feature-notes.jpg"
        ogImageAlt="Pawmed AI lifecycle notes and release updates"
        structuredData={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Lifecycle Notes', path: '/lifecycle' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: 'Pawmed AI — Lifecycle Notes & Release Updates',
            description,
            mainEntityOfPage: 'https://pawmedai.com/lifecycle',
            author: { '@type': 'Organization', name: 'Pawmed AI' },
            publisher: {
              '@type': 'Organization',
              name: 'Pawmed AI',
              logo: {
                '@type': 'ImageObject',
                url: 'https://pawmedai.com/icons/paw.png',
              },
            },
          },
        ]}
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

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              What's working today
            </h2>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <strong className="font-semibold text-slate-800">
                Disease classification:
              </strong>{' '}
              Upload a clinical photo and receive a structured diagnostic brief
              with differential diagnoses, observations, and suggested next
              steps in under five minutes.
            </li>
            <li>
              <strong className="font-semibold text-slate-800">
                Breed classification:
              </strong>{' '}
              Identify dog, cat, and other animal breeds from a single image,
              including scientific classification and a quick at-a-glance
              profile linking to the species page.
            </li>
            <li>
              <strong className="font-semibold text-slate-800">
                Nearby vets:
              </strong>{' '}
              Locate the closest veterinary clinics on a live map with
              directions, phone numbers, and distance from your current
              location.
            </li>
            <li>
              <strong className="font-semibold text-slate-800">
                Animal profiles:
              </strong>{' '}
              Browse hundreds of species and breed profiles with lifespan,
              behavior, conservation status, and key facts.
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Responsible use
            </h2>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Pawmed AI is a decision-support tool, not a substitute for
            veterinary judgment. Outputs are intended to help vets, students,
            and pet owners triage and prepare for an in-person consultation —
            not to replace one. For urgent symptoms, contact a licensed
            veterinarian immediately.
          </p>
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

import { Link } from '@tanstack/react-router'
import {
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'

import { Button } from '#/components/ui/button'
import { BentoGrid, BentoGridItem } from '#/components/ui/bento-grid'

const features = [
  {
    title: 'Rapid diagnostic briefs',
    description:
      'Turn a clinical photo into a structured, shareable brief in minutes.',
    icon: <BoltIcon className="h-5 w-5 text-blue-600" />,
    header: (
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <img
          src="/images/feature-dental.jpg"
          alt="Veterinarian examining a dog's teeth"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.2),transparent_60%)]" />
      </div>
    ),
    className: 'md:col-span-2',
  },
  {
    title: 'Evidence-guided notes',
    description: 'Surface the key differentials, observations, and next steps.',
    icon: <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />,
    header: (
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <img
          src="/images/feature-cat.jpg"
          alt="Veterinarian examining a cat"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(59,130,246,0.2),transparent_60%)]" />
      </div>
    ),
  },
  {
    title: 'Veterinary-grade security',
    description: 'Keep case data protected with secure workflows.',
    icon: <ShieldCheckIcon className="h-5 w-5 text-blue-600" />,
    header: (
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <img
          src="/images/feature-ultrasound.jpg"
          alt="Veterinary team using diagnostic equipment"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.25),transparent_60%)]" />
      </div>
    ),
  },
  {
    title: 'Actionable analytics',
    description: 'Track confidence, case trends, and operational lift.',
    icon: <ChartBarIcon className="h-5 w-5 text-blue-600" />,
    header: (
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <img
          src="/images/feature-team.jpg"
          alt="Veterinary team examining a dog"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(59,130,246,0.2),transparent_60%)]" />
      </div>
    ),
  },
]

const testimonials = [
  {
    quote:
      '“We cut case summary time by half while maintaining consistent documentation.”',
    name: 'Dr. Camille Reyes',
    title: 'Lead Veterinarian, City Vet Clinic',
  },
  {
    quote:
      '“The structured brief makes handoffs clearer for our entire care team.”',
    name: 'Jorge Santos, DVM',
    title: 'Emergency Practice',
  },
  {
    quote: '“A polished workflow for fast triage and client communication.”',
    name: 'Amanda Lee',
    title: 'Practice Manager',
  },
]

function HomeView() {
  return (
    <div className="bg-white text-slate-900">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 pt-16 space-y-10">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col items-center text-center md:items-start md:text-left gap-5">
            <p className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="#155dfc"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 1 }}
              >
                <path d="M11 2v2M5 2v2m0-1H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
                <path d="M8 15a6 6 0 0 0 12 0v-3" />
                <circle cx="20" cy="10" r="2" />
              </svg>
              <span>Veterinary intelligence</span>
            </p>
            <h1 className="text-4xl font-bold md:text-6xl">
              <span className="text-blue-600">Diagnose faster</span> with
              AI-crafted clinical briefs for pets.
            </h1>
            <p className="max-w-2xl text-base text-slate-600 md:text-lg">
              Pawmed AI transforms clinical photos into structured diagnostic
              guidance so you can focus on care, not paperwork.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row md:items-start">
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link to="/classify">Start a classification</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">See product tour</a>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(circle_at_top,#bfdbfe,transparent_65%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/80 shadow-2xl">
              <img
                src="/images/hero-vet.jpg"
                alt="Veterinarian examining a dog during a clinic visit"
                className="h-[380px] w-full object-cover md:h-[460px]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.08),transparent_40%)]" />
            </div>
            <div className="absolute -bottom-6 right-6 hidden rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 shadow-sm md:block">
              Clinic-ready UX
            </div>
          </div>
        </div>

        <div className="relative mt-16 w-full">
          <div className="relative grid w-full grid-cols-1 gap-4 rounded-3xl border border-blue-100/80 bg-blue-50 p-5 text-left  backdrop-blur sm:grid-cols-3">
            {[
              {
                label: 'Minutes to brief',
                value: '<5',
                detail: 'Case-ready summaries',
                icon: <BoltIcon className="h-4 w-4 text-blue-600" />,
              },
              {
                label: 'Care-team ready',
                value: 'Structured',
                detail: 'Unified clinical notes',
                icon: (
                  <ClipboardDocumentCheckIcon className="h-4 w-4 text-blue-600" />
                ),
              },
              {
                label: 'Confidence cues',
                value: 'Transparent',
                detail: 'Explainable insights',
                icon: <ShieldCheckIcon className="h-4 w-4 text-blue-600" />,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-3 rounded-2xl border border-blue-100/60 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-500">
                    {item.label}
                  </p>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                    {item.icon}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {item.value}
                  </p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section id="features" className="relative px-6 pb-20">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                Built for clinics
              </span>
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              Everything you need for diagnostic clarity.
            </h2>
            <p className="max-w-2xl text-sm text-slate-600 md:text-base">
              Capture, analyze, and communicate veterinary findings in a single
              flow. Pawmed AI keeps every case consistent and audit-ready.
            </p>
          </div>

          <BentoGrid>
            {features.map((feature) => (
              <BentoGridItem key={feature.title} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </section>

      <section className="bg-slate-100 px-6 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="flex justify-center items-center gap-3">
            <div className="space-y-3">
              <p className="text-xs text-center font-semibold uppercase tracking-widest text-blue-500">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                  How it works
                </span>
              </p>
              <h2 className="text-3xl font-semibold md:text-4xl">
                Designed for busy veterinary teams.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: 'Capture',
                description:
                  'Upload a clinical photo and add case context in seconds.',
                image: '/images/feature-dental.jpg',
                alt: 'Veterinarian reviewing a dog exam',
              },
              {
                title: 'Analyze',
                description:
                  'Review AI-guided findings, differentials, and suggestions.',
                image: '/images/feature-cat.jpg',
                alt: 'Veterinarian examining a cat',
              },
              {
                title: 'Deliver',
                description:
                  'Share structured briefs with your team and clients.',
                image: '/images/feature-team.jpg',
                alt: 'Veterinary team caring for a dog',
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="relative mb-4 h-28 overflow-hidden rounded-xl">
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.2),transparent_65%)]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* <section className="px-6 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                Trusted by teams
              </p>
              <h2 className="text-3xl font-semibold md:text-4xl">
                Results your clinic can feel.
              </h2>
            </div>
          </div>

          <InfiniteMovingCards
            items={testimonials}
            speed="normal"
            className="mx-auto"
          />
        </div>
      </section> */}

      <section className="px-6 pb-24 pt-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-blue-100 bg-[linear-gradient(120deg,#eff6ff,#ffffff,#dbeafe)] p-10 text-center shadow-sm">
          <h2 className="text-3xl font-semibold md:text-4xl">
            Ready to elevate your diagnostics?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            Give your care team the clarity they deserve with a streamlined,
            AI-supported workflow.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/classify">Launch classification</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/classify">Book a demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomeView

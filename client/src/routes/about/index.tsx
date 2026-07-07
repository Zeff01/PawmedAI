import { createFileRoute } from '@tanstack/react-router'
import heroImage from '@/assets/images/about/hero.png'
import { Info, AlertTriangle } from 'lucide-react'
import { PawPrint, Cross, SearchCheck, HandshakeIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { Zap, ScanSearch, ShieldCheck, BarChart3 } from 'lucide-react'
import type { ReactNode } from 'react'

// ── Shared primitives (mirrors HomeView's Pill / SectionHead) ──

interface PillProps {
  children: ReactNode
  light?: boolean
}

function Pill({ children, light = false }: PillProps) {
  return (
    <span
      className={[
        'flex w-fit items-center gap-1.5 rounded-full border px-3 py-1',
        'text-[11px] font-semibold uppercase tracking-widest',
        light
          ? 'border-white/30 bg-white/15 text-white'
          : 'border-blue-200 bg-blue-50 text-blue-600',
      ].join(' ')}
    >
      {children}
    </span>
  )
}

interface SectionHeadProps {
  pill: string
  icon?: ReactNode
  heading: string
  sub?: string
  center?: boolean
}

function SectionHead({ pill, icon, heading, sub, center = false }: SectionHeadProps) {
  return (
    <div className={`flex flex-col gap-3 ${center ? 'items-center text-center' : ''}`}>
      <Pill>
        {icon}
        {pill}
      </Pill>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        {heading}
      </h2>
      {sub && (
        <p
          className={`text-sm leading-relaxed text-slate-500 md:text-base ${
            center ? 'max-w-2xl' : 'max-w-3xl'
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

// ── Data ──

const objectives = [
  {
    title: 'Faster Assessments',
    description:
      'Cut the time between observation and a structured diagnostic starting point.',
    icon: Zap,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-600',
  },
  {
    title: 'Bridge Concern to Care',
    description:
      'Connect what you notice about your pet directly to the help they need.',
    icon: HandshakeIcon,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-500',
  },
  {
    title: 'Support, Not Replace',
    description:
      'Complement professional veterinary judgment — never substitute it.',
    icon: PawPrint,
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    iconBg: 'bg-pink-600',
  },
  {
    title: 'Accessible Pattern Recognition',
    description:
      'Make early visual diagnostic skills available to vets, students, and owners alike.',
    icon: ScanSearch,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-600',
  },
]

const features = [
  {
    title: 'Disease Classification',
    description:
      'Analyze visual symptoms from a photo and get a structured diagnostic brief in minutes.',
    image: '/src/assets/images/about/scope1.png',
    icon: Zap,
  },
  {
    title: 'Breed Identification',
    description:
      "Identifies your pet's breed and surfaces breed-linked health tendencies instantly.",
    image: '/src/assets/images/about/scope2.png',
    icon: ScanSearch,
  },
  {
    title: 'Nearby Vet Locator',
    description: 'Find licensed clinics near you and act on your results right away.',
    image: '/src/assets/images/about/scope3.png',
    icon: ShieldCheck,
  },
  {
    title: 'Structured Diagnostic Output',
    description:
      'Every result comes back as a clean, organized report you can bring to your vet.',
    image: '/src/assets/images/about/scope4.png',
    icon: BarChart3,
  },
]

const values = [
  {
    title: 'Animal Welfare First',
    description:
      'Every feature we build is guided by one question: does this help animals get better care faster?',
    image: '/src/assets/images/about/values1.png',
    alt: 'Animal Welfare',
    icon: PawPrint,
  },
  {
    title: 'Clinically Grounded',
    description:
      'Our models are trained on veterinary data. We build for accuracy, not just speed.',
    image: '/src/assets/images/about/values2.png',
    alt: 'Clinical',
    icon: Cross,
  },
  {
    title: 'Radically Transparent',
    description:
      "We're an AI tool. We know our limits. We'll always tell you when to see a veterinarian.",
    image: '/src/assets/images/about/values3.png',
    alt: 'Transparency',
    icon: SearchCheck,
  },
]

export const Route = createFileRoute('/about/')({
  component: App,
})

function App() {
  return (
    <main className="bg-white text-slate-900 antialiased">
      {/* ── Section 1 — About us ── */}
      <section className="px-6 pb-24 pt-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <Pill>
              <Info className="h-3.5 w-3.5" />
              About us
            </Pill>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-[3.5rem]">
              <span className="text-blue-600">Smart Diagnostics.</span>
              <br />
              Healthier Pets.
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-slate-500 md:text-base">
              PawMed AI is a clinical support tool that helps vets, veterinary
              students, and informed pet owners make faster, more structured
              decisions. Powered by AI, grounded in veterinary science.
            </p>
          </div>

          {/* Right */}
          <div className="flex justify-center lg:justify-end">
            <img
              src={heroImage}
              alt="About Hero"
              className="w-full max-w-[520px] rounded-[28px] object-cover shadow-xl shadow-blue-100/40"
            />
          </div>
        </div>
      </section>

      {/* ── Section 2 — What PawMed AI covers ── */}
      <section className="px-6 pb-24 pt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <SectionHead
            pill="What PawMed AI covers"
            heading="Built for every step of the diagnostic journey."
            sub="PawMed AI analyzes clinical pet photos and returns a structured diagnostic brief in under 5 minutes — whether you're a vet reviewing a case, a student sharpening your skills, or a pet owner trying to understand what's wrong."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  role="listitem"
                >
                  <figure className="relative h-44 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
                  </figure>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <header className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    </header>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Section 3 — Objectives ── */}
      <section className="bg-slate-50 px-6 py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <SectionHead
            pill="Our objectives"
            heading="What we're here to do."
            sub="PawMed AI is built with a clear purpose. Every feature, every model, and every output is shaped by these goals:"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {objectives.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className={`${item.bg} ${item.border} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
                  role="listitem"
                >
                  <div
                    className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg} shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Section 4 — Support, not replace ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border-l-4 border-orange-500 bg-orange-50/60 p-6 shadow-sm md:p-8">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                A tool to support. Not to replace.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  For professionals &amp; students
                </p>
                <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                  PawMed AI is designed to augment clinical judgment, providing
                  rapid access to differential diagnoses and literature. It
                  does not replace independent veterinary assessment.
                </p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  For owners
                </p>
                <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                  This platform offers educational insights based on your
                  pet's symptoms. It is not a substitute for professional
                  veterinary advice, diagnosis, or treatment. Always consult a
                  licensed veterinarian in emergencies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5 — Mission & vision ── */}
      <section className="px-6 py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          <img
            src="/src/assets/images/about/Mission&Vision.png"
            alt="Veterinarian examining a dog"
            className="h-[420px] w-full rounded-2xl object-cover shadow-xl shadow-blue-100/40 md:h-[480px]"
          />

          <div className="flex flex-col gap-4">
            <Pill>Our mission &amp; vision</Pill>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Faster clarity.
              <br />
              Better care.
            </h2>

            <p className="text-sm leading-relaxed text-slate-500 md:text-base">
              Our mission is simple: give everyone — from the seasoned
              clinician to the first-time pet owner — a smarter, faster way
              to understand what they're seeing. We built PawMed AI to close
              the gap between what pet owners notice and what veterinarians
              need to know.
            </p>

            <p className="text-sm leading-relaxed text-slate-500 md:text-base">
              Veterinary diagnostics shouldn't be slow, inaccessible, or
              confusing. PawMed AI makes the first step clearer.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6 — What we stand for ── */}
      <section className="bg-slate-50 px-6 py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <SectionHead
            center
            pill="What we stand for"
            heading="Care-first. Science-backed. Responsible."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {values.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  role="listitem"
                >
                  <figure className="relative h-44 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
                  </figure>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <header className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    </header>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Section 7 — CTA ── */}
      <section className="px-6 pb-24 pt-0">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-500 p-12 text-center shadow-xl shadow-blue-200/40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative flex flex-col items-center gap-4">
            <Pill light>Get started today</Pill>

            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to get started?
            </h2>

            <p className="mx-auto max-w-xl text-sm leading-relaxed text-blue-100 md:text-base">
              Try the classification tool or sign in to access your full
              diagnostic dashboard.
            </p>

            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-50">
                Try PawMed AI Now
                <ArrowRight className="h-4 w-4" />
              </button>

              <button className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white hover:text-blue-600">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
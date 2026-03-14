import { Link } from '@tanstack/react-router'
import {
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BeakerIcon,
  StarIcon,
} from '@heroicons/react/24/solid'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { FadeStagger } from '@/components/motion/FadeStagger'
import { FadeChild } from '@/components/motion/FadeChild'
import { FadeIn } from '@/components/motion/FadeIn'

const IMG: Record<string, string> = {
  hero: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=900&q=80',
  brief:
    'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=80',
  notes: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
  security:
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
  analytics:
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&q=80',
  capture:
    'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=600&q=80',
  analyze:
    'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&q=80',
  deliver:
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80',
}

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
  heading: string
  sub?: string
  center?: boolean
}

function SectionHead({ pill, heading, sub, center = false }: SectionHeadProps) {
  return (
    <FadeStagger
      className={`flex flex-col gap-3 ${center ? 'items-center text-center' : ''}`}
    >
      <FadeChild>
        <Pill>{pill}</Pill>
      </FadeChild>
      <FadeChild>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {heading}
        </h2>
      </FadeChild>
      {sub && (
        <FadeChild>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
            {sub}
          </p>
        </FadeChild>
      )}
    </FadeStagger>
  )
}

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  detail: string
}

function MetricCard({ icon, label, value, detail }: MetricCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">
          {label}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{detail}</p>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  image: string
  wide?: boolean
}

function FeatureCard({
  title,
  description,
  icon,
  image,
  wide = false,
}: FeatureCardProps) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md ${wide ? 'md:col-span-2' : ''}`}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            {icon}
          </span>
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  )
}

interface StepCardProps {
  step: number
  title: string
  description: string
  image: string
  alt: string
  icon: ReactNode
}

function StepCard({
  step,
  title,
  description,
  image,
  alt,
  icon,
}: StepCardProps) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-36 overflow-hidden rounded-xl">
        <img
          src={image}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">
          Step {step}
        </p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </div>
  )
}

interface TrustItemProps {
  label: string
}
function TrustItem({ label }: TrustItemProps) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      {label}
    </span>
  )
}

function HomeView() {
  const trustItems = ['HIPAA-aligned', 'No credit card', 'Clinic-ready UX']

  return (
    <div className="bg-white text-slate-900 antialiased">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 60% -10%, #dbeafe 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 0% 80%, #eff6ff 0%, transparent 60%)',
          }}
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          {/* Left — staggered mount */}
          <FadeStagger
            trigger="mount"
            className="flex flex-col items-center gap-6 text-center md:items-start md:text-left"
          >
            <FadeChild>
              <Pill>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 2v2M5 2v2m0-1H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
                  <path d="M8 15a6 6 0 0 0 12 0v-3" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
                Veterinary intelligence
              </Pill>
            </FadeChild>

            <FadeChild>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-[3.5rem]">
                <span className="text-blue-600">Diagnose faster</span>
                <br />
                with AI-crafted clinical briefs for pets.
              </h1>
            </FadeChild>

            <FadeChild>
              <p className="max-w-lg text-base leading-relaxed text-slate-500 md:text-lg">
                Pawmed AI transforms clinical photos into structured diagnostic
                guidance so you can focus on care, not paperwork.
              </p>
            </FadeChild>

            <FadeChild>
              <div className="flex flex-col items-center gap-3 sm:flex-row md:items-start">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  <Link to="/classify">
                    Start a classification
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <a href="#features">See product tour</a>
                </Button>
              </div>
            </FadeChild>

            <FadeChild>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                {trustItems.map((label) => (
                  <TrustItem key={label} label={label} />
                ))}
              </div>
            </FadeChild>
          </FadeStagger>

          {/* Right — hero image */}
          <FadeIn
            trigger="mount"
            direction="left"
            delay={0.2}
            className="relative mx-auto w-full max-w-md md:max-w-none"
          >
            <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-blue-100 to-blue-50 opacity-70 blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-blue-100 shadow-xl shadow-blue-100/40">
              <img
                src={IMG.hero}
                alt="Veterinarian examining a dog"
                className="h-[400px] w-full object-cover md:h-[480px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
            <FadeIn
              trigger="mount"
              direction="up"
              delay={0.5}
              className="absolute -bottom-5 right-5 flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-white/95 px-4 py-2.5 shadow-lg shadow-blue-100/30 backdrop-blur-sm"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
              <span className="text-xs font-semibold text-slate-700">
                AI analysis ready
              </span>
            </FadeIn>
          </FadeIn>
        </div>

        {/* Metric strip — scroll triggered */}
        <FadeStagger className="mx-auto mt-16 grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
          <FadeChild>
            <MetricCard
              icon={<BoltIcon className="h-4 w-4" />}
              label="Minutes to brief"
              value="< 5"
              detail="Case-ready summaries"
            />
          </FadeChild>
          <FadeChild>
            <MetricCard
              icon={<ClipboardDocumentCheckIcon className="h-4 w-4" />}
              label="Documentation"
              value="Structured"
              detail="Unified clinical notes"
            />
          </FadeChild>
          <FadeChild>
            <MetricCard
              icon={<ShieldCheckIcon className="h-4 w-4" />}
              label="Confidence cues"
              value="Transparent"
              detail="Explainable insights"
            />
          </FadeChild>
        </FadeStagger>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 pb-24 pt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <SectionHead
            pill="Built for clinics"
            heading="Everything you need for diagnostic clarity."
            sub="Capture, analyze, and communicate veterinary findings in a single flow. Pawmed AI keeps every case consistent and audit-ready."
          />
          <FadeStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FadeChild>
              <FeatureCard
                title="Rapid diagnostic briefs"
                description="Turn a clinical photo into a structured, shareable brief in minutes."
                icon={<BoltIcon className="h-4 w-4" />}
                image={IMG.brief}
                wide
              />
            </FadeChild>
            <FadeChild>
              <FeatureCard
                title="Evidence-guided notes"
                description="Surface the key differentials, observations, and next steps."
                icon={<ClipboardDocumentCheckIcon className="h-4 w-4" />}
                image={IMG.notes}
              />
            </FadeChild>
            <FadeChild>
              <FeatureCard
                title="Veterinary-grade security"
                description="Keep case data protected with secure, encrypted workflows."
                icon={<ShieldCheckIcon className="h-4 w-4" />}
                image={IMG.security}
              />
            </FadeChild>
            <FadeChild>
              <FeatureCard
                title="Actionable analytics"
                description="Track confidence, case trends, and operational lift over time."
                icon={<ChartBarIcon className="h-4 w-4" />}
                image={IMG.analytics}
              />
            </FadeChild>
          </FadeStagger>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-50 px-6 py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <SectionHead
            pill="How it works"
            heading="Designed for busy veterinary teams."
            center
          />
          <FadeStagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FadeChild>
              <StepCard
                step={1}
                title="Capture"
                description="Upload a clinical photo and add case context in seconds."
                image={IMG.capture}
                alt="Veterinarian capturing a clinical photo"
                icon={<CameraIcon className="h-4 w-4" />}
              />
            </FadeChild>
            <FadeChild>
              <StepCard
                step={2}
                title="Analyze"
                description="Review AI-guided findings, differentials, and suggestions."
                image={IMG.analyze}
                alt="Veterinarian analyzing clinical data"
                icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </FadeChild>
            <FadeChild>
              <StepCard
                step={3}
                title="Deliver"
                description="Share structured briefs with your team and clients instantly."
                image={IMG.deliver}
                alt="Veterinarian sharing a clinical brief"
                icon={<DocumentTextIcon className="h-4 w-4" />}
              />
            </FadeChild>
          </FadeStagger>
        </div>
      </section>

      {/* ── FOR YOU ── */}
      <section className="px-6 py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
          {/* Heading */}
          <FadeStagger className="flex flex-col items-center gap-3 text-center">
            <FadeChild>
              <Pill>
                <StarIcon className="h-3.5 w-3.5" />
                <p>Built for you</p>
              </Pill>
            </FadeChild>
            <FadeChild>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Your clinical edge, powered by AI.
              </h2>
            </FadeChild>
            <FadeChild>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
                Whether you're still in school or running a full practice,
                Pawmed AI meets you where you are — sharpening your instincts
                and accelerating every case.
              </p>
            </FadeChild>
          </FadeStagger>

          {/* Audience cards */}
          <FadeStagger className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Students */}
            <FadeChild direction="left">
              <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                  <BeakerIcon className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-500">
                  Veterinary students
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  Learn faster, retain more.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Bridge the gap between textbook knowledge and real-world
                  cases. Upload a clinical photo, see structured differentials,
                  and build diagnostic confidence with every submission — long
                  before you step into a clinic on your own.
                </p>
                <ul className="mt-5 flex flex-col gap-2">
                  {[
                    'Instant feedback on your differential thinking',
                    'Evidence-backed breakdowns for self-study',
                    'Build a personal case library as you go',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeChild>

            {/* Professionals */}
            <FadeChild direction="right">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-md">
                  <ClipboardDocumentCheckIcon className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-300">
                  Veterinary professionals
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  Move faster without compromising care.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Cut documentation time, reduce cognitive load during busy
                  shifts, and deliver structured briefs your whole care team can
                  act on. Spend less time on paperwork and more time on what
                  matters — the patient in front of you.
                </p>
                <ul className="mt-5 flex flex-col gap-2">
                  {[
                    'Structured briefs ready in under 5 minutes',
                    'Consistent notes across your entire team',
                    'Audit-ready records with zero extra effort',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeChild>
          </FadeStagger>

          {/* Coming soon banner */}
          <FadeIn>
            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-300" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-blue-700">
                  Coming soon for fur parents —{' '}
                </span>
                we're working on a version designed specifically for pet owners
                to better understand their companion's health. Stay tuned.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-24 pt-0">
        <FadeIn className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-500 p-12 text-center shadow-xl shadow-blue-200/40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <FadeStagger className="flex flex-col items-center gap-4">
            <FadeChild>
              <Pill light>Get started today</Pill>
            </FadeChild>
            <FadeChild>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Ready to elevate your diagnostics?
              </h2>
            </FadeChild>
            <FadeChild>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-blue-100 md:text-base">
                Give your care team the clarity they deserve with a streamlined,
                AI-supported workflow that saves hours every week.
              </p>
            </FadeChild>
            <FadeChild>
              <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-xl bg-white text-blue-600 shadow-md hover:bg-blue-50"
                >
                  <Link to="/classify">
                    Launch classification
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </FadeChild>
          </FadeStagger>
        </FadeIn>
      </section>
    </div>
  )
}

export default HomeView

import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/AuthModal'
import { useMe } from '@/hooks/useAuth'
import { FadeStagger } from '@/components/motion/FadeStagger'
import { FadeChild } from '@/components/motion/FadeChild'
import { FadeIn} from '@/components/motion/FadeIn'

const IMG: Record<string, string> = {
  ourServices: '/images/Rapid Diagnostic Brief.jpg',
  service1: '/images/Evident-guided notes.jpg',
  service2: '/images/Veterinary-grade security.jpg',
  service3: '/images/Actionable analytics.jpg',
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

export function ServicesView() {
  const { data: me } = useMe()
  const navigate = useNavigate()

  return (
    <div className="bg-white text-slate-900 antialiased">
      <section className="relative overflow-hidden px-6 pb-24 pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 60% -10%, #dbeafe 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 0% 80%, #eff6ff 0%, transparent 60%)',
          }}
        />
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          <FadeStagger
              trigger="mount"
              className="space-y-6"
            >
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              
              <div className="space-y-6">
                <FadeChild>
                  <Pill>Our services</Pill>
                </FadeChild>
                <FadeChild>
                  <div className="space-y-4">
                      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        What <span className="text-blue-500">Pawmed AI</span> Can Do
                      </h1>
                      <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                      Three tools. One platform. Built to support faster, clearer veterinary decision-making.
                      </p>
                  </div>
                </FadeChild>
              </div>
              <FadeChild>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <img
                    src={IMG.ourServices}
                    alt="Pawmed AI services overview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </FadeChild>
            </div>
          </FadeStagger>

          <section>
            <FadeIn 
              trigger="scroll"
              direction="down"
              delay={0.1}
              className="relative mx-auto w-full max-w-md md:max-w-none">
              <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{
                        backgroundImage:
                        'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                      }}
                  />
              <FadeStagger
                trigger="mount"
                className="flex flex-col items-center gap-6 text-center md:items-start md:text-left"
              >
                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <FadeChild>
                    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
                      <img
                        src={IMG.service1}
                        alt="Disease classification service"
                        className="h-full w-full object-cover"
                      />
                  </div>
                  </FadeChild>
                  <div className="space-y-6 rounded-[32px] border border-slate-200 bg-slate-50 p-10 shadow-sm">
                    <FadeChild>
                      <Pill>Service 01</Pill>
                    </FadeChild>
                    <FadeChild>
                      <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                        Stop Guessing. Start Classifying.
                      </h3>
                    </FadeChild>
                    <FadeChild>
                      <p className="max-w-xl text-base leading-relaxed text-slate-600">
                        Upload a photo of your pet's affected area and Pawmed AI returns a structured diagnostic brief in under 5 minutes. Condition categories, severity indicators, and clear next steps included.
                      </p>
                    </FadeChild>
                    <FadeChild>
                      <ul className="space-y-3 text-sm text-slate-500">
                        <li>• Condition classification with confidence indicator</li>
                        <li>• Structured diagnostic brief</li>
                        <li>• Context note for use with disease classification</li>
                      </ul>
                    </FadeChild>
                    <FadeChild>
                        {me ? (
                          <Link
                            to="/classify"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                          >
                            Start classification <ArrowRightIcon className="h-4 w-4" />
                          </Link>
                        ) : (
                          <AuthModal
                            showGuestOption
                            onGuestContinue={() => navigate({ to: '/classify' })}
                            trigger={
                              <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 ">
                                Classify a Disease Now <ArrowRightIcon className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                    </FadeChild>
                  </div>
                </div>
              </FadeStagger>
            </FadeIn>
          </section>

          <section>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 60% -10%, #dbeafe 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 0% 80%, #eff6ff 0%, transparent 60%)',
              }}
            />
            <FadeIn
              trigger="scroll"
              direction="down"
              delay={0.1}
              className="relative mx-auto w-full max-w-md md:max-w-none"
            >
              <FadeStagger
                  trigger="mount"
                  className="space-y-6"
                  >
                <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                  <div className="space-y-6 rounded-[32px] border border-slate-200 bg-slate-50 p-10 shadow-sm">
                    <FadeChild>
                      <Pill>Service 02</Pill>
                    </FadeChild>
                    <FadeChild>
                      <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                        Know the Breed. Know the Risk.
                      </h3>
                    </FadeChild>
                    <FadeChild>
                      <p className="max-w-xl text-base leading-relaxed text-slate-600">
                        Breed shapes everything. From symptom likelihood to treatment response. Upload a photo and Pawmed AI identifies the breed instantly, surfacing health predispositions that make your diagnostic picture sharper and your vet conversation smarter.
                      </p>
                    </FadeChild>
                    <FadeChild>
                      <ul className="space-y-3 text-sm text-slate-500">
                        <li>• Condition classification with confidence indicator</li>
                        <li>• Breed-specific health predispositions</li>
                        <li>• Context note for use with disease classification</li>
                      </ul>
                    </FadeChild>
                    <FadeChild>
                      {me ? (
                        <Link
                          to="/classify"
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                        >
                          Start classification <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                      ) : (
                        <AuthModal
                          showGuestOption
                          onGuestContinue={() => navigate({ to: '/classify-breed' })}
                          trigger={
                            <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 ">
                              Identify the Breed <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                          }
                        />
                      )}
                    </FadeChild>
                  </div>
                  <FadeChild>
                    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
                      <img
                        src={IMG.service2}
                        alt="Breed analysis service"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </FadeChild>
                </div>
              </FadeStagger>
            </FadeIn>
          </section>

          <section className="relative overflow-hidden px-6 pb-24 pt-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 60% -10%, #dbeafe 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 0% 80%, #eff6ff 0%, transparent 60%)',
              }}
            />
            <FadeIn
              trigger="scroll"
              direction="down"
              delay={0.1}
              className="relative mx-auto w-full max-w-md md:max-w-none"
            >
              <FadeStagger
                  trigger="mount"
                  className="flex flex-col items-center gap-6 text-center md:items-start md:text-left"
                  >
                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <FadeChild>
                  <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
                    <img
                      src={IMG.service3}
                      alt="Nearby vet guidance service"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  </FadeChild>
                  <div className="space-y-6 rounded-[32px] border border-slate-200 bg-slate-50 p-10 shadow-sm">
                    <FadeChild>
                      <Pill>Service 03</Pill>
                    </FadeChild>
                    <FadeChild>
                      <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                        Your Results Mean Nothing Without Action.
                      </h3>
                    </FadeChild>
                    <FadeChild>
                      <p className="max-w-xl text-base leading-relaxed text-slate-600">
                        Pawmed AI gives you the starting point, a licensed vet takes it from there. Once you have your diagnostic brief, connect with a clinic near you in seconds and turn your findings into real care.
                      </p>
                    </FadeChild>
                    <FadeChild>
                      <ul className="space-y-3 text-sm text-slate-500">
                        <li>• Map view and list of nearby clinics</li>
                        <li>• Clinic name, contact number, and hours</li>
                        <li>• Direct link to get directions</li>
                      </ul>
                    </FadeChild>
                    <FadeChild>
                      {me ? (
                        <Link
                          to="/classify"
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                        >
                          Start classification <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                      ) : (
                        <AuthModal
                          showGuestOption
                          onGuestContinue={() => navigate({ to: '/nearby-vets' })}
                          trigger={
                            <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 ">
                              Find a vet near me <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                          }
                        />
                      )}
                    </FadeChild>
                  </div>
                </div>
              </FadeStagger>
            </FadeIn>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
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
                            {me ? (
                              <Button
                                asChild
                                size="lg"
                                className="gap-2 rounded-xl bg-white text-blue-600 shadow-md hover:bg-blue-50"
                              >
                                <Link to="/classify-breed">
                                  Launch classification
                                  <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <AuthModal
                                showGuestOption
                                onGuestContinue={() => navigate({ to: '/classify-breed' })}
                                trigger={
                                  <Button
                                    size="lg"
                                    className="gap-2 rounded-xl bg-white text-blue-600 shadow-md hover:bg-blue-50"
                                  >
                                    Launch classification
                                    <ArrowRightIcon className="h-4 w-4" />
                                  </Button>
                                  
                                  
                                }
                              />
                            )}
                            {me ? (
                              <Button
                                asChild
                                size="lg"
                                className="gap-2 rounded-xl bg-blue shadow-md hover:bg-white-50 border-white-100"
                              >
                                <Link to="/classify">
                                  Sign In
                                  <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <AuthModal
                                trigger={
                                  <Button
                                    size="lg"
                                    className="gap-2 rounded-xl bg-blue shadow-md hover:bg-white-50 border-blue-100"
                                  >
                                    Sign In
                                    <ArrowRightIcon className="h-4 w-4" />
                                  </Button>
                                }
                              />
                            )}
                          </div>
                        </FadeChild>
                      </FadeStagger>
                    </FadeIn>
          </section>
        </div>
      </section>
    </div>
  )
}
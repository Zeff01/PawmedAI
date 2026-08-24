import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  BeakerIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/AuthModal'
import { RoutePending } from '@/components/RoutePending'
import { useIsVeterinaryProfessional } from '../hooks/useCbc'

const PROFILE_LABELS: Record<string, string> = {
  student: 'Veterinary Student',
  fur_parent: 'Fur Parent',
  professional: 'Veterinary Professional',
}

export function ProfessionalGate({ children }: { children: React.ReactNode }) {
  const { isAuthed, isProfessional, userType, isLoading } =
    useIsVeterinaryProfessional()

  if (isLoading) return <RoutePending />

  if (!isAuthed) {
    return (
      <GateShell
        icon={<LockClosedIcon className="h-6 w-6" />}
        title="Sign in to open the CBC Analyzer"
        body="The analyzer reads a complete blood count and returns a structured diagnostic brief. It is available to Veterinary Professional accounts."
        action={
          <AuthModal
            trigger={
              <Button className="h-11 rounded-xl bg-blue-600 px-6 text-[13px] font-bold text-white hover:bg-blue-700">
                Sign in to continue
              </Button>
            }
          />
        }
      />
    )
  }

  if (!isProfessional) {
    const label = userType ? PROFILE_LABELS[userType] : null
    return (
      <GateShell
        icon={<ShieldCheckIcon className="h-6 w-6" />}
        title="Available to Veterinary Professionals"
        body={
          label
            ? `Your account is set up as a ${label}. The CBC Analyzer interprets raw haematology values and names differentials, so it is limited to Veterinary Professional profiles.`
            : 'Choose the Veterinary Professional profile to use the CBC Analyzer. It interprets raw haematology values and names differentials, so it is limited to clinicians.'
        }
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              className="h-11 rounded-xl bg-blue-600 px-6 text-[13px] font-bold text-white hover:bg-blue-700"
            >
              <Link to="/classify">
                <BeakerIcon className="h-4 w-4" />
                Go to Classify Disease
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-slate-200 px-6 text-[13px] font-bold text-slate-600"
            >
              <Link to="/classify-breed">Classify a breed instead</Link>
            </Button>
          </div>
        }
        footnote="Registered with the wrong profile type? Contact pawmed.ai27@gmail.com and we can move your account over."
      />
    )
  }

  return <>{children}</>
}

function GateShell({
  icon,
  title,
  body,
  action,
  footnote,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action: React.ReactNode
  footnote?: string
}) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>
        <h1 className="mt-4 text-[20px] font-extrabold text-slate-900">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
          {body}
        </p>
        <div className="mt-6 flex justify-center">{action}</div>
        {footnote ? (
          <p className="mt-5 border-t border-slate-100 pt-4 text-[11.5px] text-slate-400">
            {footnote}
          </p>
        ) : null}
      </div>
    </section>
  )
}

import type { DiseaseClassificationResult } from '@/features/classify-dss/types'
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { useDownloadPdf } from '../hooks/useDownloadPdf'
import { BulletList, SectionLabel, TreatmentBlock } from './ResultsBlock'
import { isNonAnimalResult } from '../utils/is-non-animal-result'
import { useUserTypeStore } from '@/stores/userTypeStore'

function Divider() {
  return (
    <hr className="h-px border-0 bg-linear-to-r from-transparent via-slate-200 to-transparent" />
  )
}

export function ResultsSection({
  result,
  previewUrl,
}: {
  result: DiseaseClassificationResult
  previewUrl: string | null
}) {
  const handleDownloadPdf = useDownloadPdf(result, previewUrl)
  const userType = useUserTypeStore((state) => state.userType)
  const isProfessional = userType === 'professional'

  if (isNonAnimalResult(result)) {
    return (
      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/80 shadow-[0_10px_30px_rgba(37,99,235,0.12)]">
        <div className="flex items-start gap-3 border-b border-blue-200/60 bg-blue-600/95 px-6 py-5 text-white">
          <ExclamationCircleIcon className="mt-0.5 h-6 w-6" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
              Unable to classify
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              This photo doesn't appear to show an animal.
            </h2>
            <p className="mt-2 text-sm text-blue-100/90">
              Please upload a clear photo of your pet's skin or affected area so
              we can help.
            </p>
          </div>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Try this:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Make sure your pet is fully in frame.</li>
            <li>Focus on the area of concern.</li>
            <li>Use good lighting and avoid blurry shots.</li>
          </ul>
        </div>
      </div>
    )
  }

  if (isProfessional) {
    return (
      <ProfessionalResults result={result} onDownload={handleDownloadPdf} />
    )
  }

  return <StudentResults result={result} onDownload={handleDownloadPdf} />
}

function StudentResults({
  result,
  onDownload,
}: {
  result: DiseaseClassificationResult
  onDownload: () => void
}) {
  const differential =
    Array.isArray(result.differential_diagnoses) &&
    result.differential_diagnoses.length > 0
      ? result.differential_diagnoses
      : null

  return (
    <div className="animate-rise-in overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_30px_rgba(15,28,63,0.09)]">
      <div className="relative flex flex-col md:flex-row space-y-5 md:space-y-0 justify-between overflow-hidden bg-linear-to-br from-blue-800 via-blue-700 to-blue-600 px-7 py-8">
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
            <CheckCircleIcon className="h-2.5 w-2.5" />
            {typeof result.confidence === 'number'
              ? `${result.confidence}% confidence`
              : 'Confidence unavailable'}
          </div>
          <h2 className="mb-1.5 text-[28px] font-bold leading-tight text-white">
            {result.disease_name}
          </h2>
          <p className="max-w-3xl text-lg font-semibold text-gray-300">
            {result.short_description}
          </p>
        </div>
        <div className="relative z-10 md:absolute md:right-7 md:top-7">
          <Button
            type="button"
            variant="outline"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-md border-white/40 bg-white px-4 py-2 text-xs font-semibold text-blue-500 transition hover:bg-blue-500/20 hover:text-white"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-7 py-7 text-sm font-medium">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <SectionLabel>Possible Causes</SectionLabel>
            <BulletList items={result.possible_causes} />
          </div>
          <div>
            <SectionLabel>Symptoms</SectionLabel>
            <BulletList items={result.symptoms} />
          </div>
        </div>
        <Divider />
        <div>
          <SectionLabel>Recommended Treatment</SectionLabel>
          <TreatmentBlock value={result.recommended_treatment} />
        </div>
        {result.pathophysiology && (
          <>
            <Divider />
            <div>
              <SectionLabel>Pathophysiology</SectionLabel>
              <p className="leading-relaxed text-slate-600">
                {result.pathophysiology}
              </p>
            </div>
          </>
        )}
        {result.visual_cues && result.visual_cues.length > 0 && (
          <>
            <Divider />
            <div>
              <SectionLabel>Visual Cues</SectionLabel>
              <BulletList items={result.visual_cues} />
            </div>
          </>
        )}
        {differential && (
          <>
            <Divider />
            <div>
              <SectionLabel>Differential Diagnoses</SectionLabel>
              <ul className="flex flex-col gap-2">
                {differential.map((item) => {
                  if (typeof item === 'string') {
                    return (
                      <li key={item} className="text-sm text-slate-600">
                        {item}
                      </li>
                    )
                  }
                  return (
                    <li
                      key={item.name}
                      className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-600"
                    >
                      <p className="font-semibold text-slate-800">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {item.reason_excluded}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
        {result.study_topics && result.study_topics.length > 0 && (
          <>
            <Divider />
            <div>
              <SectionLabel>Study Topics</SectionLabel>
              <BulletList items={result.study_topics} />
            </div>
          </>
        )}
        {result.additional_notes && (
          <>
            <Divider />
            <div>
              <SectionLabel>Additional Notes</SectionLabel>
              <div className="rounded-xl border border-blue-100 bg-linear-to-br from-blue-50/80 to-indigo-50/40 px-5 py-4">
                <p className="leading-relaxed text-slate-600">
                  {result.additional_notes}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ProfessionalResults({
  result,
  onDownload,
}: {
  result: DiseaseClassificationResult
  onDownload: () => void
}) {
  const differential =
    Array.isArray(result.differential_diagnoses) &&
    result.differential_diagnoses.length > 0
      ? result.differential_diagnoses
      : null

  return (
    <div className="animate-rise-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_6px_28px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-900 px-6 py-4 text-white sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            Clinical Summary
          </p>
          <h2 className="text-3xl font-semibold">{result.disease_name}</h2>
          <p className="max-w-3xl text-sm text-slate-200">
            {result.short_description}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-left sm:text-right">
          <div className="flex items-center gap-2 text-[.6em] border border-gray-600 bg-gray-700 py-1 px-3 rounded-full">
            <p className="uppercase tracking-[0.2em] text-slate-300">
              Confidence:
            </p>
            <p className="font-semibold">
              {typeof result.confidence === 'number'
                ? `${result.confidence}%`
                : 'N/A'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-md border-white/30 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-900 transition hover:bg-white/90"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="text-[12px] text-slate-700">
        <KeyValueRow label="Possible causes">
          <InlineList items={result.possible_causes} />
        </KeyValueRow>
        <KeyValueRow label="Symptoms">
          <InlineList items={result.symptoms} />
        </KeyValueRow>
        <KeyValueRow label="Recommended treatment">
          <span className="text-slate-700">{result.recommended_treatment}</span>
        </KeyValueRow>
        {result.treatment_protocol && (
          <>
            <KeyValueRow label="Medications">
              <InlineList items={result.treatment_protocol.medications} />
            </KeyValueRow>
            <KeyValueRow label="Dosage notes">
              <StructuredText value={result.treatment_protocol.dosage_notes} />
            </KeyValueRow>
            <KeyValueRow label="Duration">
              {result.treatment_protocol.duration}
            </KeyValueRow>
          </>
        )}
        {differential && (
          <KeyValueRow label="Differential diagnoses">
            <InlineList
              items={differential.map((item) =>
                typeof item === 'string' ? item : item.name,
              )}
            />
          </KeyValueRow>
        )}
        {result.escalation_criteria &&
          result.escalation_criteria.length > 0 && (
            <KeyValueRow label="Escalation criteria">
              <InlineList items={result.escalation_criteria} />
            </KeyValueRow>
          )}
        {result.additional_notes && (
          <KeyValueRow label="Additional notes">
            {result.additional_notes}
          </KeyValueRow>
        )}
      </div>
    </div>
  )
}

function KeyValueRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2 p-5 border-b border-slate-100 sm:grid-cols-[180px_1fr] sm:items-start">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="text-sm font-medium leading-5 text-slate-700">
        {children}
      </div>
    </div>
  )
}

function InlineList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md font-medium border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function StructuredText({ value }: { value: string }) {
  const cleaned = value.replace(/\*\*/g, '').trim()
  const numberedSplit = cleaned.split(/\s*\d+\.\s+/).filter(Boolean)
  if (numberedSplit.length > 1) {
    return (
      <ul className="flex flex-col gap-2">
        {numberedSplit.map((item) => (
          <li key={item} className="text-[12px] text-slate-700">
            {item.trim()}
          </li>
        ))}
      </ul>
    )
  }
  return <span className="text-[12px] text-slate-700">{cleaned}</span>
}

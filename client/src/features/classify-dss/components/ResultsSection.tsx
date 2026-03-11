import type { DiseaseClassificationResult } from '#/features/classify-dss/types'
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid'
import { Button } from '#/components/ui/button'
import { useDownloadPdf } from '../hooks/useDownloadPdf'
import { BulletList, SectionLabel, TreatmentBlock } from './ResultsBlock'
import { isNonAnimalResult } from '../utils/is-non-animal-result'

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
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-md border-white/40 bg-white px-4 py-2 text-xs font-semibold text-blue-500 transition hover:bg-blue-500/20 hover:text-white"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-7 py-7 text-sm font-medium">
        <div>
          <SectionLabel>Clinical Diagnosis</SectionLabel>
          <p className="leading-relaxed text-slate-600">
            {result.clinical_diagnosis}
          </p>
        </div>
        <Divider />
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

import { createFileRoute, Link } from '@tanstack/react-router'
import { Seo } from '@/components/Seo'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found | Pawmed AI"
        description="The page you're looking for doesn't exist. Return to Pawmed AI to classify a disease or find a vet near you."
        noIndex={true}
        canonicalPath="/"
      />
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Back to home
          </Link>
          <Link
            to="/classify"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Classify a disease
          </Link>
        </div>
      </div>
    </>
  )
}

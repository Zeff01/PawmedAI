import { ChevronRight, Plus } from 'lucide-react'

export function AddPetCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50/20 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50 focus-visible:ring-2 focus-visible:ring-fp-brand-500/40 focus-visible:outline-none"
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-emerald-200 bg-white text-fp-brand-700 shadow-fp-subtle transition group-hover:scale-110">
        <Plus className="size-6" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">
        Welcoming a new rescue?
      </h3>
      <p className="mt-1 max-w-xs text-xs text-slate-500">
        Register your puppy, kitten, or adoption buddy to unlock instant AI
        checkups and care reminders.
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-fp-brand-700 group-hover:underline">
        Get started
        <ChevronRight className="size-3.5" />
      </span>
    </button>
  )
}

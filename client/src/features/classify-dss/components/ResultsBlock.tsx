import { CheckIcon } from '@heroicons/react/24/solid'
import { cleanText, splitIntoItems } from '../utils/text'

function TreatmentBlock({ value }: { value: string }) {
  const items = splitIntoItems(value)
  if (items.length > 1) {
    return (
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-slate-600"
          >
            <span className="mt-0.5 flex h-4.25 w-4.25 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <CheckIcon />
            </span>
            {item}
          </li>
        ))}
      </ul>
    )
  }
  return <p className="leading-relaxed text-slate-600">{cleanText(value)}</p>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm font-bold uppercase tracking-[0.13em] text-blue-600">
      {children}
    </p>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-sm text-slate-600"
        >
          <span className="mt-0.5 flex h-4.25 w-4.25 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
            <CheckIcon />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export { TreatmentBlock, SectionLabel, BulletList }

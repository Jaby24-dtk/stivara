import type { TimelineEvent } from '@/lib/compliance/timeline'

export function CompanyTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No dated history on record yet.</p>
  }

  return (
    <ul className="flex flex-col">
      {events.map((e, i) => (
        <li key={i} className="flex gap-4 py-2">
          <span className="text-xs text-slate-400 shrink-0 w-24 pt-0.5">{e.date}</span>
          <div className="flex flex-col items-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5" />
            {i < events.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
          </div>
          <span className="text-sm text-slate-700 pb-2">{e.label}</span>
        </li>
      ))}
    </ul>
  )
}

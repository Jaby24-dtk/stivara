'use client'

// Explains the deterministic health/risk rules in lib/compliance/health.ts —
// kept in one place so the wording can't drift out of sync with the actual
// scoring logic.

import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

const ROWS: { badgeClass: string; label: string; riskLabel: string; description: string }[] = [
  {
    badgeClass: 'badge-success',
    label: 'green',
    riskLabel: 'LOW',
    description: 'No overdue filings or tasks, nothing due within 30 days, and at least one director on record.',
  },
  {
    badgeClass: 'badge-warning',
    label: 'amber',
    riskLabel: 'MEDIUM',
    description: 'A compliance filing is due within 30 days, or there are no directors on record — nothing overdue yet.',
  },
  {
    badgeClass: 'badge-danger',
    label: 'red',
    riskLabel: 'HIGH',
    description: 'A compliance filing or task is overdue.',
  },
]

export function HealthLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle size={13} />
        What do these mean?
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2 p-4 rounded-lg border border-slate-200 bg-slate-50">
          {ROWS.map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <div className="flex items-center gap-1.5 shrink-0 w-28">
                <span className={`badge ${row.badgeClass}`}>{row.label}</span>
                <span className="text-xs text-slate-400">/ {row.riskLabel}</span>
              </div>
              <p className="text-sm text-slate-600">{row.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

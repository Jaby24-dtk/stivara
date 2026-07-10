'use client'

import { useState } from 'react'
import type { RiskLevel } from '@/lib/compliance/health'

const SCAN_STEPS = ['Director register', 'Statutory filings', 'Tasks']
const STEP_DELAY_MS = 450

const riskBadge: Record<RiskLevel, string> = {
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-danger',
}

export function CorporateDoctorScan({
  companyHealth,
  riskLevel,
  recommendations,
}: {
  companyHealth: number
  riskLevel: RiskLevel
  recommendations: string[]
}) {
  const [scanning, setScanning] = useState(false)
  const [stepsShown, setStepsShown] = useState(0)
  const [done, setDone] = useState(false)

  function runScan() {
    setScanning(true)
    setDone(false)
    setStepsShown(0)
    SCAN_STEPS.forEach((_, i) => {
      setTimeout(() => setStepsShown(i + 1), STEP_DELAY_MS * (i + 1))
    })
    setTimeout(() => {
      setScanning(false)
      setDone(true)
    }, STEP_DELAY_MS * (SCAN_STEPS.length + 1))
  }

  if (!scanning && !done) {
    return (
      <button className="btn-primary self-start" onClick={runScan}>
        Run health check
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {SCAN_STEPS.map((step, i) => (
          <li key={step} className={`text-sm flex items-center gap-2 ${i < stepsShown ? 'text-slate-700' : 'text-slate-300'}`}>
            <span>{i < stepsShown ? '✓' : '…'}</span>
            Scanning {step}
          </li>
        ))}
      </ul>

      {done && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-6 mb-3">
            <div>
              <p className="text-3xl font-bold text-slate-900">{companyHealth}%</p>
              <p className="text-xs text-slate-500">Company health</p>
            </div>
            <span className={`badge ${riskBadge[riskLevel]}`}>{riskLevel} risk</span>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">No recommendations — everything on record checks out.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {recommendations.map((r, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-teal-700">•</span>
                  {r}
                </li>
              ))}
            </ul>
          )}
          <button className="btn-secondary btn-sm mt-4" onClick={runScan}>
            Run again
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { JURISDICTIONS, OTHER_JURISDICTION_CODE } from '@/lib/reference/jurisdictions'
import { COUNTRIES } from '@/lib/reference/countries'

export function JurisdictionSelect({
  jurisdiction,
  onJurisdictionChange,
  otherCountry,
  onOtherCountryChange,
}: {
  jurisdiction: string
  onJurisdictionChange: (code: string) => void
  otherCountry: string
  onOtherCountryChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <select className="input-field" value={jurisdiction} onChange={(e) => onJurisdictionChange(e.target.value)}>
        {JURISDICTIONS.map((j) => (
          <option key={j.code} value={j.code}>{j.name}</option>
        ))}
        <option value={OTHER_JURISDICTION_CODE}>Other (Please Specify)</option>
      </select>
      {jurisdiction === OTHER_JURISDICTION_CODE && (
        <select className="input-field" value={otherCountry} onChange={(e) => onOtherCountryChange(e.target.value)} required>
          <option value="">Specify country…</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      )}
      {jurisdiction !== 'SG' && (
        <p className="text-xs text-amber-600">
          Compliance calendar generation is Singapore-only in this build — other jurisdictions won&apos;t get auto-created deadlines yet.
        </p>
      )}
    </div>
  )
}

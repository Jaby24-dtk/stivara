'use client'

import { useState } from 'react'
import { ENTITY_TYPES } from '@/lib/reference/entityTypes'

const OTHER = '__other__'

export function EntityTypeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const knownNames = ENTITY_TYPES.map((t) => t.name)
  const isKnownOrEmpty = value === '' || knownNames.includes(value)
  const [customMode, setCustomMode] = useState(!isKnownOrEmpty)

  function handleSelectChange(next: string) {
    if (next === OTHER) {
      setCustomMode(true)
      onChange('')
      return
    }
    setCustomMode(false)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        className="input-field"
        value={customMode ? OTHER : value}
        onChange={(e) => handleSelectChange(e.target.value)}
      >
        <option value="">Entity type (optional)</option>
        {ENTITY_TYPES.map((t) => (
          <option key={t.name} value={t.name} title={t.description}>{t.name}</option>
        ))}
        <option value={OTHER}>Other (please specify)</option>
      </select>
      {customMode && (
        <input
          className="input-field"
          placeholder="Entity type"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

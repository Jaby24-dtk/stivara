'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import type { Person } from '@/lib/types'
import { COUNTRIES } from '@/lib/reference/countries'

const ID_TYPES = [
  { value: 'nric', label: 'NRIC' },
  { value: 'passport', label: 'Passport' },
  { value: 'fin', label: 'FIN' },
  { value: 'other', label: 'Other' },
]
const KYC_STATUSES = ['not_started', 'pending', 'verified', 'rejected']
const SANCTIONS_STATUSES = ['not_screened', 'clear', 'flagged', 'under_review']
const PEP_STATUSES = ['not_pep', 'pep', 'pep_associate', 'unknown']
const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export function PersonDetailsForm({ person }: { person: Person }) {
  const router = useRouter()
  const [name, setName] = useState(person.name)
  const [email, setEmail] = useState(person.email ?? '')
  const [idType, setIdType] = useState(person.id_type ?? '')
  const [idNumber, setIdNumber] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [nationality, setNationality] = useState(person.nationality ?? '')
  const [residentialAddress, setResidentialAddress] = useState('')
  const [serviceAddress, setServiceAddress] = useState(person.service_address ?? '')
  const [phone, setPhone] = useState(person.phone ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(person.date_of_birth ?? '')
  const [kycStatus, setKycStatus] = useState(person.kyc_status ?? '')
  const [sanctionsStatus, setSanctionsStatus] = useState(person.sanctions_screening_status ?? '')
  const [pepStatus, setPepStatus] = useState(person.pep_status ?? '')
  const [verificationDate, setVerificationDate] = useState(person.verification_date ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReveal() {
    setRevealing(true)
    setError(null)
    const res = await fetch(`/api/people/${person.id}/reveal-sensitive`, { method: 'POST' })
    setRevealing(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to reveal sensitive fields')
      return
    }
    const body = await res.json()
    setIdNumber(body.idNumber ?? '')
    setResidentialAddress(body.residentialAddress ?? '')
    setRevealed(true)
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    const res = await fetch(`/api/people/${person.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: email || null,
        idType: idType || null,
        ...(revealed ? { idNumber: idNumber || null } : {}),
        nationality: nationality || null,
        ...(revealed ? { residentialAddress: residentialAddress || null } : {}),
        serviceAddress: serviceAddress || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        kycStatus: kycStatus || null,
        sanctionsScreeningStatus: sanctionsStatus || null,
        pepStatus: pepStatus || null,
        verificationDate: verificationDate || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to save')
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="card p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Full name</label>
          <input className="input-field" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Email</label>
          <input className="input-field" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false) }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Nationality</label>
          <select className="input-field" value={nationality} onChange={(e) => { setNationality(e.target.value); setSaved(false) }}>
            <option value="">Not set</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Phone</label>
          <input className="input-field" value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false) }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Date of birth</label>
          <input className="input-field" type="date" value={dateOfBirth} onChange={(e) => { setDateOfBirth(e.target.value); setSaved(false) }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">ID type</label>
          <select className="input-field" value={idType} onChange={(e) => { setIdType(e.target.value); setSaved(false) }}>
            <option value="">Not set</option>
            {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sensitive fields (encrypted at rest)</p>
          {!revealed && (
            <button type="button" className="btn-secondary btn-sm" onClick={handleReveal} disabled={revealing}>
              <Eye size={14} />
              {revealing ? 'Revealing…' : 'Reveal to edit'}
            </button>
          )}
        </div>
        {revealed ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">ID number</label>
              <input className="input-field" value={idNumber} onChange={(e) => { setIdNumber(e.target.value); setSaved(false) }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Residential address</label>
              <input className="input-field" value={residentialAddress} onChange={(e) => { setResidentialAddress(e.target.value); setSaved(false) }} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {person.id_number_encrypted || person.residential_address_encrypted
              ? 'On record, hidden by default. Click "Reveal to edit" to view or change.'
              : 'Not on record.'}
          </p>
        )}
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs text-slate-500">Service address (not encrypted — normally public register info)</label>
          <input className="input-field" value={serviceAddress} onChange={(e) => { setServiceAddress(e.target.value); setSaved(false) }} />
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">KYC status</label>
          <select className="input-field" value={kycStatus} onChange={(e) => { setKycStatus(e.target.value); setSaved(false) }}>
            <option value="">Not set</option>
            {KYC_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Sanctions screening</label>
          <select className="input-field" value={sanctionsStatus} onChange={(e) => { setSanctionsStatus(e.target.value); setSaved(false) }}>
            <option value="">Not set</option>
            {SANCTIONS_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">PEP status</label>
          <select className="input-field" value={pepStatus} onChange={(e) => { setPepStatus(e.target.value); setSaved(false) }}>
            <option value="">Not set</option>
            {PEP_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 col-span-3">
          <label className="text-xs text-slate-500">Verification date</label>
          <input className="input-field w-48" type="date" value={verificationDate} onChange={(e) => { setVerificationDate(e.target.value); setSaved(false) }} />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-sm text-teal-700">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Company } from '@/lib/types'

type TriState = boolean | null

function TriStateSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: TriState
  onChange: (value: TriState) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <select
        className="input-field"
        value={value === null ? '' : value ? 'yes' : 'no'}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'yes')}
      >
        <option value="">Not set</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <input className="input-field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

const REGISTRATION_STATUSES = ['live', 'struck_off', 'dissolved', 'converted', 'amalgamated', 'in_liquidation', 'other']
const LIABILITY_TYPES = ['limited_by_shares', 'limited_by_guarantee', 'unlimited', 'other']
const AUDIT_EXEMPTION_STATUSES = ['exempt', 'review_required', 'not_exempt']

const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export function CompanyProfileForm({ company, otherCompanies }: { company: Company; otherCompanies: { id: string; name: string }[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'identity' | 'classification'>('identity')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState({
    uen: company.uen ?? '',
    formerName: company.former_name ?? '',
    registeredOfficeAddress: company.registered_office_address ?? '',
    principalBusinessAddress: company.principal_business_address ?? '',
    primarySsicCode: company.primary_ssic_code ?? '',
    primarySsicDescription: company.primary_ssic_description ?? '',
    secondarySsicCode: company.secondary_ssic_code ?? '',
    secondarySsicDescription: company.secondary_ssic_description ?? '',
    businessDescription: company.business_description ?? '',
    firstFye: company.first_fye ?? '',
    constitutionAdopted: company.constitution_adopted as TriState,
    companySealUsed: company.company_seal_used as TriState,
    registrationStatus: company.registration_status ?? '',
    isPrivate: company.is_private as TriState,
    isExemptPrivate: company.is_exempt_private as TriState,
    isForeignEntity: company.is_foreign_entity as TriState,
    liabilityType: company.liability_type ?? '',
    isDormant: company.is_dormant as TriState,
    isSolvent: company.is_solvent as TriState,
    auditExemptionStatus: company.audit_exemption_status ?? '',
    isGstRegistered: company.is_gst_registered as TriState,
    isEmployerRegistered: company.is_employer_registered as TriState,
    isRegulatedBusiness: company.is_regulated_business as TriState,
    licensedActivities: company.licensed_activities ?? '',
    isCspClient: company.is_csp_client as TriState,
    isListed: company.is_listed as TriState,
    isCharityOrIpc: company.is_charity_or_ipc as TriState,
    isGroupCompany: company.is_group_company as TriState,
    isHoldingCompany: company.is_holding_company as TriState,
    parentCompanyId: company.parent_company_id ?? '',
  })

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    const res = await fetch(`/api/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...fields,
        parentCompanyId: fields.parentCompanyId || null,
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
      <div className="flex items-center gap-2 mb-5 border-b border-slate-200">
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'identity' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}
          onClick={() => setTab('identity')}
        >
          Identity & Registration
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'classification' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}
          onClick={() => setTab('classification')}
        >
          Compliance Classification & Structure
        </button>
      </div>

      {tab === 'identity' && (
        <div className="grid grid-cols-2 gap-4">
          <TextField label="UEN" value={fields.uen} onChange={(v) => set('uen', v)} />
          <TextField label="Former name" value={fields.formerName} onChange={(v) => set('formerName', v)} />
          <TextField label="Registered office address" value={fields.registeredOfficeAddress} onChange={(v) => set('registeredOfficeAddress', v)} />
          <TextField label="Principal business address" value={fields.principalBusinessAddress} onChange={(v) => set('principalBusinessAddress', v)} />
          <TextField label="Primary SSIC code" value={fields.primarySsicCode} onChange={(v) => set('primarySsicCode', v)} />
          <TextField label="Primary SSIC description" value={fields.primarySsicDescription} onChange={(v) => set('primarySsicDescription', v)} />
          <TextField label="Secondary SSIC code" value={fields.secondarySsicCode} onChange={(v) => set('secondarySsicCode', v)} />
          <TextField label="Secondary SSIC description" value={fields.secondarySsicDescription} onChange={(v) => set('secondarySsicDescription', v)} />
          <div className="col-span-2">
            <TextField label="Business description" value={fields.businessDescription} onChange={(v) => set('businessDescription', v)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">First financial year end</label>
            <input className="input-field" type="date" value={fields.firstFye} onChange={(e) => set('firstFye', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Registration status</label>
            <select className="input-field" value={fields.registrationStatus} onChange={(e) => set('registrationStatus', e.target.value)}>
              <option value="">Not set</option>
              {REGISTRATION_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
          <TriStateSelect label="Constitution adopted" value={fields.constitutionAdopted} onChange={(v) => set('constitutionAdopted', v)} />
          <TriStateSelect label="Company seal used" value={fields.companySealUsed} onChange={(v) => set('companySealUsed', v)} />
        </div>
      )}

      {tab === 'classification' && (
        <div className="grid grid-cols-2 gap-4">
          <TriStateSelect label="Private company" value={fields.isPrivate} onChange={(v) => set('isPrivate', v)} />
          <TriStateSelect label="Exempt private company" value={fields.isExemptPrivate} onChange={(v) => set('isExemptPrivate', v)} />
          <TriStateSelect label="Foreign entity" value={fields.isForeignEntity} onChange={(v) => set('isForeignEntity', v)} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Liability type</label>
            <select className="input-field" value={fields.liabilityType} onChange={(e) => set('liabilityType', e.target.value)}>
              <option value="">Not set</option>
              {LIABILITY_TYPES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
          <TriStateSelect label="Dormant" value={fields.isDormant} onChange={(v) => set('isDormant', v)} />
          <TriStateSelect label="Solvent" value={fields.isSolvent} onChange={(v) => set('isSolvent', v)} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Audit exemption status</label>
            <select className="input-field" value={fields.auditExemptionStatus} onChange={(e) => set('auditExemptionStatus', e.target.value)}>
              <option value="">Not set</option>
              {AUDIT_EXEMPTION_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
          <TriStateSelect label="GST registered" value={fields.isGstRegistered} onChange={(v) => set('isGstRegistered', v)} />
          <TriStateSelect label="Employer registered" value={fields.isEmployerRegistered} onChange={(v) => set('isEmployerRegistered', v)} />
          <TriStateSelect label="Regulated business" value={fields.isRegulatedBusiness} onChange={(v) => set('isRegulatedBusiness', v)} />
          <TextField label="Licensed activities" value={fields.licensedActivities} onChange={(v) => set('licensedActivities', v)} />
          <TriStateSelect label="Corporate service provider client" value={fields.isCspClient} onChange={(v) => set('isCspClient', v)} />
          <TriStateSelect label="Listed company" value={fields.isListed} onChange={(v) => set('isListed', v)} />
          <TriStateSelect label="Charity or IPC" value={fields.isCharityOrIpc} onChange={(v) => set('isCharityOrIpc', v)} />
          <TriStateSelect label="Group company" value={fields.isGroupCompany} onChange={(v) => set('isGroupCompany', v)} />
          <TriStateSelect label="Holding company" value={fields.isHoldingCompany} onChange={(v) => set('isHoldingCompany', v)} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Parent company</label>
            <select className="input-field" value={fields.parentCompanyId} onChange={(e) => set('parentCompanyId', e.target.value)}>
              <option value="">None</option>
              {otherCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
        {saved && <span className="text-sm text-teal-700">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}

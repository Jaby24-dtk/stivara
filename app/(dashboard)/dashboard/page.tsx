import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { Company } from '@/lib/types'
import { computeCompanyHealth, computeMissionControl, type HealthStatus, type RiskLevel } from '@/lib/compliance/health'
import { buildDailyBriefing } from '@/lib/compliance/briefing'
import { HealthLegend } from '@/components/companies/HealthLegend'

const statusBadge: Record<HealthStatus, string> = {
  green: 'badge-success',
  amber: 'badge-warning',
  red: 'badge-danger',
}

const riskBadge: Record<RiskLevel, string> = {
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-danger',
}

type RiskItem = { companyId: string; companyName: string; severity: 'red' | 'amber'; message: string }

function greeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('*').order('name')
  const companyList = (companies ?? []) as Company[]
  const companyIds = companyList.map((c) => c.id)

  const [{ data: events }, { data: tasks }, { data: roles }] = companyIds.length > 0
    ? await Promise.all([
        supabase.from('compliance_events').select('company_id, type, due_date, status').in('company_id', companyIds),
        supabase.from('tasks').select('company_id, title, due_date, status').in('company_id', companyIds),
        supabase.from('role_assignments').select('company_id, role').in('company_id', companyIds).eq('role', 'director').is('end_date', null),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const healthByCompany = new Map(
    companyList.map((c) => [
      c.id,
      computeCompanyHealth({
        events: (events ?? []).filter((e) => e.company_id === c.id),
        tasks: (tasks ?? []).filter((t) => t.company_id === c.id),
        directorCount: (roles ?? []).filter((r) => r.company_id === c.id).length,
      }),
    ])
  )

  const missionControlByCompany = new Map(
    companyList.map((c) => [
      c.id,
      computeMissionControl({
        events: (events ?? []).filter((e) => e.company_id === c.id),
        tasks: (tasks ?? []).filter((t) => t.company_id === c.id),
        directorCount: (roles ?? []).filter((r) => r.company_id === c.id).length,
      }),
    ])
  )

  const riskRank: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }
  const portfolioScore = companyList.length === 0
    ? { trustScore: 100, governanceScore: 100, riskLevel: 'LOW' as RiskLevel }
    : companyList.reduce(
        (acc, c) => {
          const s = missionControlByCompany.get(c.id)!
          return {
            trustScore: acc.trustScore + s.trustScore / companyList.length,
            governanceScore: acc.governanceScore + s.governanceScore / companyList.length,
            riskLevel: riskRank[s.riskLevel] > riskRank[acc.riskLevel] ? s.riskLevel : acc.riskLevel,
          }
        },
        { trustScore: 0, governanceScore: 0, riskLevel: 'LOW' as RiskLevel }
      )
  portfolioScore.trustScore = Math.round(portfolioScore.trustScore)
  portfolioScore.governanceScore = Math.round(portfolioScore.governanceScore)

  const riskItems: RiskItem[] = []
  for (const c of companyList) {
    const health = healthByCompany.get(c.id)!
    for (const reason of health.reasons) {
      riskItems.push({ companyId: c.id, companyName: c.name, severity: reason.severity, message: reason.message })
    }
  }
  riskItems.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'red' ? -1 : 1))

  const briefing = buildDailyBriefing({
    items: riskItems,
    trustScore: portfolioScore.trustScore,
    riskLevel: portfolioScore.riskLevel,
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="gradient-panel rounded-2xl px-8 py-10">
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--gold-light)' }}>
          {greeting(new Date())}
        </p>
        <h1 className="relative font-display text-5xl md:text-6xl font-semibold tracking-tight text-white">
          {user.name}
        </h1>
        <p className="relative text-base text-slate-300 mt-2">{companyList.length} companies under management</p>
      </div>

      <div className="card-gold p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--gold)' }}>Daily briefing</p>
        <p className="text-base text-slate-700 leading-relaxed">{briefing}</p>
      </div>

      <div className="card-gold p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--gold)' }}>Corporate Trust Score</p>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="font-display gradient-text text-6xl md:text-7xl font-semibold leading-none">{portfolioScore.trustScore}</p>
            <p className="text-sm text-slate-500 mt-2">Trust score</p>
          </div>
          <div>
            <p className="font-display gradient-text text-6xl md:text-7xl font-semibold leading-none">{portfolioScore.governanceScore}</p>
            <p className="text-sm text-slate-500 mt-2">Governance</p>
          </div>
          <div>
            <span className={`badge ${riskBadge[portfolioScore.riskLevel]} text-sm`}>{portfolioScore.riskLevel}</span>
            <p className="text-sm text-slate-500 mt-2">Risk</p>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100">
          <HealthLegend />
        </div>
      </div>

      <div className="card-gold p-7">
        <h2 className="font-display text-2xl font-semibold text-slate-900 mb-1">Today&rsquo;s Priority</h2>
        <p className="text-base text-slate-500 mb-5">Everything that needs action, across your whole portfolio, most urgent first.</p>
        {riskItems.length === 0 ? (
          <p className="text-base text-slate-500">Nothing needs attention right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {riskItems.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-base py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`badge ${item.severity === 'red' ? 'badge-danger' : 'badge-warning'}`}>
                    {item.severity === 'red' ? 'overdue' : 'due soon'}
                  </span>
                  <span className="text-slate-700">{item.message}</span>
                </div>
                <Link href={`/companies/${item.companyId}`} className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>
                  {item.companyName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-gold p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Companies</h2>
          <Link href="/companies" className="btn-secondary btn-sm">View all</Link>
        </div>
        {companyList.length === 0 ? (
          <p className="text-base text-slate-500">No companies yet. <Link href="/companies" className="font-medium" style={{ color: 'var(--teal)' }}>Add your first company</Link>.</p>
        ) : (
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Jurisdiction</th>
                <th className="py-2 font-medium">FYE</th>
                <th className="py-2 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {companyList.map((c) => {
                const health = healthByCompany.get(c.id)!
                return (
                  <tr key={c.id} className="table-row-hover border-b border-slate-100">
                    <td className="py-3">
                      <Link href={`/companies/${c.id}`} className="font-display font-medium text-lg text-slate-900 hover:text-teal-700">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">{c.jurisdiction}</td>
                    <td className="py-3 text-slate-600">{c.fye}</td>
                    <td className="py-3"><span className={`badge ${statusBadge[health.status]}`}>{health.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

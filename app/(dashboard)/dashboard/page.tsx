import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { Company } from '@/lib/types'
import { computeCompanyHealth, computeMissionControl, type HealthStatus, type RiskLevel } from '@/lib/compliance/health'
import { buildDailyBriefing } from '@/lib/compliance/briefing'

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
      <div>
        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">{greeting(new Date())}</p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
        <p className="text-sm text-slate-500">{companyList.length} companies under management</p>
      </div>

      <div className="card p-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Daily briefing</p>
        <p className="text-sm text-slate-700 leading-relaxed">{briefing}</p>
      </div>

      <div className="card p-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Corporate Trust Score</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-4xl font-bold text-slate-900">{portfolioScore.trustScore}</p>
            <p className="text-xs text-slate-500 mt-1">Trust score</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-slate-900">{portfolioScore.governanceScore}</p>
            <p className="text-xs text-slate-500 mt-1">Governance</p>
          </div>
          <div>
            <span className={`badge ${riskBadge[portfolioScore.riskLevel]}`}>{portfolioScore.riskLevel}</span>
            <p className="text-xs text-slate-500 mt-1">Risk</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Today&rsquo;s Priority</h2>
        <p className="text-sm text-slate-500 mb-4">Everything that needs action, across your whole portfolio, most urgent first.</p>
        {riskItems.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing needs attention right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {riskItems.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`badge ${item.severity === 'red' ? 'badge-danger' : 'badge-warning'}`}>
                    {item.severity === 'red' ? 'overdue' : 'due soon'}
                  </span>
                  <span className="text-slate-700">{item.message}</span>
                </div>
                <Link href={`/companies/${item.companyId}`} className="text-teal-700 font-medium hover:underline">
                  {item.companyName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Companies</h2>
          <Link href="/companies" className="btn-secondary btn-sm">View all</Link>
        </div>
        {companyList.length === 0 ? (
          <p className="text-sm text-slate-500">No companies yet. <Link href="/companies" className="text-teal-700 font-medium">Add your first company</Link>.</p>
        ) : (
          <table className="w-full text-sm">
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
                    <td className="py-2">
                      <Link href={`/companies/${c.id}`} className="font-medium text-slate-900 hover:text-teal-700">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-600">{c.jurisdiction}</td>
                    <td className="py-2 text-slate-600">{c.fye}</td>
                    <td className="py-2"><span className={`badge ${statusBadge[health.status]}`}>{health.status}</span></td>
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

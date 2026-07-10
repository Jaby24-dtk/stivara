import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Stivara — AI Governance OS',
  description: 'One platform, one AI, for corporate governance, compliance, and board administration.',
}

const pillars = [
  {
    name: 'Governance',
    body: 'Everything about managing a company.',
    items: ['Board', 'Directors', 'Shareholders', 'Secretary', 'Registers', 'Policies', 'Meetings', 'Decisions'],
  },
  {
    name: 'Compliance',
    body: 'Everything about staying compliant.',
    items: ['ACRA', 'IRAS', 'CPF', 'GST', 'Licences', 'Employment', 'PDPA', 'Corporate secretarial'],
  },
  {
    name: 'Trust',
    body: 'Everything proving the company is trustworthy.',
    items: ['KYC', 'Due diligence', 'Verification', 'Audit trail', 'Digital signatures', 'Document verification'],
  },
  {
    name: 'Intelligence',
    body: 'Instead of searching, you simply ask.',
    items: ['"Prepare my AGM"', '"Am I tax compliant?"', '"Review our corporate records"', '"Who are our directors?"'],
  },
]

const liveToday = [
  {
    title: 'Corporate Trust Score',
    body: 'A deterministic trust and governance score for every company, computed from real director records and statutory filings — on Mission Control.',
  },
  {
    title: 'Corporate Doctor',
    body: 'A one-click health scan of the director register, statutory filings, and tasks on record, with recommendations grounded in your own data.',
  },
  {
    title: 'AI Company Secretary',
    body: 'Ask questions in plain English. Answers are grounded in your company’s real records and indexed documents, not guesses.',
  },
  {
    title: 'Company Timeline',
    body: 'A chronological history of appointments, resignations, and document uploads for every company you manage.',
  },
]

const executiveTeam = [
  'AI Corporate Secretary',
  'AI Tax Officer',
  'AI Governance Officer',
  'AI CFO Assistant',
  'AI HR Manager',
  'AI Banking Officer',
  'AI Immigration Officer',
  'AI Compliance Officer',
  'AI KYC Officer',
  'AI Document Controller',
  'AI Risk Officer',
  'AI Business Adviser',
]

export default async function Home() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header
        className="border-b"
        style={{ background: 'linear-gradient(180deg, #0B1220 0%, #0F1A2E 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #14B8A6, #0B5C55)', boxShadow: '0 0 12px rgba(20,184,166,0.35)' }}
            >
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">Stivara</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/trust" className="text-sm font-medium text-slate-400 hover:text-slate-200">Trust Center</Link>
            <Link href="/login" className="text-sm font-medium text-slate-200 hover:text-white">Sign in</Link>
            <Link href="/signup" className="btn-primary btn-sm">Get started</Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-4">AI Governance OS</p>
          <h1 className="text-white text-4xl sm:text-5xl font-bold tracking-tight mb-5 max-w-3xl mx-auto">
            One platform. One AI. Total corporate compliance.
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
            Stivara runs governance, compliance, and board administration through a single AI-native platform —
            built from the perspective of people who&apos;ve actually run a corporate secretarial function, not
            just written software for one.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary">Get started</Link>
            <Link href="/login" className="btn-secondary" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 flex flex-col gap-16">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">The four pillars</h2>
          <p className="text-sm text-slate-500 mb-5">Every business process runs through the same platform.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map((p) => (
              <div key={p.name} className="card p-5">
                <h3 className="font-semibold text-slate-900 mb-1">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{p.body}</p>
                <ul className="flex flex-col gap-1">
                  {p.items.map((item) => (
                    <li key={item} className="text-xs text-slate-600">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Live today</h2>
          <p className="text-sm text-slate-500 mb-5">Not a mockup — what&apos;s actually shipped and working right now.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {liveToday.map((item) => (
              <div key={item.title} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-success">live</span>
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">The AI Executive Team</h2>
          <p className="text-sm text-slate-500 mb-5">
            Where we&apos;re headed: an AI workforce alongside every company. The AI Corporate Secretary is live
            today as the AI Assistant; the rest of this team is the direction we&apos;re building toward, not a
            claim about what exists yet.
          </p>
          <div className="card p-5">
            <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {executiveTeam.map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <span className={`badge ${role === 'AI Corporate Secretary' ? 'badge-success' : 'badge-gray'}`}>
                    {role === 'AI Corporate Secretary' ? 'live' : 'vision'}
                  </span>
                  <span className="text-sm text-slate-700">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card p-8 text-center" style={{ background: '#0F172A' }}>
          <h2 className="text-white font-semibold text-lg mb-2">Ready to see it in action?</h2>
          <p className="text-slate-300 text-sm mb-5">Sign in, or create an account to add your first company.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary">Get started</Link>
            <Link href="/login" className="btn-secondary" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.25)' }}>
              Sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

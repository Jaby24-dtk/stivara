import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, ShieldCheck, Landmark, BadgeCheck, Sparkles, Activity, Stethoscope, MessageSquareText, History } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Stivara — AI Governance OS',
  description: 'One platform, one AI, for corporate governance, compliance, and board administration.',
}

const pillars = [
  {
    name: 'Governance',
    icon: Landmark,
    body: 'Everything about managing a company.',
    items: ['Board', 'Directors', 'Shareholders', 'Secretary', 'Registers', 'Policies', 'Meetings', 'Decisions'],
  },
  {
    name: 'Compliance',
    icon: ShieldCheck,
    body: 'Everything about staying compliant.',
    items: ['ACRA', 'IRAS', 'CPF', 'GST', 'Licences', 'Employment', 'PDPA', 'Corporate secretarial'],
  },
  {
    name: 'Trust',
    icon: BadgeCheck,
    body: 'Everything proving the company is trustworthy.',
    items: ['KYC', 'Due diligence', 'Verification', 'Audit trail', 'Digital signatures', 'Document verification'],
  },
  {
    name: 'Intelligence',
    icon: Sparkles,
    body: 'Instead of searching, you simply ask.',
    items: ['"Prepare my AGM"', '"Am I tax compliant?"', '"Review our corporate records"', '"Who are our directors?"'],
  },
]

const liveToday = [
  {
    title: 'Corporate Trust Score',
    icon: Activity,
    body: 'A deterministic trust and governance score for every company, computed from real director records and statutory filings — on Mission Control.',
  },
  {
    title: 'Corporate Doctor',
    icon: Stethoscope,
    body: 'A one-click health scan of the director register, statutory filings, and tasks on record, with recommendations grounded in your own data.',
  },
  {
    title: 'AI Company Secretary',
    icon: MessageSquareText,
    body: 'Ask questions in plain English. Answers are grounded in your company’s real records and indexed documents, not guesses.',
  },
  {
    title: 'Company Timeline',
    icon: History,
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

const coverage = ['ACRA', 'IRAS', 'CPF', 'GST', 'PDPA']

// Illustrative preview of Mission Control — clearly labelled as a sample.
function MissionControlPreview() {
  return (
    <div className="lp-glass p-2 sm:p-3 max-w-4xl mx-auto text-left">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-slate-500">Sample view</span>
      </div>
      <div className="rounded-2xl bg-[#F7F8FA] p-4 sm:p-6 grid gap-4 sm:grid-cols-5">
        <div className="gradient-panel rounded-xl px-5 py-6 sm:col-span-3">
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--gold-light)' }}>Good morning</p>
          <p className="relative font-display text-2xl sm:text-3xl font-semibold text-white">Mission Control</p>
          <p className="relative text-xs text-slate-400 mt-1">Every company, every deadline, one view.</p>
        </div>
        <div className="card-gold p-5 sm:col-span-2 flex items-end gap-6">
          <div>
            <p className="font-display gradient-text text-5xl font-semibold leading-none">92</p>
            <p className="text-xs text-slate-500 mt-2">Trust score</p>
          </div>
          <div>
            <p className="font-display gradient-text text-5xl font-semibold leading-none">88</p>
            <p className="text-xs text-slate-500 mt-2">Governance</p>
          </div>
          <div className="ml-auto">
            <span className="badge badge-success">LOW</span>
            <p className="text-xs text-slate-500 mt-2">Risk</p>
          </div>
        </div>
        <div className="card-gold p-5 sm:col-span-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--gold)' }}>Daily briefing</p>
          <p className="text-sm text-slate-700 leading-relaxed">
            No overdue filings across your portfolio. Annual return due in 21 days for one company. All directors on record.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function Home() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <section className="lp-hero">
        <header className="relative max-w-6xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/stiv-logo-mark.png" alt="STIV" width={34} height={34} unoptimized priority className="shrink-0" />
            <span className="text-white font-semibold text-[16px] tracking-tight">Stivara</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/trust" className="hidden sm:inline text-sm font-medium text-slate-400 hover:text-white transition-colors">Trust Center</Link>
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" className="btn-gold btn-gold-sm">Get started</Link>
          </nav>
        </header>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 text-center">
          <p className="lp-eyebrow mb-6">AI Governance OS</p>
          <h1 className="font-display text-white text-[2.6rem] leading-[1.05] sm:text-6xl md:text-7xl font-semibold tracking-tight max-w-4xl mx-auto">
            One platform. One AI.
            <br />
            <span className="lp-gold-text italic font-medium">Total corporate compliance.</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-6">
            Stivara runs governance, compliance, and board administration through a single AI-native platform —
            built from the perspective of people who&apos;ve actually run a corporate secretarial function, not
            just written software for one.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-9 max-w-xs sm:max-w-none mx-auto">
            <Link href="/signup" className="btn-gold">
              Get started <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn-ghost-light">Sign in</Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span className="text-slate-400 normal-case tracking-normal font-medium text-xs">Built for Singapore</span>
            {coverage.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>

          <div className="mt-14 sm:mt-20">
            <MissionControlPreview />
          </div>
        </div>
      </section>

      <section className="lp-ivory">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="max-w-4xl mb-10 sm:mb-12">
            <p className="lp-eyebrow lp-eyebrow-left mb-4">The four pillars</p>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
              Every business process, <span className="italic font-medium text-[#8A6A2E]">one platform.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {pillars.map((p, i) => (
              <div key={p.name} className="lp-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B1220, #16233d)' }}>
                    <p.icon size={18} style={{ color: 'var(--gold-light)' }} />
                  </span>
                  <span className="font-display text-sm text-slate-300">0{i + 1}</span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-slate-900 mb-1">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-5">{p.body}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {p.items.map((item) => (
                    <li key={item} className="text-xs text-slate-600 bg-[#F5F2EC] border border-[#ECE7DD] rounded-full px-2.5 py-1">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-dark">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 sm:mb-12">
            <div className="max-w-3xl">
              <p className="lp-eyebrow lp-eyebrow-left mb-4">Live today</p>
              <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
                Not a mockup. <span className="lp-gold-text italic font-medium">Shipped and working.</span>
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-xs md:text-right">What&apos;s actually shipped and working in Stivara right now.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {liveToday.map((item) => (
              <div key={item.title} className="lp-glass p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
                    <item.icon size={18} style={{ color: 'var(--gold-light)' }} />
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    Live
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-ivory">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="max-w-4xl mb-10">
            <p className="lp-eyebrow lp-eyebrow-left mb-4">The AI Executive Team</p>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
              An AI workforce <span className="italic font-medium text-[#8A6A2E]">alongside every company.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-4 leading-relaxed max-w-2xl">
              Where we&apos;re headed. The AI Corporate Secretary is live today as the AI Assistant; the rest of this
              team is the direction we&apos;re building toward, not a claim about what exists yet.
            </p>
          </div>
          <div className="lp-card p-2 sm:p-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#ECE7DD] rounded-xl overflow-hidden">
              {executiveTeam.map((role) => {
                const live = role === 'AI Corporate Secretary'
                return (
                  <div key={role} className={`flex items-center justify-between gap-3 px-5 py-4 ${live ? 'bg-[#0B1220]' : 'bg-white'}`}>
                    <span className={`text-sm font-medium ${live ? 'text-white' : 'text-slate-700'}`}>{role}</span>
                    {live ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Vision</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-ivory pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="lp-hero rounded-3xl px-6 py-14 sm:py-20 text-center">
            <div className="relative">
              <Image src="/stiv-logo-mark.png" alt="" width={56} height={56} unoptimized className="mx-auto mb-6" />
              <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
                Ready to see it <span className="lp-gold-text italic font-medium">in action?</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-4 mb-8">Sign in, or create an account to add your first company.</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
                <Link href="/signup" className="btn-gold">
                  Get started <ArrowRight size={16} />
                </Link>
                <Link href="/login" className="btn-ghost-light">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-ivory border-t border-[#ECE7DD]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Image src="/stiv-logo-mark.png" alt="" width={20} height={20} unoptimized />
            <span>© {new Date().getFullYear()} Stivara · a STIV product</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/trust" className="hover:text-slate-800">Trust Center</Link>
            <Link href="/login" className="hover:text-slate-800">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, CalendarClock, ListChecks, FileText, Sparkles, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/compliance', label: 'Compliance', icon: CalendarClock },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ userName, orgName }: { userName: string; orgName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-64 shrink-0 flex flex-col p-4 min-h-screen"
      style={{ background: 'linear-gradient(180deg, #0B1220 0%, #0F1A2E 100%)' }}
    >
      <div className="px-2 py-3 mb-4 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #E8C766, #C9A227)', boxShadow: '0 0 12px rgba(201,162,39,0.35)' }}
        >
          <span className="text-xs font-bold" style={{ color: 'var(--navy)' }}>S</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-[15px] tracking-tight leading-tight">Stivara</p>
          <p className="text-slate-400 text-xs truncate leading-tight">{orgName}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 pt-3 mt-3">
        <p className="text-slate-400 text-xs px-2 mb-2 truncate">{userName}</p>
        <button onClick={handleSignOut} className="sidebar-link w-full">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

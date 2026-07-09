'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, CalendarClock, ListChecks, Sparkles, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/compliance', label: 'Compliance', icon: CalendarClock },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
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
    <aside className="w-64 shrink-0 bg-[#0F172A] flex flex-col p-4 min-h-screen">
      <div className="px-2 py-3 mb-4">
        <p className="text-white font-semibold text-lg">Stivara</p>
        <p className="text-slate-400 text-xs truncate">{orgName}</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-700 pt-3 mt-3">
        <p className="text-slate-400 text-xs px-2 mb-2 truncate">{userName}</p>
        <button onClick={handleSignOut} className="sidebar-link w-full">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

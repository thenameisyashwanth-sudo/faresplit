import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptIndianRupee,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ThreeBackground } from '@/components/ui/three-bg'
import { useAuth } from '@/context/auth-context'
import { listPendingInvitesForUser } from '@/services/firestore/invites'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/trips', label: 'Trips', icon: Users },
  { to: '/reports', label: 'Reports', icon: ReceiptIndianRupee },
  { to: '/requests', label: 'Requests', icon: Wallet },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      end={end}
      to={to}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-white/60 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={[
              'h-5 w-5 transition',
              isActive ? 'text-indigo-300' : 'text-white/60',
            ].join(' ')}
          />
          <span className="flex-1">{label}</span>
          {isActive ? (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          ) : null}
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onNavigate, initials, name, email, onLogout }) {
  const navigate = useNavigate()

  const handleProfileClick = () => {
    if (onNavigate) onNavigate()
    navigate('/settings')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <div className="text-xl font-bold tracking-tight text-white">
          FareSplit
        </div>
      </div>

      <nav className="space-y-1 px-3">
        {navItems.map((item) => (
          <div key={item.to} onClick={onNavigate ? () => onNavigate() : undefined}>
            <NavItem {...item} />
          </div>
        ))}
        <div onClick={onNavigate ? () => onNavigate() : undefined}>
          <NavItem to="/settings" label="Settings" icon={Settings} />
        </div>
      </nav>

      <div className="mt-auto px-4 pb-6">
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3.5 transition hover:bg-white/10">
          <button
            onClick={handleProfileClick}
            className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{name}</div>
              <div className="truncate text-xs text-white/60 font-medium">View & Edit Profile</div>
            </div>
          </button>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/50 hover:bg-white/10 hover:text-rose-300 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/60 py-6 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          © 2026 FareSplit. Built and owned by Yashwanth S.
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a className="text-gray-500 hover:text-gray-900" href="#">
            About
          </a>
          <a className="text-gray-500 hover:text-gray-900" href="#">
            Privacy Policy
          </a>
          <a className="text-gray-500 hover:text-gray-900" href="#">
            Contact
          </a>
          <a className="text-gray-500 hover:text-gray-900" href="#">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

function NotificationsPopover() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invites, setInvites] = useState([])

  useEffect(() => {
    if (!user) return
    const fetchInvites = async () => {
      try {
        const list = await listPendingInvitesForUser(user.uid)
        setInvites(list)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[FareSplit] Failed to fetch notification invites:', err)
      }
    }
    fetchInvites()
  }, [user])

  const unread = invites.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-xl border-gray-200 bg-white/90 shadow-sm backdrop-blur-md">
          <Bell className="h-4 w-4 text-gray-700" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-2xl bg-white text-gray-900 border border-gray-200/90 z-50 rounded-2xl overflow-hidden" align="end">
        <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
          <div className="text-sm font-bold text-gray-900">Notifications ({unread})</div>
          <div className="text-xs text-gray-500">Trip invitations & updates</div>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {invites.length === 0 ? (
            <div className="p-4 text-center text-xs font-medium text-gray-500">
              No new notifications right now.
            </div>
          ) : (
            invites.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate('/requests')}
                className="w-full rounded-xl p-3 text-left transition hover:bg-gray-50/90 border border-transparent hover:border-indigo-50"
              >
                <div className="text-xs font-bold text-indigo-600">Trip Invitation</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{n.tripName}</div>
                <div className="text-xs text-gray-500">From @{n.fromUsername}</div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Header({ onOpenMobileSidebar, name, initials, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()

  const title = useMemo(() => {
    if (location.pathname.startsWith('/trips')) return 'Trips'
    if (location.pathname.startsWith('/reports')) return 'Reports'
    if (location.pathname.startsWith('/requests')) return 'Requests'
    if (location.pathname.startsWith('/settings')) return 'Settings'
    return 'Dashboard'
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl lg:hidden"
            onClick={onOpenMobileSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <div className="text-xl font-bold tracking-tight">{title}</div>
            <div className="text-sm text-gray-500">Welcome back, {name}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold text-white shadow-sm">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export function AppLayout() {
  const { user, profile, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const name = (profile?.fullName || user?.displayName || 'there').trim()
  const email = (user?.email || profile?.email || '').trim()
  const initials = (name[0] || 'U').toUpperCase()

  return (
    <div className="relative min-h-screen bg-slate-50/70 overflow-hidden">
      <ThreeBackground />
      
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-950 shadow-2xl lg:block">
        <SidebarContent
          initials={initials}
          name={name}
          email={email}
          onLogout={logout}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-950 shadow-2xl lg:hidden"
            >
              <SidebarContent
                onNavigate={() => setMobileOpen(false)}
                initials={initials}
                name={name}
                email={email}
                onLogout={logout}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-screen flex-col lg:ml-72">
        <Header
          onOpenMobileSidebar={() => setMobileOpen(true)}
          name={name}
          initials={initials}
          onLogout={logout}
        />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}


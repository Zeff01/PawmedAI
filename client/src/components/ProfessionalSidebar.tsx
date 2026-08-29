import { Link, useLocation } from '@tanstack/react-router'
import {
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  MapPin,
  PawPrint,
  Stethoscope,
} from 'lucide-react'

import { PawIcon } from './custom/custom-icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from './ui/sidebar'
import { useMe } from '@/hooks/useAuth'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

type NavGroup = {
  label: string
  items: Array<NavItem>
}

const navGroups: Array<NavGroup> = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Diagnostics',
    items: [
      { to: '/classify', label: 'Classify Disease', icon: Stethoscope },
      { to: '/classify-breed', label: 'Classify Breed', icon: PawPrint },
      { to: '/cbc-analyzer', label: 'CBC Analyzer', icon: FlaskConical },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/medical-log', label: 'Medical Log', icon: ClipboardList },
      { to: '/nearby-vets', label: 'Nearby Vets', icon: MapPin },
    ],
  },
]

export function ProfessionalSidebar({
  onSignOut,
  signOutPending,
}: {
  onSignOut: () => void
  signOutPending: boolean
}) {
  const location = useLocation()
  const { data: me } = useMe()
  const { setOpenMobile, isMobile } = useSidebar()

  const isActivePath = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  const firstName = me?.first_name ?? ''
  const lastName = me?.last_name ?? ''
  const username = me?.username ?? ''

  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    username ||
    'Veterinary Professional'

  const initials = (
    (firstName || username || 'V').charAt(0) + lastName.charAt(0)
  ).toUpperCase()

  return (
    <Sidebar collapsible="icon" className="border-slate-200">
      <SidebarHeader className="border-b border-slate-100 p-3">
        <Link
          to="/"
          onClick={closeOnMobile}
          className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-slate-50"
          aria-label="Pawmed AI home"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-sm">
            <div className="rotate-20">
              <PawIcon />
            </div>
          </div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-[13.5px] font-bold tracking-tight text-slate-900">
              Pawmed AI
            </p>
            <p className="text-[10.5px] font-medium tracking-wide text-slate-400">
              Professional workspace
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10.5px] font-semibold tracking-widest text-slate-400 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActivePath(item.to)
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="h-9 text-[13.5px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-blue-50 data-[active=true]:font-semibold data-[active=true]:text-blue-700"
                      >
                        <Link to={item.to} onClick={closeOnMobile}>
                          <Icon
                            className={
                              active ? 'text-blue-600' : 'text-slate-400'
                            }
                          />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator className="bg-slate-100" />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2 group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[12.5px] font-semibold text-slate-800">
              {displayName}
            </p>
            <p className="truncate text-[10.5px] font-medium text-slate-400">
              Veterinary Professional
            </p>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              disabled={signOutPending}
              onClick={onSignOut}
              className="h-9 text-[13.5px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="text-slate-400" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

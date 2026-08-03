import React from 'react';
import {
  Stethoscope,
  Calendar,
  Layers,
  UserCheck,
  Settings,
  Code2,
  LogOut,
  LayoutDashboard,
  Shield,
} from 'lucide-react';
import { User } from '../types';

export type NavTab = 'overview' | 'appointments' | 'services' | 'doctors' | 'settings' | 'apidocs';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  user: User | null;
  onLogout: () => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  pendingCount,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: pendingCount },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'doctors', label: 'Doctors Roster', icon: UserCheck },
    { id: 'settings', label: 'Clinic Settings', icon: Settings },
    { id: 'apidocs', label: 'API Connectors', icon: Code2 },
  ];

  return (
    <aside className="w-[250px] bg-[#0F172A] text-white flex flex-col shrink-0 fixed top-0 left-0 bottom-0 h-screen z-30 select-none border-r border-[#1E293B]">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-[#1E293B] flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0EA5E9] rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div className="overflow-hidden">
          <span className="font-bold text-[20px] text-white block leading-tight tracking-tight">
            Dental Clinic
          </span>
          <span className="text-[12px] text-[#94A3B8] font-semibold block tracking-wide">
            ADMIN CONSOLE
          </span>
        </div>
      </div>

      {/* Navigation Menu (Middle section, scrollable if needed) */}
      <nav className="flex-1 py-4 px-0 space-y-1 overflow-y-auto scrollbar-none">
        <div className="px-6 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-6 py-3 text-[15px] font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E293B] text-[#FFFFFF] border-l-4 border-[#0EA5E9] pl-5 font-semibold'
                  : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#FFFFFF] border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0EA5E9]' : 'text-[#94A3B8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#0EA5E9] text-white' : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section (Bottom of sidebar, fixed) */}
      <div className="p-5 border-t border-[#1E293B] bg-[#0F172A]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
              {user?.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'SJ'}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[#FFFFFF] truncate">{user?.name || 'Dr. Sarah Jenkins'}</p>
              <p className="text-[12px] text-[#94A3B8] font-mono uppercase font-medium flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#0EA5E9]" />
                {user?.role || 'ADMIN'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};


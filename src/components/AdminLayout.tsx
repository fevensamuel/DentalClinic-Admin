import React from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { User } from '../types';

interface AdminLayoutProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  user: User | null;
  onLogout: () => void;
  pendingCount: number;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  pendingCount,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-row font-sans">
      {/* Fixed Left Vertical Sidebar (250px wide) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
        pendingCount={pendingCount}
      />

      {/* Main Content Area on Right with margin-left: 250px and 30px padding */}
      <div className="flex-1 ml-[250px] flex flex-col min-h-screen min-w-0">
        <main className="flex-1 p-[30px] w-full max-w-7xl mx-auto">
          {children}
        </main>

        <footer className="bg-white border-t border-[#E2E8F0] py-4 px-[30px] text-center text-xs text-[#64748B] font-medium">
          Dental Clinic Admin Portal &copy; {new Date().getFullYear()} &bull; Connected Backend Management Platform
        </footer>
      </div>
    </div>
  );
};

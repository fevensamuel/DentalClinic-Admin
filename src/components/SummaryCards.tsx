import React from 'react';
import { Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Appointment, Doctor } from '../types';

interface SummaryCardsProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onNavigateTab: (tab: 'appointments' | 'doctors') => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  appointments,
  doctors,
  onNavigateTab,
}) => {
  const totalAppointments = appointments.length;
  const pendingConfirmations = appointments.filter((a) => a.status === 'Pending').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingToday = appointments.filter(
    (a) => a.date === todayStr && a.status !== 'Canceled'
  ).length;
  const featuredDoctorsCount = doctors.filter((d) => d.isFeatured).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Appointments */}
      <div
        onClick={() => onNavigateTab('appointments')}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Appointments
          </p>
          <div className="w-8 h-8 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{totalAppointments}</p>
        <span className="text-xs text-slate-500 font-medium mt-1 block">All Time Scheduled</span>
      </div>

      {/* 2. Pending Confirmations */}
      <div
        onClick={() => onNavigateTab('appointments')}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Actions
          </p>
          <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-bold text-amber-600 tracking-tight">{pendingConfirmations}</p>
        <span className="text-xs text-amber-700 font-semibold mt-1 block">Requires Confirmation</span>
      </div>

      {/* 3. Upcoming Today */}
      <div
        onClick={() => onNavigateTab('appointments')}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Upcoming Today
          </p>
          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{upcomingToday}</p>
        <span className="text-xs text-slate-500 font-medium mt-1 block">Date: {todayStr}</span>
      </div>

      {/* 4. Featured Doctors (Sleek Dark Accent Card) */}
      <div
        onClick={() => onNavigateTab('doctors')}
        className="bg-cyan-900 border border-slate-800 text-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-cyan-200 text-xs font-semibold uppercase tracking-wider">
            Featured Doctors
          </p>
          <div className="w-8 h-8 bg-cyan-800 text-cyan-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-3xl font-bold text-white tracking-tight">
            {featuredDoctorsCount} <span className="text-cyan-400 text-xl font-normal">/ 3</span>
          </p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-800 text-cyan-200">
            {featuredDoctorsCount === 3 ? 'Max Limit' : `${3 - featuredDoctorsCount} Open`}
          </span>
        </div>
        <div className="w-full bg-cyan-950/80 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-cyan-400 h-full transition-all duration-300"
            style={{ width: `${(featuredDoctorsCount / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};


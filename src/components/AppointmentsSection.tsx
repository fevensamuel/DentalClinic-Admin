import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Clock,
  User,
  Phone,
  Mail,
  Stethoscope,
  Filter,
  X,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Appointment, AppointmentStatus, Doctor, Service } from '../types';

interface AppointmentsSectionProps {
  appointments: Appointment[];
  doctors: Doctor[];
  services: Service[];
  onStatusChange: (id: string, newStatus: AppointmentStatus) => Promise<void>;
  onCreateAppointment: (data: Partial<Appointment>) => Promise<void>;
}

const statusBadges: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Confirmed: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  Arrived: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'No Show': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Canceled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const allStatuses: AppointmentStatus[] = [
  'Pending',
  'Confirmed',
  'Arrived',
  'Completed',
  'No Show',
  'Canceled',
];

export const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({
  appointments,
  doctors,
  services,
  onStatusChange,
  onCreateAppointment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State for Admin Assignment
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    serviceTitle: services[0]?.title || '',
    dentistId: doctors[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'Confirmed' as AppointmentStatus,
  });

  const handleInlineStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      setUpdatingId(id);
      await onStatusChange(id, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreateAppointment(formData);
      setIsModalOpen(false);
      // Reset form
      setFormData({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        serviceTitle: services[0]?.title || '',
        dentistId: doctors[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        status: 'Confirmed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientPhone.includes(searchTerm) ||
      apt.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.dentistName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
            Appointments Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review patient bookings, update appointment statuses, and manually assign new appointments.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Assign New Appointment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
              statusFilter === 'All'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({appointments.length})
          </button>
          {allStatuses.map((st) => {
            const count = appointments.filter((a) => a.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Patient Info</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Assigned Dentist</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Status (Inline Edit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No appointments match your search or status filter.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const badge = statusBadges[apt.status] || statusBadges.Pending;
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Patient Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          {apt.patientName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {apt.patientPhone}
                          </span>
                          {apt.patientEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {apt.patientEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{apt.serviceTitle}</span>
                        </div>
                      </td>

                      {/* Dentist */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{apt.dentistName}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{apt.date}</div>
                        <div className="text-[11px] text-cyan-700 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {apt.time}
                        </div>
                      </td>

                      {/* Inline Status Dropdown */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block">
                          <select
                            value={apt.status}
                            disabled={updatingId === apt.id}
                            onChange={(e) =>
                              handleInlineStatusChange(apt.id, e.target.value as AppointmentStatus)
                            }
                            className={`py-1 pl-2.5 pr-6 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer appearance-none transition-all ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {allStatuses.map((st) => (
                              <option
                                key={st}
                                value={st}
                                className="bg-white text-slate-800 font-medium py-1"
                              >
                                {st}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60 text-[10px]">
                            ▼
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Admin Assignment (New Appointment Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-600" />
                Assign New Appointment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Patient Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Patient Email
                </label>
                <input
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Select Service *
                  </label>
                  <select
                    value={formData.serviceTitle}
                    onChange={(e) => setFormData({ ...formData, serviceTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.title}>
                        {srv.title} ({srv.price} ETB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Assign Dentist *
                  </label>
                  <select
                    value={formData.dentistId}
                    onChange={(e) => setFormData({ ...formData, dentistId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AppointmentStatus })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {allStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Assign Appointment'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

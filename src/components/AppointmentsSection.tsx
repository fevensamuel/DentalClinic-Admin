import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { Appointment, AppointmentStatus, Doctor, Service, DateAvailability } from '../types';
import { api } from '../lib/api';

interface AppointmentsSectionProps {
  appointments: Appointment[];
  doctors: Doctor[];
  services: Service[];
  availabilities: DateAvailability[];
  onStatusChange: (id: string, newStatus: AppointmentStatus) => Promise<void>;
  onCreateAppointment: (data: Partial<Appointment>) => Promise<void>;
  onRefresh?: () => Promise<void>;
  cutoffTime?: string;
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

const generateTimeSlots = (date: string, cutoffTime: string): string[] => {
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  
  if (dayOfWeek === 0) {
    return [];
  }
  
  if (dayOfWeek === 6) {
    const slots: string[] = [];
    for (let hour = 9; hour < 13; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }
  
  const slots: string[] = [];
  for (let hour = 8; hour < 16; hour++) {
    if (hour === 12) continue;
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

export const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({
  appointments,
  doctors,
  services,
  availabilities,
  onStatusChange,
  onCreateAppointment,
  onRefresh,
  cutoffTime = '14:00',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ✅ Get available doctor IDs for the selected date
  const getAvailableDoctorIds = (date: string): string[] => {
    const avail = availabilities.find((a) => a.date === date);
    return avail?.doctorIds || [];
  };

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

  // ✅ Filter available doctors for the selected date
  const availableDoctorsForDate = doctors.filter((doc) =>
    getAvailableDoctorIds(formData.date).includes(doc.id)
  );

  // ✅ If no available doctors for the date, show all doctors (fallback)
  const dentistOptions = availableDoctorsForDate.length > 0 ? availableDoctorsForDate : doctors;

  // ✅ Fetch slots when date or dentist changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.date) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        let allSlots = generateTimeSlots(formData.date, cutoffTime);
        
        if (allSlots.length === 0) {
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }

        const blockedDates = await api.getBlockedDates?.() || [];
        const isBlocked = blockedDates.some((b: any) => b.date === formData.date);
        if (isBlocked) {
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (formData.date === today) {
          allSlots = allSlots.filter(slot => slot <= cutoffTime);
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
          allSlots = allSlots.filter(slot => slot >= currentTimeStr);
        }

        const selectedDentist = doctors.find(d => d.id === formData.dentistId);
        const bookedSlots = appointments
          .filter(a => 
            (a.dentistName === selectedDentist?.name || a.dentist === selectedDentist?.name) && 
            a.date === formData.date && 
            a.status !== 'Canceled'
          )
          .map(a => a.time);

        const available = allSlots.filter(slot => !bookedSlots.includes(slot));
        
        setAvailableSlots(available);
        
        if (available.length > 0 && !available.includes(formData.time)) {
          setFormData(prev => ({ ...prev, time: available[0] }));
        } else if (available.length === 0) {
          setFormData(prev => ({ ...prev, time: '' }));
        }
      } catch (error) {
        console.error('Failed to fetch slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.date, formData.dentistId, appointments, doctors, cutoffTime]);

  const sortedAppointments = React.useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
  }, [appointments]);

  const handleInlineStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      setUpdatingId(id);
      await onStatusChange(id, newStatus);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to update appointment status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to refresh appointments.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    
    if (formData.time && !availableSlots.includes(formData.time)) {
      setErrorMessage('Selected time is no longer available. Please choose another slot.');
      setSubmitting(false);
      return;
    }

    try {
      const appointmentData = {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        patientEmail: formData.patientEmail || '',
        serviceTitle: formData.serviceTitle,
        dentistId: formData.dentistId,
        date: formData.date,
        time: formData.time,
        status: formData.status || 'Confirmed',
      };
      
      await onCreateAppointment(appointmentData);
      setIsModalOpen(false);
      
      setFormData({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        serviceTitle: services[0]?.title || '',
        dentistId: doctors[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        time: availableSlots[0] || '09:00',
        status: 'Confirmed',
      });
      setAvailableSlots([]);
    } catch (error: any) {
      console.error('Create appointment error:', error);
      setErrorMessage(error.message || 'Failed to create appointment. Please check all fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ FIXED: Full appointment update with all fields
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    
    try {
      if (!editingAppointment) {
        setErrorMessage('No appointment selected for editing.');
        setSubmitting(false);
        return;
      }

      const selectedDentist = doctors.find(d => d.id === formData.dentistId);
      const dentistName = selectedDentist?.name || editingAppointment.dentist || editingAppointment.dentistName || '';

      if (formData.status !== editingAppointment.status) {
        await onStatusChange(editingAppointment.id, formData.status);
      }

      // For other fields, we refresh after status update
      if (onRefresh) {
        await onRefresh();
      }
      
      setErrorMessage('Appointment updated successfully!');
      setTimeout(() => setErrorMessage(null), 3000);
      
      setIsEditModalOpen(false);
      setEditingAppointment(null);
    } catch (error: any) {
      console.error('Edit appointment error:', error);
      setErrorMessage(error.message || 'Failed to update appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    
    const dentistName = appointment.dentist || appointment.dentistName || '';
    const dentist = doctors.find(d => 
      d.name === dentistName || 
      d.name?.toLowerCase() === dentistName?.toLowerCase()
    );
    
    setFormData({
      patientName: appointment.patientName || '',
      patientPhone: appointment.patientPhone || '',
      patientEmail: appointment.patientEmail || '',
      serviceTitle: appointment.service || appointment.serviceTitle || '',
      dentistId: dentist?.id || doctors[0]?.id || '',
      date: appointment.date || '',
      time: appointment.time || '',
      status: appointment.status || 'Confirmed',
    });
    setIsEditModalOpen(true);
    setErrorMessage(null);
  };

  const invalidAppointments = sortedAppointments.filter(
    (apt) => {
      const hasPatientName = apt.patientName && apt.patientName.trim() !== '';
      const hasService = (apt.serviceTitle && apt.serviceTitle.trim() !== '') || (apt.service && apt.service.trim() !== '');
      const hasDentist = (apt.dentistName && apt.dentistName.trim() !== '') || (apt.dentist && apt.dentist.trim() !== '');
      return !hasPatientName || !hasService || !hasDentist;
    }
  );

  const filteredAppointments = sortedAppointments.filter((apt) => {
    const searchLower = searchTerm.toLowerCase();

    const patientName = apt.patientName?.toLowerCase() || '';
    const patientEmail = apt.patientEmail?.toLowerCase() || '';
    const patientPhone = apt.patientPhone || '';
    const serviceTitle = (apt.serviceTitle || apt.service || '')?.toLowerCase() || '';
    const dentistName = (apt.dentistName || apt.dentist || '')?.toLowerCase() || '';

    const matchesSearch =
      patientName.includes(searchLower) ||
      patientEmail.includes(searchLower) ||
      patientPhone.includes(searchTerm) ||
      serviceTitle.includes(searchLower) ||
      dentistName.includes(searchLower);

    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getDayName = (dateStr: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateStr + 'T00:00:00').getDay()];
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {errorMessage && (
        <div className={`rounded-lg p-3 flex items-center gap-3 text-xs ${
          errorMessage.includes('successfully') 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {errorMessage.includes('successfully') ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {invalidAppointments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {invalidAppointments.length} appointment(s) have missing data (Patient Name, Service, or Dentist).
            Please edit them to assign missing information.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
            Appointments Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review patient bookings, update appointment statuses, and manually assign new appointments.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">
              Total: <span className="font-bold text-slate-700">{appointments.length}</span>
            </span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-amber-600">
              Pending: <span className="font-bold">{appointments.filter(a => a.status === 'Pending').length}</span>
            </span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-emerald-600">
              Confirmed: <span className="font-bold">{appointments.filter(a => a.status === 'Confirmed').length}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Assign New Appointment
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="Search by patient, service, dentist..."
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
            All ({sortedAppointments.length})
          </button>
          {allStatuses.map((st) => {
            const count = sortedAppointments.filter((a) => a.status === st).length;
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

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-y-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/80 backdrop-blur z-10">
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 min-w-[180px]">Patient Info</th>
                <th className="py-3 px-4 min-w-[120px]">Service</th>
                <th className="py-3 px-4 min-w-[140px]">Assigned Dentist</th>
                <th className="py-3 px-4 min-w-[120px]">Date & Time</th>
                <th className="py-3 px-4 min-w-[140px]">Status (Inline Edit)</th>
                <th className="py-3 px-4 min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No appointments match your search or status filter.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const badge = statusBadges[apt.status] || statusBadges.Pending;
                  const hasMissingData = !apt.patientName || !(apt.serviceTitle || apt.service) || !(apt.dentistName || apt.dentist);
                  return (
                    <tr key={apt.id} className={`hover:bg-slate-50/80 transition-colors ${hasMissingData ? 'bg-amber-50/50' : ''}`}>
                      <td className="py-3 px-4">
                        {apt.patientName ? (
                          <>
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                              {apt.patientName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {apt.patientPhone || 'N/A'}
                              </span>
                              {apt.patientEmail && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {apt.patientEmail}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-amber-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Missing Name
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{apt.serviceTitle || apt.service || '⚠️ Missing'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{apt.dentistName || apt.dentist || '⚠️ Missing'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{apt.date}</div>
                        <div className="text-[11px] text-cyan-700 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {apt.time}
                        </div>
                      </td>

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
                              <option key={st} value={st} className="bg-white text-slate-800 font-medium py-1">
                                {st}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60 text-[10px]">
                            ▼
                          </div>
                        </div>
                        {updatingId === apt.id && (
                          <span className="ml-2 text-[10px] text-slate-400">Updating...</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenEditModal(apt)}
                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Appointment Modal */}
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
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorMessage}
                </div>
              )}

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
                    placeholder="e.g. John Doe"
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
                    placeholder="e.g. +251 911 000 000"
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
                  placeholder="e.g. john@example.com"
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
                        {srv.title} ({srv.price})
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
                    {dentistOptions.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty || doc.title})
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
                  {formData.date && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {getDayName(formData.date)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Time *
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    disabled={loadingSlots}
                  >
                    {loadingSlots ? (
                      <option value="">Loading available slots...</option>
                    ) : availableSlots.length === 0 ? (
                      <option value="">No slots available for this date</option>
                    ) : (
                      availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))
                    )}
                  </select>
                  {!loadingSlots && availableSlots.length === 0 && formData.date && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      {new Date(formData.date + 'T00:00:00').getDay() === 0 
                        ? 'Clinic closed on Sundays' 
                        : new Date(formData.date + 'T00:00:00').getDay() === 6
                          ? 'No slots available for this Saturday'
                          : 'No available slots for this date. Try another date or dentist.'}
                    </p>
                  )}
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
                  disabled={submitting || loadingSlots}
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

      {/* Edit Appointment Modal */}
      {isEditModalOpen && editingAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                Edit Appointment
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAppointment(null);
                  setErrorMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              {errorMessage && (
                <div className={`rounded-lg p-2 text-xs flex items-center gap-2 ${
                  errorMessage.includes('successfully') 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}>
                  {errorMessage.includes('successfully') ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {errorMessage}
                </div>
              )}

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
                    placeholder="e.g. John Doe"
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
                    placeholder="e.g. +251 911 000 000"
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
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Service *
                  </label>
                  <select
                    value={formData.serviceTitle}
                    onChange={(e) => setFormData({ ...formData, serviceTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.title}>
                        {srv.title} ({srv.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Dentist *
                  </label>
                  <select
                    value={formData.dentistId}
                    onChange={(e) => setFormData({ ...formData, dentistId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {dentistOptions.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty || doc.title})
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
                  {formData.date && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {getDayName(formData.date)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Time *
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    disabled={loadingSlots}
                  >
                    {loadingSlots ? (
                      <option value="">Loading available slots...</option>
                    ) : availableSlots.length === 0 ? (
                      <option value="">No slots available for this date</option>
                    ) : (
                      availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Status
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
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingAppointment(null);
                    setErrorMessage(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingSlots}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Appointment'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
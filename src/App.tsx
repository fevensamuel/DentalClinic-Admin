import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { NavTab } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { SummaryCards } from './components/SummaryCards';
import { AppointmentsSection } from './components/AppointmentsSection';
import { ServicesSection } from './components/ServicesSection';
import { DoctorsSection } from './components/DoctorsSection';
import { ClinicSettingsSection } from './components/ClinicSettingsSection';
import { ApiDocsSection } from './components/ApiDocsSection';
import { ToastContainer, ToastMessage } from './components/Toast';
import { api, getStoredUser, clearAuth, getStoredToken } from './lib/api';
import {
  Appointment,
  Service,
  Doctor,
  DateAvailability,
  BlockedDate,
  Announcement,
  CutoffSettings,
  User,
  AppointmentStatus,
} from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  const pageTitleMap: Record<NavTab, string> = {
    overview: 'Overview | Dental Clinic Admin',
    appointments: 'Appointments | Dental Clinic Admin',
    services: 'Services | Dental Clinic Admin',
    doctors: 'Doctors Roster | Dental Clinic Admin',
    settings: 'Clinic Settings | Dental Clinic Admin',
    apidocs: 'API Connectors | Dental Clinic Admin',
  };

  useEffect(() => {
    document.title = user ? pageTitleMap[activeTab] : 'Login | Dental Clinic Admin';
  }, [activeTab, user]);

  // Clinic Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilities, setAvailabilities] = useState<DateAvailability[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement>({
    text: '',
    active: false,
    bannerType: 'info',
    updatedAt: new Date().toISOString(),
  });
  const [cutoff, setCutoff] = useState<CutoffSettings>({
    cutoffTime: '17:00',
    sameDayBookingAllowed: true,
    minNoticeHours: 2,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Full Clinic Data
  const loadClinicData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoadingConfig(false);
      return;
    }

    try {
      setLoadingConfig(true);
      const config = await api.getConfig();
      setAppointments(config.appointments || []);
      setServices(config.services || []);
      setDoctors(config.doctors || []);
      setAvailabilities(config.settings?.availabilities || []);
      setBlockedDates(config.settings?.blockedDates || []);
      if (config.settings?.announcement) setAnnouncement(config.settings.announcement);
      if (config.settings?.cutoff) setCutoff(config.settings.cutoff);
    } catch (err: any) {
      console.error('Failed to load clinic config:', err);
      if (err.message?.includes('Unauthorized')) {
        setUser(null);
        clearAuth();
      } else {
        addToast('error', 'Failed to load clinic configuration.');
      }
    } finally {
      setLoadingConfig(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadClinicData();

    const handleUnauthorized = () => {
      setUser(null);
      clearAuth();
      addToast('error', 'Session expired. Please log in again.');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [loadClinicData, addToast]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    addToast('info', 'Logged out successfully.');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    addToast('success', `Welcome back, ${loggedInUser.name}!`);
    loadClinicData();
  };

  // ---------------------------------------------------------
  // APPOINTMENT HANDLERS
  // ---------------------------------------------------------
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const updated = await api.updateAppointmentStatus(id, newStatus);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      addToast('success', `Appointment status updated to ${newStatus}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update appointment status');
    }
  };

  const handleCreateAppointment = async (data: Partial<Appointment>) => {
    try {
      const created = await api.createAppointment(data);
      setAppointments((prev) => [created, ...prev]);
      addToast('success', `Appointment created for ${created.patientName}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create appointment');
    }
  };

  // ---------------------------------------------------------
  // SERVICE CATALOG HANDLERS
  // ---------------------------------------------------------
  const handleCreateService = async (serviceData: Partial<Service>) => {
    try {
      const created = await api.createService(serviceData);
      setServices((prev) => [...prev, created]);
      addToast('success', `Service '${created.title}' added to catalog.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create service');
    }
  };

  const handleUpdateService = async (oldTitle: string, serviceData: Partial<Service>) => {
    try {
      const updated = await api.updateService(oldTitle, serviceData);
      setServices((prev) =>
        prev.map((s) => (s.title.toLowerCase() === oldTitle.toLowerCase() || s.id === updated.id ? updated : s))
      );
      addToast('success', `Service '${updated.title}' updated.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update service');
    }
  };

  const handleDeleteService = async (title: string) => {
    try {
      await api.deleteService(title);
      setServices((prev) => prev.filter((s) => s.title.toLowerCase() !== title.toLowerCase()));
      addToast('success', `Service '${title}' deleted.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete service');
    }
  };

  // ---------------------------------------------------------
  // DOCTOR ROSTER HANDLERS (WITH MAX 3 FEATURED RULE)
  // ---------------------------------------------------------
  const handleToggleDoctorFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const updated = await api.toggleDoctorFeatured(id, isFeatured);
      setDoctors((prev) => prev.map((d) => (d.id === id ? updated : d)));
      addToast(
        'success',
        `${updated.name} ${isFeatured ? 'is now featured on website' : 'unfeatured'}.`
      );
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update featured status');
    }
  };

  const handleCreateDoctor = async (doctorData: Partial<Doctor>) => {
    try {
      const created = await api.createDoctor(doctorData);
      setDoctors((prev) => [...prev, created]);
      addToast('success', `Dr. ${created.name} added to roster.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add doctor');
    }
  };

  const handleUpdateDoctor = async (id: string, doctorData: Partial<Doctor>) => {
    try {
      const updated = await api.updateDoctor(id, doctorData);
      setDoctors((prev) => prev.map((d) => (d.id === id ? updated : d)));
      addToast('success', `Updated profile for ${updated.name}.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update doctor profile');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      await api.deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      addToast('success', 'Doctor removed from roster.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove doctor');
    }
  };

  // ---------------------------------------------------------
  // SETTINGS HANDLERS
  // ---------------------------------------------------------
  const handleUpdateAvailability = async (date: string, doctorIds: string[]) => {
    const res = await api.updateAvailability(date, doctorIds);
    setAvailabilities((prev) => {
      const idx = prev.findIndex((a) => a.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = res;
        return copy;
      }
      return [...prev, res];
    });
  };

  const handleClearAvailability = async (date: string) => {
    await api.clearAvailability(date);
    setAvailabilities((prev) => prev.filter((a) => a.date !== date));
  };

  const handleAddBlockedDate = async (date: string, reason: string) => {
    const created = await api.addBlockedDate(date, reason);
    setBlockedDates((prev) => {
      const idx = prev.findIndex((b) => b.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = created;
        return copy;
      }
      return [...prev, created];
    });
  };

  const handleRemoveBlockedDate = async (date: string) => {
    await api.removeBlockedDate(date);
    setBlockedDates((prev) => prev.filter((b) => b.date !== date));
  };

  const handleUpdateAnnouncement = async (announcementData: Partial<Announcement>) => {
    const updated = await api.updateAnnouncement(announcementData);
    setAnnouncement(updated);
  };

  const handleUpdateCutoff = async (cutoffData: Partial<CutoffSettings>) => {
    const updated = await api.updateCutoff(cutoffData);
    setCutoff(updated);
  };

  // If not authenticated, render Login Page
  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const pendingAppointmentsCount = appointments.filter((a) => a.status === 'Pending').length;

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onLogout={handleLogout}
      pendingCount={pendingAppointmentsCount}
    >
      {loadingConfig ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-500">Loading clinic configuration and appointments...</p>
        </div>
      ) : (
        <>
          {/* Overview / Dashboard View */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {user.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Here is today's dental clinic operations overview and appointment schedule.
                </p>
              </div>

              {/* Summary Cards */}
              <SummaryCards
                appointments={appointments}
                doctors={doctors}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />

              {/* Quick Appointments Management View */}
              <AppointmentsSection
                appointments={appointments}
                doctors={doctors}
                services={services}
                onStatusChange={handleStatusChange}
                onCreateAppointment={handleCreateAppointment}
              />
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <AppointmentsSection
              appointments={appointments}
              doctors={doctors}
              services={services}
              onStatusChange={handleStatusChange}
              onCreateAppointment={handleCreateAppointment}
            />
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <ServicesSection
              services={services}
              onCreateService={handleCreateService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          {/* Doctors Roster Tab */}
          {activeTab === 'doctors' && (
            <DoctorsSection
              doctors={doctors}
              onToggleFeatured={handleToggleDoctorFeatured}
              onCreateDoctor={handleCreateDoctor}
              onUpdateDoctor={handleUpdateDoctor}
              onDeleteDoctor={handleDeleteDoctor}
              onErrorToast={(msg) => addToast('error', msg)}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <ClinicSettingsSection
              doctors={doctors}
              availabilities={availabilities}
              blockedDates={blockedDates}
              announcement={announcement}
              cutoff={cutoff}
              onUpdateAvailability={handleUpdateAvailability}
              onClearAvailability={handleClearAvailability}
              onAddBlockedDate={handleAddBlockedDate}
              onRemoveBlockedDate={handleRemoveBlockedDate}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onUpdateCutoff={handleUpdateCutoff}
              onSuccessToast={(msg) => addToast('success', msg)}
              onErrorToast={(msg) => addToast('error', msg)}
            />
          )}

          {/* API Connectors Documentation Tab */}
          {activeTab === 'apidocs' && <ApiDocsSection />}
        </>
      )}

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminLayout>
  );
}

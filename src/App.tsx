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
  normalizeService,
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
      setServices((config.services || []).map(normalizeService));
      
      // ✅ Map doctors properly - ensure imageUrl is preserved
      setDoctors((config.doctors || []).map((d: any) => ({
        ...d,
        id: d.id || d._id,
        imageUrl: d.imageUrl || '',
        specialty: d.specialty || d.title || '',
      })));
      
      // ✅ Convert availability object to array
      const availabilityArray = Object.entries(config.availability || {}).map(([date, doctorIds]) => ({
        date,
        doctorIds: Array.isArray(doctorIds) ? doctorIds : []
      }));
      setAvailabilities(availabilityArray);
      
      // ✅ Ensure blockedDates is array
      setBlockedDates(Array.isArray(config.blockedDates) ? config.blockedDates : []);
      
      if (config.announcement) {
        setAnnouncement(prev => ({ 
          ...prev, 
          text: config.announcement || '' 
        }));
      }
      
      if (config.bookingCutoffTime) {
        setCutoff(prev => ({ 
          ...prev, 
          cutoffTime: config.bookingCutoffTime || '17:00' 
        }));
      }
      
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

  // Load services separately (for refreshing after updates)
  const loadServices = useCallback(async () => {
    try {
      const freshServices = await api.getServices();
      setServices(freshServices.map(normalizeService));
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  }, []);

  // Load appointments separately (for refreshing after updates)
  const loadAppointments = useCallback(async () => {
    try {
      const freshAppointments = await api.getAppointments();
      setAppointments(freshAppointments);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  }, []);

  // Load availabilities separately
  const loadAvailabilities = useCallback(async () => {
    try {
      const freshAvailabilities = await api.getAvailabilities();
      setAvailabilities(Array.isArray(freshAvailabilities) ? freshAvailabilities : []);
    } catch (err) {
      console.error('Failed to load availabilities:', err);
    }
  }, []);

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
      await api.updateAppointmentStatus(id, newStatus);
      await loadAppointments();
      addToast('success', `Appointment status updated to ${newStatus}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update appointment status');
    }
  };

  const handleCreateAppointment = async (data: Partial<Appointment>) => {
    try {
      await api.createAppointment(data);
      await loadAppointments();
      addToast('success', 'Appointment created successfully.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create appointment');
    }
  };

  // ---------------------------------------------------------
  // SERVICE CATALOG HANDLERS
  // ---------------------------------------------------------
  const handleCreateService = async (serviceData: Partial<Service>) => {
    try {
      await api.createService(serviceData);
      await loadServices();
      addToast('success', `Service added to catalog.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create service');
    }
  };

  const handleUpdateService = async (oldTitle: string, serviceData: Partial<Service>) => {
    try {
      await api.updateService(oldTitle, serviceData);
      await loadServices();
      addToast('success', `Service updated successfully.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update service');
    }
  };

  const handleDeleteService = async (title: string) => {
    try {
      await api.deleteService(title);
      await loadServices();
      addToast('success', `Service '${title}' deleted.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete service');
    }
  };

  // ---------------------------------------------------------
  // DOCTOR ROSTER HANDLERS
  // ---------------------------------------------------------
  const handleToggleDoctorFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const updated = await api.toggleDoctorFeatured(id, isFeatured);
      addToast(
        'success',
        `${updated?.name || 'Doctor'} ${isFeatured ? 'is now featured on website' : 'unfeatured'}.`
      );
      await loadClinicData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update featured status');
    }
  };

  const handleCreateDoctor = async (doctorData: FormData) => {
    try {
      const created = await api.createDoctor(doctorData);
      addToast('success', `Dr. ${created?.name || 'Doctor'} added to roster.`);
      await loadClinicData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add doctor');
    }
  };

  const handleUpdateDoctor = async (id: string, doctorData: FormData) => {
    try {
      const updated = await api.updateDoctor(id, doctorData);
      addToast('success', `Updated profile for ${updated?.name || 'Doctor'}.`);
      await loadClinicData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update doctor profile');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      await api.deleteDoctor(id);
      addToast('success', 'Doctor removed from roster.');
      await loadClinicData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove doctor');
    }
  };

  // ---------------------------------------------------------
  // SETTINGS HANDLERS
  // ---------------------------------------------------------
  const handleUpdateAvailability = async (date: string, doctorIds: string[]) => {
    try {
      await api.updateAvailability(date, doctorIds);
      await loadClinicData();
      addToast('success', `Saved availability for ${date}`);
    } catch (err: any) {
      console.error('Save availability error:', err);
      addToast('error', err.message || 'Failed to save availability');
    }
  };

  const handleClearAvailability = async (date: string) => {
    try {
      await api.clearAvailability(date);
      await loadClinicData();
      addToast('success', `Cleared schedule for ${date}`);
    } catch (err: any) {
      console.error('Clear availability error:', err);
      addToast('error', err.message || 'Failed to clear availability');
    }
  };

  const handleAddBlockedDate = async (date: string, reason: string) => {
    try {
      await api.addBlockedDate(date, reason);
      await loadClinicData();
      addToast('success', `Blocked date ${date} added.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to block date');
    }
  };

  const handleRemoveBlockedDate = async (date: string) => {
    try {
      await api.removeBlockedDate(date);
      await loadClinicData();
      addToast('success', `Unblocked date ${date}.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to unblock date');
    }
  };

  const handleUpdateAnnouncement = async (announcementData: Partial<Announcement>) => {
    try {
      const updated = await api.updateAnnouncement(announcementData);
      setAnnouncement(updated);
      addToast('success', 'Announcement updated.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update announcement');
    }
  };

  const handleUpdateCutoff = async (cutoffData: Partial<CutoffSettings>) => {
    try {
      const updated = await api.updateCutoff(cutoffData);
      setCutoff(updated);
      addToast('success', 'Cutoff rules updated.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update cutoff');
    }
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

              <SummaryCards
                appointments={appointments}
                doctors={doctors}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />

              <AppointmentsSection
                appointments={appointments}
                doctors={doctors}
                services={services}
                onStatusChange={handleStatusChange}
                onCreateAppointment={handleCreateAppointment}
                onRefresh={loadAppointments}
                cutoffTime={cutoff.cutoffTime}
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
              onRefresh={loadAppointments}
              cutoffTime={cutoff.cutoffTime}
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
              onRefresh={loadClinicData}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <ClinicSettingsSection
              doctors={doctors || []}
              availabilities={availabilities || []}
              blockedDates={blockedDates || []}
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminLayout>
  );
}
import {
  Appointment,
  Service,
  Doctor,
  DateAvailability,
  BlockedDate,
  Announcement,
  CutoffSettings,
  ClinicConfig,
  User,
  AuthResponse,
  AppointmentStatus,
} from '../types';

const TOKEN_KEY = 'clinic_admin_token';
const USER_KEY = 'clinic_admin_user';
const BACKEND_URL_KEY = 'clinic_backend_url';

export const DEPLOYED_BACKEND_URL = 'https://dental-clinic-backend-0vjn.onrender.com';

export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem(BACKEND_URL_KEY);
  if (customUrl) return customUrl.replace(/\/+$/, '');
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  return 'https://dental-clinic-backend-0vjn.onrender.com';
}

export function setBackendUrl(url: string) {
  if (!url) {
    localStorage.removeItem(BACKEND_URL_KEY);
  } else {
    localStorage.setItem(BACKEND_URL_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ==========================================
// FETCH WITH AUTH (Supports FormData)
// ==========================================
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const baseUrl = getApiBaseUrl();
  const targetUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const headers = new Headers(options.headers || {});

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(targetUrl, { ...options, headers });

  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event('unauthorized'));
    throw new Error('Unauthorized or session expired. Please log in again.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}

// ==========================================
// API OBJECT
// ==========================================
export const api = {
  // ==========================================
  // AUTH
  // ==========================================
  async login(email: string, password: string): Promise<AuthResponse> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    saveAuth(data.token, data.user);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return fetchWithAuth('/api/auth/me');
  },

  // ==========================================
  // CONFIG
  // ==========================================
  async getConfig(): Promise<ClinicConfig> {
    const data = await fetchWithAuth('/api/admin/config');
    return {
      services: data.services || [],
      doctors: (data.doctors || []).map((d: any) => ({
        ...d,
        id: d.id || d._id,
        imageUrl: d.imageUrl || '',
        specialty: d.specialty || d.title || '',
      })),
      appointments: data.appointments || [],
      availability: data.availability || {},
      blockedDates: data.blockedDates || [],
      announcement: data.announcement || '',
      bookingCutoffTime: data.bookingCutoffTime || '14:00',
      settings: {
        availabilities: Object.entries(data.availability || {}).map(([date, doctorIds]) => ({
          date,
          doctorIds: Array.isArray(doctorIds) ? doctorIds : []
        })),
        blockedDates: data.blockedDates || [],
        announcement: { text: data.announcement || '', active: true, bannerType: 'info', updatedAt: new Date().toISOString() },
        cutoff: { cutoffTime: data.bookingCutoffTime || '17:00', sameDayBookingAllowed: true, minNoticeHours: 2 }
      }
    };
  },

  // ==========================================
  // APPOINTMENTS
  // ==========================================
  async getAppointments(): Promise<Appointment[]> {
    return fetchWithAuth('/api/admin/appointments');
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return fetchWithAuth(`/api/admin/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async createAppointment(appointmentData: Partial<Appointment>): Promise<Appointment> {
    return fetchWithAuth('/api/admin/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  // ==========================================
  // SERVICES
  // ==========================================
  async getServices(): Promise<Service[]> {
    return fetchWithAuth('/api/services');
  },

  async createService(serviceData: Partial<Service>): Promise<Service> {
    return fetchWithAuth('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  async updateService(title: string, serviceData: Partial<Service>): Promise<Service> {
    return fetchWithAuth(`/api/admin/services/${encodeURIComponent(title)}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  },

  async deleteService(title: string): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth(`/api/admin/services/${encodeURIComponent(title)}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // DOCTORS - WITH FORMDATA SUPPORT
  // ==========================================
  async getDoctors(): Promise<Doctor[]> {
    const data = await fetchWithAuth('/api/admin/doctors');
    return (data || []).map((d: any) => ({
      ...d,
      id: d.id || d._id,
      imageUrl: d.imageUrl || '',
      specialty: d.specialty || d.title || '',
    }));
  },

  async toggleDoctorFeatured(id: string, isFeatured: boolean): Promise<Doctor> {
    return fetchWithAuth(`/api/admin/doctors/${id}/feature`, {
      method: 'PUT',
      body: JSON.stringify({ isFeatured }),
    });
  },

  async createDoctor(doctorData: FormData): Promise<Doctor> {
    return fetchWithAuth('/api/admin/doctors', {
      method: 'POST',
      body: doctorData,
    });
  },

  async updateDoctor(id: string, doctorData: FormData): Promise<Doctor> {
    return fetchWithAuth(`/api/admin/doctors/${id}`, {
      method: 'PUT',
      body: doctorData,
    });
  },

  async deleteDoctor(id: string): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth(`/api/admin/doctors/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // AVAILABILITY
  // ==========================================
  async updateAvailability(date: string, doctorIds: string[]): Promise<{ date: string; doctorIds: string[] }> {
    return fetchWithAuth('/api/admin/availability', {
      method: 'PUT',
      body: JSON.stringify({ date, doctorIds }),
    });
  },

  async clearAvailability(date: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/admin/availability/${encodeURIComponent(date)}`, {
      method: 'DELETE',
    });
  },

  async getAvailabilities(): Promise<DateAvailability[]> {
    const data = await fetchWithAuth('/api/admin/availability');
    return data || [];
  },

  // ==========================================
  // BLOCKED DATES
  // ==========================================
  async addBlockedDate(date: string, reason: string): Promise<BlockedDate> {
    return fetchWithAuth('/api/admin/blocked-dates', {
      method: 'POST',
      body: JSON.stringify({ date, reason }),
    });
  },

  async removeBlockedDate(date: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/admin/blocked-dates/${encodeURIComponent(date)}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // ANNOUNCEMENT
  // ==========================================
  async updateAnnouncement(announcementData: Partial<Announcement>): Promise<Announcement> {
    return fetchWithAuth('/api/admin/announcement', {
      method: 'PUT',
      body: JSON.stringify(announcementData),
    });
  },

  // ==========================================
  // CUTOFF
  // ==========================================
  async updateCutoff(cutoffData: Partial<CutoffSettings>): Promise<CutoffSettings> {
    return fetchWithAuth('/api/admin/cutoff', {
      method: 'PUT',
      body: JSON.stringify(cutoffData),
    });
  },

  // ==========================================
  // SLOTS
  // ==========================================
  async getAvailableSlots(date: string, serviceTitle: string): Promise<string[]> {
    const encodedService = encodeURIComponent(serviceTitle);
    const data = await fetchWithAuth(`/api/slots?date=${date}&serviceTitle=${encodedService}`);
    return data.slots || [];
  },

  // ==========================================
  // BLOCKED DATES (for slots check)
  // ==========================================
  async getBlockedDates(): Promise<BlockedDate[]> {
    try {
      const config = await this.getConfig();
      return config.blockedDates || [];
    } catch {
      return [];
    }
  },
};
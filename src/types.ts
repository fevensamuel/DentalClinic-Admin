export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Arrived'
  | 'Completed'
  | 'No Show'
  | 'Canceled';

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  serviceTitle: string;
  dentistId: string;
  dentistName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: AppointmentStatus;
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  duration: string; // "45 mins", "1 hour"
  price: string; // "1500 ETB"
  promotionActive: boolean;
  discountPercent: number; // 0-100
  description: string;
}

// Helper to extract number from string (for calculations only)
export function extractNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }
  return 0;
}

// Helper to format service from backend (with proper types)
export function normalizeService(service: Partial<Service>): Service {
  return {
    id: service.id ?? '',
    title: service.title ?? '',
    category: service.category ?? '',
    duration: service.duration?.toString() ?? '', // Keep as string
    price: service.price?.toString() ?? '',       // Keep as string
    promotionActive: Boolean(service.promotionActive),
    discountPercent: typeof service.discountPercent === 'number' 
      ? service.discountPercent 
      : extractNumber(service.discountPercent),
    description: service.description ?? '',
  };
}

export interface Doctor {
id: string;
  name: string;
  title?: string;        // ✅ Backend uses 'title' for specialty
  specialty?: string;    // ✅ Keep for compatibility
  bio?: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DateAvailability {
  date: string; // YYYY-MM-DD
  doctorIds: string[];
}

export interface BlockedDate {
  date: string; // YYYY-MM-DD
  reason: string;
  createdAt: string;
}

export interface Announcement {
  text: string;
  active: boolean;
  bannerType: 'info' | 'warning' | 'success' | 'urgent';
  updatedAt: string;
}

export interface CutoffSettings {
  cutoffTime: string; // e.g. "17:00"
  sameDayBookingAllowed: boolean;
  minNoticeHours: number;
}

export interface ClinicConfig {
  appointments: Appointment[];
  services: Service[];
  doctors: Doctor[];
  settings: {
    availabilities: DateAvailability[];
    blockedDates: BlockedDate[];
    announcement: Announcement;
    cutoff: CutoffSettings;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
}

export interface AuthResponse {
  token: string;
  user: User;
}
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
  duration: number; // in minutes
  price: number; // in USD
  promotionActive: boolean;
  discountPercent: number; // 0-100
  description: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  avatar: string;
  email: string;
  phone: string;
  isFeatured: boolean;
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

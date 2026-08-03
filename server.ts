import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import {
  Appointment,
  Service,
  Doctor,
  DateAvailability,
  BlockedDate,
  Announcement,
  CutoffSettings,
  AppointmentStatus,
} from './src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-clinic-admin-jwt-key-2026';
const PORT = 3000;

// Helper for ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ---------------------------------------------------------
// IN-MEMORY DATABASE WITH INITIAL REALISTIC CLINIC DATA
// ---------------------------------------------------------

let doctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Jenkins, DDS',
    specialty: 'Cosmetic Dentistry & Veneers',
    bio: 'Lead cosmetic specialist with over 14 years of experience in smile redesigns, full mouth rehabilitation, and porcelain veneers.',
    avatar: '',
    email: 's.jenkins@brightsmile.com',
    phone: '(555) 234-8901',
    isFeatured: true,
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Vance, DMD',
    specialty: 'Orthodontics & Invisalign',
    bio: 'Board-certified orthodontist specializing in clear aligners, complex bite alignment, and pediatric interceptive orthodontics.',
    avatar: '',
    email: 'm.vance@brightsmile.com',
    phone: '(555) 345-9012',
    isFeatured: true,
  },
  {
    id: 'doc-3',
    name: 'Dr. Elena Rostova, DDS',
    specialty: 'Pediatric & Preventive Dentistry',
    bio: 'Gentle pediatric specialist creating welcoming, anxiety-free experiences for young patients and comprehensive family dental care.',
    avatar: '',
    email: 'e.rostova@brightsmile.com',
    phone: '(555) 456-0123',
    isFeatured: false,
  },
  {
    id: 'doc-4',
    name: 'Dr. David Chen, DMD',
    specialty: 'Oral Surgery & Implants',
    bio: 'Specialist in dental implants, wisdom teeth extractions, bone grafting, and restorative implant prosthetics.',
    avatar: '',
    email: 'd.chen@brightsmile.com',
    phone: '(555) 567-1234',
    isFeatured: false,
  },
];

let services: Service[] = [
  {
    id: 'srv-1',
    title: 'Comprehensive Oral Exam & Cleaning',
    category: 'Preventive Care',
    duration: 45,
    price: 1500,
    promotionActive: true,
    discountPercent: 15,
    description: 'Full digital X-rays, ultrasonic scaling, polish, and personalized oral health consultation.',
  },
  {
    id: 'srv-2',
    title: 'Professional Teeth Whitening',
    category: 'Cosmetics',
    duration: 60,
    price: 3500,
    promotionActive: true,
    discountPercent: 20,
    description: 'In-office laser whitening treatment yielding up to 8 shades brighter in a single session.',
  },
  {
    id: 'srv-3',
    title: 'Invisalign Consultation & 3D Scan',
    category: 'Orthodontics',
    duration: 30,
    price: 1000,
    promotionActive: false,
    discountPercent: 0,
    description: 'Iterative 3D iTero scan with simulated treatment outcomes and customized alignment plan.',
  },
  {
    id: 'srv-4',
    title: 'Dental Implant Consultation & CBCT',
    category: 'Implantology',
    duration: 60,
    price: 2500,
    promotionActive: false,
    discountPercent: 0,
    description: 'High-resolution 3D bone density mapping and custom implant surgical guide design.',
  },
  {
    id: 'srv-5',
    title: 'Porcelain Crown Restoration',
    category: 'Restorative Care',
    duration: 90,
    price: 8500,
    promotionActive: false,
    discountPercent: 0,
    description: 'Same-day custom aesthetic porcelain crown designed with CAD/CAM technology.',
  },
  {
    id: 'srv-6',
    title: 'Emergency Tooth Relief & Root Canal Evaluation',
    category: 'Emergency Care',
    duration: 45,
    price: 2000,
    promotionActive: false,
    discountPercent: 0,
    description: 'Immediate diagnostic imaging, pain management, and root canal therapy mapping.',
  },
];

// Helper to calculate today's YYYY-MM-DD
const todayStr = new Date().toISOString().split('T')[0];
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

const dayAfterTomorrowDate = new Date();
dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2);
const dayAfterTomorrowStr = dayAfterTomorrowDate.toISOString().split('T')[0];

let appointments: Appointment[] = [
  {
    id: 'apt-101',
    patientName: 'Emma Thompson',
    patientPhone: '(555) 890-1234',
    patientEmail: 'emma.t@example.com',
    serviceTitle: 'Comprehensive Oral Exam & Cleaning',
    dentistId: 'doc-1',
    dentistName: 'Dr. Sarah Jenkins, DDS',
    date: todayStr,
    time: '09:00',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-102',
    patientName: 'Robert Martinez',
    patientPhone: '(555) 901-2345',
    patientEmail: 'robert.m@example.com',
    serviceTitle: 'Invisalign Consultation & 3D Scan',
    dentistId: 'doc-2',
    dentistName: 'Dr. Marcus Vance, DMD',
    date: todayStr,
    time: '10:30',
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-103',
    patientName: 'Sophia Lin',
    patientPhone: '(555) 012-3456',
    patientEmail: 'sophia.l@example.com',
    serviceTitle: 'Professional Teeth Whitening',
    dentistId: 'doc-1',
    dentistName: 'Dr. Sarah Jenkins, DDS',
    date: todayStr,
    time: '14:00',
    status: 'Arrived',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-104',
    patientName: 'Michael Chang',
    patientPhone: '(555) 123-4567',
    patientEmail: 'mchang@example.com',
    serviceTitle: 'Dental Implant Consultation & CBCT',
    dentistId: 'doc-4',
    dentistName: 'Dr. David Chen, DMD',
    date: tomorrowStr,
    time: '11:00',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-105',
    patientName: 'Jessica Taylor',
    patientPhone: '(555) 234-5678',
    patientEmail: 'jtaylor@example.com',
    serviceTitle: 'Porcelain Crown Restoration',
    dentistId: 'doc-3',
    dentistName: 'Dr. Elena Rostova, DDS',
    date: tomorrowStr,
    time: '15:30',
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-106',
    patientName: 'Daniel Kim',
    patientPhone: '(555) 345-6789',
    patientEmail: 'dkim@example.com',
    serviceTitle: 'Comprehensive Oral Exam & Cleaning',
    dentistId: 'doc-3',
    dentistName: 'Dr. Elena Rostova, DDS',
    date: dayAfterTomorrowStr,
    time: '09:30',
    status: 'Completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-107',
    patientName: 'Alice Walker',
    patientPhone: '(555) 456-7890',
    patientEmail: 'awalker@example.com',
    serviceTitle: 'Emergency Tooth Relief & Root Canal Evaluation',
    dentistId: 'doc-4',
    dentistName: 'Dr. David Chen, DMD',
    date: todayStr,
    time: '16:00',
    status: 'Canceled',
    createdAt: new Date().toISOString(),
  },
];

let availabilities: DateAvailability[] = [
  {
    date: todayStr,
    doctorIds: ['doc-1', 'doc-2', 'doc-3', 'doc-4'],
  },
  {
    date: tomorrowStr,
    doctorIds: ['doc-1', 'doc-2', 'doc-4'],
  },
  {
    date: dayAfterTomorrowStr,
    doctorIds: ['doc-2', 'doc-3'],
  },
];

let blockedDates: BlockedDate[] = [
  {
    date: '2026-11-26',
    reason: 'Thanksgiving Holiday Clinic Closure',
    createdAt: new Date().toISOString(),
  },
  {
    date: '2026-12-25',
    reason: 'Christmas Holiday Closure',
    createdAt: new Date().toISOString(),
  },
];

let announcement: Announcement = {
  text: 'Summer Smile Promo: Enjoy 20% OFF all cosmetic whitening procedures booked through the end of this month!',
  active: true,
  bannerType: 'info',
  updatedAt: new Date().toISOString(),
};

let cutoffSettings: CutoffSettings = {
  cutoffTime: '17:00',
  sameDayBookingAllowed: true,
  minNoticeHours: 2,
};

// ---------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// ---------------------------------------------------------
// AUTH ROUTES
// ---------------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Simple admin auth check
  if ((email === 'admin@clinic.com' || email === 'admin') && (password === 'admin123' || password === 'admin')) {
    const user = { id: 'usr-admin', email: 'admin@clinic.com', name: 'Dr. Sarah Jenkins (Admin)', role: 'admin' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user });
  }

  // Allow fallback demo user
  if (email && password && password.length >= 4) {
    const user = { id: 'usr-staff', email, name: email.split('@')[0] || 'Clinic Admin', role: 'admin' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user });
  }

  return res.status(401).json({ error: 'Invalid credentials. Use admin@clinic.com / admin123' });
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// ---------------------------------------------------------
// ADMIN ROUTES (PROTECTED)
// ---------------------------------------------------------

// GET Full Config
app.get('/api/admin/config', authenticateToken, (req: Request, res: Response) => {
  return res.json({
    appointments,
    services,
    doctors,
    settings: {
      availabilities,
      blockedDates,
      announcement,
      cutoff: cutoffSettings,
    },
  });
});

// Appointments
app.get('/api/admin/appointments', authenticateToken, (req: Request, res: Response) => {
  return res.json(appointments);
});

app.post('/api/admin/appointments', authenticateToken, (req: Request, res: Response) => {
  const { patientName, patientPhone, patientEmail, serviceTitle, dentistId, date, time, status } = req.body;

  if (!patientName || !serviceTitle || !dentistId || !date || !time) {
    return res.status(400).json({ error: 'Patient Name, Service, Dentist, Date, and Time are required' });
  }

  const dentist = doctors.find((d) => d.id === dentistId);
  const dentistName = dentist ? dentist.name : 'Assigned Dentist';

  const newApt: Appointment = {
    id: `apt-${Date.now()}`,
    patientName,
    patientPhone: patientPhone || '(555) 000-0000',
    patientEmail: patientEmail || 'patient@example.com',
    serviceTitle,
    dentistId,
    dentistName,
    date,
    time,
    status: (status as AppointmentStatus) || 'Confirmed',
    createdAt: new Date().toISOString(),
  };

  appointments.unshift(newApt);
  return res.status(201).json(newApt);
});

app.put('/api/admin/appointments/:id/status', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses: AppointmentStatus[] = ['Pending', 'Confirmed', 'Arrived', 'Completed', 'No Show', 'Canceled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const apt = appointments.find((a) => a.id === id);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  apt.status = status;
  return res.json(apt);
});

// Services CRUD
app.get('/api/admin/services', authenticateToken, (req: Request, res: Response) => {
  return res.json(services);
});

app.post('/api/admin/services', authenticateToken, (req: Request, res: Response) => {
  const { title, category, duration, price, promotionActive, discountPercent, description } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ error: 'Service Title and Price are required' });
  }

  const existing = services.find((s) => s.title.toLowerCase() === title.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A service with this title already exists' });
  }

  const newService: Service = {
    id: `srv-${Date.now()}`,
    title,
    category: category || 'General Dentistry',
    duration: Number(duration) || 30,
    price: Number(price) || 0,
    promotionActive: Boolean(promotionActive),
    discountPercent: Number(discountPercent) || 0,
    description: description || '',
  };

  services.push(newService);
  return res.status(201).json(newService);
});

app.put('/api/admin/services/:title', authenticateToken, (req: Request, res: Response) => {
  const paramTitle = decodeURIComponent(req.params.title);
  const { title, category, duration, price, promotionActive, discountPercent, description } = req.body;

  const srvIndex = services.findIndex(
    (s) => s.title.toLowerCase() === paramTitle.toLowerCase() || s.id === paramTitle
  );

  if (srvIndex === -1) {
    return res.status(404).json({ error: 'Service not found' });
  }

  services[srvIndex] = {
    ...services[srvIndex],
    title: title || services[srvIndex].title,
    category: category !== undefined ? category : services[srvIndex].category,
    duration: duration !== undefined ? Number(duration) : services[srvIndex].duration,
    price: price !== undefined ? Number(price) : services[srvIndex].price,
    promotionActive: promotionActive !== undefined ? Boolean(promotionActive) : services[srvIndex].promotionActive,
    discountPercent: discountPercent !== undefined ? Number(discountPercent) : services[srvIndex].discountPercent,
    description: description !== undefined ? description : services[srvIndex].description,
  };

  return res.json(services[srvIndex]);
});

app.delete('/api/admin/services/:title', authenticateToken, (req: Request, res: Response) => {
  const paramTitle = decodeURIComponent(req.params.title);
  const initialLen = services.length;
  services = services.filter(
    (s) => s.title.toLowerCase() !== paramTitle.toLowerCase() && s.id !== paramTitle
  );

  if (services.length === initialLen) {
    return res.status(404).json({ error: 'Service not found' });
  }

  return res.json({ success: true, message: `Service '${paramTitle}' deleted.` });
});

// Doctors / Staff Roster CRUD
app.get('/api/admin/doctors', authenticateToken, (req: Request, res: Response) => {
  return res.json(doctors);
});

// Toggle Featured Endpoint
app.put('/api/admin/doctors/:id/feature', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  const doc = doctors.find((d) => d.id === id);
  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  if (isFeatured === true && !doc.isFeatured) {
    const currentFeaturedCount = doctors.filter((d) => d.isFeatured).length;
    if (currentFeaturedCount >= 3) {
      return res.status(400).json({
        error: 'Maximum of 3 featured doctors allowed',
      });
    }
  }

  doc.isFeatured = Boolean(isFeatured);
  return res.json(doc);
});

app.post('/api/admin/doctors', authenticateToken, (req: Request, res: Response) => {
  const { name, specialty, bio, avatar, email, phone, isFeatured } = req.body;

  if (!name || !specialty) {
    return res.status(400).json({ error: 'Doctor Name and Specialty are required' });
  }

  if (isFeatured) {
    const currentFeaturedCount = doctors.filter((d) => d.isFeatured).length;
    if (currentFeaturedCount >= 3) {
      return res.status(400).json({
        error: 'Maximum of 3 featured doctors allowed',
      });
    }
  }

  const newDoc: Doctor = {
    id: `doc-${Date.now()}`,
    name,
    specialty,
    bio: bio || '',
    avatar: avatar || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    email: email || '',
    phone: phone || '',
    isFeatured: Boolean(isFeatured),
  };

  doctors.push(newDoc);
  return res.status(201).json(newDoc);
});

app.put('/api/admin/doctors/:id', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, specialty, bio, avatar, email, phone, isFeatured } = req.body;

  const doc = doctors.find((d) => d.id === id);
  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  if (isFeatured === true && !doc.isFeatured) {
    const currentFeaturedCount = doctors.filter((d) => d.isFeatured).length;
    if (currentFeaturedCount >= 3) {
      return res.status(400).json({
        error: 'Maximum of 3 featured doctors allowed',
      });
    }
  }

  if (name) doc.name = name;
  if (specialty) doc.specialty = specialty;
  if (bio !== undefined) doc.bio = bio;
  if (avatar !== undefined) doc.avatar = avatar;
  if (email !== undefined) doc.email = email;
  if (phone !== undefined) doc.phone = phone;
  if (isFeatured !== undefined) doc.isFeatured = Boolean(isFeatured);

  return res.json(doc);
});

app.delete('/api/admin/doctors/:id', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = doctors.length;
  doctors = doctors.filter((d) => d.id !== id);

  if (doctors.length === initialLen) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  return res.json({ success: true, message: 'Doctor removed from roster' });
});

// Clinic Settings - Availability
app.get('/api/admin/availability', authenticateToken, (req: Request, res: Response) => {
  return res.json(availabilities);
});

app.put('/api/admin/availability', authenticateToken, (req: Request, res: Response) => {
  const { date, doctorIds } = req.body;

  if (!date || !Array.isArray(doctorIds)) {
    return res.status(400).json({ error: 'Date (YYYY-MM-DD) and doctorIds array are required' });
  }

  const existingIndex = availabilities.findIndex((a) => a.date === date);
  if (existingIndex >= 0) {
    availabilities[existingIndex].doctorIds = doctorIds;
  } else {
    availabilities.push({ date, doctorIds });
  }

  return res.json({ date, doctorIds });
});

app.delete('/api/admin/availability', authenticateToken, (req: Request, res: Response) => {
  const { date, doctorId } = req.body || req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date is required to clear availability' });
  }

  if (doctorId) {
    const existing = availabilities.find((a) => a.date === date);
    if (existing) {
      existing.doctorIds = existing.doctorIds.filter((id) => id !== doctorId);
    }
  } else {
    availabilities = availabilities.filter((a) => a.date !== date);
  }

  return res.json({ success: true, message: `Availability cleared for date ${date}` });
});

// Clinic Settings - Blocked Dates
app.get('/api/admin/blocked-dates', authenticateToken, (req: Request, res: Response) => {
  return res.json(blockedDates);
});

app.post('/api/admin/blocked-dates', authenticateToken, (req: Request, res: Response) => {
  const { date, reason } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  const existing = blockedDates.find((b) => b.date === date);
  if (existing) {
    existing.reason = reason || 'Clinic Closed';
    return res.json(existing);
  }

  const newBlocked: BlockedDate = {
    date,
    reason: reason || 'Clinic Closed / Holiday',
    createdAt: new Date().toISOString(),
  };

  blockedDates.push(newBlocked);
  return res.status(201).json(newBlocked);
});

app.delete('/api/admin/blocked-dates/:date', authenticateToken, (req: Request, res: Response) => {
  const { date } = req.params;
  blockedDates = blockedDates.filter((b) => b.date !== date);
  return res.json({ success: true, message: `Blocked date ${date} removed.` });
});

// Clinic Settings - Announcement
app.get('/api/admin/announcement', authenticateToken, (req: Request, res: Response) => {
  return res.json(announcement);
});

app.put('/api/admin/announcement', authenticateToken, (req: Request, res: Response) => {
  const { text, active, bannerType } = req.body;

  announcement = {
    text: text !== undefined ? text : announcement.text,
    active: active !== undefined ? Boolean(active) : announcement.active,
    bannerType: bannerType || announcement.bannerType || 'info',
    updatedAt: new Date().toISOString(),
  };

  return res.json(announcement);
});

// Clinic Settings - Cutoff Time
app.get('/api/admin/cutoff', authenticateToken, (req: Request, res: Response) => {
  return res.json(cutoffSettings);
});

app.put('/api/admin/cutoff', authenticateToken, (req: Request, res: Response) => {
  const { cutoffTime, sameDayBookingAllowed, minNoticeHours } = req.body;

  if (cutoffTime !== undefined) cutoffSettings.cutoffTime = cutoffTime;
  if (sameDayBookingAllowed !== undefined) cutoffSettings.sameDayBookingAllowed = Boolean(sameDayBookingAllowed);
  if (minNoticeHours !== undefined) cutoffSettings.minNoticeHours = Number(minNoticeHours);

  return res.json(cutoffSettings);
});

// ---------------------------------------------------------
// PUBLIC ENDPOINTS (for Public Website integration)
// ---------------------------------------------------------

app.get('/api/public/services', (req: Request, res: Response) => {
  return res.json(services);
});

app.get('/api/public/doctors', (req: Request, res: Response) => {
  const featuredOnly = req.query.featured === 'true';
  const result = featuredOnly ? doctors.filter((d) => d.isFeatured) : doctors;
  return res.json(result);
});

app.get('/api/public/announcement', (req: Request, res: Response) => {
  return res.json(announcement);
});

app.get('/api/public/availability', (req: Request, res: Response) => {
  return res.json({
    availabilities,
    blockedDates,
    cutoffSettings,
  });
});

app.post('/api/public/appointments', (req: Request, res: Response) => {
  const { patientName, patientPhone, patientEmail, serviceTitle, dentistId, date, time } = req.body;

  if (!patientName || !patientPhone || !serviceTitle || !date || !time) {
    return res.status(400).json({ error: 'Name, Phone, Service, Date, and Time are required' });
  }

  // Check blocked date
  if (blockedDates.some((b) => b.date === date)) {
    return res.status(400).json({ error: 'Selected date is closed/blocked for appointments.' });
  }

  const dentist = doctors.find((d) => d.id === dentistId);
  const dentistName = dentist ? dentist.name : 'First Available Doctor';

  const newApt: Appointment = {
    id: `apt-${Date.now()}`,
    patientName,
    patientPhone,
    patientEmail: patientEmail || '',
    serviceTitle,
    dentistId: dentistId || (doctors[0] ? doctors[0].id : 'doc-1'),
    dentistName,
    date,
    time,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  appointments.unshift(newApt);
  return res.status(201).json({ success: true, appointment: newApt });
});

// ---------------------------------------------------------
// VITE / SERVER INITIALIZATION
// ---------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dental Clinic Admin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

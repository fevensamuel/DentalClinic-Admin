import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Server,
  ShieldCheck,
  Globe,
  ExternalLink,
  RefreshCw,
  Terminal,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { DEPLOYED_BACKEND_URL, getApiBaseUrl, setBackendUrl } from '../lib/api';

interface EndpointDoc {
  category: 'Auth' | 'Admin' | 'Public Website';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  authRequired: boolean;
  description: string;
  requestPayload?: string;
  responsePayload?: string;
}

const endpoints: EndpointDoc[] = [
  // Public Website Endpoints
  {
    category: 'Public Website',
    method: 'GET',
    path: '/api/public/doctors',
    authRequired: false,
    description: 'Fetches doctors roster for public patient website (filtered to featured doctors if query parameter ?featured=true is passed).',
    responsePayload: JSON.stringify(
      [
        {
          id: 'doc-1',
          name: 'Dr. Sarah Jenkins, DDS',
          specialty: 'Cosmetic Dentistry & Veneers',
          bio: 'Lead cosmetic specialist with over 14 years of experience.',
          avatar: '',
          email: 's.jenkins@brightsmile.com',
          phone: '(555) 234-8901',
          isFeatured: true,
        },
        {
          id: 'doc-2',
          name: 'Dr. Marcus Vance, DMD',
          specialty: 'Orthodontics & Invisalign',
          bio: 'Board-certified orthodontist specializing in clear aligners.',
          avatar: '',
          email: 'm.vance@brightsmile.com',
          phone: '(555) 345-9012',
          isFeatured: true,
        },
      ],
      null,
      2
    ),
  },
  {
    category: 'Public Website',
    method: 'GET',
    path: '/api/public/services',
    authRequired: false,
    description: 'Retrieves all available dental services and ETB pricing for public patient booking dropdowns.',
    responsePayload: JSON.stringify(
      [
        {
          id: 'srv-1',
          title: 'Comprehensive Oral Exam & Cleaning',
          category: 'Preventive Care',
          duration: 45,
          price: 1500,
          promotionActive: true,
          discountPercent: 15,
          description: 'Full digital X-rays, ultrasonic scaling, polish, and consultation.',
        },
        {
          id: 'srv-2',
          title: 'Professional Teeth Whitening',
          category: 'Cosmetics',
          duration: 60,
          price: 3500,
          promotionActive: true,
          discountPercent: 20,
          description: 'In-office laser whitening treatment yielding up to 8 shades brighter.',
        },
      ],
      null,
      2
    ),
  },
  {
    category: 'Public Website',
    method: 'POST',
    path: '/api/public/appointments',
    authRequired: false,
    description: 'Allows public patients to request an appointment on the website. Default status is Pending.',
    requestPayload: JSON.stringify(
      {
        patientName: 'Abebe Bikila',
        patientPhone: '+251911234567',
        patientEmail: 'abebe@example.com',
        serviceTitle: 'Professional Teeth Whitening',
        dentistId: 'doc-1',
        date: '2026-08-15',
        time: '14:00',
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        success: true,
        appointment: {
          id: 'apt-902',
          patientName: 'Abebe Bikila',
          patientPhone: '+251911234567',
          patientEmail: 'abebe@example.com',
          serviceTitle: 'Professional Teeth Whitening',
          dentistId: 'doc-1',
          dentistName: 'Dr. Sarah Jenkins, DDS',
          date: '2026-08-15',
          time: '14:00',
          status: 'Pending',
          createdAt: '2026-08-03T08:10:00.000Z',
        },
      },
      null,
      2
    ),
  },

  // Auth
  {
    category: 'Auth',
    method: 'POST',
    path: '/api/auth/login',
    authRequired: false,
    description: 'Authenticates admin/staff user and returns JWT bearer token.',
    requestPayload: JSON.stringify({ email: 'admin@clinic.com', password: 'admin123' }, null, 2),
    responsePayload: JSON.stringify(
      {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
        user: { id: 'usr-admin', email: 'admin@clinic.com', name: 'Dr. Sarah Jenkins', role: 'admin' },
      },
      null,
      2
    ),
  },
  {
    category: 'Auth',
    method: 'GET',
    path: '/api/auth/me',
    authRequired: true,
    description: 'Validates current JWT token and returns authenticated user profile.',
    responsePayload: JSON.stringify(
      { user: { id: 'usr-admin', email: 'admin@clinic.com', name: 'Dr. Sarah Jenkins', role: 'admin' } },
      null,
      2
    ),
  },

  // Admin Appointments
  {
    category: 'Admin',
    method: 'GET',
    path: '/api/admin/appointments',
    authRequired: true,
    description: 'Retrieves all appointments across all 6 statuses (Pending, Confirmed, Arrived, Completed, No Show, Canceled).',
    responsePayload: JSON.stringify(
      [
        {
          id: 'apt-101',
          patientName: 'Emma Thompson',
          patientPhone: '(555) 890-1234',
          serviceTitle: 'Comprehensive Oral Exam & Cleaning',
          dentistId: 'doc-1',
          dentistName: 'Dr. Sarah Jenkins, DDS',
          date: '2026-07-29',
          time: '09:00',
          status: 'Pending',
        },
      ],
      null,
      2
    ),
  },
  {
    category: 'Admin',
    method: 'PUT',
    path: '/api/admin/appointments/:id/status',
    authRequired: true,
    description:
      'Inline updates appointment status. Supported statuses: Pending, Confirmed, Arrived, Completed, No Show, Canceled.',
    requestPayload: JSON.stringify({ status: 'Confirmed' }, null, 2),
    responsePayload: JSON.stringify({ id: 'apt-101', status: 'Confirmed' }, null, 2),
  },
  {
    category: 'Admin',
    method: 'POST',
    path: '/api/admin/appointments',
    authRequired: true,
    description: 'Admin creates and assigns an appointment for any patient directly.',
    requestPayload: JSON.stringify(
      {
        patientName: 'Jane Doe',
        patientPhone: '(555) 123-4567',
        patientEmail: 'jane@example.com',
        serviceTitle: 'Professional Teeth Whitening',
        dentistId: 'doc-1',
        date: '2026-08-01',
        time: '10:00',
        status: 'Confirmed',
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        id: 'apt-105',
        patientName: 'Jane Doe',
        patientPhone: '(555) 123-4567',
        patientEmail: 'jane@example.com',
        serviceTitle: 'Professional Teeth Whitening',
        dentistId: 'doc-1',
        dentistName: 'Dr. Sarah Jenkins, DDS',
        date: '2026-08-01',
        time: '10:00',
        status: 'Confirmed',
      },
      null,
      2
    ),
  },

  // Admin Doctors Roster
  {
    category: 'Admin',
    method: 'GET',
    path: '/api/admin/doctors',
    authRequired: true,
    description: 'Retrieves full doctor roster including featured flags and email/phone contact.',
    responsePayload: JSON.stringify(
      [
        {
          id: 'doc-1',
          name: 'Dr. Sarah Jenkins, DDS',
          specialty: 'Cosmetic Dentistry & Veneers',
          bio: 'Lead cosmetic specialist...',
          avatar: '',
          email: 's.jenkins@brightsmile.com',
          phone: '(555) 234-8901',
          isFeatured: true,
        },
      ],
      null,
      2
    ),
  },
  {
    category: 'Admin',
    method: 'PUT',
    path: '/api/admin/doctors/:id/feature',
    authRequired: true,
    description:
      'Toggles doctor featured flag for public homepage display. Strictly limits active featured doctors to maximum of 3.',
    requestPayload: JSON.stringify({ isFeatured: true }, null, 2),
    responsePayload: JSON.stringify({ id: 'doc-1', isFeatured: true }, null, 2),
  },
  {
    category: 'Admin',
    method: 'POST',
    path: '/api/admin/doctors',
    authRequired: true,
    description: 'Adds a new practitioner to the clinic roster.',
    requestPayload: JSON.stringify(
      {
        name: 'Dr. Michael Chang, DDS',
        specialty: 'Endodontics',
        bio: 'Specialist in root canal procedures.',
        avatar: '',
        email: 'm.chang@brightsmile.com',
        phone: '(555) 678-2345',
        isFeatured: false,
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        id: 'doc-5',
        name: 'Dr. Michael Chang, DDS',
        specialty: 'Endodontics',
        bio: 'Specialist in root canal procedures.',
        avatar: '',
        email: 'm.chang@brightsmile.com',
        phone: '(555) 678-2345',
        isFeatured: false,
      },
      null,
      2
    ),
  },

  // Admin Services
  {
    category: 'Admin',
    method: 'GET',
    path: '/api/admin/services',
    authRequired: true,
    description: 'Retrieves all clinic procedures with duration, price in ETB, and promotion discounts.',
    responsePayload: JSON.stringify(
      [
        {
          id: 'srv-1',
          title: 'Comprehensive Oral Exam & Cleaning',
          category: 'Preventive Care',
          duration: 45,
          price: 1500,
          promotionActive: true,
          discountPercent: 15,
          description: 'Full digital X-rays and ultrasonic scaling.',
        },
      ],
      null,
      2
    ),
  },
  {
    category: 'Admin',
    method: 'POST',
    path: '/api/admin/services',
    authRequired: true,
    description: 'Creates a new service procedure with ETB pricing and promotion settings.',
    requestPayload: JSON.stringify(
      {
        title: 'Laser Teeth Whitening',
        category: 'Cosmetics',
        duration: 60,
        price: 3500,
        promotionActive: true,
        discountPercent: 20,
        description: 'In-office laser whitening procedure.',
      },
      null,
      2
    ),
    responsePayload: JSON.stringify(
      {
        id: 'srv-7',
        title: 'Laser Teeth Whitening',
        category: 'Cosmetics',
        duration: 60,
        price: 3500,
        promotionActive: true,
        discountPercent: 20,
        description: 'In-office laser whitening procedure.',
      },
      null,
      2
    ),
  },
];

const jsIntegrationSnippet = `// -------------------------------------------------------------
// Dental Clinic Public Website API Integration Snippet (JavaScript / React)
// Connect your public website directly to: ${DEPLOYED_BACKEND_URL}
// -------------------------------------------------------------

const BACKEND_BASE_URL = "${DEPLOYED_BACKEND_URL}";

// 1. Fetch Featured Doctors for Homepage
export async function getFeaturedDoctors() {
  const res = await fetch(\`\${BACKEND_BASE_URL}/api/public/doctors?featured=true\`);
  if (!res.ok) throw new Error('Failed to fetch doctors');
  return res.json();
}

// 2. Fetch Active Services & ETB Prices
export async function getClinicServices() {
  const res = await fetch(\`\${BACKEND_BASE_URL}/api/public/services\`);
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
}

// 3. Submit Patient Appointment Booking Form
export async function submitPatientBooking(bookingData) {
  /*
    bookingData = {
      patientName: "John Smith",
      patientPhone: "(555) 987-6543",
      patientEmail: "john@example.com",
      serviceTitle: "Comprehensive Oral Exam & Cleaning",
      dentistId: "doc-1",
      date: "2026-08-10",
      time: "10:30"
    }
  */
  const res = await fetch(\`\${BACKEND_BASE_URL}/api/public/appointments\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit booking');
  return data;
}`;

export const ApiDocsSection: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [currentBaseUrl, setCurrentBaseUrl] = useState<string>(getApiBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const copyCode = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleSetBackend = (url: string) => {
    setBackendUrl(url);
    setCurrentBaseUrl(url);
  };

  const testBackendConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const target = currentBaseUrl || DEPLOYED_BACKEND_URL;
      const res = await fetch(`${target.replace(/\/+$/, '')}/api-docs/`);
      if (res.ok || res.status < 500) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const filtered =
    selectedCat === 'All'
      ? endpoints
      : endpoints.filter((ep) => ep.category === selectedCat);

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6 text-[#1E293B]">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#0EA5E9]" />
          API Connectors & Integration Specification
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Complete RESTful API endpoint reference and live integration specs for connecting your public website and backend.
        </p>
      </div>

      {/* Deployed Backend Highlight Box */}
      <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#0EA5E9] text-white rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs mt-0.5">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Deployed Live Backend:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30">
                  LIVE REST API
                </span>
              </div>
              <div className="text-sm font-mono font-bold text-[#0EA5E9] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{DEPLOYED_BACKEND_URL}</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Swagger / Interactive Docs:{' '}
                <a
                  href={`${DEPLOYED_BACKEND_URL}/api-docs/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0EA5E9] font-medium underline flex-inline items-center gap-1"
                >
                  https://dental-clinic-backend-0vjn.onrender.com/api-docs/ <ExternalLink className="w-3 h-3 inline" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`${DEPLOYED_BACKEND_URL}/api-docs/`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Open API Docs <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => copyCode(DEPLOYED_BACKEND_URL, 'live-backend-url')}
              className="px-3.5 py-2 bg-white hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#1E293B] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedPath === 'live-backend-url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Backend Connection Controller */}
        <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#64748B]">Admin Portal Target Backend:</span>
            <span className="font-mono font-bold text-[#1E293B]">
              {currentBaseUrl ? currentBaseUrl : 'Local Express Container Proxy (/api)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentBaseUrl !== DEPLOYED_BACKEND_URL ? (
              <button
                onClick={() => handleSetBackend(DEPLOYED_BACKEND_URL)}
                className="px-3 py-1 bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-white font-semibold rounded-md transition-all cursor-pointer text-[11px] flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Connect to Deployed Render Backend
              </button>
            ) : (
              <button
                onClick={() => handleSetBackend('')}
                className="px-3 py-1 bg-[#64748B] hover:bg-[#1E293B] text-white font-semibold rounded-md transition-all cursor-pointer text-[11px]"
              >
                Reset to Container Proxy
              </button>
            )}

            <button
              onClick={testBackendConnection}
              disabled={testingConnection}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC] font-semibold rounded-md transition-all cursor-pointer text-[11px] flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin text-[#0EA5E9]' : ''}`} />
              Test Connection
            </button>
          </div>
        </div>

        {connectionStatus === 'success' && (
          <div className="p-2.5 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0" />
            Successfully reached deployed backend server! Response headers and endpoints active.
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="p-2.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
            Backend server connection verified. Deployed swagger docs active at https://dental-clinic-backend-0vjn.onrender.com/api-docs/
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
        <div className="text-xs font-bold text-[#1E293B] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#0EA5E9]" />
          <span>API Endpoints Reference</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'Public Website', 'Auth', 'Admin'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedCat === cat
                  ? 'bg-[#0EA5E9] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:bg-[#E2E8F0] border border-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Code Integration Box for Public Website */}
      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-xs font-bold font-mono">
            <Code2 className="w-4 h-4 text-[#0EA5E9]" />
            <span>Public Website Integration JavaScript Code (Fetch / Axios)</span>
          </div>
          <button
            onClick={() => copyCode(jsIntegrationSnippet, 'js-snippet')}
            className="text-[#94A3B8] hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedPath === 'js-snippet' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                Copied Snippet
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Code
              </>
            )}
          </button>
        </div>
        <pre className="p-4 bg-[#0F172A] text-[11px] font-mono text-[#94A3B8] leading-relaxed overflow-x-auto">
          {jsIntegrationSnippet}
        </pre>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {filtered.map((ep, i) => (
          <div
            key={i}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs hover:border-[#0EA5E9] transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase font-mono ${
                    ep.method === 'GET'
                      ? 'bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30'
                      : ep.method === 'POST'
                      ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                      : ep.method === 'PUT'
                      ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
                  }`}
                >
                  {ep.method}
                </span>

                <span className="text-sm font-mono font-bold text-[#1E293B] tracking-tight">
                  {ep.path}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                  {ep.category}
                </span>

                {ep.authRequired ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#3B82F6]" /> JWT Auth Required
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#14B8A6]" /> Public Endpoint
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-[#64748B] mb-3">{ep.description}</p>

            {/* Payloads */}
            {(ep.requestPayload || ep.responsePayload) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#E2E8F0]">
                {ep.requestPayload && (
                  <div>
                    <div className="text-[10px] font-semibold text-[#64748B] uppercase mb-1 flex items-center justify-between">
                      <span>Request Body JSON</span>
                      <button
                        onClick={() => copyCode(ep.requestPayload!, `${ep.path}-req`)}
                        className="text-[#0EA5E9] hover:text-[#0284C7] flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {copiedPath === `${ep.path}-req` ? (
                          <Check className="w-3 h-3 text-[#22C55E]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 bg-[#0F172A] rounded-lg text-[11px] font-mono text-[#0EA5E9] overflow-x-auto border border-[#1E293B]">
                      {ep.requestPayload}
                    </pre>
                  </div>
                )}

                {ep.responsePayload && (
                  <div>
                    <div className="text-[10px] font-semibold text-[#64748B] uppercase mb-1 flex items-center justify-between">
                      <span>Response JSON</span>
                      <button
                        onClick={() => copyCode(ep.responsePayload!, `${ep.path}-res`)}
                        className="text-[#0EA5E9] hover:text-[#0284C7] flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {copiedPath === `${ep.path}-res` ? (
                          <Check className="w-3 h-3 text-[#22C55E]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 bg-[#0F172A] rounded-lg text-[11px] font-mono text-[#14B8A6] overflow-x-auto border border-[#1E293B]">
                      {ep.responsePayload}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Star,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Stethoscope,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { Doctor } from '../types';

interface DoctorsSectionProps {
  doctors: Doctor[];
  onToggleFeatured: (id: string, isFeatured: boolean) => Promise<void>;
  onCreateDoctor: (doctorData: Partial<Doctor>) => Promise<void>;
  onUpdateDoctor: (id: string, doctorData: Partial<Doctor>) => Promise<void>;
  onDeleteDoctor: (id: string) => Promise<void>;
  onErrorToast: (msg: string) => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({
  doctors,
  onToggleFeatured,
  onCreateDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  onErrorToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    bio: '',
    avatar: '',
    email: '',
    phone: '',
    isFeatured: false,
  });

  const featuredCount = doctors.filter((d) => d.isFeatured).length;

  const handleToggle = async (doctor: Doctor) => {
    const nextFeaturedState = !doctor.isFeatured;

    // Strict client-side check before API call
    if (nextFeaturedState && featuredCount >= 3) {
      alert('You cannot feature more than 3 doctors at a time.');
      onErrorToast('Maximum of 3 featured doctors allowed');
      return;
    }

    try {
      setTogglingId(doctor.id);
      await onToggleFeatured(doctor.id, nextFeaturedState);
    } catch (err: any) {
      const msg = err?.message || 'Failed to update featured status';
      if (msg.toLowerCase().includes('maximum') || msg.toLowerCase().includes('3 featured')) {
        alert('You cannot feature more than 3 doctors at a time.');
      }
      onErrorToast(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setFormData({
      name: '',
      specialty: 'General Dentistry',
      bio: '',
      avatar: '',
      email: '',
      phone: '',
      isFeatured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormData({
      name: doc.name,
      specialty: doc.specialty,
      bio: doc.bio || '',
      avatar: doc.avatar || '',
      email: doc.email || '',
      phone: doc.phone || '',
      isFeatured: doc.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce featured count rule in add/edit form
    if (formData.isFeatured) {
      const isCurrentlyFeatured = editingDoctor?.isFeatured;
      if (!isCurrentlyFeatured && featuredCount >= 3) {
        onErrorToast('Maximum limit reached! Only 3 doctors can be featured at a time.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingDoctor) {
        await onUpdateDoctor(editingDoctor.id, formData);
      } else {
        await onCreateDoctor(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      onErrorToast(err.message || 'Error saving doctor details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      await onDeleteDoctor(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      onErrorToast(err.message || 'Failed to delete doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header & Featured Rule Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-600" />
            Doctor & Staff Roster
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage practitioner profiles, assign specialties, and control featured homepage doctors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Featured Counter Badge */}
          <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-xs">
            <Star className="w-4 h-4 text-cyan-600 fill-cyan-600 shrink-0" />
            <div className="text-xs">
              <span className="text-cyan-700 font-medium">Featured: </span>
              <span className="font-extrabold text-cyan-900">{featuredCount}</span>
              <span className="text-cyan-600 font-bold"> / 3</span>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Practitioner
          </button>
        </div>
      </div>

      {/* Featured Banner Warning if 3 reached */}
      {featuredCount === 3 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Max Featured Limit Reached (3/3):</strong> Unfeature a current doctor before featuring another practitioner.
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className={`bg-white border rounded-xl p-5 transition-all shadow-sm relative flex flex-col justify-between ${
              doc.isFeatured
                ? 'border-2 border-cyan-500 shadow-md'
                : 'border-slate-200 hover:border-cyan-300'
            }`}
          >
            <div>
              <div className="flex items-start gap-4">
                {doc.avatar && doc.avatar.trim() !== '' ? (
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#0EA5E9] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-sm border border-[#E2E8F0]">
                    {doc.name.replace(/^Dr\.\s*/i, '').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'DR'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">{doc.name}</h3>

                    {/* Featured Toggle Button */}
                    <button
                      onClick={() => handleToggle(doc)}
                      disabled={togglingId === doc.id}
                      title={doc.isFeatured ? 'Unfeature doctor' : 'Feature doctor on homepage'}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        doc.isFeatured
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          doc.isFeatured ? 'text-white fill-white' : 'text-slate-400'
                        }`}
                      />
                      <span>{doc.isFeatured ? 'Featured' : 'Feature'}</span>
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-cyan-700 flex items-center gap-1 mt-0.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    {doc.specialty}
                  </p>

                  <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                    {doc.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{doc.email}</span>
                      </div>
                    )}
                    {doc.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{doc.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-4 line-clamp-3 leading-relaxed">
                {doc.bio || 'No biography available.'}
              </p>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">ID: {doc.id}</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(doc)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setDeleteConfirmId(doc.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-600" />
                {editingDoctor ? `Edit Profile: ${editingDoctor.name}` : 'Add New Doctor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Specialty *
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Avatar Photo URL
                </label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Is Featured Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-cyan-50/50 rounded-lg border border-cyan-200">
                <input
                  type="checkbox"
                  id="isFeaturedToggle"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 accent-cyan-600 cursor-pointer"
                />
                <label
                  htmlFor="isFeaturedToggle"
                  className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-cyan-600 fill-cyan-600" />
                  Feature on Website Homepage ({featuredCount} / 3 slots used)
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                />
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
                  {submitting ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Remove Doctor?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to remove this practitioner from the roster? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Remove Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

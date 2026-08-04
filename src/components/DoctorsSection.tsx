import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Star,
  X,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { Doctor } from '../types';

interface DoctorsSectionProps {
  doctors: Doctor[];
  onToggleFeatured: (id: string, isFeatured: boolean) => Promise<void>;
  onCreateDoctor: (doctorData: FormData) => Promise<void>;
  onUpdateDoctor: (id: string, doctorData: FormData) => Promise<void>;
  onDeleteDoctor: (id: string) => Promise<void>;
  onErrorToast: (msg: string) => void;
  onRefresh?: () => Promise<void>;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({
  doctors,
  onToggleFeatured,
  onCreateDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  onErrorToast,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',        // ✅ Changed from 'specialty' to 'title'
    bio: '',
    email: '',
    phone: '',
    isFeatured: false,
  });

  // --- Image Handling ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onErrorToast('Please select a valid image file (JPEG, PNG, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onErrorToast('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Modal open/close ---
  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setFormData({
      name: '',
      title: '',
      bio: '',
      email: '',
      phone: '',
      isFeatured: false,
    });
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      title: doctor.title || doctor.specialty || '',  // ✅ Use title or fallback to specialty
      bio: doctor.bio || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      isFeatured: doctor.isFeatured || false,
    });
    if (doctor.imageUrl) {
      setImagePreview(doctor.imageUrl);
    } else {
      setImagePreview('');
    }
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsModalOpen(true);
  };

  // --- Submit with FormData ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('title', formData.title || '');  // ✅ Send as 'title'
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('email', formData.email || '');   // ✅ Send email
      formDataToSend.append('phone', formData.phone || '');   // ✅ Send phone
      formDataToSend.append('isFeatured', String(formData.isFeatured));

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingDoctor) {
        await onUpdateDoctor(editingDoctor.id, formDataToSend);
      } else {
        await onCreateDoctor(formDataToSend);
      }
      setIsModalOpen(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      onErrorToast('Failed to save doctor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Toggle Featured ---
  const handleToggleFeatured = async (doctor: Doctor) => {
    if (!doctor || !doctor.id) {
      onErrorToast('Cannot toggle featured: Doctor ID is missing');
      return;
    }
    const newFeatured = !doctor.isFeatured;
    const featuredCount = doctors.filter(d => d && d.isFeatured).length;
    if (newFeatured && featuredCount >= 3 && !doctor.isFeatured) {
      onErrorToast('Maximum of 3 featured doctors allowed');
      return;
    }
    try {
      await onToggleFeatured(doctor.id, newFeatured);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      onErrorToast('Failed to update featured status');
    }
  };

  // --- Delete ---
  const handleDelete = async (id: string) => {
    if (!id) {
      onErrorToast('Cannot delete doctor: ID is missing');
      return;
    }
    setSubmitting(true);
    try {
      await onDeleteDoctor(id);
      setDeleteConfirmId(null);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      onErrorToast('Failed to delete doctor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Safe filtering ---
  const filteredDoctors = doctors.filter((doc) => {
    if (!doc) return false;
    const searchLower = searchTerm.toLowerCase();
    const name = doc.name?.toLowerCase() || '';
    const title = (doc.title || doc.specialty || '')?.toLowerCase() || '';
    const email = doc.email?.toLowerCase() || '';
    const phone = doc.phone || '';
    return name.includes(searchLower) ||
      title.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchTerm);
  });

  const featuredCount = doctors.filter(d => d && d.isFeatured).length;

  const getImageUrl = (doctor: Doctor) => {
    if (doctor.imageUrl) return doctor.imageUrl;
    return '';
  };

  // ✅ Display title with fallback to specialty
  const getDisplayTitle = (doctor: Doctor) => {
    return doctor.title || doctor.specialty || 'Specialist';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" />
            Doctors Roster
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clinical staff, specialists, and featured doctor profiles.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">
              Featured: <span className="font-bold text-amber-600">{featuredCount} / 3</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Doctor
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="Search by name, specialty, email..."
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {filteredDoctors.length} doctor(s)
          </span>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => {
          if (!doc || !doc.id) return null;
          return (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center hover:border-cyan-300 transition-all shadow-sm relative group"
            >
              {doc.isFeatured && (
                <div className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Featured
                </div>
              )}

              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 mb-4 flex items-center justify-center overflow-hidden">
                {getImageUrl(doc) ? (
                  <img
                    src={getImageUrl(doc)}
                    alt={doc.name || 'Doctor'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900">{doc.name || 'Unnamed Doctor'}</h3>
              <p className="text-xs text-cyan-600 font-medium">{getDisplayTitle(doc)}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.bio || 'No bio provided'}</p>

              <div className="w-full mt-3 pt-3 border-t border-slate-100 flex flex-col items-start text-xs text-slate-500">
                {doc.email && <span className="truncate w-full">✉️ {doc.email}</span>}
                {doc.phone && <span className="truncate w-full">📞 {doc.phone}</span>}
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 w-full pt-3 border-t border-slate-100 flex-wrap">
                <button
                  onClick={() => handleOpenEdit(doc)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleFeatured(doc)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                    doc.isFeatured
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                      : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${doc.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                  {doc.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => {
                    if (!doc.id) {
                      onErrorToast('Cannot delete: Doctor ID is missing');
                      return;
                    }
                    setDeleteConfirmId(doc.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-600" />
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Image Upload */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block w-full">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer text-xs font-medium transition-colors">
                        <Upload className="w-4 h-4" />
                        {editingDoctor ? 'Change Image' : 'Upload Image'}
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">
                      JPEG, PNG, GIF. Max 5MB
                    </p>
                    {imagePreview && editingDoctor && !imageFile && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Current image shown. Upload a new one to replace it.
                      </p>
                    )}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="text-xs text-rose-500 hover:text-rose-700 mt-1"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Dr. Sarah Jenkins"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Title / Specialty *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Orthodontist, Family Dentist"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Describe the doctor's experience and specialties..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. doctor@clinic.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. +251 911 000 000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 accent-cyan-600 cursor-pointer"
                />
                <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  Featured Doctor ({featuredCount}/3)
                </label>
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
                  {submitting ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-xl max-w-sm w-full p-6 shadow-xl relative">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Delete Doctor?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              This action cannot be undone. The doctor will be permanently removed from the roster.
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
                {submitting ? 'Deleting...' : 'Delete Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
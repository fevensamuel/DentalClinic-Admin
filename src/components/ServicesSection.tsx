import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Clock,
  Percent,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Service } from '../types';

interface ServicesSectionProps {
  services: Service[];
  onCreateService: (serviceData: Partial<Service>) => Promise<void>;
  onUpdateService: (oldTitle: string, serviceData: Partial<Service>) => Promise<void>;
  onDeleteService: (title: string) => Promise<void>;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onCreateService,
  onUpdateService,
  onDeleteService,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  type ServiceFormData = {
    title: string;
    category: string;
    duration: string;
    priceNumber: number | '';
    price: string;
    promotionActive: boolean;
    discountPercent: number;
    description: string;
  };

  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    category: 'Preventive Care',
    duration: '',
    priceNumber: '',
    price: '',
    promotionActive: false,
    discountPercent: 0,
    description: '',
  });

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  const extractPriceNumber = (priceStr: string): number => {
    const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      title: '',
      category: 'Preventive Care',
      duration: '',
      priceNumber: '',
      price: '',
      promotionActive: false,
      discountPercent: 0,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    const priceNumber = extractPriceNumber(service.price);
    setFormData({
      title: service.title,
      category: service.category,
      duration: service.duration || '',
      priceNumber: priceNumber || '',
      price: service.price || '',
      promotionActive: service.promotionActive,
      discountPercent: Number(service.discountPercent) || 0,
      description: service.description || '',
    });
    setIsModalOpen(true);
  };

  const handleTextChange = (field: 'duration') => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };
  };

  const handlePriceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setFormData((prev) => ({
        ...prev,
        priceNumber: '',
        price: '',
      }));
      return;
    }
    const numValue = Number(rawValue);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({
        ...prev,
        priceNumber: numValue,
        price: `${numValue} ETB`,
      }));
    }
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setFormData((prev) => ({ ...prev, discountPercent: 0 }));
      return;
    }
    const parsedValue = Number(rawValue);
    setFormData((prev) => ({
      ...prev,
      discountPercent: Number.isNaN(parsedValue) ? 0 : parsedValue,
    }));
  };

  const handleTextFocus = (field: 'duration') => {
    return (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === '0' || e.target.value === '') {
        setFormData((prev) => ({ ...prev, [field]: '' }));
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalPrice = formData.price || `${formData.priceNumber || 0} ETB`;
      
      const payload: Partial<Service> = {
        title: formData.title,
        category: formData.category,
        duration: formData.duration || '0 mins',
        price: finalPrice,
        promotionActive: formData.promotionActive,
        discountPercent: Number(formData.discountPercent) || 0,
        description: formData.description || '',
      };

      if (editingService) {
        await onUpdateService(editingService.title, payload);
      } else {
        await onCreateService(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (title: string) => {
    setSubmitting(true);
    try {
      await onDeleteService(title);
      setDeleteConfirmTitle(null);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || srv.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            Service Catalog Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain procedure pricing, durations, categories, and promotional discounts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Service
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="Search services..."
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => {
          const originalPrice = extractPriceNumber(srv.price);
          const finalPrice = srv.promotionActive
            ? Math.round(originalPrice * (1 - (srv.discountPercent || 0) / 100))
            : originalPrice;

          return (
            <div
              key={srv.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-cyan-300 transition-all shadow-sm relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {srv.category}
                  </span>
                  {srv.promotionActive && srv.discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      {srv.discountPercent}% OFF
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">{srv.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {srv.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{srv.duration}</span>
                  </div>

                  <div className="text-right">
                    {srv.promotionActive && srv.discountPercent > 0 ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-slate-400 line-through">{srv.price}</span>
                        <span className="text-lg font-extrabold text-cyan-700">{finalPrice} ETB</span>
                      </div>
                    ) : (
                      <span className="text-lg font-extrabold text-slate-900">{srv.price}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(srv)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmTitle(srv.title)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-600" />
                {editingService ? `Edit Service: ${editingService.title}` : 'Add New Service'}
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
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Teeth Whitening"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Preventive Care">Preventive Care</option>
                    <option value="Cosmetic">Cosmetic</option>
                    <option value="Restorative">Restorative</option>
                    <option value="Orthodontic">Orthodontic</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={handleTextChange('duration')}
                    onFocus={handleTextFocus('duration')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. 45 mins"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Price (ETB) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.priceNumber}
                      onChange={handlePriceNumberChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500 pr-16"
                      placeholder="e.g. 1500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      ETB
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Discount Percent (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.discountPercent === 0 ? '' : formData.discountPercent}
                    onChange={handleDiscountChange}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        setFormData((prev) => ({ ...prev, discountPercent: 0 }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="promoActive"
                  checked={formData.promotionActive}
                  onChange={(e) => setFormData({ ...formData, promotionActive: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 accent-cyan-600 cursor-pointer"
                />
                <label htmlFor="promoActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Activate Promotional Discount ({formData.discountPercent}% OFF)
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Brief description of the service..."
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
                  {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTitle && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-xl max-w-sm w-full p-6 shadow-xl relative">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Delete Service?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete service <span className="font-bold text-slate-900">"{deleteConfirmTitle}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmTitle(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmTitle)}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
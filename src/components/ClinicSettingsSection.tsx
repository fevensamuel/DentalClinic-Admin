import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Megaphone,
  Ban,
  Save,
  Trash2,
  CheckCircle2,
  Plus,
  Bell,
  AlertCircle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  Doctor,
  DateAvailability,
  BlockedDate,
  Announcement,
  CutoffSettings,
} from '../types';

interface ClinicSettingsSectionProps {
  doctors: Doctor[];
  availabilities: DateAvailability[];
  blockedDates: BlockedDate[];
  announcement: Announcement;
  cutoff: CutoffSettings;
  onUpdateAvailability: (date: string, doctorIds: string[]) => Promise<void>;
  onClearAvailability: (date: string) => Promise<void>;
  onAddBlockedDate: (date: string, reason: string) => Promise<void>;
  onRemoveBlockedDate: (date: string) => Promise<void>;
  onUpdateAnnouncement: (announcementData: Partial<Announcement>) => Promise<void>;
  onUpdateCutoff: (cutoffData: Partial<CutoffSettings>) => Promise<void>;
  onSuccessToast: (msg: string) => void;
  onErrorToast: (msg: string) => void;
}

export const ClinicSettingsSection: React.FC<ClinicSettingsSectionProps> = ({
  doctors,
  availabilities,
  blockedDates,
  announcement,
  cutoff,
  onUpdateAvailability,
  onClearAvailability,
  onAddBlockedDate,
  onRemoveBlockedDate,
  onUpdateAnnouncement,
  onUpdateCutoff,
  onSuccessToast,
  onErrorToast,
}) => {
  const [activeTab, setActiveTab] = useState<'availability' | 'blocked' | 'announcement' | 'cutoff'>(
    'availability'
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Availability State
  const [selectedAvailDate, setSelectedAvailDate] = useState(todayStr);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>(doctors.map((d) => d.id));
  const [savingAvail, setSavingAvail] = useState(false);

  // 2. Blocked Date State
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');
  const [savingBlocked, setSavingBlocked] = useState(false);

  // 3. Announcement State
  const [announcementText, setAnnouncementText] = useState(announcement.text);
  const [announcementActive, setAnnouncementActive] = useState(announcement.active);
  const [announcementType, setAnnouncementType] = useState(announcement.bannerType || 'info');
  const [savingAnnounce, setSavingAnnounce] = useState(false);

  // 4. Cutoff State
  const [cutoffTime, setCutoffTime] = useState(cutoff.cutoffTime || '17:00');
  const [sameDayAllowed, setSameDayAllowed] = useState(cutoff.sameDayBookingAllowed ?? true);
  const [minNoticeHours, setMinNoticeHours] = useState(cutoff.minNoticeHours || 2);
  const [savingCutoff, setSavingCutoff] = useState(false);

  // Availability handlers
  const handleDoctorToggle = (docId: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSaveAvailability = async () => {
    if (!selectedAvailDate) {
      onErrorToast('Please select a date first.');
      return;
    }
    setSavingAvail(true);
    try {
      await onUpdateAvailability(selectedAvailDate, selectedDoctorIds);
      onSuccessToast(`Saved availability for ${selectedAvailDate}`);
    } catch (err: any) {
      onErrorToast(err.message || 'Failed to save availability');
    } finally {
      setSavingAvail(false);
    }
  };

  const handleClearAvailability = async (dateToClear: string) => {
    setSavingAvail(true);
    try {
      await onClearAvailability(dateToClear);
      onSuccessToast(`Cleared schedule for ${dateToClear}`);
    } catch (err: any) {
      onErrorToast(err.message || 'Failed to clear availability');
    } finally {
      setSavingAvail(false);
    }
  };

  // Blocked Date handlers
  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedDate) {
      onErrorToast('Please select a date to block.');
      return;
    }
    setSavingBlocked(true);
    try {
      await onAddBlockedDate(newBlockedDate, newBlockedReason || 'Clinic Closed');
      onSuccessToast(`Date ${newBlockedDate} added to blocked schedule.`);
      setNewBlockedDate('');
      setNewBlockedReason('');
    } catch (err: any) {
      onErrorToast(err.message || 'Failed to block date');
    } finally {
      setSavingBlocked(false);
    }
  };

  const handleRemoveBlockedDate = async (date: string) => {
    try {
      await onRemoveBlockedDate(date);
      onSuccessToast(`Unblocked date ${date}`);
    } catch (err: any) {
      onErrorToast(err.message || 'Failed to unblock date');
    }
  };

  // Announcement handler
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAnnounce(true);
    try {
      await onUpdateAnnouncement({
        text: announcementText,
        active: announcementActive,
        bannerType: announcementType as any,
      });
      onSuccessToast('Announcement banner updated successfully.');
    } catch (err: any) {
      onErrorToast(err.message || 'Failed to update announcement');
    } finally {
      setSavingAnnounce(false);
    }
  };

  // Cutoff handler
  const handleSaveCutoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCutoff(true);
    try {
      await onUpdateCutoff({
        cutoffTime,
        sameDayBookingAllowed: sameDayAllowed,
        minNoticeHours: Number(minNoticeHours),
      });
      onSuccessToast('Cutoff and booking notice rules updated.');
    } catch (err: any) {
      onErrorToast(err.message || 'Failed to update cutoff settings');
    } finally {
      setSavingCutoff(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-600" />
          Clinic Operating Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure doctor availability schedules, clinic holiday closures, banner announcements, and daily booking cutoff times.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('availability')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'availability'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Doctor Availability Schedule
        </button>

        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'blocked'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Ban className="w-4 h-4" />
          Blocked Dates & Closures ({blockedDates.length})
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'announcement'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Announcement Banner
        </button>

        <button
          onClick={() => setActiveTab('cutoff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'cutoff'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Cutoff Time & Rules
        </button>
      </div>

      {/* TAB 1: DOCTOR AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Availability Editor Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-1 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              Set Doctor Availability
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Select Target Date *
                </label>
                <input
                  type="date"
                  value={selectedAvailDate}
                  onChange={(e) => setSelectedAvailDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-2">
                  Select Available Doctors for Date
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {doctors.map((doc) => {
                    const isChecked = selectedDoctorIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleDoctorToggle(doc.id)}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-50 border-cyan-300 text-slate-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {doc.avatar && doc.avatar.trim() !== '' ? (
                            <img
                              src={doc.avatar}
                              alt={doc.name}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-[#0EA5E9] text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                              {doc.name.replace(/^Dr\.\s*/i, '').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'DR'}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{doc.name}</div>
                            <div className="text-[10px] text-slate-500">{doc.specialty}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-cyan-600 rounded accent-cyan-600 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAvailability}
                  disabled={savingAvail}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingAvail ? 'Saving...' : 'Save Availability'}
                </button>

                <button
                  type="button"
                  onClick={() => handleClearAvailability(selectedAvailDate)}
                  disabled={savingAvail}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Clear all doctor availability for selected date"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Availabilities List */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-2 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Configured Date Availabilities
            </h3>

            <div className="space-y-3">
              {availabilities.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No date availabilities saved yet. All doctors default to available.
                </p>
              ) : (
                availabilities.map((avail) => (
                  <div
                    key={avail.date}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-cyan-800 font-mono">
                        {avail.date}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {avail.doctorIds.map((dId) => {
                          const doc = doctors.find((d) => d.id === dId);
                          return (
                            <span
                              key={dId}
                              className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs"
                            >
                              {doc ? doc.name : dId}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleClearAvailability(avail.date)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      Clear Schedule
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BLOCKED DATES & CLOSURES */}
      {activeTab === 'blocked' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Blocked Date Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-1 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              Add Blocked Date / Closure
            </h3>

            <form onSubmit={handleAddBlockedDate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Closure Date *
                </label>
                <input
                  type="date"
                  required
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Reason for Closure
                </label>
                <input
                  type="text"
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={savingBlocked}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {savingBlocked ? 'Adding...' : 'Block Date from Appointments'}
              </button>
            </form>
          </div>

          {/* Blocked Dates List */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-2 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Active Blocked Dates & Clinic Closures
            </h3>

            <div className="space-y-3">
              {blockedDates.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No blocked dates configured. The clinic is open on all standard operating days.
                </p>
              ) : (
                blockedDates.map((b) => (
                  <div
                    key={b.date}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-bold text-rose-700 font-mono">{b.date}</span>
                      <p className="text-xs font-medium text-slate-700 mt-1">{b.reason}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveBlockedDate(b.date)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-700 transition-colors cursor-pointer shadow-2xs"
                      title="Unblock date"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENT BANNER */}
      {activeTab === 'announcement' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-cyan-600" />
              Homepage Announcement Banner
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Last updated: {new Date(announcement.updatedAt).toLocaleDateString()}
            </span>
          </div>

          <form onSubmit={handleSaveAnnouncement} className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-800">Show Announcement Banner</span>
                <p className="text-[11px] text-slate-500">
                  Toggle whether the banner is visible to patients visiting your clinic website.
                </p>
              </div>
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="w-5 h-5 text-cyan-600 rounded accent-cyan-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Banner Tone / Style
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'info', label: 'Info (Cyan)', color: 'border-cyan-600 text-cyan-700 bg-cyan-50' },
                  { id: 'warning', label: 'Warning (Amber)', color: 'border-amber-600 text-amber-800 bg-amber-50' },
                  { id: 'success', label: 'Promo (Green)', color: 'border-emerald-600 text-emerald-800 bg-emerald-50' },
                  { id: 'urgent', label: 'Urgent (Rose)', color: 'border-rose-600 text-rose-800 bg-rose-50' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAnnouncementType(type.id as any)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      announcementType === type.id
                        ? `${type.color} ring-1 ring-cyan-600`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Announcement Text Content
              </label>
              <textarea
                rows={3}
                required
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              />
            </div>

            {/* Live Preview */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 uppercase mb-2">
                Live Public Website Preview
              </span>
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 text-xs font-medium ${
                  announcementType === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : announcementType === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : announcementType === 'urgent'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                }`}
              >
                <Bell className="w-4 h-4 shrink-0 text-cyan-700" />
                <span>{announcementText || 'Your announcement banner will appear here.'}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingAnnounce}
              className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingAnnounce ? 'Saving...' : 'Save Announcement Banner'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: CUTOFF TIME & RULES */}
      {activeTab === 'cutoff' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Clock className="w-4 h-4 text-cyan-600" />
            Same-Day Booking & Cutoff Rules
          </h3>

          <form onSubmit={handleSaveCutoff} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Daily Same-Day Booking Cutoff Time
              </label>
              <input
                type="time"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono shadow-2xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                After this time (e.g. 17:00), same-day bookings for the current day will be locked on the public booking page.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-800">Allow Same-Day Online Bookings</span>
                <p className="text-[11px] text-slate-500">
                  If disabled, patients can only book appointments for tomorrow or later.
                </p>
              </div>
              <input
                type="checkbox"
                checked={sameDayAllowed}
                onChange={(e) => setSameDayAllowed(e.target.checked)}
                className="w-5 h-5 text-cyan-600 rounded accent-cyan-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Minimum Advance Notice Required (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={48}
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(parseInt(e.target.value) || 2)}
                className="w-full sm:w-48 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono shadow-2xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Patients must book at least this many hours before the requested appointment time.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingCutoff}
              className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingCutoff ? 'Saving...' : 'Save Cutoff Rules'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

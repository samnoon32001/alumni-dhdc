'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Bell,
  Pin,
  Calendar,
  Sparkles,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Filter,
  Send,
  Building,
  Info,
} from 'lucide-react';
import type { AlumniAnnouncement, AlumniZone } from '../../types';

interface AnnouncementsViewProps {
  onRefreshUnreadCount?: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  onRefreshUnreadCount,
}) => {
  const { currentUser, currentAlumni } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin';

  const [announcements, setAnnouncements] = useState<AlumniAnnouncement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Admin New Announcement Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newPriority, setNewPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newTargetZoneId, setNewTargetZoneId] = useState('');
  const [newTargetBatch, setNewTargetBatch] = useState('');
  const [zones, setZones] = useState<AlumniZone[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const fetchAnnouncements = () => {
    setIsLoading(true);
    const query = new URLSearchParams();
    if (currentAlumni?.id) query.append('alumniId', currentAlumni.id);
    if (currentAlumni?.zoneId) query.append('zoneId', currentAlumni.zoneId);
    if (currentAlumni?.passoutBatchYear) query.append('batch', currentAlumni.passoutBatchYear);

    fetch(`/api/announcements?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAnnouncements(data.announcements || []);
          setReadIds(data.readIds || []);
        }
      })
      .catch((e) => console.error('Fetch notices error:', e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
    // Load zones for admin targeting
    if (isAdmin) {
      fetch('/api/zones')
        .then((r) => r.json())
        .then((d) => {
          if (d.zones) setZones(d.zones);
        })
        .catch(() => {});
    }
  }, [currentAlumni, isAdmin]);

  const markAsRead = async (announcementId: string) => {
    if (!currentAlumni || readIds.includes(announcementId)) return;
    try {
      const res = await fetch('/api/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumniId: currentAlumni.id,
          announcementId,
        }),
      });
      if (res.ok) {
        setReadIds((prev) => [...prev, announcementId]);
        if (onRefreshUnreadCount) onRefreshUnreadCount();
      }
    } catch (e) {
      console.warn('Could not mark notice as read:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!currentAlumni) return;
    try {
      const res = await fetch('/api/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumniId: currentAlumni.id,
          markAll: true,
        }),
      });
      if (res.ok) {
        setReadIds(announcements.map((a) => a.id));
        if (onRefreshUnreadCount) onRefreshUnreadCount();
      }
    } catch (e) {
      console.warn('Could not mark all as read:', e);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          priority: newPriority,
          isPinned: newIsPinned,
          targetZoneId: newTargetZoneId || null,
          targetBatch: newTargetBatch || null,
          createdBy: currentUser?.id,
          createdByName: currentUser?.name || 'College Admin',
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        fetchAnnouncements();
      }
    } catch (err) {
      console.error('Create announcement error:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (selectedCategory === 'ALL') return true;
    return a.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Institute Notices & Broadcasts</span>
            <Badge variant="primary" size="sm">Official</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official communications, event invitations, and circulars directly from Darul Hidaya Da&apos;wa College.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {announcements.length > 0 && currentAlumni && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Mark All as Read
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'General', 'Event', 'Reunion', 'Donation Drive', 'Urgent'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {cat === 'ALL' ? 'All Notices' : cat}
          </button>
        ))}
      </div>

      {/* Announcements Feed */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading institute announcements...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Announcements Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no active notices in this category for your batch or zone.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isRead = readIds.includes(ann.id);
            const isUrgent = ann.priority === 'urgent';
            return (
              <div
                key={ann.id}
                onClick={() => markAsRead(ann.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                  ann.isPinned
                    ? 'border-indigo-300 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm'
                    : isUrgent
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {/* Notice Top Meta */}
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        <Pin className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400" />
                        <span>Pinned Notice</span>
                      </span>
                    )}
                    <Badge
                      variant={isUrgent ? 'danger' : ann.category === 'Donation Drive' ? 'gold' : 'primary'}
                      size="sm"
                    >
                      {ann.category}
                    </Badge>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" title="Unread" />
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(ann.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                </div>

                {/* Title & Content */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                  {ann.title}
                </h3>
                <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {ann.content}
                </div>

                {/* Notice Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    Posted by: {ann.createdByName || 'Administration'}
                  </span>
                  {(ann.targetBatch || ann.targetZoneId) && (
                    <span className="italic">
                      Target: {ann.targetBatch ? `Batch ${ann.targetBatch}` : ''} {ann.targetZoneId ? '• Regional Chapter' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Broadcast Notice Modal */}
      {isAdmin && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Broadcast Institute Announcement"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Annual Alumni Meet 2026 - Registration Open"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="General">General</option>
                  <option value="Event">Event</option>
                  <option value="Reunion">Reunion</option>
                  <option value="Donation Drive">Donation Drive</option>
                  <option value="Urgent">Urgent Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Zone (Optional)
                </label>
                <select
                  value={newTargetZoneId}
                  onChange={(e) => setNewTargetZoneId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="">All Zones (Broadcast to All)</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Batch (Optional)
                </label>
                <input
                  type="text"
                  value={newTargetBatch}
                  onChange={(e) => setNewTargetBatch(e.target.value)}
                  placeholder="e.g. 2024 (leave empty for all)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notice Content / Body *
              </label>
              <textarea
                rows={5}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write the complete announcement details, dates, venue, or links..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinNotice"
                checked={newIsPinned}
                onChange={(e) => setNewIsPinned(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="pinNotice" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pin this notice to the top of all feeds
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPosting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPosting ? 'Publishing...' : 'Publish Broadcast'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

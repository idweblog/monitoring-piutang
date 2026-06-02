/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Check, Trash2, Calendar, AlertTriangle, UserCheck, Info } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsPanelProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (module: 'payments' | 'invoices', id: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onNavigate,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 w-full" id="notifications-panel-root">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Pusat Notifikasi</h2>
            <p className="text-xs text-slate-400">Sistem monitoring otomatis</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-rose-50 rounded"
            title="Hapus semua notifikasi"
            id="btn-clear-all-notif"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Bell className="h-8 w-8 text-slate-300 stroke-[1.5]" />
          <p className="text-sm">Tidak ada notifikasi baru</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border transition-all duration-200 relative ${
                notif.read
                  ? 'bg-slate-50/50 border-slate-100'
                  : 'bg-indigo-50/30 border-indigo-100/50 hover:bg-indigo-50/50'
              }`}
              id={`notif-card-${notif.id}`}
            >
              <div className="flex gap-2.5">
                <div className="mt-0.5">
                  {notif.tipe === 'deadline' && (
                    <div className="p-1 px-1.5 rounded bg-rose-100 text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  )}
                  {notif.tipe === 'approval' && (
                    <div className="p-1 px-1.5 rounded bg-amber-100 text-amber-600">
                      <UserCheck className="h-4 w-4" />
                    </div>
                  )}
                  {notif.tipe === 'log' && (
                    <div className="p-1 px-1.5 rounded bg-indigo-100 text-indigo-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                  )}
                  {notif.tipe === 'system' && (
                    <div className="p-1 px-1.5 rounded bg-sky-100 text-sky-600">
                      <Info className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className={`text-xs font-semibold leading-normal ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {notif.judul}
                    </h3>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                      {notif.tanggal}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 mb-2">
                    {notif.deskripsi}
                  </p>
                  
                  <div className="flex items-center justify-between gap-2">
                    {notif.linkTo ? (
                      <button
                        onClick={() => onNavigate(notif.linkTo!.module, notif.linkTo!.id)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                        id={`btn-notif-link-${notif.id}`}
                      >
                        Buka Detail & Tindaklanjuti
                      </button>
                    ) : (
                      <div />
                    )}

                    {!notif.read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="p-1 rounded hover:bg-indigo-100/50 text-indigo-600 flex items-center justify-center"
                        title="Tandai Sudah Dibaca"
                        id={`btn-read-notif-${notif.id}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

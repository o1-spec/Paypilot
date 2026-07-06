import React, { useState } from 'react';
import { Bell, Check, Info } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export default function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200"
      >
        <span className="sr-only">Notifications</span>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600 border border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2.5 w-80 sm:w-96 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none z-40 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4.5 py-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Notifications</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{unreadCount} unread messages</p>
              </div>
              {unreadCount > 0 && onMarkAllRead && (
                <button
                  onClick={() => {
                    onMarkAllRead();
                    setIsOpen(false);
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-500 font-bold inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4.5 transition-colors text-xs flex gap-3 ${
                      notif.read ? 'hover:bg-slate-50/40' : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="mt-0.5 rounded-lg bg-white border border-slate-200 p-1.5 text-slate-400 h-fit shadow-sm">
                      <Info className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 leading-tight">{notif.title}</span>
                        <StatusBadge status={notif.type} />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{notif.message}</p>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[9px] text-slate-400 font-medium">{notif.created_at}</span>
                        {!notif.read && onMarkRead && (
                          <button
                            onClick={() => onMarkRead(notif.id)}
                            className="text-[10px] text-slate-400 hover:text-indigo-600 font-semibold"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-2">
                  <div className="rounded-full bg-slate-50 p-3.5 border border-slate-100 text-slate-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-700">All caught up!</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">You have no new notifications.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationItem,
  formatDate,
} from '@/lib/api';
import {
  Bell, CheckCheck, RefreshCw, AlertTriangle, CheckCircle2,
  AlertCircle, DollarSign, FileText, Inbox
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  PAYMENT_RECEIVED: { icon: DollarSign,    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  INVOICE_PAID:     { icon: CheckCircle2,  color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200'  },
  PARTIAL_PAYMENT:  { icon: AlertCircle,   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'    },
  OVERPAYMENT:      { icon: AlertTriangle, color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200'  },
  UNMATCHED:        { icon: AlertTriangle, color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200'      },
  default:          { icon: Bell,          color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200'    },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
    setMarkingAll(false);
  };

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <TopNavbar title="Notifications" />

      <main className="flex-1 p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Payment alerts, invoice updates, and reconciliation events.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white px-3 py-2 shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {markingAll ? 'Marking…' : 'Mark All Read'}
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {(['all', 'unread'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-all capitalize ${
                filter === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'unread' ? `Unread (${unreadCount})` : 'All'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Failed to load notifications</p>
            <button onClick={load} className="text-xs font-semibold text-indigo-600 hover:underline">Retry</button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center space-y-3">
            <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs text-slate-400">
              Notifications appear here when payments are received or invoices are updated.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(n => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`flex gap-4 p-4 rounded-2xl border bg-white shadow-sm transition-all ${
                    !n.read ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'
                  }`}
                >
                  <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                        {!n.read && (
                          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600 align-middle" />
                        )}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium shrink-0">{formatDate(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">{n.message}</p>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 self-center text-[9px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2 py-1 transition-all"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import React from 'react';
import { ArrowDownLeft, CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface ActivityItem {
  id: string;
  type: 'payment' | 'invoice' | 'reconciliation';
  title: string;
  description: string;
  status: string;
  time: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 mb-5">
        Recent Activity
      </h3>

      {activities.length > 0 ? (
        <div className="relative border-l border-slate-100 ml-3 space-y-6">
          {activities.map((act) => {
            const Icon = act.type === 'payment' ? ArrowDownLeft : act.type === 'reconciliation' ? CheckCircle2 : Clock;
            return (
              <div key={act.id} className="relative pl-7 text-xs space-y-1">
                {/* Timeline Icon */}
                <span className="absolute -left-3.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-bold text-slate-800">{act.title}</span>
                    <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{act.description}</p>
                  </div>
                  <div className="text-right space-y-1 flex flex-col items-end">
                    <StatusBadge status={act.status} />
                    <span className="block text-[9px] text-slate-400 font-medium">{act.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
          <div className="rounded-full bg-slate-50 p-3 border border-slate-100 text-slate-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-700">No recent activities</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Activities will display here once transactions begin.</p>
          </div>
        </div>
      )}
    </div>
  );
}

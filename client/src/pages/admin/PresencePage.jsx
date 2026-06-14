import React from 'react';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { useGetPresenceListQuery } from '../../services/adminApi.js';
import { Users, Wifi, WifiOff, Shield } from 'lucide-react';

export default function PresencePage() {
  const { data, isLoading } = useGetPresenceListQuery(undefined, {
    pollingInterval: 5000 // Poll presence list every 5s
  });
  const presenceList = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active User Sessions"
        subtitle="Supervise live socket connections, administrator presence logs, and active staff statuses"
      />

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span>Staff Presence Register</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 p-0 text-xs">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading presence list...</div>
          ) : presenceList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No active sessions found.</div>
          ) : (
            presenceList.map((session, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                <div className="flex items-center gap-3">
                  {session.user?.avatar ? (
                    <img src={session.user.avatar} alt={session.user.firstName} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                      {session.user?.firstName?.[0]}{session.user?.lastName?.[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      {session.user?.firstName} {session.user?.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                      <Shield className="h-3.5 w-3.5" />
                      <span>{session.user?.role?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {session.ipAddress && (
                    <span className="font-mono text-slate-400 text-[10px] hidden sm:inline">{session.ipAddress}</span>
                  )}
                  {session.lastActive && (
                    <span className="text-slate-400 text-[10px] hidden sm:inline">
                      Seen: {new Date(session.lastActive).toLocaleTimeString()}
                    </span>
                  )}
                  <Badge className="gap-1.5 pl-2 py-0.5">
                    {session.isOnline ? (
                      <>
                        <Wifi className="h-3 w-3 text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500">Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400">Idle</span>
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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

  const getStatusStyle = (isOnline) => {
    if (isOnline) {
      return { background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' };
    }
    return { background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active User Sessions"
        subtitle="Supervise live socket connections, administrator presence logs, and active staff statuses"
      />

      <Card className="border border-[#1e293b] bg-[#1a2332]">
        <CardHeader className="pb-0">
          <CardTitle 
            style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}
            className="text-slate-100 flex items-center"
          >
            <Users style={{ marginRight: '8px', width: '20px', height: '20px' }} className="text-[#3b82f6]" />
            <span>Staff Presence Register</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading presence list...</div>
          ) : presenceList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No active sessions found.</div>
          ) : (
            presenceList.map((session, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid #0f172a'
                }}
              >
                {/* Avatar Placeholder / Circle */}
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: '12px',
                    overflow: 'hidden'
                  }}
                >
                  {session.user?.avatar ? (
                    <img src={session.user.avatar} alt={session.user.firstName || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-bold text-xs text-slate-400">
                      {session.user?.firstName?.[0] || 'U'}{session.user?.lastName?.[0] || 'S'}
                    </span>
                  )}
                </div>

                {/* Name / Info */}
                <div className="flex items-center gap-3">
                  <div className="font-bold text-slate-200 text-sm">
                    {session.user ? `${session.user.firstName || ''} ${session.user.lastName || ''}` : 'Unknown Staff Session'}
                  </div>
                  
                  {/* Shield Role badge */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-[#1e293b]/60 px-2 py-0.5 rounded border border-[#1e293b]">
                    <Shield className="h-3.5 w-3.5 text-[#3b82f6]" />
                    <span className="capitalize">{session.user?.role?.replace('_', ' ') || 'Staff'}</span>
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right side information */}
                <div className="flex items-center gap-4">
                  {session.ipAddress && (
                    <span className="font-mono text-slate-400 text-[10px] hidden sm:inline">{session.ipAddress}</span>
                  )}
                  {session.lastActive && (
                    <span className="text-slate-400 text-[10px] hidden sm:inline">
                      Seen: {new Date(session.lastActive).toLocaleTimeString()}
                    </span>
                  )}
                  
                  {/* Status Badge */}
                  <div 
                    style={{
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      ...getStatusStyle(session.isOnline)
                    }}
                  >
                    {session.isOnline ? 'Available' : 'Idle'}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

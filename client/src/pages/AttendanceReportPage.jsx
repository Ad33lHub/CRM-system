import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { LogIn, LogOut, Clock, Calendar, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import {
  useGetAttendanceLogsQuery,
  useCheckInMutation,
  useCheckOutMutation,
} from '../services/attendanceApi.js';
import useAuth from '../hooks/useAuth.js';
import { toast } from 'sonner';

export default function AttendanceReportPage() {
  const { user, role } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // RTK Query endpoints
  const { data: logsData, isLoading: isLogsLoading, refetch } = useGetAttendanceLogsQuery();
  const [checkInApi, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOutApi, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const logs = logsData?.data || [];

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check today's check-in/out log
  const todayStr = new Date().toDateString();
  const todayLog = logs.find(log => new Date(log.date).toDateString() === todayStr);

  const handleCheckIn = async () => {
    try {
      await checkInApi().unwrap();
      toast.success('Successfully checked in!');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutApi().unwrap();
      toast.success('Successfully checked out!');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Check-out failed');
    }
  };

  const isManager = ['super_admin', 'admin', 'manager'].includes(role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Check-in"
        subtitle="Manage daily shifts, record work entries, and review your logs"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock & Check In Control Card */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm shadow-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-6">
            <div className="flex flex-col items-center space-y-1">
              <Clock className="h-8 w-8 text-blue-500 animate-pulse" />
              <span className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                {currentTime.toLocaleTimeString()}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Today&apos;s Status</span>
              {todayLog ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Checked In at {new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {todayLog.checkOut ? (
                    <div className="text-slate-500 dark:text-slate-400 text-xs">
                      Checked Out at {new Date(todayLog.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[10px] animate-pulse">Shift Active</div>
                  )}
                  <Badge variant={todayLog.status === 'late' ? 'warning' : 'success'} className="mt-1">
                    {todayLog.status === 'late' ? 'Late Check In' : 'On Time'}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm">
                  <AlertCircle className="h-4.5 w-4.5" />
                  <span>Not checked in yet</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full pt-2">
              <Button
                onClick={handleCheckIn}
                disabled={!!todayLog || isCheckingIn}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 transition-all rounded-lg flex items-center justify-center gap-2"
              >
                <LogIn className="h-4.5 w-4.5" />
                Check In
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={!todayLog || !!todayLog.checkOut || isCheckingOut}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 transition-all rounded-lg flex items-center justify-center gap-2"
              >
                <LogOut className="h-4.5 w-4.5" />
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History / Summary List */}
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Attendance History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLogsLoading ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading attendance history...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No attendance records found for this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Staff Profile</th>
                      <th className="py-2.5 px-3">Check In</th>
                      <th className="py-2.5 px-3">Check Out</th>
                      <th className="py-2.5 px-3">Shift Status</th>
                      <th className="py-2.5 px-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id || log._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(log.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {log.user?.firstName || user.firstName} {log.user?.lastName || user.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">{log.user?.role || user.role}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={log.status === 'late' ? 'warning' : 'success'} className="capitalize text-[10px]">
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{log.ipAddress || 'Unknown'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isManager && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>Manager Supervision Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              You are viewing employee check-in registers. Logs listed above contain records for your direct reports.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

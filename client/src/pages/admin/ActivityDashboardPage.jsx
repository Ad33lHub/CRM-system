import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { useGetActivityDashboardQuery } from '../../services/adminApi.js';
import { ShieldAlert, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';

export default function ActivityDashboardPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetActivityDashboardQuery({ page, limit: 15 });

  const logs = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Audit Logs"
        subtitle="Chronological audit records tracking logins, profile changes, and media uploads"
      />

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-blue-500" />
            <span>Audit Trail Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading audit feed...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No activity logs recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Log Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id || log._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {new Date(log.performedAt || log.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">{log.entity}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.performedBy?.firstName} {log.performedBy?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">{log.performedBy?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-400 font-mono text-[10px]" title={JSON.stringify(log.metadata)}>
                        {log.metadata ? JSON.stringify(log.metadata) : '{}'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Page {page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React from 'react';
import { ArrowRight, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { useGetStatusLogQuery } from '@/services/clientsApi';

export default function StatusHistoryTab({ clientId, client }) {
  const { data, isLoading } = useGetStatusLogQuery(clientId);

  const logs = data?.data || data || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="text-sm font-semibold text-muted-foreground">Current:</span>
          <StatusBadge status={client?.status} dot />
          <span className="text-sm text-muted-foreground">
            since{' '}
            {client?.updatedAt
              ? new Date(client.updatedAt).toLocaleDateString()
              : '—'}
          </span>
        </CardContent>
      </Card>

      {logs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No status changes recorded</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Status transitions for this client will appear here.
          </p>
        </Card>
      ) : (
        <div className="relative space-y-6 pl-6">
          {/* timeline line */}
          <div className="absolute bottom-2 left-2 top-2 w-px bg-border" />
          {logs.map((log) => (
            <div key={log._id || log.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={log.fromStatus} size="sm" />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <StatusBadge status={log.toStatus} size="sm" />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{log.reason}</p>
                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      {log.changedBy?.avatar && (
                        <AvatarImage src={log.changedBy.avatar} alt={log.changedBy.firstName} />
                      )}
                      <AvatarFallback className="bg-muted text-[9px]">
                        {log.changedBy?.firstName?.[0]}
                        {log.changedBy?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {log.changedBy
                        ? `${log.changedBy.firstName} ${log.changedBy.lastName}`
                        : 'System'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

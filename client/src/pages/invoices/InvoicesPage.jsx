import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardHeader, CardContent } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Plus, Receipt, Calendar, User, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useGetInvoicesQuery } from '../../services/invoicesApi.js';
import useAuth from '../../hooks/useAuth.js';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  // States
  const [statusFilter, setStatusFilter] = useState('all');

  // Queries
  const { data: invoicesData, isLoading } = useGetInvoicesQuery({
    status: statusFilter === 'all' ? undefined : statusFilter
  });
  const invoices = invoicesData?.data || [];

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'default';
      case 'draft': return 'secondary';
      case 'overdue': return 'warning';
      case 'void': return 'destructive';
      default: return 'outline';
    }
  };

  const canCreate = ['super_admin', 'admin', 'manager'].includes(role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Invoices"
        subtitle="Manage billing contracts, project invoices, and client balances"
        actions={
          canCreate && (
            <Button onClick={() => navigate('/invoices/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex gap-2 border-b pb-4 overflow-x-auto select-none">
        {['all', 'draft', 'sent', 'paid', 'overdue', 'void'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading invoices database...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border rounded-xl">
          <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No Invoices Found</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your status filter or create a new invoice pitch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((inv) => (
            <Card
              key={inv.id || inv._id}
              onClick={() => navigate(`/invoices/${inv.id || inv._id}`)}
              className={cn(
                'hover:shadow-md transition-all border cursor-pointer bg-white dark:bg-slate-900/50 backdrop-blur-sm',
                inv.status === 'overdue'
                  ? 'border-red-300 dark:border-red-800 hover:border-red-400'
                  : 'hover:border-blue-500/20'
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center gap-1.5">
                    Invoice #{inv.invoiceNumber}
                    {inv.escalated && (
                      <span title="Escalated — sent multiple overdue alerts">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {inv.project?.name || 'CRM Workspace'}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(inv.status)} className="capitalize text-[9px] font-bold">
                  {inv.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {inv.client?.companyName || 'Corporate Client'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '--'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400 uppercase text-[9px] tracking-wider font-bold">Total Bill</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    ${(inv.totals?.total || 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

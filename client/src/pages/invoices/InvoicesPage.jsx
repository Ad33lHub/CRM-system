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
  const canCreate = ['super_admin', 'admin', 'manager'].includes(role);
  
  // States
  const [statusFilter, setStatusFilter] = useState('all');

  // Queries
  const { data: invoicesData, isLoading } = useGetInvoicesQuery({
    status: statusFilter === 'all' ? undefined : statusFilter
  });
  const invoices = invoicesData?.data || [];

  const getInvoiceStatusStyle = (status) => {
    switch (status) {
      case 'paid':
        return { background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' };
      case 'draft':
        return { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' };
      case 'sent':
        return { background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' };
      case 'partially_paid':
        return { background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' };
      case 'overdue':
        return { background: 'rgba(248, 113, 113, 0.12)', color: '#f87171' };
      case 'void':
        return { background: 'rgba(148, 163, 184, 0.12)', color: '#64748b' };
      default:
        return { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Invoices"
        subtitle="Manage billing contracts, project invoices, and client balances"
        actions={
          canCreate && (
            <Button onClick={() => navigate('/invoices/new')} className="btn-primary-cta gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          )
        }
      />

      {/* Filters */}
      <div 
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid #1e293b',
          marginBottom: '24px',
          paddingBottom: '12px',
          overflowX: 'auto',
          userSelect: 'none'
        }}
      >
        {['all', 'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'].map((status) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={isActive ? {
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              } : {
                backgroundColor: 'transparent',
                color: '#64748b',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
              className="hover:text-slate-100"
            >
              {status.replace('_', ' ')}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading invoices database...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 bg-[#1a2332] border border-[#1e293b] rounded-xl">
          <Receipt className="h-12 w-12 text-[#64748b] mx-auto mb-3" />
          <h4 className="font-bold text-slate-300">No Invoices Found</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your status filter or create a new invoice pitch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[20px]">
          {invoices.map((inv) => (
            <Card
              key={inv.id || inv._id}
              onClick={() => navigate(`/invoices/${inv.id || inv._id}`)}
              className={cn(
                'hover:shadow-md transition-all border cursor-pointer bg-[#1a2332] border-[#1e293b]',
                inv.status === 'overdue'
                  ? 'border-red-400'
                  : 'hover:border-blue-500/20'
              )}
            >
              <CardHeader 
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '12px'
                }}
              >
                <div className="min-w-0">
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }} className="flex items-center gap-1.5">
                    Invoice #{inv.invoiceNumber}
                    {inv.escalated && (
                      <span title="Escalated — sent multiple overdue alerts">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      </span>
                    )}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }} className="truncate">
                    {inv.project?.name || 'CRM Workspace'}
                  </p>
                </div>
                <Badge
                  style={{
                    borderRadius: '6px',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: 'none',
                    ...getInvoiceStatusStyle(inv.status)
                  }}
                  className="capitalize"
                >
                  {inv.status?.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="text-xs font-semibold">
                <div style={{ borderTop: '1px solid #1e293b', margin: '12px 0', paddingTop: '12px' }} className="space-y-2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }} className="text-slate-300">
                    <User style={{ width: '14px', height: '14px', color: '#64748b' }} className="shrink-0" />
                    <span className="truncate">
                      {inv.client?.companyName || 'Corporate Client'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }} className="text-slate-300">
                    <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} className="shrink-0" />
                    <span>Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '--'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', marginTop: '12px', paddingTop: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Total Bill</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    {inv.currency || 'PKR'} {(inv.total || 0).toLocaleString()}
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

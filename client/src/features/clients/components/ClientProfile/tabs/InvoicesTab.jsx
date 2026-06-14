import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetClientInvoicesQuery } from '@/services/clientsApi';

const formatCurrency = (amount, curr = 'PKR') =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: curr,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const SummaryCard = ({ label, value, accent }) => (
  <Card>
    <CardContent className="p-4">
      <p className={`text-xl font-bold ${accent || 'text-foreground'}`}>{value}</p>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default function InvoicesTab({ clientId }) {
  const navigate = useNavigate();
  const { data, isLoading } = useGetClientInvoicesQuery(clientId);

  const invoices = data?.data || data || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No invoices</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          No invoices have been generated for this client yet.
        </p>
        <Button
          onClick={() => navigate(`/invoices/new?client=${clientId}`)}
          className="mt-4 gap-1"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </Card>
    );
  }

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const overdue = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + ((inv.total || inv.amount || 0) - (inv.amountPaid || 0)), 0);

  const currency = invoices[0]?.currency || 'PKR';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total Billed" value={formatCurrency(totalBilled, currency)} />
        <SummaryCard
          label="Total Paid"
          value={formatCurrency(totalPaid, currency)}
          accent="text-emerald-600"
        />
        <SummaryCard
          label="Outstanding"
          value={formatCurrency(outstanding, currency)}
          accent="text-amber-600"
        />
        <SummaryCard
          label="Overdue"
          value={formatCurrency(overdue, currency)}
          accent="text-destructive"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => navigate(`/invoices/new?client=${clientId}`)}
          size="sm"
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Generate Invoice
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv._id || inv.id}>
                  <TableCell className="font-medium">
                    {inv.invoiceNumber || inv.number || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.issueDate || inv.createdAt
                      ? new Date(inv.issueDate || inv.createdAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(inv.total || inv.amount, inv.currency || currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 text-xs"
                      onClick={() => navigate(`/invoices/${inv._id || inv.id}`)}
                    >
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

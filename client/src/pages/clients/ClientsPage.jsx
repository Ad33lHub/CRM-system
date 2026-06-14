import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Download } from 'lucide-react';
import ClientFilters from '@/features/clients/components/ClientFilters';
import ClientTable from '@/features/clients/components/ClientTable';
import DeleteClientDialog from '@/features/clients/components/DeleteClientDialog';
import { useGetClientsQuery } from '@/services/clientsApi';

const STATUS_TABS = [
  { value: 'all', label: 'All Clients' },
  { value: 'active', label: 'Active' },
  { value: 'lead', label: 'Leads' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
];

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL
  const initialFilters = useMemo(
    () => ({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      industry: searchParams.get('industry') || undefined,
      source: searchParams.get('source') || undefined,
      tags: searchParams.get('tags') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
    }),
    // Only read URL params on mount; later changes are driven through state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [filters, setFilters] = useState(initialFilters);
  const [sorting, setSorting] = useState({
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const activeTab = filters.status || 'all';

  // Build query params
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      ...sorting,
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined)
      ),
    }),
    [page, limit, sorting, filters]
  );

  const { data, isLoading, isFetching } = useGetClientsQuery(queryParams);

  const clients = data?.data || [];
  const pagination = data?.pagination || null;

  // Sync URL
  const syncUrl = useCallback(
    (newFilters, newSort, newPage, newLimit) => {
      const params = new URLSearchParams();
      Object.entries(newFilters || filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const s = newSort || sorting;
      if (s.sortBy !== 'createdAt') params.set('sortBy', s.sortBy);
      if (s.sortOrder !== 'desc') params.set('sortOrder', s.sortOrder);
      const p = newPage ?? page;
      if (p > 1) params.set('page', String(p));
      const l = newLimit ?? limit;
      if (l !== 10) params.set('limit', String(l));
      setSearchParams(params, { replace: true });
    },
    [filters, sorting, page, limit, setSearchParams]
  );

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      setPage(1);
      syncUrl(newFilters, undefined, 1, undefined);
    },
    [syncUrl]
  );

  const handleResetFilters = useCallback(() => {
    const empty = {};
    setFilters(empty);
    setPage(1);
    syncUrl(empty, undefined, 1, undefined);
  }, [syncUrl]);

  const handleSortChange = useCallback(
    (sortBy, sortOrder) => {
      const newSort = { sortBy, sortOrder };
      setSorting(newSort);
      setPage(1);
      syncUrl(undefined, newSort, 1, undefined);
    },
    [syncUrl]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      setPage(newPage);
      syncUrl(undefined, undefined, newPage, undefined);
    },
    [syncUrl]
  );

  const handleLimitChange = useCallback(
    (newLimit) => {
      setLimit(newLimit);
      setPage(1);
      syncUrl(undefined, undefined, 1, newLimit);
    },
    [syncUrl]
  );

  const handleTabChange = useCallback(
    (tab) => {
      const newFilters = {
        ...filters,
        status: tab === 'all' ? undefined : tab,
      };
      handleFilterChange(newFilters);
    },
    [filters, handleFilterChange]
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle={
          pagination
            ? `${pagination.totalItems} total client${pagination.totalItems !== 1 ? 's' : ''}`
            : 'Manage your clients'
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={() => navigate('/clients/new')}>
              <Plus className="h-4 w-4 mr-1" /> Add Client
            </Button>
          </div>
        }
      />

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <ClientFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={pagination?.totalItems}
      />

      {/* Table */}
      <ClientTable
        data={clients}
        pagination={pagination}
        sorting={sorting}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        isLoading={isLoading}
        isFetching={isFetching}
        onDelete={(client) => setDeleteTarget(client)}
        hasFilters={hasActiveFilters}
        onClearFilters={handleResetFilters}
      />

      {/* Delete Dialog */}
      <DeleteClientDialog
        client={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={() => setDeleteTarget(null)}
      />
    </div>
  );
}

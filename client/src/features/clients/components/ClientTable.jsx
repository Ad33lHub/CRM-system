import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function formatCurrency(amount, currency = 'PKR') {
  if (!amount && amount !== 0) return '—';
  return `${currency} ${Number(amount).toLocaleString()}`;
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLabel(v) {
  if (!v) return '—';
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

const VISIBLE_COLS_KEY = 'client_table_cols';

export default function ClientTable({
  data = [],
  pagination,
  sorting,
  onSortChange,
  onPageChange,
  onLimitChange,
  isLoading,
  isFetching,
  onDelete,
  hasFilters,
  onClearFilters,
}) {
  const navigate = useNavigate();
  const [rowSelection, setRowSelection] = useState({});

  // Column visibility persistence
  const [columnVisibility, setColumnVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_COLS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(VISIBLE_COLS_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'companyName',
        header: 'Company',
        enableSorting: true,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border">
                {c.avatar && <AvatarImage src={c.avatar} />}
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                  {(c.companyName || '').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{c.companyName}</p>
                <Badge variant="outline" className="text-[10px] mt-0.5">
                  {formatLabel(c.industry)}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        id: 'primaryContact',
        header: 'Primary Contact',
        enableSorting: false,
        cell: ({ row }) => {
          const pc = row.original.primaryContact || row.original.contacts?.[0];
          if (!pc) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <div className="text-sm">
              <p className="font-medium">{pc.name}</p>
              {pc.email && (
                <p className="text-xs text-muted-foreground">{pc.email}</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      },
      {
        accessorKey: 'source',
        header: 'Source',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-sm">{formatLabel(getValue())}</span>
        ),
      },
      {
        accessorKey: 'totalRevenue',
        header: 'Revenue',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatCurrency(row.original.totalRevenue, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: 'assignedTo',
        header: 'Assigned To',
        enableSorting: false,
        cell: ({ getValue }) => {
          const user = getValue();
          if (!user)
            return (
              <span className="text-sm text-muted-foreground italic">Unassigned</span>
            );
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {user.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback className="text-[10px]">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {user.firstName} {user.lastName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(getValue())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 50,
        cell: ({ row }) => {
          const client = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => navigate(`/clients/${client._id || client.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" /> View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/clients/${client._id || client.id}`)}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(client)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [navigate, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      columnVisibility,
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  const selectedCount = Object.keys(rowSelection).length;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border border-border rounded-lg">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={hasFilters ? 'No clients match your filters' : 'No clients yet'}
        description={
          hasFilters
            ? 'Try adjusting your search or filters'
            : 'Start by adding your first client'
        }
        action={
          hasFilters
            ? { label: 'Clear Filters', onClick: onClearFilters }
            : { label: 'Add Client', onClick: () => navigate('/clients/new') }
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedCount} client{selectedCount > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Subtle loading bar on refetch */}
      {isFetching && !isLoading && (
        <div className="h-0.5 w-full bg-primary/20 rounded overflow-hidden">
          <div className="h-full w-1/3 bg-primary animate-pulse rounded" />
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.column.getSize() }}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => {
                          const col = header.column.id;
                          const isCurrentSort = sorting?.sortBy === col;
                          const newOrder =
                            isCurrentSort && sorting?.sortOrder === 'asc' ? 'desc' : 'asc';
                          onSortChange?.(col, newOrder);
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() =>
                  navigate(`/clients/${row.original._id || row.original.id}`)
                }
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.totalItems)}–
              {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
            </span>{' '}
            of <span className="font-medium text-foreground">{pagination.totalItems}</span>{' '}
            clients
          </p>
          <div className="flex items-center gap-2">
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange?.(Number(e.target.value))}
              className="h-8 px-2 text-sm border border-input rounded-md bg-background"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

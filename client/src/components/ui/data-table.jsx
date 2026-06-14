import * as React from "react"
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

export function DataTable({
  columns,
  data = [],
  loading = false,
  pagination, // e.g. { pageIndex, pageSize, pageCount, totalCount }
  onPageChange,
  searchable = false,
  searchPlaceholder = "Search records...",
}) {
  const [sorting, setSorting] = React.useState([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [searchValue, setSearchValue] = React.useState("")

  // Debounced search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setGlobalFilter(searchValue)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchValue])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const isServerPaged = !!pagination
  const pageIndex = isServerPaged ? pagination.pageIndex : table.getState().pagination.pageIndex
  const pageCount = isServerPaged ? pagination.pageCount : table.getPageCount()
  const canPreviousPage = isServerPaged ? pageIndex > 0 : table.getCanPreviousPage()
  const canNextPage = isServerPaged ? pageIndex < pageCount - 1 : table.getCanNextPage()

  const handlePageChange = (index) => {
    if (index < 0 || index >= pageCount) return
    if (isServerPaged) {
      if (onPageChange) onPageChange(index)
    } else {
      table.setPageIndex(index)
    }
  }

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    if (pageCount <= maxVisible) {
      for (let i = 0; i < pageCount; i++) pages.push(i)
    } else {
      let start = Math.max(0, pageIndex - 2)
      let end = Math.min(pageCount - 1, pageIndex + 2)
      if (pageIndex <= 2) {
        end = 4
      } else if (pageIndex >= pageCount - 3) {
        start = pageCount - 5
      }
      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="w-full space-y-4">
      {searchable && (
        <div className="relative flex items-center max-w-sm">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getCanSort() &&
                        "select-none cursor-pointer hover:bg-muted/50 transition-colors"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5 py-2.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span>
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`} className="py-3">
                      <Skeleton className="h-5 w-full bg-muted/80" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium text-muted-foreground">No records found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (canPreviousPage) handlePageChange(pageIndex - 1)
                  }}
                  className={cn(
                    "cursor-pointer",
                    !canPreviousPage && "pointer-events-none opacity-40"
                  )}
                />
              </PaginationItem>

              {pageNumbers[0] > 0 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(0)
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {pageNumbers[0] > 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {pageNumbers.map((num) => (
                <PaginationItem key={num}>
                  <PaginationLink
                    href="#"
                    isActive={num === pageIndex}
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(num)
                    }}
                  >
                    {num + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {pageNumbers[pageNumbers.length - 1] < pageCount - 1 && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < pageCount - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(pageCount - 1)
                      }}
                    >
                      {pageCount}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (canNextPage) handlePageChange(pageIndex + 1)
                  }}
                  className={cn(
                    "cursor-pointer",
                    !canNextPage && "pointer-events-none opacity-40"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

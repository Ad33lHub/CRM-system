import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'lead', label: 'Lead' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
];

const INDUSTRY_OPTIONS = [
  { value: 'all', label: 'All Industries' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'upwork', label: 'Upwork' },
  { value: 'fiverr', label: 'Fiverr' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

export default function ClientFilters({ filters, onChange, onReset, totalResults }) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        onChange({ ...filters, search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // Debounce only on search input changes; filters/onChange are read fresh each run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSelect = (key, value) => {
    onChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  const hasActive =
    filters.search || filters.status || filters.industry || filters.source;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies, contacts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onChange({ ...filters, search: undefined });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => handleSelect('status', v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Industry */}
        <Select
          value={filters.industry || 'all'}
          onValueChange={(v) => handleSelect('industry', v)}
        >
          <SelectTrigger className="w-[150px] hidden md:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source */}
        <Select
          value={filters.source || 'all'}
          onValueChange={(v) => handleSelect('source', v)}
        >
          <SelectTrigger className="w-[140px] hidden lg:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActive && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {totalResults !== undefined && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{totalResults}</span> client
          {totalResults !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

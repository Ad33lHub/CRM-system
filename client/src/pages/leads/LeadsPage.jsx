import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { ConfirmDialog } from '../../components/ui/confirm-dialog.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import {
  useGetLeadsQuery,
  useGetLeadsMembersQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
} from '../../services/leadsApi.js';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Activity,
  Globe,
  Share2,
  UserCheck,
  FileSpreadsheet,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

const STAGES = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const SOURCES = ['Manual', 'Website', 'Referral', 'Social', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];

// Helper to format currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// Helper for initials
const getInitials = (user) => {
  if (!user) return 'UN';
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return user.email ? user.email.slice(0, 2).toUpperCase() : 'U';
};

// Source Icon selector
const getSourceIcon = (source) => {
  switch (source) {
    case 'Manual':
      return <User className="w-3.5 h-3.5" />;
    case 'Website':
      return <Globe className="w-3.5 h-3.5" />;
    case 'Referral':
      return <Share2 className="w-3.5 h-3.5" />;
    case 'Social':
      return <TrendingUp className="w-3.5 h-3.5" />;
    default:
      return <FolderOpen className="w-3.5 h-3.5" />;
  }
};

export default function LeadsPage() {
  const { role, user: currentUser, token } = useAuth();

  // RTK Query hooks
  const { data: leadsResponse, isLoading: isLeadsLoading, refetch: refetchLeads } = useGetLeadsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: membersResponse } = useGetLeadsMembersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const leads = leadsResponse?.data || [];
  const members = membersResponse?.data || [];

  // Local state for layout & views
  const [view, setView] = useState(() => localStorage.getItem('leads_view') || 'kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState(['All']);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assignedToFilter, setAssignedToFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Sorting for Table View
  const [sortField, setSortField] = useState('Name'); // Name | Value | Date | Stage | Priority
  const [sortDirection, setSortDirection] = useState('asc');

  // Drag & drop support
  const [draggedLead, setDraggedLead] = useState(null);
  const [activeDragStage, setActiveDragStage] = useState(null);

  // Side drawer controls
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create'); // create | edit | view
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Form values state
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    source: 'Manual',
    stage: 'New',
    value: 0,
    priority: 'Medium',
    assignedTo: '',
    expectedCloseDate: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Inline notes editing in details view
  const [notesEditing, setNotesEditing] = useState(false);
  const [editedNotesValue, setEditedNotesValue] = useState('');

  // Bulk actions selection
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  // Deletion confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Persist view preference
  useEffect(() => {
    localStorage.setItem('leads_view', view);
  }, [view]);

  // Sync Assigned To filter for sales rep role
  useEffect(() => {
    if (role !== 'super_admin' && role !== 'admin' && role !== 'manager' && currentUser) {
      setAssignedToFilter(currentUser.id || currentUser._id);
    }
  }, [role, currentUser]);

  // Calculate Global metrics
  const metrics = useMemo(() => {
    const totalCount = leads.length;
    const nonLostLeads = leads.filter((l) => l.stage !== 'Lost');
    const pipelineSum = nonLostLeads.reduce((sum, l) => sum + (l.value || 0), 0);

    // Won this calendar month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const wonThisMonth = leads.filter((l) => {
      if (l.stage !== 'Won') return false;
      const date = new Date(l.updatedAt || l.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const wonThisMonthCount = wonThisMonth.length;
    const wonThisMonthValue = wonThisMonth.reduce((sum, l) => sum + (l.value || 0), 0);

    // Conversion rate
    const wonLeadsCount = leads.filter((l) => l.stage === 'Won').length;
    const conversionRate = totalCount > 0 ? ((wonLeadsCount / totalCount) * 100).toFixed(1) : '0.0';

    return {
      totalLeads: totalCount,
      pipelineValue: pipelineSum,
      wonThisMonthCount,
      wonThisMonthValue,
      conversionRate,
    };
  }, [leads]);

  // Combined filters logic (AND logic)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.fullName?.toLowerCase().includes(q);
        const matchCompany = lead.company?.toLowerCase().includes(q);
        const matchEmail = lead.email?.toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchEmail) return false;
      }

      // 2. Stage pills
      if (selectedStages.length > 0 && !selectedStages.includes('All')) {
        if (!selectedStages.includes(lead.stage)) return false;
      }

      // 3. Priority
      if (priorityFilter !== 'All') {
        if (lead.priority !== priorityFilter) return false;
      }

      // 4. Source
      if (sourceFilter !== 'All') {
        if (lead.source !== sourceFilter) return false;
      }

      // 5. Assigned To (Sales Rep is locked backend-side, but filter matches client-side too)
      if (assignedToFilter !== 'All') {
        const leadAssigneeId = lead.assignedTo?._id || lead.assignedTo;
        if (String(leadAssigneeId) !== String(assignedToFilter)) return false;
      }

      // 6. Date Range
      if (dateRange.start) {
        if (!lead.expectedCloseDate || new Date(lead.expectedCloseDate) < new Date(dateRange.start)) return false;
      }
      if (dateRange.end) {
        if (!lead.expectedCloseDate || new Date(lead.expectedCloseDate) > new Date(dateRange.end)) return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedStages, priorityFilter, sourceFilter, assignedToFilter, dateRange]);

  // Sorting logic for Table View
  const sortedLeads = useMemo(() => {
    if (view !== 'table') return filteredLeads;
    const sorted = [...filteredLeads];

    sorted.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'Name':
          valA = a.fullName || '';
          valB = b.fullName || '';
          break;
        case 'Value':
          valA = a.value || 0;
          valB = b.value || 0;
          break;
        case 'Date':
          valA = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
          valB = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
          break;
        case 'Stage':
          valA = STAGES.indexOf(a.stage);
          valB = STAGES.indexOf(b.stage);
          break;
        case 'Priority':
          valA = PRIORITIES.indexOf(a.priority);
          valB = PRIORITIES.indexOf(b.priority);
          break;
        default:
          return 0;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return sorted;
  }, [filteredLeads, sortField, sortDirection, view]);

  // Toggle stage selection pill
  const handleStagePillClick = (stage) => {
    if (stage === 'All') {
      setSelectedStages(['All']);
      return;
    }

    let next = selectedStages.filter((s) => s !== 'All');
    if (next.includes(stage)) {
      next = next.filter((s) => s !== stage);
      if (next.length === 0) next = ['All'];
    } else {
      next.push(stage);
    }
    setSelectedStages(next);
  };

  // Filter count computation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedStages.length > 0 && !selectedStages.includes('All')) count += selectedStages.length;
    if (priorityFilter !== 'All') count++;
    if (sourceFilter !== 'All') count++;
    if (assignedToFilter !== 'All' && (role === 'super_admin' || role === 'admin' || role === 'manager')) count++;
    if (dateRange.start || dateRange.end) count++;
    return count;
  }, [searchQuery, selectedStages, priorityFilter, sourceFilter, assignedToFilter, dateRange, role]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStages(['All']);
    setPriorityFilter('All');
    if (role === 'super_admin' || role === 'admin' || role === 'manager') {
      setAssignedToFilter('All');
    }
    setSourceFilter('All');
    setDateRange({ start: '', end: '' });
  };

  // Validation function
  const validateField = (name, value) => {
    let error = '';
    if (name === 'fullName') {
      if (!value || value.trim().length < 2) {
        error = 'Full Name is required (min 2 chars)';
      }
    } else if (name === 'email') {
      if (!value) {
        error = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Invalid email address format';
      }
    } else if (name === 'notes') {
      if (value && value.length > 500) {
        error = 'Notes cannot exceed 500 characters';
      }
    }
    return error;
  };

  const handleFormFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (touchedFields[name]) {
      const err = validateField(name, value);
      setFormErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleFormFieldBlur = (name, value) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: err }));
  };

  // Enable/disable form save button
  const isFormInvalid = useMemo(() => {
    if (!formValues.fullName || !formValues.email) return true;
    const nameErr = validateField('fullName', formValues.fullName);
    const emailErr = validateField('email', formValues.email);
    if (nameErr || emailErr) return true;
    return Object.values(formErrors).some((err) => !!err);
  }, [formValues, formErrors]);

  // Handle open creation side drawer
  const openCreateDrawer = () => {
    setFormValues({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      source: 'Manual',
      stage: 'New',
      value: 0,
      priority: 'Medium',
      assignedTo: role === 'super_admin' || role === 'admin' || role === 'manager' ? '' : currentUser?.id || currentUser?._id || '',
      expectedCloseDate: '',
      notes: '',
    });
    setFormErrors({});
    setTouchedFields({});
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  // Handle open Edit form in side drawer
  const openEditDrawer = (lead) => {
    const assignedId = lead.assignedTo?._id || lead.assignedTo || '';
    setFormValues({
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source,
      stage: lead.stage,
      value: lead.value || 0,
      priority: lead.priority,
      assignedTo: assignedId,
      expectedCloseDate: lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().split('T')[0] : '',
      notes: lead.notes || '',
    });
    setFormErrors({});
    setTouchedFields({});
    setSelectedLeadId(lead._id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  // Save/Update Lead
  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (isFormInvalid) return;

    try {
      if (drawerMode === 'create') {
        const payload = { ...formValues };
        if (!payload.assignedTo) payload.assignedTo = null;

        const res = await createLead(payload).unwrap();
        if (res.success) {
          toast.success('Lead created and appended successfully');
          setDrawerOpen(false);
        } else {
          toast.error(res.message || 'Failed to save lead');
        }
      } else {
        const payload = { ...formValues };
        if (!payload.assignedTo) payload.assignedTo = null;

        const res = await updateLead({ id: selectedLeadId, data: payload }).unwrap();
        if (res.success) {
          toast.success('Lead updated successfully');
          setDrawerOpen(false);
        } else {
          toast.error(res.message || 'Failed to save lead');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.data?.message || 'Failed to save lead — please try again.');
    }
  };

  // Open Details view drawer
  const openDetailsDrawer = (lead) => {
    setSelectedLeadId(lead._id);
    setDrawerMode('view');
    setDrawerOpen(true);
    setNotesEditing(false);
  };

  // Currently viewing lead object
  const activeLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return leads.find((l) => l._id === selectedLeadId);
  }, [selectedLeadId, leads]);

  // Handle stage transition from detail stepper or Move Next buttons
  const handleMoveToNextStage = async (lead) => {
    const currentIdx = STAGES.indexOf(lead.stage);
    if (currentIdx === -1 || currentIdx >= STAGES.indexOf('Won')) return; // Won/Lost is terminal
    const nextStage = STAGES[currentIdx + 1];

    try {
      const res = await updateLead({ id: lead._id, data: { stage: nextStage } }).unwrap();
      if (res.success) {
        toast.success(`Lead moved to ${nextStage}`);
      } else {
        toast.error(res.message || 'Failed to update stage');
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update stage');
    }
  };

  // Inline notes update
  const handleUpdateNotes = async () => {
    if (editedNotesValue.length > 500) {
      toast.error('Notes cannot exceed 500 characters');
      return;
    }

    try {
      const res = await updateLead({ id: activeLead._id, data: { notes: editedNotesValue } }).unwrap();
      if (res.success) {
        toast.success('Notes updated successfully');
        setNotesEditing(false);
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update notes');
    }
  };

  // Lead Delete Trigger
  const triggerDeleteLead = (lead) => {
    setLeadToDelete(lead);
    setDeleteConfirmOpen(true);
  };

  // Perform delete
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    try {
      const res = await deleteLead(leadToDelete._id).unwrap();
      if (res.success) {
        toast.success(`Lead "${leadToDelete.fullName}" deleted successfully`);
        if (drawerOpen && selectedLeadId === leadToDelete._id) {
          setDrawerOpen(false);
        }
      } else {
        toast.error(res.message || 'Failed to delete lead');
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to delete lead');
    } finally {
      setLeadToDelete(null);
    }
  };

  // Drag & drop update stage
  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.setData('leadId', lead._id);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    setActiveDragStage(stage);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setActiveDragStage(null);
    const leadId = e.dataTransfer.getData('leadId') || draggedLead?._id;
    if (!leadId) return;

    const lead = leads.find((l) => l._id === leadId);
    if (!lead) return;

    // Quality gate: block drops from New directly to Won/Lost
    if (lead.stage === 'New' && (targetStage === 'Won' || targetStage === 'Lost')) {
      toast.error('Qualify this lead before marking as won or lost');
      setDraggedLead(null);
      return;
    }

    if (lead.stage === targetStage) {
      setDraggedLead(null);
      return;
    }

    // Call API (RTK updates state optimistically)
    try {
      const res = await updateLead({ id: leadId, data: { stage: targetStage } }).unwrap();
      if (res.success) {
        toast.success(`Lead moved to ${targetStage}`);
      } else {
        toast.error(res.message || 'Failed to save stage change');
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to save lead — please try again.');
    } finally {
      setDraggedLead(null);
    }
  };

  // CSV Export action (fetch as blob with token)
  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/leads/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_pipeline_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Pipeline CSV exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export pipeline data');
    }
  };

  // Table sorting triggers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Bulk actions triggers
  const handleSelectAllRows = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(sortedLeads.map((l) => l._id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRowIds((prev) => [...prev, id]);
    } else {
      setSelectedRowIds((prev) => prev.filter((rid) => rid !== id));
    }
  };

  // Execute bulk delete
  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) return;
    if (window.confirm(`Delete ${selectedRowIds.length} selected leads? This cannot be undone.`)) {
      let successCount = 0;
      let failCount = 0;
      for (const id of selectedRowIds) {
        try {
          const leadObj = leads.find((l) => l._id === id);
          // Standard delete validation matches backend checks (Users/Managers cannot delete Won/Lost or arbitrary leads)
          const res = await deleteLead(id).unwrap();
          if (res.success) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }
      setSelectedRowIds([]);
      toast.success(`Successfully deleted ${successCount} leads.${failCount > 0 ? ` Failed to delete ${failCount} leads due to permissions.` : ''}`);
    }
  };

  // Execute bulk stage change
  const handleBulkStageChange = async (targetStage) => {
    if (selectedRowIds.length === 0) return;
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedRowIds) {
      try {
        const leadObj = leads.find((l) => l._id === id);
        if (leadObj.stage === 'New' && (targetStage === 'Won' || targetStage === 'Lost')) {
          failCount++;
          continue;
        }
        const res = await updateLead({ id, data: { stage: targetStage } }).unwrap();
        if (res.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setSelectedRowIds([]);
    toast.success(`Updated ${successCount} leads to stage: ${targetStage}.${failCount > 0 ? ` Failed to update ${failCount} leads (Quality gate or RBAC).` : ''}`);
  };

  // Execute bulk reassign
  const handleBulkReassign = async (assigneeId) => {
    if (selectedRowIds.length === 0) return;
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedRowIds) {
      try {
        const res = await updateLead({ id, data: { assignedTo: assigneeId || null } }).unwrap();
        if (res.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setSelectedRowIds([]);
    toast.success(`Reassigned ${successCount} leads.${failCount > 0 ? ` Failed to reassign ${failCount} leads (RBAC restricted).` : ''}`);
  };

  // Format stage badges
  const getStageBadgeColor = (stage) => {
    switch (stage) {
      case 'New':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Contacted':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'Qualified':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      case 'Won':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Lost':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
    }
  };

  // Priority Badge Color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-slate-800 text-slate-400 border border-slate-700';
      case 'Medium':
        return 'bg-amber-950/40 text-amber-400 border border-amber-800/30';
      case 'High':
        return 'bg-rose-950/40 text-rose-400 border border-rose-800/30';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  // Group leads by stage for Kanban board columns
  const kanbanLeadsByStage = useMemo(() => {
    const map = { New: [], Contacted: [], Qualified: [], Won: [], Lost: [] };
    filteredLeads.forEach((lead) => {
      if (map[lead.stage]) {
        map[lead.stage].push(lead);
      }
    });
    return map;
  }, [filteredLeads]);

  return (
    <div className="space-y-6 text-slate-100 min-h-screen pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Leads & Pipeline"
          subtitle="Manage business opportunities, prospective clients, and deal pipeline"
        />
        <div className="flex items-center gap-3 self-end md:self-auto">
          {['super_admin', 'admin'].includes(role) && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-200 transition"
              title="Export Full Pipeline to CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
          <button
            onClick={openCreateDrawer}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Total Leads</span>
            <div className="text-3xl font-bold">{metrics.totalLeads}</div>
          </div>
          <div className="p-3 bg-indigo-950/40 border border-indigo-900/30 rounded-lg">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Pipeline Value</span>
            <div className="text-3xl font-bold text-emerald-400">{formatCurrency(metrics.pipelineValue)}</div>
          </div>
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Won This Month */}
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Won This Month</span>
            <div className="text-3xl font-bold">{metrics.wonThisMonthCount}</div>
            <div className="text-xs text-slate-400">
              Value: <span className="text-emerald-400 font-medium">{formatCurrency(metrics.wonThisMonthValue)}</span>
            </div>
          </div>
          <div className="p-3 bg-amber-950/40 border border-amber-900/30 rounded-lg">
            <CheckCircle className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Conversion Rate</span>
            <div className="text-3xl font-bold text-indigo-400">{metrics.conversionRate}%</div>
          </div>
          <div className="p-3 bg-purple-950/40 border border-purple-900/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Toolbar Filters Panel */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left search & selections */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Live Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg text-sm placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            {/* Date Rangepicker */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-slate-100 focus:outline-none w-[110px]"
                title="Start Expected Close Date"
              />
              <span className="text-slate-600">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-slate-100 focus:outline-none w-[110px]"
                title="End Expected Close Date"
              />
            </div>
          </div>

          {/* Right toggles & View selector */}
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition"
              >
                Clear all filters
              </button>
            )}

            {/* View Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setView('kanban')}
                className={`p-1.5 rounded-md transition ${
                  view === 'kanban' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Kanban View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`p-1.5 rounded-md transition ${
                  view === 'table' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Selectors Row */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-800/60 pt-3">
          {/* Stage Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium mr-1">Stages:</span>
            {['All', ...STAGES].map((stage) => {
              const active = selectedStages.includes(stage);
              return (
                <button
                  key={stage}
                  onClick={() => handleStagePillClick(stage)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  {stage}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="hidden lg:block h-4 w-px bg-slate-800 mx-2" />

          {/* Priority dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-600 transition"
            >
              <option value="All">All</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Source dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-600 transition"
            >
              <option value="All">All</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To Dropdown (Lock/Hide for sales rep) */}
          {(role === 'super_admin' || role === 'admin' || role === 'manager') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Assigned To:</span>
              <select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-600 transition"
              >
                <option value="All">All</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Leads listing content */}
      {isLeadsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading your pipeline...</p>
        </div>
      ) : sortedLeads.length === 0 ? (
        <div className="bg-[#111827]/40 border border-slate-800 rounded-xl py-16 px-4 flex flex-col items-center justify-center text-center shadow-md">
          <FolderOpen className="w-12 h-12 text-slate-600 mb-4" />
          {leads.length === 0 ? (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-200">Your pipeline is empty</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Add a new lead to start tracking opportunities and converting sales.
              </p>
              <button
                onClick={openCreateDrawer}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white shadow-md transition"
              >
                Create New Lead
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-200">No leads match your filters</h3>
              <p className="text-sm text-slate-500">Try loosening your search criteria or selecting other stages.</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      ) : view === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none h-[calc(100vh-320px)] min-h-[500px]">
          {STAGES.map((stage) => {
            const columnLeads = kanbanLeadsByStage[stage] || [];
            const isDraggingOver = activeDragStage === stage;
            const leadsSum = columnLeads.reduce((sum, l) => sum + (l.value || 0), 0);

            // Check if drop is blocked (currently dragged lead is New and column is Won/Lost)
            const isDropBlocked = draggedLead?.stage === 'New' && (stage === 'Won' || stage === 'Lost');

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={() => setActiveDragStage(null)}
                onDrop={(e) => handleDrop(e, stage)}
                className={`flex-1 min-w-[280px] max-w-[360px] bg-slate-900/60 border rounded-xl flex flex-col transition relative ${
                  isDraggingOver
                    ? isDropBlocked
                      ? 'border-rose-500/50 bg-rose-950/10'
                      : 'border-indigo-500/50 bg-slate-800/50'
                    : 'border-slate-800'
                }`}
              >
                {/* Column Stepper Block Warning */}
                {isDraggingOver && isDropBlocked && (
                  <div className="absolute inset-0 z-30 bg-slate-950/85 rounded-xl flex flex-col items-center justify-center p-4 text-center gap-2 transition duration-200">
                    <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
                    <span className="text-sm font-bold text-rose-400">Dropping Blocked</span>
                    <span className="text-xs text-slate-400">Qualify this lead before marking as won or lost.</span>
                  </div>
                )}

                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-800/80 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                      {stage}
                      <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full font-semibold">
                        {columnLeads.length}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">{formatCurrency(leadsSum)}</span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin">
                  {columnLeads.length === 0 ? (
                    <div className="h-28 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                      No leads
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={() => setDraggedLead(null)}
                        onClick={() => openDetailsDrawer(lead)}
                        className="group bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition relative flex flex-col gap-3"
                      >
                        {/* Top corner hover actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDrawer(lead);
                            }}
                            className="p-1 bg-slate-850 border border-slate-700 hover:bg-slate-700 hover:text-indigo-400 rounded text-slate-400 transition"
                            title="Edit Lead"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {role !== 'developer' && role !== 'designer' && role !== 'qa_engineer' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerDeleteLead(lead);
                              }}
                              className="p-1 bg-slate-850 border border-slate-700 hover:bg-slate-700 hover:text-rose-400 rounded text-slate-400 transition"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Name and Company */}
                        <div className="space-y-1 pr-10">
                          <h4 className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition line-clamp-1">
                            {lead.fullName}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {lead.company ? lead.company : '—'}
                          </p>
                        </div>

                        {/* Middle Attributes */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityBadgeColor(lead.priority)}`}>
                            {lead.priority}
                          </span>
                          <span className="text-xs font-bold text-slate-350">{formatCurrency(lead.value)}</span>
                        </div>

                        {/* Footer details */}
                        <div className="flex items-center justify-between border-t border-slate-800/40 pt-2.5 mt-0.5">
                          {/* Close Date */}
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-550" />
                            {lead.expectedCloseDate
                              ? new Date(lead.expectedCloseDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'no date'}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Source Icon */}
                            <span className="text-slate-500 hover:text-slate-400 transition" title={`Source: ${lead.source}`}>
                              {getSourceIcon(lead.source)}
                            </span>

                            {/* Assignee Avatar */}
                            <div
                              className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-semibold text-slate-300"
                              title={lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
                            >
                              {getInitials(lead.assignedTo)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Add button for New stage only */}
                {stage === 'New' && (
                  <button
                    onClick={openCreateDrawer}
                    className="m-2.5 p-2 bg-slate-950 border border-slate-800/80 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lead</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Bulk Action Controls Bar */}
          {selectedRowIds.length > 0 && (
            <div className="bg-indigo-950/40 border-b border-indigo-900/40 p-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in-20">
              <div className="flex items-center gap-2 text-sm text-indigo-300 font-medium">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                <span>{selectedRowIds.length} lead(s) selected</span>
              </div>
              <div className="flex items-center gap-3.5 flex-wrap">
                {/* Stage Change */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Change Stage:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkStageChange(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-600 transition"
                  >
                    <option value="">Select Stage...</option>
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reassign */}
                {(role === 'super_admin' || role === 'admin' || role === 'manager') && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Reassign:</span>
                    <select
                      onChange={(e) => {
                        handleBulkReassign(e.target.value);
                        e.target.value = '';
                      }}
                      className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-600 transition"
                    >
                      <option value="">Select Member...</option>
                      <option value="unassigned">Unassigned</option>
                      {members.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.firstName} {m.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delete */}
                {role !== 'developer' && role !== 'designer' && role !== 'qa_engineer' && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded text-xs font-semibold text-white transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedRowIds([])}
                  className="text-xs text-slate-400 hover:text-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold text-xs border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-[40px]">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length > 0 && selectedRowIds.length === sortedLeads.length}
                      onChange={handleSelectAllRows}
                      className="rounded border-slate-800 bg-slate-950 accent-indigo-600 cursor-pointer"
                    />
                  </th>
                  <th onClick={() => handleSort('Name')} className="py-3 px-4 cursor-pointer hover:bg-slate-950 transition">
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      {sortField === 'Name' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="py-3 px-4">Company</th>
                  <th onClick={() => handleSort('Stage')} className="py-3 px-4 cursor-pointer hover:bg-slate-950 transition">
                    <div className="flex items-center gap-1">
                      <span>Stage</span>
                      {sortField === 'Stage' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('Priority')} className="py-3 px-4 cursor-pointer hover:bg-slate-950 transition">
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      {sortField === 'Priority' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('Value')} className="py-3 px-4 cursor-pointer hover:bg-slate-950 transition">
                    <div className="flex items-center gap-1">
                      <span>Value</span>
                      {sortField === 'Value' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th onClick={() => handleSort('Date')} className="py-3 px-4 cursor-pointer hover:bg-slate-950 transition">
                    <div className="flex items-center gap-1">
                      <span>Close Date</span>
                      {sortField === 'Date' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {sortedLeads.map((lead) => {
                  const isChecked = selectedRowIds.includes(lead._id);
                  return (
                    <tr
                      key={lead._id}
                      onClick={() => openDetailsDrawer(lead)}
                      className={`hover:bg-slate-800/30 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-600/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(lead._id, e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">{lead.fullName}</td>
                      <td className="py-3 px-4 text-slate-400">{lead.company ? lead.company : '—'}</td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {/* Chevron dropdown for changing stage */}
                        <div className="relative inline-block text-left">
                          <div className="group flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStageBadgeColor(lead.stage)}`}>
                              {lead.stage}
                            </span>
                            <select
                              value={lead.stage}
                              onChange={async (e) => {
                                const newStage = e.target.value;
                                if (lead.stage === 'New' && (newStage === 'Won' || newStage === 'Lost')) {
                                  toast.error('Qualify this lead before marking as won or lost');
                                  return;
                                }
                                try {
                                  const res = await updateLead({ id: lead._id, data: { stage: newStage } }).unwrap();
                                  if (res.success) toast.success(`Lead moved to ${newStage}`);
                                } catch (err) {
                                  toast.error(err.data?.message || 'Failed to update stage');
                                }
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityBadgeColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">{formatCurrency(lead.value)}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          {getSourceIcon(lead.source)}
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {lead.assignedTo ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-350">
                              {getInitials(lead.assignedTo)}
                            </div>
                            <span className="text-slate-300 font-medium">
                              {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-medium">
                        {lead.expectedCloseDate
                          ? new Date(lead.expectedCloseDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDrawer(lead)}
                            className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:text-indigo-400 rounded transition"
                            title="Edit Lead"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {role !== 'developer' && role !== 'designer' && role !== 'qa_engineer' && (
                            <button
                              onClick={() => triggerDeleteLead(lead)}
                              className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 hover:text-rose-450 rounded transition"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide Out Drawer Overlays */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop dim backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel content */}
          <div className="relative w-full max-w-[400px] h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Close Trigger */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* View Details Mode */}
            {drawerMode === 'view' && activeLead && (
              <div className="flex-1 overflow-y-auto flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 pr-12 space-y-3.5">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-100">{activeLead.fullName}</h3>
                    <p className="text-sm text-slate-500 font-semibold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-550" />
                      {activeLead.company ? activeLead.company : 'No Company'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStageBadgeColor(activeLead.stage)}`}>
                      {activeLead.stage}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityBadgeColor(activeLead.priority)}`}>
                      {activeLead.priority}
                    </span>
                  </div>
                </div>

                {/* Stepper progression bar */}
                <div className="px-6 py-4 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Pipeline Progress</span>
                  {activeLead.stage !== 'Won' && activeLead.stage !== 'Lost' && (
                    <button
                      onClick={() => handleMoveToNextStage(activeLead)}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                    >
                      <span>Advance</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
                  {['New', 'Contacted', 'Qualified', 'Won/Lost'].map((step, idx) => {
                    const currentIdx = STAGES.indexOf(activeLead.stage);
                    const stepIdx = idx;

                    let isCompleted = false;
                    let isActive = false;
                    let isStepLost = false;

                    if (activeLead.stage === 'Lost' && idx === 3) {
                      isStepLost = true;
                    }

                    if (currentIdx >= 3 && idx === 3) {
                      isCompleted = true;
                    } else if (currentIdx > idx) {
                      isCompleted = true;
                    } else if (currentIdx === idx) {
                      isActive = true;
                    }

                    return (
                      <div key={step} className="flex items-center gap-1 flex-1 min-w-[70px]">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                              isCompleted
                                ? isStepLost
                                  ? 'bg-rose-600 border-rose-500 text-white'
                                  : 'bg-emerald-600 border-emerald-500 text-white'
                                : isActive
                                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-400'
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[9px] font-bold ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                            {idx === 3 ? (activeLead.stage === 'Lost' ? 'Lost' : activeLead.stage === 'Won' ? 'Won' : 'Closed') : step}
                          </span>
                        </div>
                        {idx < 3 && <div className="h-0.5 bg-slate-800 flex-1 -mt-4 min-w-[10px]" />}
                      </div>
                    );
                  })}
                </div>

                {/* Key Info Details List */}
                <div className="p-6 border-b border-slate-800 space-y-4">
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wide">Key Information</h4>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850/60">
                      <span className="text-slate-500 font-medium">Email</span>
                      <a href={`mailto:${activeLead.email}`} className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {activeLead.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850/60">
                      <span className="text-slate-500 font-medium">Phone</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {activeLead.phone ? activeLead.phone : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850/60">
                      <span className="text-slate-500 font-medium">Source</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                        {getSourceIcon(activeLead.source)}
                        {activeLead.source}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850/60">
                      <span className="text-slate-500 font-medium">Assigned To</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-2">
                        {activeLead.assignedTo ? (
                          <>
                            <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300">
                              {getInitials(activeLead.assignedTo)}
                            </div>
                            <span>
                              {activeLead.assignedTo.firstName} {activeLead.assignedTo.lastName}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-650">Unassigned</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850/60">
                      <span className="text-slate-500 font-medium">Deal Value</span>
                      <span className="text-emerald-400 font-bold text-sm">{formatCurrency(activeLead.value)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-500 font-medium">Expected Close</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {activeLead.expectedCloseDate
                          ? new Date(activeLead.expectedCloseDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes section with inline edit */}
                <div className="p-6 border-b border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wide">Notes & Background</h4>
                    {!notesEditing ? (
                      <button
                        onClick={() => {
                          setEditedNotesValue(activeLead.notes || '');
                          setNotesEditing(true);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUpdateNotes}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setNotesEditing(false)}
                          className="text-xs text-slate-400 hover:text-slate-350 font-bold hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {notesEditing ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={editedNotesValue}
                        onChange={(e) => setEditedNotesValue(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-100 placeholder-slate-650 resize-y min-h-[80px]"
                        placeholder="Add customer background, requirements..."
                        maxLength={500}
                      />
                      <div className="text-[10px] text-right text-slate-500">{editedNotesValue.length}/500 chars</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/20 border border-slate-850 p-3 rounded-lg min-h-[40px] whitespace-pre-wrap">
                      {activeLead.notes ? activeLead.notes : 'No background notes logged.'}
                    </p>
                  )}
                </div>

                {/* Activity Log */}
                <div className="p-6 flex-1 flex flex-col min-h-0">
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Activity History</span>
                  </h4>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin min-h-[120px]">
                    {(!activeLead.activities || activeLead.activities.length === 0) ? (
                      <p className="text-xs text-slate-600 italic">No activity logged.</p>
                    ) : (
                      [...activeLead.activities].reverse().map((act) => {
                        const actor = act.doneBy
                          ? `${act.doneBy.firstName || ''} ${act.doneBy.lastName || ''}`.trim() || act.doneBy.email
                          : 'System';
                        return (
                          <div key={act._id} className="flex gap-3 text-xs leading-normal">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-550 border-2 border-slate-900 mt-1" />
                              <div className="w-0.5 bg-slate-800 flex-1 mt-1" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-300 font-medium">{act.note}</p>
                              <div className="text-[10px] text-slate-500 font-medium">
                                by <span className="text-slate-400">{actor}</span> ·{' '}
                                {new Date(act.date).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between gap-3">
                  <button
                    onClick={() => openEditDrawer(activeLead)}
                    className="flex-1 py-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Lead</span>
                  </button>
                  {role !== 'developer' && role !== 'designer' && role !== 'qa_engineer' && (
                    <button
                      onClick={() => triggerDeleteLead(activeLead)}
                      className="flex-1 py-2 border border-rose-900/40 bg-rose-950/10 hover:bg-rose-950/20 text-rose-450 hover:text-rose-400 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Lead</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Create/Edit Form Mode */}
            {(drawerMode === 'create' || drawerMode === 'edit') && (
              <form onSubmit={handleSaveLead} className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 pr-12">
                  <h3 className="text-lg font-bold text-slate-200">
                    {drawerMode === 'create' ? 'Create New Lead' : 'Edit Lead Details'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill in the details below to save the business lead.
                  </p>
                </div>

                {/* Form fields content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Usman Tariq"
                      value={formValues.fullName}
                      onChange={(e) => handleFormFieldChange('fullName', e.target.value)}
                      onBlur={(e) => handleFormFieldBlur('fullName', e.target.value)}
                      className={`w-full bg-slate-950 border ${
                        touchedFields.fullName && formErrors.fullName ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-600'
                      } rounded-lg px-3.5 py-2 text-sm focus:outline-none transition text-slate-200`}
                      required
                    />
                    {touchedFields.fullName && formErrors.fullName && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. usman@startup.com"
                      value={formValues.email}
                      onChange={(e) => handleFormFieldChange('email', e.target.value)}
                      onBlur={(e) => handleFormFieldBlur('email', e.target.value)}
                      className={`w-full bg-slate-950 border ${
                        touchedFields.email && formErrors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-600'
                      } rounded-lg px-3.5 py-2 text-sm focus:outline-none transition text-slate-200`}
                      required
                    />
                    {touchedFields.email && formErrors.email && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone & Company */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Phone</label>
                      <input
                        type="text"
                        placeholder="+92 300 1234567"
                        value={formValues.phone}
                        onChange={(e) => handleFormFieldChange('phone', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs focus:outline-none transition text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Company</label>
                      <input
                        type="text"
                        placeholder="e.g. Startup Co"
                        value={formValues.company}
                        onChange={(e) => handleFormFieldChange('company', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs focus:outline-none transition text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Source & Stage */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Source</label>
                      <select
                        value={formValues.source}
                        onChange={(e) => handleFormFieldChange('source', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs focus:outline-none transition text-slate-200"
                      >
                        {SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Stage</label>
                      <select
                        value={formValues.stage}
                        disabled={drawerMode === 'edit' && formValues.stage === 'New'} // Let Kanban drop or edit control stages
                        onChange={(e) => handleFormFieldChange('stage', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs focus:outline-none transition text-slate-200"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Deal Value & Close Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Deal Value ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={formValues.value}
                          onChange={(e) => handleFormFieldChange('value', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg pl-6 pr-3 py-2 text-xs focus:outline-none transition text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Expected Close</label>
                      <input
                        type="date"
                        value={formValues.expectedCloseDate}
                        onChange={(e) => handleFormFieldChange('expectedCloseDate', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs focus:outline-none transition text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Priority Segmented Control */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Priority</label>
                    <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      {PRIORITIES.map((p) => {
                        const isSelected = formValues.priority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleFormFieldChange('priority', p)}
                            className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                              isSelected ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-400 hover:text-slate-250'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned To searchable user dropdown */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Assigned To</label>
                    <select
                      value={formValues.assignedTo || ''}
                      onChange={(e) => handleFormFieldChange('assignedTo', e.target.value)}
                      disabled={role !== 'super_admin' && role !== 'admin' && role !== 'manager'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs focus:outline-none transition text-slate-200"
                    >
                      <option value="">Select Assignee...</option>
                      {members.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.firstName} {m.lastName} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes Description */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-450 font-bold uppercase tracking-wide">Notes & Background</label>
                      <span className="text-[10px] text-slate-500 font-semibold">{(formValues.notes || '').length}/500</span>
                    </div>
                    <textarea
                      placeholder="Add descriptions, specific requests, client objectives..."
                      value={formValues.notes}
                      onChange={(e) => handleFormFieldChange('notes', e.target.value)}
                      onBlur={(e) => handleFormFieldBlur('notes', e.target.value)}
                      className={`w-full bg-slate-950 border ${
                        touchedFields.notes && formErrors.notes ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-600'
                      } rounded-lg p-3 text-xs focus:outline-none text-slate-200 placeholder-slate-650 resize-y min-h-[90px]`}
                      maxLength={500}
                    />
                    {touchedFields.notes && formErrors.notes && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.notes}</p>
                    )}
                  </div>
                </div>

                {/* Footer Save buttons */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (drawerMode === 'edit') {
                        setDrawerMode('view');
                      } else {
                        setDrawerOpen(false);
                      }
                    }}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFormInvalid}
                    className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md transition ${
                      isFormInvalid ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Save Lead
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Lead */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete Lead "${leadToDelete?.fullName}"?`}
        description="This action will delete the lead record from your pipeline database. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}

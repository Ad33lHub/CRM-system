import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import Lead from '../models/Lead.model.js';
import Project from '../models/Project.model.js';
import Task from '../models/Task.model.js';
import Invoice from '../models/Invoice.model.js';
import Client from '../models/Client.model.js';
import AuditLog from '../models/AuditLog.model.js';

/* ───────── helpers ───────── */

const PERIOD_MAP = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
};

function getDateRange(period) {
  const days = PERIOD_MAP[period] || 30;
  const now = new Date();
  const currentFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousFrom = new Date(currentFrom.getTime() - days * 24 * 60 * 60 * 1000);
  return { now, currentFrom, previousTo: currentFrom, previousFrom };
}

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function relativeTime(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

const ACTION_ICONS = {
  'user.registered': 'user-plus',
  'user.login': 'log-in',
  'user.password_reset_requested': 'key',
  'user.password_reset_completed': 'shield-check',
  'invoice.paid': 'receipt',
  'invoice.created': 'file-plus',
  'project.created': 'folder-plus',
  'task.done': 'check-circle',
  'task.created': 'list-plus',
  'lead.won': 'trophy',
  'lead.created': 'target',
  'client.created': 'building-2',
};

function describeAction(action, entity, performedByName) {
  const verb = action.split('.').pop() || action;
  const readableVerb = verb.replace(/_/g, ' ');
  return `${performedByName} ${readableVerb} a ${entity.toLowerCase()}`;
}

/* ───────── controllers ───────── */

/**
 * GET /api/analytics/dashboard-stats?period=30d
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const period = req.query.period || '30d';
  const { now, currentFrom, previousTo, previousFrom } = getDateRange(period);

  const [
    revenueCurrent,
    revenuePrevious,
    activeProjectsCurrent,
    activeProjectsPrevious,
    openLeadsCurrent,
    openLeadsPrevious,
    openTasksCurrent,
    openTasksPrevious,
    totalClientsCurrent,
    totalClientsPrevious,
    overdueInvoicesCurrent,
  ] = await Promise.all([
    // 1. Revenue
    Invoice.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: currentFrom, $lte: now } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: previousFrom, $lte: previousTo } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    // 2. Active projects
    Project.countDocuments({ status: 'active' }),
    Project.countDocuments({ status: 'active', createdAt: { $lte: previousTo } }),
    // 3. Open leads
    Lead.countDocuments({ stage: { $nin: ['won', 'lost', 'Won', 'Lost'] } }),
    Lead.countDocuments({ stage: { $nin: ['won', 'lost', 'Won', 'Lost'] }, createdAt: { $lte: previousTo } }),
    // 4. Open tasks
    Task.countDocuments({ status: { $nin: ['done'] } }),
    Task.countDocuments({ status: { $nin: ['done'] }, createdAt: { $lte: previousTo } }),
    // 5. Total clients
    Client.countDocuments({}),
    Client.countDocuments({ createdAt: { $lte: previousTo } }),
    // 6. Overdue invoices
    Invoice.countDocuments({ status: 'overdue' }),
  ]);

  const revCurr = revenueCurrent[0]?.total || 0;
  const revPrev = revenuePrevious[0]?.total || 0;

  return successResponse(
    res,
    {
      period,
      stats: {
        revenue: {
          current: revCurr,
          previous: revPrev,
          change: pctChange(revCurr, revPrev),
          currency: 'PKR',
        },
        activeProjects: {
          current: activeProjectsCurrent,
          previous: activeProjectsPrevious,
          change: pctChange(activeProjectsCurrent, activeProjectsPrevious),
        },
        openLeads: {
          current: openLeadsCurrent,
          previous: openLeadsPrevious,
          change: pctChange(openLeadsCurrent, openLeadsPrevious),
        },
        openTasks: {
          current: openTasksCurrent,
          previous: openTasksPrevious,
          change: pctChange(openTasksCurrent, openTasksPrevious),
        },
        totalClients: {
          current: totalClientsCurrent,
          previous: totalClientsPrevious,
          change: pctChange(totalClientsCurrent, totalClientsPrevious),
        },
        overdueInvoices: { current: overdueInvoicesCurrent },
      },
    },
    'Dashboard stats fetched'
  );
});

/**
 * GET /api/analytics/revenue-chart?period=12m
 */
export const getRevenueChart = asyncHandler(async (req, res) => {
  const period = req.query.period || '12m';
  const months = period === '6m' ? 6 : 12;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const raw = await Invoice.aggregate([
    { $match: { status: 'paid', paidAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const rawMap = {};
  raw.forEach((r) => {
    rawMap[`${r._id.year}-${r._id.month}`] = { revenue: r.revenue, invoiceCount: r.count };
  });

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlyRevenue = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(startDate);
    d.setMonth(startDate.getMonth() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const entry = rawMap[key] || { revenue: 0, invoiceCount: 0 };
    if (d <= now) {
      monthlyRevenue.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        revenue: entry.revenue,
        invoiceCount: entry.invoiceCount,
      });
    }
  }

  return successResponse(res, monthlyRevenue, 'Revenue chart data fetched');
});

/**
 * GET /api/analytics/lead-funnel
 */
export const getLeadFunnel = asyncHandler(async (req, res) => {
  const raw = await Lead.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$stage', count: { $sum: 1 } } },
  ]);

  const stageOrder = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const stageLabels = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  };
  const stageColors = {
    new: '#6366f1',
    contacted: '#8b5cf6',
    qualified: '#3b82f6',
    proposal: '#06b6d4',
    negotiation: '#f59e0b',
    won: '#22c55e',
    lost: '#ef4444',
  };

  const countMap = {};
  raw.forEach((r) => {
    const key = r._id ? r._id.toLowerCase() : '';
    countMap[key] = (countMap[key] || 0) + r.count;
  });

  let total = 0;
  const funnelData = stageOrder.map((stage) => {
    const count = countMap[stage] || 0;
    total += count;
    return { stage: stageLabels[stage], value: stage, count, color: stageColors[stage] };
  });

  const wonCount = countMap.won || 0;
  const wonRate = total > 0 ? Math.round((wonCount / total) * 1000) / 10 : 0;

  return successResponse(res, { funnelData, wonRate, total }, 'Lead funnel data fetched');
});

/**
 * GET /api/analytics/task-status
 */
export const getTaskStatusChart = asyncHandler(async (req, res) => {
  const raw = await Task.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusConfig = {
    todo: { label: 'To Do', color: '#94a3b8' },
    in_progress: { label: 'In Progress', color: '#3b82f6' },
    review: { label: 'Review', color: '#8b5cf6' },
    testing: { label: 'Testing', color: '#f59e0b' },
    done: { label: 'Done', color: '#22c55e' },
  };

  const countMap = {};
  raw.forEach((r) => {
    countMap[r._id] = r.count;
  });

  let total = 0;
  const taskStatusData = Object.entries(statusConfig).map(([key, cfg]) => {
    const count = countMap[key] || 0;
    total += count;
    return { status: key, label: cfg.label, count, color: cfg.color };
  });

  return successResponse(res, { taskStatusData, total }, 'Task status chart data fetched');
});

/**
 * GET /api/analytics/activity-feed?page=1&limit=30&entity=&action=&userId=&dateFrom=&dateTo=
 */
export const getActivityFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, entity, action, userId, dateFrom, dateTo } = req.query;
  const { skip, limit: lim, page: pg } = getPaginationParams({ page, limit });

  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (userId) filter.performedBy = userId;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate('performedBy', 'firstName lastName avatar role'),
    AuditLog.countDocuments(filter),
  ]);

  const activities = logs.map((log) => {
    const performedByName = log.performedBy
      ? `${log.performedBy.firstName} ${log.performedBy.lastName}`
      : 'System';

    return {
      id: log._id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      performedBy: {
        name: performedByName,
        avatar: log.performedBy?.avatar || null,
        role: log.performedBy?.role || null,
      },
      description: describeAction(log.action, log.entity, performedByName),
      timeAgo: relativeTime(log.createdAt),
      createdAt: log.createdAt,
      icon: ACTION_ICONS[log.action] || 'activity',
    };
  });

  const pagination = buildPaginationMeta(total, pg, lim);

  return paginatedResponse(res, activities, pagination, 'Activity feed fetched');
});

export default {
  getDashboardStats,
  getRevenueChart,
  getLeadFunnel,
  getTaskStatusChart,
  getActivityFeed,
};

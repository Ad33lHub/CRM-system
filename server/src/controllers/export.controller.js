import asyncHandler from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.model.js';
import Attendance from '../models/Attendance.model.js';
import * as revenueService from '../services/revenueAnalytics.service.js';
import * as employeeService from '../services/employeeAnalytics.service.js';
import * as clientService from '../services/clientAnalytics.service.js';
import * as exportService from '../services/exportService.js';
import { getManagedTeamUserIds } from '../services/teamScope.service.js';
import logger from '../utils/logger.js';

const FINANCIAL_ROLES = ['super_admin', 'admin'];
const ATTENDANCE_EXPORT_ROLES = ['super_admin', 'admin', 'manager'];

function buildPeriodLabel(dateFrom, dateTo, year) {
  if (dateFrom && dateTo) return `${dateFrom} to ${dateTo}`;
  if (year) return `Year ${year}`;
  return new Date().getFullYear().toString();
}

function setDownloadHeaders(res, format, filename) {
  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
  } else {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

async function logExport(req, reportType, format, meta = {}) {
  try {
    await AuditLog.create({
      action: 'export',
      entity: 'Report',
      entityId: req.user._id,
      performedBy: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { reportType, format, ...meta },
    });
  } catch (e) {
    logger.warn('Failed to log export audit', { error: e.message });
  }
}

export const exportRevenue = asyncHandler(async (req, res) => {
  const { format = 'excel', dateFrom, dateTo } = req.query;
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const period = buildPeriodLabel(dateFrom, dateTo, year);

  const [metrics, monthly, byClient, byType, receivables] = await Promise.all([
    revenueService.getTopRevenueMetrics(),
    revenueService.getRevenueByMonth(year),
    revenueService.getRevenueByClient(dateFrom, dateTo, 20),
    revenueService.getRevenueByProjectType(dateFrom, dateTo),
    revenueService.getOutstandingReceivables(),
  ]);

  const data = { metrics, monthly, byClient, byType, receivables };
  const userName =
    `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const filename = `Revenue_Report_${ts}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

  setDownloadHeaders(res, format, filename);
  await logExport(req, 'revenue', format, { year, dateFrom, dateTo });

  if (format === 'pdf') {
    const buffer = await exportService.exportRevenuePdf(data, period, userName);
    return res.send(buffer);
  }
  const buffer = await exportService.exportRevenueExcel(data, period, userName);
  return res.send(buffer);
});

export const exportEmployees = asyncHandler(async (req, res) => {
  const { format = 'excel', period = 'last_30d', department } = req.query;
  const { employeeId } = req.query;

  let teamData;
  let single = false;

  if (employeeId) {
    single = true;
    const emp = await (
      await import('../models/Employee.model.js')
    ).default
      .findOne({ $or: [{ _id: employeeId }, { user: employeeId }] })
      .populate('user', 'firstName lastName email avatar')
      .lean();

    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const metrics = await employeeService.getProductivityMetrics(emp.user._id, period);
    teamData = {
      employees: [
        {
          employee: {
            _id: emp._id,
            userId: emp.user._id,
            name: `${emp.user.firstName} ${emp.user.lastName}`,
            department: emp.department,
            designation: emp.designation,
            employeeId: emp.employeeId,
          },
          metrics,
        },
      ],
      teamAverages: null,
    };
  } else {
    teamData = await employeeService.getTeamProductivitySummary(period, department);
  }

  const userName =
    `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const filename = `Employee_Report_${ts}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

  setDownloadHeaders(res, format, filename);
  await logExport(req, 'employees', format, { period, department, employeeId });

  if (format === 'pdf') {
    const buffer = await exportService.exportEmployeePdf({ ...teamData, single }, period, userName);
    return res.send(buffer);
  }
  const buffer = await exportService.exportEmployeeExcel(teamData, period, userName);
  return res.send(buffer);
});

export const exportClients = asyncHandler(async (req, res) => {
  const { format = 'excel', dateFrom, dateTo } = req.query;
  const { clientId } = req.query;
  const isAdmin = FINANCIAL_ROLES.includes(req.user.role);
  const period = buildPeriodLabel(dateFrom, dateTo, null);

  let clients;
  let leadConversion = null;
  let single = false;

  if (clientId) {
    single = true;
    const [summary, projects, spendTrend] = await Promise.all([
      clientService.getClientSummary(clientId),
      clientService.getClientProjectPerformance(clientId),
      isAdmin ? clientService.getClientSpendTrend(clientId, 12) : Promise.resolve([]),
    ]);
    clients = [{ ...summary, projects, spendTrend }];
  } else {
    clients = await clientService.getAllClientsSummary();
    if (isAdmin) {
      leadConversion = await clientService.getLeadConversionMetrics();
    }
  }

  if (!isAdmin) {
    const FINANCIAL_KEYS = new Set([
      'totalBilled',
      'totalCollected',
      'outstandingAmount',
      'lifetimeValue',
      'avgPaymentDays',
      'invoiceCount',
      'paidInvoiceCount',
    ]);
    clients = clients.map((c) =>
      Object.fromEntries(Object.entries(c).filter(([k]) => !FINANCIAL_KEYS.has(k)))
    );
  }

  const userName =
    `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const filename = `Client_Report_${ts}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

  setDownloadHeaders(res, format, filename);
  await logExport(req, 'clients', format, { clientId, dateFrom, dateTo });

  if (format === 'pdf') {
    const buffer = await exportService.exportClientPdf(
      { clients, leadConversion, single },
      period,
      userName,
      isAdmin
    );
    return res.send(buffer);
  }
  const buffer = await exportService.exportClientExcel(
    { clients, leadConversion },
    period,
    userName,
    isAdmin
  );
  return res.send(buffer);
});

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '--';
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
const hoursBetween = (a, b) =>
  a && b ? Number(((new Date(b) - new Date(a)) / 3_600_000).toFixed(2)) : 0;

/**
 * Export attendance.
 *  • super_admin / admin → every employee
 *  • manager            → their own team only (members of projects they manage)
 * Anyone else is rejected (the route's analytics:read guard already blocks
 * developers/designers/QA, but we double-check here).
 */
export const exportAttendance = asyncHandler(async (req, res) => {
  const { role } = req.user;
  if (!ATTENDANCE_EXPORT_ROLES.includes(role)) {
    return res
      .status(403)
      .json({ success: false, message: 'You are not allowed to export attendance' });
  }

  const { format = 'excel', dateFrom, dateTo } = req.query;
  const isAdmin = FINANCIAL_ROLES.includes(role);

  const filter = {};
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  let scopeLabel;
  if (isAdmin) {
    scopeLabel = 'All Employees';
  } else {
    const teamIds = await getManagedTeamUserIds(req.user);
    filter.user = { $in: teamIds };
    scopeLabel = 'My Team';
  }

  const logs = await Attendance.find(filter)
    .sort({ date: -1 })
    .populate('user', 'firstName lastName email role')
    .lean();

  // Daily rows for the detail sheet.
  const rows = logs.map((l) => {
    const u = l.user || {};
    return {
      date: fmtDate(l.date),
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'Unknown',
      role: u.role ?? '',
      checkIn: fmtTime(l.checkIn),
      checkOut: fmtTime(l.checkOut),
      hours: hoursBetween(l.checkIn, l.checkOut),
      status: l.status,
      ipAddress: l.ipAddress ?? '',
    };
  });

  // Per-employee summary.
  const byUser = new Map();
  logs.forEach((l) => {
    const u = l.user || {};
    const key = (u._id ?? l.user).toString();
    if (!byUser.has(key)) {
      byUser.set(key, {
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'Unknown',
        role: u.role ?? '',
        present: 0,
        late: 0,
        absent: 0,
        totalDays: 0,
        totalHours: 0,
      });
    }
    const e = byUser.get(key);
    e.totalDays += 1;
    e.totalHours += hoursBetween(l.checkIn, l.checkOut);
    if (l.status === 'late') e.late += 1;
    else if (l.status === 'absent') e.absent += 1;
    else e.present += 1; // present, half_day, remote count as attended
  });
  const summary = [...byUser.values()].map((e) => ({
    ...e,
    totalHours: Number(e.totalHours.toFixed(2)),
    attendanceRate:
      e.totalDays > 0 ? Number((((e.present + e.late) / e.totalDays) * 100).toFixed(2)) : null,
  }));

  const data = { summary, rows, scopeLabel };
  const period = buildPeriodLabel(dateFrom, dateTo, null);
  const userName =
    `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const filename = `Attendance_Report_${ts}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

  setDownloadHeaders(res, format, filename);
  await logExport(req, 'attendance', format, { dateFrom, dateTo, scope: scopeLabel });

  if (format === 'pdf') {
    const buffer = await exportService.exportAttendancePdf(data, period, userName);
    return res.send(buffer);
  }
  const buffer = await exportService.exportAttendanceExcel(data, period, userName);
  return res.send(buffer);
});

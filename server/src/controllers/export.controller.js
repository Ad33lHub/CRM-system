import asyncHandler from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.model.js';
import * as revenueService from '../services/revenueAnalytics.service.js';
import * as employeeService from '../services/employeeAnalytics.service.js';
import * as clientService from '../services/clientAnalytics.service.js';
import * as exportService from '../services/exportService.js';
import logger from '../utils/logger.js';

const FINANCIAL_ROLES = ['super_admin', 'admin'];

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

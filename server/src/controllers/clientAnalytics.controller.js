import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import * as clientService from '../services/clientAnalytics.service.js';

const FINANCIAL_ROLES = ['super_admin', 'admin', 'manager'];

function stripFinancial(summary) {
  const safe = { ...summary };
  delete safe.totalBilled;
  delete safe.totalCollected;
  delete safe.outstandingAmount;
  delete safe.lifetimeValue;
  delete safe.avgPaymentDays;
  delete safe.invoiceCount;
  delete safe.paidInvoiceCount;
  return safe;
}

export const getClientReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, clientId: userClientId } = req.user;
  const canSeeFinancial = FINANCIAL_ROLES.includes(role);

  if (role === 'client' && userClientId?.toString() !== id) {
    return errorResponse(res, 'Access denied', 403);
  }

  const [summary, spendTrend, projects] = await Promise.all([
    clientService.getClientSummary(id),
    clientService.getClientSpendTrend(id, 12),
    clientService.getClientProjectPerformance(id),
  ]);

  const result = canSeeFinancial ? summary : stripFinancial(summary);
  return successResponse(
    res,
    { ...result, spendTrend: canSeeFinancial ? spendTrend : undefined, projects },
    'Client report fetched'
  );
});

export const getClientList = asyncHandler(async (req, res) => {
  const clients = await clientService.getAllClientsSummary();
  return successResponse(res, clients, 'Client list fetched');
});

export const getLeadConversion = asyncHandler(async (req, res) => {
  const data = await clientService.getLeadConversionMetrics();
  return successResponse(res, data, 'Lead conversion metrics fetched');
});

export const getTopClients = asyncHandler(async (req, res) => {
  const { metric = 'spend' } = req.query;
  const limit = parseInt(req.query.limit, 10) || 10;
  const data = await clientService.getTopClients(metric, limit);
  return successResponse(res, data, 'Top clients fetched');
});

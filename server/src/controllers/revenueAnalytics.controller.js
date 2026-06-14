import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import * as revenueService from '../services/revenueAnalytics.service.js';

export const getRevenueDashboard = asyncHandler(async (req, res) => {
  const [metrics, monthly] = await Promise.all([
    revenueService.getTopRevenueMetrics(),
    revenueService.getRevenueByMonth(new Date().getFullYear()),
  ]);
  return successResponse(res, { metrics, monthly }, 'Revenue dashboard fetched');
});

export const getRevenueByMonth = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const data = await revenueService.getRevenueByMonth(year);
  return successResponse(res, data, 'Monthly revenue fetched');
});

export const getRevenueByClient = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const limit = parseInt(req.query.limit, 10) || 10;
  const data = await revenueService.getRevenueByClient(dateFrom, dateTo, limit);
  return successResponse(res, data, 'Revenue by client fetched');
});

export const getRevenueByType = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const data = await revenueService.getRevenueByProjectType(dateFrom, dateTo);
  return successResponse(res, data, 'Revenue by type fetched');
});

export const getRevenueGrowth = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months, 10) || 12;
  const data = await revenueService.getRevenueGrowth(months);
  return successResponse(res, data, 'Revenue growth fetched');
});

export const getReceivables = asyncHandler(async (req, res) => {
  const data = await revenueService.getOutstandingReceivables();
  return successResponse(res, data, 'Receivables fetched');
});

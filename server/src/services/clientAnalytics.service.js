import mongoose from 'mongoose';
import Invoice from '../models/Invoice.model.js';
import Project from '../models/Project.model.js';
import Client from '../models/Client.model.js';
import Lead from '../models/Lead.model.js';
import { getJSON, setJSON } from '../config/redis.js';
import logger from '../utils/logger.js';

function cacheKey(type, params) {
  return `report:client:${type}:${JSON.stringify(params)}`;
}

async function withCache(key, ttlSeconds, fn) {
  try {
    const cached = await getJSON(key);
    if (cached !== null) return cached;
  } catch (e) {
    logger.warn('Redis cache read failed', { key, error: e.message });
  }
  const result = await fn();
  try {
    if (ttlSeconds > 0) await setJSON(key, ttlSeconds, result);
  } catch (e) {
    logger.warn('Redis cache write failed', { key, error: e.message });
  }
  return result;
}

export async function getClientSummary(clientId) {
  const key = cacheKey('summary', { clientId: clientId.toString() });
  return withCache(key, 1800, async () => {
    const oid = new mongoose.Types.ObjectId(clientId);

    const [invoiceData, projectData, client, lead] = await Promise.all([
      Invoice.aggregate([
        { $match: { client: oid } },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$total' },
            totalCollected: { $sum: '$paidAmount' },
            invoiceCount: { $sum: 1 },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
            },
            avgPaymentDays: {
              $avg: {
                $cond: [
                  { $ne: ['$approvedAt', null] },
                  { $divide: [{ $subtract: ['$approvedAt', '$createdAt'] }, 86400000] },
                  null,
                ],
              },
            },
          },
        },
      ]),
      Project.aggregate([
        { $match: { client: oid, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            projectCount: { $sum: 1 },
            activeProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            firstProjectDate: { $min: '$createdAt' },
          },
        },
      ]),
      Client.findById(clientId).lean(),
      Lead.findOne({ convertedToClient: oid }).lean(),
    ]);

    const inv = invoiceData[0] ?? {
      totalBilled: 0,
      totalCollected: 0,
      invoiceCount: 0,
      paidCount: 0,
      avgPaymentDays: 0,
    };
    const proj = projectData[0] ?? {
      projectCount: 0,
      activeProjects: 0,
      completedProjects: 0,
      firstProjectDate: null,
    };

    return {
      clientId: clientId.toString(),
      companyName: client?.companyName,
      industry: client?.industry,
      status: client?.status,
      createdAt: client?.createdAt,
      totalBilled: inv.totalBilled,
      totalCollected: inv.totalCollected,
      outstandingAmount: Math.max(0, inv.totalBilled - inv.totalCollected),
      lifetimeValue: inv.totalCollected,
      invoiceCount: inv.invoiceCount,
      paidInvoiceCount: inv.paidCount,
      avgPaymentDays: inv.avgPaymentDays ? Math.round(inv.avgPaymentDays) : null,
      projectCount: proj.projectCount,
      activeProjects: proj.activeProjects,
      completedProjects: proj.completedProjects,
      firstProjectDate: proj.firstProjectDate,
      leadSource: lead?.source ?? null,
      daysFromLeadToClient:
        lead?.convertedAt && lead?.createdAt
          ? Math.round((new Date(lead.convertedAt) - new Date(lead.createdAt)) / 86400000)
          : null,
    };
  });
}

export async function getClientSpendTrend(clientId, months = 12) {
  const key = cacheKey('spendTrend', { clientId: clientId.toString(), months });
  return withCache(key, 1800, async () => {
    const oid = new mongoose.Types.ObjectId(clientId);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const [billed, collected] = await Promise.all([
      Invoice.aggregate([
        { $match: { client: oid, createdAt: { $gte: from } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            billed: { $sum: '$total' },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { client: oid, approvedAt: { $gte: from }, paidAmount: { $gt: 0 } } },
        {
          $group: {
            _id: { year: { $year: '$approvedAt' }, month: { $month: '$approvedAt' } },
            collected: { $sum: '$paidAmount' },
          },
        },
      ]),
    ]);

    const billedMap = Object.fromEntries(
      billed.map((b) => [`${b._id.year}-${b._id.month}`, b.billed])
    );
    const collectedMap = Object.fromEntries(
      collected.map((c) => [`${c._id.year}-${c._id.month}`, c.collected])
    );

    const MONTHS = [
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
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const mapKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
      return {
        month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        billed: billedMap[mapKey] ?? 0,
        collected: collectedMap[mapKey] ?? 0,
      };
    });
  });
}

export async function getClientProjectPerformance(clientId) {
  const key = cacheKey('projects', { clientId: clientId.toString() });
  return withCache(key, 1800, async () => {
    const oid = new mongoose.Types.ObjectId(clientId);

    const projects = await Project.find({ client: oid, isDeleted: { $ne: true } }).lean();

    return projects.map((p) => {
      const deliveredOnTime = p.completedAt && p.deadline ? p.completedAt <= p.deadline : null;

      const completionPercent =
        p.milestones?.length > 0
          ? Math.round(
              p.milestones.reduce((s, m) => s + (m.completionPercent || 0), 0) / p.milestones.length
            )
          : 0;

      return {
        _id: p._id,
        name: p.name,
        status: p.status,
        health: p.health,
        completionPercent,
        totalBudget: p.budget?.estimated ?? 0,
        actualCost: p.budget?.actual ?? 0,
        deliveredOnTime,
        startDate: p.startDate,
        deadline: p.deadline,
        completedAt: p.completedAt,
      };
    });
  });
}

export async function getLeadConversionMetrics() {
  const key = cacheKey('leadConversion', {});
  return withCache(key, 3600, async () => {
    const [overview, bySource, lostReasons] = await Promise.all([
      Lead.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            converted: { $sum: { $cond: [{ $in: ['$stage', ['won', 'Won']] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $in: ['$stage', ['lost', 'Lost']] }, 1, 0] } },
          },
        },
      ]),
      Lead.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: '$source',
            total: { $sum: 1 },
            converted: { $sum: { $cond: [{ $in: ['$stage', ['won', 'Won']] }, 1, 0] } },
          },
        },
        {
          $project: {
            source: '$_id',
            total: 1,
            converted: 1,
            rate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $multiply: [{ $divide: ['$converted', '$total'] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { converted: -1 } },
      ]),
      Lead.aggregate([
        { $match: { stage: { $in: ['lost', 'Lost'] }, lostReason: { $ne: null }, isDeleted: { $ne: true } } },
        { $group: { _id: '$lostReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const o = overview[0] ?? { totalLeads: 0, converted: 0, lost: 0 };
    const conversionRate =
      o.totalLeads > 0 ? Number(((o.converted / o.totalLeads) * 100).toFixed(2)) : 0;

    const avgDaysResult = await Lead.aggregate([
      { $match: { stage: { $in: ['won', 'Won'] }, convertedAt: { $ne: null }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          avgDays: {
            $avg: { $divide: [{ $subtract: ['$convertedAt', '$createdAt'] }, 86400000] },
          },
        },
      },
    ]);

    return {
      totalLeads: o.totalLeads,
      totalConverted: o.converted,
      totalLost: o.lost,
      conversionRate,
      avgDaysToConvert: avgDaysResult[0] ? Math.round(avgDaysResult[0].avgDays) : null,
      bySource: bySource.map((s) => ({
        source: s.source ?? 'unknown',
        total: s.total,
        converted: s.converted,
        rate: Number(s.rate.toFixed(2)),
      })),
      lostReasons: lostReasons.map((r) => ({ reason: r._id, count: r.count })),
    };
  });
}

export async function getTopClients(metric = 'spend', limit = 10) {
  const key = cacheKey('top', { metric, limit });
  return withCache(key, 3600, async () => {
    const sortField = metric === 'projectCount' ? 'projectCount' : 'totalCollected';

    return Invoice.aggregate([
      { $match: { paidAmount: { $gt: 0 } } },
      {
        $group: {
          _id: '$client',
          totalCollected: { $sum: '$paidAmount' },
          totalBilled: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'client',
          as: 'projects',
        },
      },
      { $addFields: { projectCount: { $size: '$projects' } } },
      { $sort: { [sortField]: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'clientData',
        },
      },
      { $unwind: { path: '$clientData', preserveNullAndEmpty: true } },
      {
        $project: {
          clientId: '$_id',
          companyName: '$clientData.companyName',
          industry: '$clientData.industry',
          totalBilled: 1,
          totalCollected: 1,
          outstandingAmount: { $subtract: ['$totalBilled', '$totalCollected'] },
          invoiceCount: 1,
          projectCount: 1,
        },
      },
    ]);
  });
}

export async function getAllClientsSummary() {
  const key = cacheKey('allSummary', {});
  return withCache(key, 1800, async () => {
    return Client.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'client',
          as: 'invoices',
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'client',
          as: 'projects',
        },
      },
      {
        $project: {
          companyName: 1,
          industry: 1,
          status: 1,
          createdAt: 1,
          totalBilled: { $sum: '$invoices.total' },
          totalCollected: { $sum: '$invoices.paidAmount' },
          outstandingAmount: {
            $subtract: [{ $sum: '$invoices.total' }, { $sum: '$invoices.paidAmount' }],
          },
          invoiceCount: { $size: '$invoices' },
          projectCount: { $size: '$projects' },
          activeProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $eq: ['$$p.status', 'active'] },
              },
            },
          },
        },
      },
      { $sort: { totalCollected: -1 } },
    ]);
  });
}

export async function clearClientCache(clientId) {
  try {
    const redis = (await import('../config/redis.js')).default;
    const pattern = clientId ? `report:client:*${clientId}*` : 'report:client:*';
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (e) {
    logger.warn('Failed to clear client cache', { error: e.message });
  }
}

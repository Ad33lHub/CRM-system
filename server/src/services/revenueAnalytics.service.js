import Invoice from '../models/Invoice.model.js';
import { getJSON, setJSON } from '../config/redis.js';
import logger from '../utils/logger.js';

function monthRange(month, year) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  return { from, to };
}

function cacheKey(type, params) {
  const hash = JSON.stringify(params);
  return `report:revenue:${type}:${hash}`;
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

export async function getMRR(month, year) {
  const key = cacheKey('mrr', { month, year });
  return withCache(key, 3600, async () => {
    const { from, to } = monthRange(month, year);
    const [result] = await Invoice.aggregate([
      {
        $match: {
          approvedAt: { $gte: from, $lt: to },
          paidAmount: { $gt: 0 },
        },
      },
      { $group: { _id: null, mrr: { $sum: '$paidAmount' } } },
    ]);
    return { month, year, mrr: result?.mrr ?? 0, currency: 'PKR' };
  });
}

export async function getARR(year) {
  const key = cacheKey('arr', { year });
  return withCache(key, 3600, async () => {
    const currentYear = new Date().getFullYear();
    let arr;
    let monthlyBreakdown;

    if (year === currentYear) {
      const currentMonth = new Date().getMonth() + 1;
      const mrrData = await getMRR(currentMonth, year);
      arr = mrrData.mrr * 12;
      monthlyBreakdown = await getRevenueByMonth(year);
    } else {
      const from = new Date(year, 0, 1);
      const to = new Date(year + 1, 0, 1);
      const [result] = await Invoice.aggregate([
        { $match: { approvedAt: { $gte: from, $lt: to }, paidAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]);
      arr = result?.total ?? 0;
      monthlyBreakdown = await getRevenueByMonth(year);
    }

    return { year, arr, monthlyBreakdown };
  });
}

export async function getRevenueByMonth(year) {
  const key = cacheKey('monthly', { year });
  return withCache(key, 1800, async () => {
    const from = new Date(year, 0, 1);
    const to = new Date(year + 1, 0, 1);

    const [billed, collected] = await Promise.all([
      Invoice.aggregate([
        { $match: { createdAt: { $gte: from, $lt: to } } },
        {
          $group: {
            _id: { $month: '$createdAt' },
            billed: { $sum: '$total' },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { approvedAt: { $gte: from, $lt: to }, paidAmount: { $gt: 0 } } },
        {
          $group: {
            _id: { $month: '$approvedAt' },
            collected: { $sum: '$paidAmount' },
          },
        },
      ]),
    ]);

    const billedMap = Object.fromEntries(billed.map((b) => [b._id, b.billed]));
    const collectedMap = Object.fromEntries(collected.map((c) => [c._id, c.collected]));

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

    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const b = billedMap[monthNum] ?? 0;
      const c = collectedMap[monthNum] ?? 0;
      return {
        month: MONTHS[i],
        monthNum,
        billed: b,
        collected: c,
        outstanding: Math.max(0, b - c),
      };
    });
  });
}

export async function getRevenueByClient(dateFrom, dateTo, limit = 10) {
  const key = cacheKey('byClient', { dateFrom, dateTo, limit });
  return withCache(key, 3600, async () => {
    const match = { paidAmount: { $gt: 0 } };
    if (dateFrom || dateTo) {
      match.approvedAt = {};
      if (dateFrom) match.approvedAt.$gte = new Date(dateFrom);
      if (dateTo) match.approvedAt.$lte = new Date(dateTo);
    }

    return Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$client',
          totalCollected: { $sum: '$paidAmount' },
          totalBilled: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { totalCollected: -1 } },
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
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'client',
          as: 'projects',
        },
      },
      {
        $project: {
          clientId: '$_id',
          companyName: '$clientData.companyName',
          totalBilled: 1,
          totalCollected: 1,
          invoiceCount: 1,
          projectCount: { $size: '$projects' },
        },
      },
    ]);
  });
}

export async function getRevenueByProjectType(dateFrom, dateTo) {
  const key = cacheKey('byType', { dateFrom, dateTo });
  return withCache(key, 3600, async () => {
    const invoiceMatch = { paidAmount: { $gt: 0 } };
    if (dateFrom || dateTo) {
      invoiceMatch.approvedAt = {};
      if (dateFrom) invoiceMatch.approvedAt.$gte = new Date(dateFrom);
      if (dateTo) invoiceMatch.approvedAt.$lte = new Date(dateTo);
    }

    return Invoice.aggregate([
      { $match: invoiceMatch },
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'projectData',
        },
      },
      { $unwind: { path: '$projectData', preserveNullAndEmpty: true } },
      {
        $group: {
          _id: '$projectData.tags',
          totalBilled: { $sum: '$total' },
          totalCollected: { $sum: '$paidAmount' },
          projectCount: { $addToSet: '$project' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $project: {
          type: { $ifNull: ['$_id', 'untagged'] },
          totalBilled: 1,
          totalCollected: 1,
          projectCount: { $size: '$projectCount' },
          invoiceCount: 1,
          avgProjectValue: {
            $cond: [
              { $gt: [{ $size: '$projectCount' }, 0] },
              { $divide: ['$totalCollected', { $size: '$projectCount' }] },
              0,
            ],
          },
        },
      },
      { $sort: { totalCollected: -1 } },
    ]);
  });
}

export async function getRevenueGrowth(months = 12) {
  const key = cacheKey('growth', { months });
  return withCache(key, 1800, async () => {
    const now = new Date();
    const points = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      points.push({ month: d.getMonth() + 1, year: d.getFullYear(), date: d });
    }

    const results = await Promise.all(points.map(({ month, year }) => getMRR(month, year)));

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

    return results.map((curr, idx) => {
      const prev = idx > 0 ? results[idx - 1] : null;
      let growthPercent = null;
      if (prev && prev.mrr > 0) {
        growthPercent = Number((((curr.mrr - prev.mrr) / prev.mrr) * 100).toFixed(2));
      }
      return {
        month: `${MONTHS[curr.month - 1]} ${curr.year}`,
        monthNum: curr.month,
        year: curr.year,
        revenue: curr.mrr,
        growthPercent,
      };
    });
  });
}

export async function getOutstandingReceivables() {
  const now = new Date();

  const buckets = await Invoice.aggregate([
    {
      $match: {
        status: { $in: ['sent', 'overdue', 'partially_paid'] },
        paidAmount: { $lt: '$total' },
      },
    },
    {
      $addFields: {
        outstanding: { $subtract: ['$total', '$paidAmount'] },
        daysOverdue: {
          $cond: [
            { $lt: ['$dueDate', now] },
            { $divide: [{ $subtract: [now, '$dueDate'] }, 86400000] },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $gte: ['$dueDate', now] }, then: 'current' },
              {
                case: { $and: [{ $gte: ['$daysOverdue', 1] }, { $lte: ['$daysOverdue', 30] }] },
                then: 'days_30',
              },
              {
                case: { $and: [{ $gte: ['$daysOverdue', 31] }, { $lte: ['$daysOverdue', 60] }] },
                then: 'days_60',
              },
              {
                case: { $and: [{ $gte: ['$daysOverdue', 61] }, { $lte: ['$daysOverdue', 90] }] },
                then: 'days_90',
              },
              { case: { $gt: ['$daysOverdue', 90] }, then: 'days_90plus' },
            ],
            default: 'current',
          },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$outstanding' },
        clientList: { $addToSet: '$client' },
      },
    },
  ]);

  const template = {
    current: { count: 0, totalAmount: 0, clientList: [] },
    days_30: { count: 0, totalAmount: 0, clientList: [] },
    days_60: { count: 0, totalAmount: 0, clientList: [] },
    days_90: { count: 0, totalAmount: 0, clientList: [] },
    days_90plus: { count: 0, totalAmount: 0, clientList: [] },
  };

  for (const b of buckets) {
    if (template[b._id])
      template[b._id] = { count: b.count, totalAmount: b.totalAmount, clientList: b.clientList };
  }

  return template;
}

export async function getTopRevenueMetrics() {
  const key = cacheKey('topMetrics', {});
  return withCache(key, 300, async () => {
    const now = new Date();
    const thisMonth = {
      $gte: new Date(now.getFullYear(), now.getMonth(), 1),
      $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
    const ytdStart = new Date(now.getFullYear(), 0, 1);

    const [mrrResult, ytdResult, billingResult, paymentDaysResult] = await Promise.all([
      Invoice.aggregate([
        { $match: { approvedAt: thisMonth, paidAmount: { $gt: 0 } } },
        { $group: { _id: null, mrr: { $sum: '$paidAmount' } } },
      ]),
      Invoice.aggregate([
        { $match: { approvedAt: { $gte: ytdStart }, paidAmount: { $gt: 0 } } },
        { $group: { _id: null, ytd: { $sum: '$paidAmount' } } },
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: ytdStart } } },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$total' },
            totalCollected: { $sum: '$paidAmount' },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { approvedAt: { $ne: null }, createdAt: { $gte: ytdStart } } },
        {
          $project: {
            paymentDays: {
              $divide: [{ $subtract: ['$approvedAt', '$createdAt'] }, 86400000],
            },
          },
        },
        { $group: { _id: null, avgDays: { $avg: '$paymentDays' } } },
      ]),
    ]);

    const mrr = mrrResult[0]?.mrr ?? 0;
    const ytd = ytdResult[0]?.ytd ?? 0;
    const totalBilled = billingResult[0]?.totalBilled ?? 0;
    const totalCollected = billingResult[0]?.totalCollected ?? 0;
    const invoiceCount = billingResult[0]?.invoiceCount ?? 0;

    return {
      mrrCurrent: mrr,
      arrProjected: mrr * 12,
      totalRevenueYTD: ytd,
      totalRevenueLastMonth: 0,
      avgInvoiceValue: invoiceCount > 0 ? totalBilled / invoiceCount : 0,
      avgPaymentDays: Math.round(paymentDaysResult[0]?.avgDays ?? 0),
      collectionRate:
        totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(2)) : 0,
      currency: 'PKR',
    };
  });
}

export async function clearRevenueCache() {
  try {
    const redis = (await import('../config/redis.js')).default;
    const keys = await redis.keys('report:revenue:*');
    if (keys.length > 0) await redis.del(...keys);
    logger.info(`Revenue cache cleared: ${keys.length} keys`);
  } catch (e) {
    logger.warn('Failed to clear revenue cache', { error: e.message });
  }
}

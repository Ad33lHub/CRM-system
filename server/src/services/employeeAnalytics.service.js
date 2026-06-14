import mongoose from 'mongoose';
import Task from '../models/Task.model.js';
import Attendance from '../models/Attendance.model.js';
import Employee from '../models/Employee.model.js';
import { getJSON, setJSON } from '../config/redis.js';
import logger from '../utils/logger.js';

function periodRange(period) {
  const now = new Date();
  const map = {
    last_30d: new Date(now - 30 * 86400000),
    last_90d: new Date(now - 90 * 86400000),
    last_6m: new Date(now - 180 * 86400000),
    last_12m: new Date(now - 365 * 86400000),
  };
  return { from: map[period] ?? map['last_30d'], to: now };
}

function cacheKey(type, params) {
  return `report:employee:${type}:${JSON.stringify(params)}`;
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

export async function getProductivityMetrics(employeeId, period = 'last_30d') {
  const key = cacheKey('productivity', { employeeId: employeeId.toString(), period });
  return withCache(key, 900, async () => {
    const { from, to } = periodRange(period);
    const userOid = new mongoose.Types.ObjectId(employeeId);

    const [taskMetrics, attendanceMetrics, employee] = await Promise.all([
      Task.aggregate([
        {
          $match: {
            'assignees.user': userOid,
            isDeleted: { $ne: true },
            createdAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: null,
            tasksAssigned: { $sum: 1 },
            tasksCompleted: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
            },
            onTimeCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'done'] },
                      { $ne: ['$dueDate', null] },
                      { $lte: ['$completedAt', '$dueDate'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            withDueDateDone: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'done'] }, { $ne: ['$dueDate', null] }] },
                  1,
                  0,
                ],
              },
            },
            overdueCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', 'done'] },
                      { $lt: ['$dueDate', to] },
                      { $ne: ['$dueDate', null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            hoursLogged: { $sum: '$loggedHours' },
            hoursEstimated: { $sum: '$estimatedHours' },
            criticalCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] },
            },
            highCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] },
            },
            mediumCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] },
            },
            lowCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] },
            },
          },
        },
      ]),
      Attendance.aggregate([
        {
          $match: {
            user: userOid,
            date: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: null,
            presentDays: {
              $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
            },
            absentDays: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
            },
            lateDays: {
              $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
            },
            totalRecords: { $sum: 1 },
            totalWorkingMinutes: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ['$checkOut', null] }, { $ne: ['$checkIn', null] }] },
                  { $divide: [{ $subtract: ['$checkOut', '$checkIn'] }, 60000] },
                  0,
                ],
              },
            },
          },
        },
      ]),
      Employee.findOne({ user: userOid }).lean(),
    ]);

    const t = taskMetrics[0] ?? {
      tasksAssigned: 0,
      tasksCompleted: 0,
      onTimeCount: 0,
      withDueDateDone: 0,
      overdueCount: 0,
      hoursLogged: 0,
      hoursEstimated: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
    const a = attendanceMetrics[0] ?? {
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      totalRecords: 0,
      totalWorkingMinutes: 0,
    };

    const workingDays = a.totalRecords;
    const attendanceRate =
      workingDays > 0 ? Number(((a.presentDays / workingDays) * 100).toFixed(2)) : null;
    const completionRate =
      t.tasksAssigned > 0 ? Number(((t.tasksCompleted / t.tasksAssigned) * 100).toFixed(2)) : null;
    const onTimeRate =
      t.withDueDateDone > 0 ? Number(((t.onTimeCount / t.withDueDateDone) * 100).toFixed(2)) : null;
    const estimationAccuracy =
      t.hoursEstimated > 0 ? Number(((t.hoursLogged / t.hoursEstimated) * 100).toFixed(2)) : null;

    return {
      employeeId: employeeId.toString(),
      period,
      tasks: {
        tasksAssigned: t.tasksAssigned,
        tasksCompleted: t.tasksCompleted,
        completionRate,
        onTimeRate,
        overdueCount: t.overdueCount,
        hoursLogged: Number(t.hoursLogged.toFixed(2)),
        hoursEstimated: Number(t.hoursEstimated.toFixed(2)),
        estimationAccuracy,
        byPriority: {
          critical: t.criticalCount,
          high: t.highCount,
          medium: t.mediumCount,
          low: t.lowCount,
        },
      },
      attendance: {
        presentDays: a.presentDays,
        absentDays: a.absentDays,
        lateDays: a.lateDays,
        workingDays,
        attendanceRate,
        avgWorkingHours:
          a.presentDays > 0 ? Number((a.totalWorkingMinutes / 60 / a.presentDays).toFixed(2)) : 0,
      },
      leaveBalance: employee?.leaveBalance ?? { annual: 0, sick: 0, casual: 0 },
    };
  });
}

export async function getTeamProductivitySummary(period = 'last_30d', department) {
  const key = cacheKey('teamSummary', { period, department });
  return withCache(key, 1800, async () => {
    const filter = { isActive: true };
    if (department) filter.department = department;

    const employees = await Employee.find(filter)
      .populate('user', 'firstName lastName email avatar role')
      .lean();

    const BATCH = 5;
    const results = [];
    for (let i = 0; i < employees.length; i += BATCH) {
      const batch = employees.slice(i, i + BATCH);
      const batchResults = await Promise.all(
        batch.map((emp) =>
          getProductivityMetrics(emp.user._id, period)
            .then((metrics) => ({
              employee: {
                _id: emp._id,
                userId: emp.user._id,
                name: `${emp.user.firstName} ${emp.user.lastName}`,
                email: emp.user.email,
                avatar: emp.user.avatar,
                department: emp.department,
                designation: emp.designation,
                employeeId: emp.employeeId,
              },
              metrics,
            }))
            .catch(() => null)
        )
      );
      results.push(...batchResults.filter(Boolean));
    }

    results.sort((a, b) => {
      const ar = a.metrics.tasks.completionRate ?? -1;
      const br = b.metrics.tasks.completionRate ?? -1;
      return br - ar;
    });

    const validRates = results.filter((r) => r.metrics.tasks.completionRate !== null);
    const teamAvgCompletion =
      validRates.length > 0
        ? Number(
            (
              validRates.reduce((s, r) => s + r.metrics.tasks.completionRate, 0) / validRates.length
            ).toFixed(2)
          )
        : null;
    const validOnTime = results.filter((r) => r.metrics.tasks.onTimeRate !== null);
    const teamAvgOnTime =
      validOnTime.length > 0
        ? Number(
            (
              validOnTime.reduce((s, r) => s + r.metrics.tasks.onTimeRate, 0) / validOnTime.length
            ).toFixed(2)
          )
        : null;
    const validAttendance = results.filter((r) => r.metrics.attendance.attendanceRate !== null);
    const teamAvgAttendance =
      validAttendance.length > 0
        ? Number(
            (
              validAttendance.reduce((s, r) => s + r.metrics.attendance.attendanceRate, 0) /
              validAttendance.length
            ).toFixed(2)
          )
        : null;

    return {
      employees: results,
      teamAverages: {
        completionRate: teamAvgCompletion,
        onTimeRate: teamAvgOnTime,
        attendanceRate: teamAvgAttendance,
        totalHoursLogged: results.reduce((s, r) => s + r.metrics.tasks.hoursLogged, 0),
      },
    };
  });
}

export async function getEmployeeRanking(metric = 'completionRate', period = 'last_30d') {
  const key = cacheKey('ranking', { metric, period });
  return withCache(key, 900, async () => {
    const { employees } = await getTeamProductivitySummary(period);

    const METRIC_MAP = {
      completionRate: (r) => r.metrics.tasks.completionRate,
      onTimeRate: (r) => r.metrics.tasks.onTimeRate,
      tasksCompleted: (r) => r.metrics.tasks.tasksCompleted,
      hoursLogged: (r) => r.metrics.tasks.hoursLogged,
      attendanceRate: (r) => r.metrics.attendance.attendanceRate,
    };

    const getter = METRIC_MAP[metric] ?? METRIC_MAP.completionRate;

    return employees
      .map((r) => ({ ...r, metricValue: getter(r) }))
      .filter((r) => r.metricValue !== null)
      .sort((a, b) => b.metricValue - a.metricValue)
      .slice(0, 10)
      .map((r, idx) => ({ rank: idx + 1, ...r }));
  });
}

export async function getWeeklyTrend(employeeId, weeks = 12) {
  const key = cacheKey('weeklyTrend', { employeeId: employeeId.toString(), weeks });
  return withCache(key, 900, async () => {
    const userOid = new mongoose.Types.ObjectId(employeeId);
    const now = new Date();
    const results = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now - i * 7 * 86400000);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

      const [tasks] = await Task.aggregate([
        {
          $match: {
            'assignees.user': userOid,
            status: 'done',
            completedAt: { $gte: weekStart, $lt: weekEnd },
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            tasksCompleted: { $sum: 1 },
            hoursLogged: { $sum: '$loggedHours' },
          },
        },
      ]);

      const label = `W${weeks - i}`;
      results.push({
        week: label,
        weekStart: weekStart.toISOString().split('T')[0],
        tasksCompleted: tasks?.tasksCompleted ?? 0,
        hoursLogged: Number((tasks?.hoursLogged ?? 0).toFixed(2)),
      });
    }

    return results;
  });
}

export async function clearEmployeeCache(employeeId) {
  try {
    const redis = (await import('../config/redis.js')).default;
    const pattern = employeeId ? `report:employee:*${employeeId}*` : 'report:employee:*';
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (e) {
    logger.warn('Failed to clear employee cache', { error: e.message });
  }
}

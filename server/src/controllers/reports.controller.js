import Lead from '../models/Lead.model.js';
import Invoice from '../models/Invoice.model.js';
import Project from '../models/Project.model.js';
import Task from '../models/Task.model.js';
import Employee from '../models/Employee.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getReportsSummary = asyncHandler(async (req, res) => {
  const [leadsCount, invoices, projects, tasks, employeesCount] = await Promise.all([
    Lead.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Invoice.find({ isDeleted: false }),
    Project.find({ isDeleted: false }),
    Task.find({ isDeleted: false }),
    Employee.countDocuments({ isActive: true }),
  ]);

  // Format leads stage summary
  const leadsObj = { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 };
  leadsCount.forEach((item) => {
    const key = item._id ? item._id.toLowerCase() : '';
    if (key in leadsObj) leadsObj[key] = item.count;
  });

  // Format invoices financial summary
  let totalRevenue = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;
  const invoiceStatuses = { draft: 0, sent: 0, paid: 0, overdue: 0, void: 0 };
  invoices.forEach((inv) => {
    invoiceStatuses[inv.status] = (invoiceStatuses[inv.status] || 0) + 1;
    if (inv.status === 'paid') {
      totalRevenue += inv.total || 0;
    } else if (inv.status === 'sent') {
      pendingAmount += inv.total || 0;
    } else if (inv.status === 'overdue') {
      overdueAmount += inv.total || 0;
    }
  });

  // Format projects health & status summary
  const projectHealth = { green: 0, amber: 0, red: 0 };
  const projectStatuses = { draft: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 };
  projects.forEach((proj) => {
    projectHealth[proj.health] = (projectHealth[proj.health] || 0) + 1;
    projectStatuses[proj.status] = (projectStatuses[proj.status] || 0) + 1;
  });

  // Format tasks status summary
  const taskStatuses = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  tasks.forEach((tsk) => {
    taskStatuses[tsk.status] = (taskStatuses[tsk.status] || 0) + 1;
  });

  // Renders a consolidated reports dashboard object
  const reportData = {
    leads: leadsObj,
    financials: {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      invoiceStatuses,
    },
    projects: {
      health: projectHealth,
      statuses: projectStatuses,
      totalCount: projects.length,
    },
    tasks: taskStatuses,
    employeesCount,
  };

  return successResponse(res, reportData, 'Report metrics aggregated successfully');
});
